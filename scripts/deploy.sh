#!/usr/bin/env bash
# The deploy fast-forwards the checkout bash is reading this file from: the body
# lives in main() and the last byte is `exit`, so the whole script is in memory.
set -u

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# Vendored from gcotcheza/engineering-standards and not edited here:
# scripts/check.sh recomputes each file's own header hash.
# shellcheck source=scripts/lib/deploy/summary.sh
. "$SCRIPT_DIR/lib/deploy/summary.sh"
# shellcheck source=scripts/lib/deploy/resolve.sh
. "$SCRIPT_DIR/lib/deploy/resolve.sh"
# shellcheck source=scripts/lib/deploy/preflight.sh
. "$SCRIPT_DIR/lib/deploy/preflight.sh"

usage() {
    printf 'usage: scripts/deploy.sh <PR#> [--gated-by-hand]\n' >&2
    exit 64
}

root_owned() { find "$ROOT" -user root 2>/dev/null | wc -l; }

http_code() { curl -sS -o /dev/null -w '%{http_code}' --max-time 20 --connect-timeout 5 "$1"; }

# The lib's gated() demands a green e2e row too, and this project has no browser
# gate. docs/DECISIONS.md: why the gate check here reads ci alone.
ci_verdict() {
    [ -f "$LEDGER" ] || { printf 'absent, no ledger at %s' "$LEDGER"; return 0; }
    awk -v sha="$GATE_SHA" '$1 == sha && $2 == "ci" { rc = $4; seen = 1 }
         END { printf "%s", (!seen ? "absent" : (rc == "0" ? "green" : "red")) }' "$LEDGER"
}

gated_ci() {
    local verdict
    verdict=$(ci_verdict)
    if [ "$verdict" = green ]; then
        GATED="ledger $GATE_WHAT ${GATE_SHA:0:7} ci green, e2e none"
        say "GATED ${GATE_SHA:0:7} ci green in $LEDGER, and this project has no browser gate to read"
        [ "$BY_HAND" -eq 0 ] \
            || say 'GATE BY HAND: --gated-by-hand was passed and the verdict above is green anyway.'
        return 0
    fi
    [ "$BY_HAND" -eq 1 ] || refuse "the ledger holds no green ci for ${GATE_SHA:0:7} (ci $verdict): run scripts/check.sh on that commit, or deploy with --gated-by-hand, which records this as ungated."
    GATED="by hand over [ci $verdict for ${GATE_SHA:0:7}]"
    say "GATE ci $verdict for ${GATE_SHA:0:7} in $LEDGER"
    say "GATED BY HAND: #$PR deploys on a human's word over the verdict above — transition and rescue only."
}

land() {
    local head
    $GIT merge --ff-only "$MERGE_SHA" \
        || refuse 'fast-forward refused, the checkout is unchanged and nothing was landed.'
    head=$($GIT rev-parse HEAD)
    [ "$head" = "$MERGE_SHA" ] \
        || refuse "HEAD $head is not the resolved merge $MERGE_SHA, and nothing is served off a commit that was not resolved."
}

verify() {
    local page dice
    page=$(http_code "$URL")
    dice=$(http_code "${URL}dice-1.png")
    ROOTED=$(root_owned)
    if [ "$page" != 200 ] || [ "$dice" != 200 ] || [ "$ROOTED" -ne 0 ]; then
        say "FAILED DEPLOY: $URL answered $page (want 200), ${URL}dice-1.png answered $dice (want 200), root-owned $ROOTED (want 0). The landing is on disk; read $LOG before re-running."
        exit 1
    fi
    EXTRA_DONE="page $page dice $dice root-owned $ROOTED"
    say "VERIFY $EXTRA_DONE"
}

main() {
    ROOT=${DEPLOY_ROOT:-/var/www/pig-dice-game}

    PR=''
    BY_HAND=0
    while [ $# -gt 0 ]; do
        case "$1" in
            --gated-by-hand) BY_HAND=1 ;;
            -h | --help) usage ;;
            '' | *[!0-9]*) usage ;;
            *) [ -z "$PR" ] || usage; PR=$1 ;;
        esac
        shift
    done
    [ -n "$PR" ] || usage

    # DEPLOY_GIT is a COMMAND WITH ARGUMENTS, so it is unquoted at every call site
    # on purpose: it has to split.
    GIT=${DEPLOY_GIT:-git-as ghiecode -C $ROOT}
    GH=${DEPLOY_GH:-gh}
    HEAVY=${DEPLOY_HEAVY:-heavy-work}
    LEDGER=${DEPLOY_LEDGER:-/var/lib/fleet/gate-ledger}
    URL=${DEPLOY_URL:-https://ghiecode.io/games/pig-dice/}
    GATED=''
    HEAD_SHA=''
    MERGE_SHA=''
    GATE_SHA=''
    GATE_WHAT=''
    ROOTED=''
    EXTRA_DONE=''

    cd "$ROOT" || { printf 'deploy.sh: no checkout at %s\n' "$ROOT" >&2; exit 64; }
    deploy_log_open "$PR"

    [ "$($GIT rev-parse --abbrev-ref HEAD)" = main ] \
        || refuse "the checkout is not on main, and a deploy fast-forwards main."
    $GIT log --oneline -3

    resolve
    preflight
    BEFORE=$($GIT rev-parse --short HEAD)
    refuse_if_dirty
    gated_ci
    land
    verify
    finish "$($GIT rev-parse --short HEAD)"
}

main "$@"
# shellcheck disable=SC2317
exit
