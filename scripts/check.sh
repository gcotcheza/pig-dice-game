#!/usr/bin/env bash
# The gate: static checks only, cheapest first — no network, no containers, no build.
set -u

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

# shellcheck source=scripts/lib/deploy/ledger.sh
. "$SCRIPT_DIR/lib/deploy/ledger.sh"

# CI_GIT and GATE_LEDGER_GIT are commands with arguments: unquoted on purpose.
GATE_LEDGER_GIT=${CI_GIT:-git -C $ROOT}
LOG=${CI_LOG:--}

SHELL_SCRIPTS='scripts/check.sh scripts/deploy.sh scripts/lib/deploy/test.sh'
LIB_BODIES='ledger.sh preflight.sh resolve.sh summary.sh'

fail() {
    printf 'GATE FAILED step %s: %s\n' "$1" "$2"
    gate_ledger_record ci 1 "$LOG"
    exit 1
}

# The counts are the guard: a loop over a list that went empty passes every
# assertion in it without reading a file.
step_syntax() {
    local f n=0
    for f in $SHELL_SCRIPTS; do
        [ -f "$ROOT/$f" ] || fail 1 "$f is not in this checkout, so bash -n read nothing"
        bash -n "$ROOT/$f" || fail 1 "bash -n refused $f"
        n=$((n + 1))
    done
    [ "$n" -eq 3 ] || fail 1 "bash -n ran over $n files and the list names 3"
    printf 'ok   step 1 bash -n over %s shell scripts\n' "$n"
}

step_vendored_lib() {
    local f want got n=0
    for f in $LIB_BODIES; do
        want=$(sed -n '1s/.*sha256:\([0-9a-f]\{64\}\).*/\1/p' "$SCRIPT_DIR/lib/deploy/$f")
        [ -n "$want" ] || fail 2 "lib/deploy/$f declares no sha256 in its first line"
        got=$(tail -n +2 "$SCRIPT_DIR/lib/deploy/$f" | sha256sum | cut -d' ' -f1)
        [ "$want" = "$got" ] \
            || fail 2 "lib/deploy/$f was edited here: its body hashes to $got and its own header declares $want"
        n=$((n + 1))
    done
    [ "$n" -eq 4 ] || fail 2 "the drift check read $n lib files and the list names 4"
    printf 'ok   step 2 vendored deploy lib %s matches its own header hashes (%s files)\n' \
        "$(cat "$SCRIPT_DIR/lib/deploy/VERSION")" "$n"
}

step_lib_suite() {
    "$SCRIPT_DIR/lib/deploy/test.sh" || fail 3 "the deploy lib's own suite failed"
    printf 'ok   step 3 the deploy lib suite\n'
}

gate_ledger_arm
step_syntax
step_vendored_lib
step_lib_suite
GATE_SUITE_PASSED=1
gate_ledger_record ci 0 "$LOG"
printf 'GATE GREEN scripts/check.sh\n'
