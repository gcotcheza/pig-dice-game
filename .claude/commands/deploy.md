# Deploy Pig Dice

**Project:** Pig Dice game (static HTML/CSS/JS)
**Directory:** `/var/www/pig-dice-game`
**URL:** https://ghiecode.io/games/pig-dice/
**Remote:** https://github.com/gcotcheza/pig-dice-game.git
**Branch:** main
**Owner:** ghiecode:ghiecode

Served by nginx via an `alias` block in the ghiecode server config
(`/etc/nginx/sites-available/ghiecode`). No PHP, no build step, no process to restart.

**Merging to `main` does not deploy.** This runbook is the deploy, it is run by hand, and
`scripts/deploy.sh` is the whole of it: logging, pre-flight, the gate check, the
fast-forward and the verification. Run it as root — it does its git as `ghiecode`.

## Before you start

The deploy takes the merged PR number and refuses anything else: a PR that is not `MERGED`,
a merge commit that is not `origin/main`, a checkout that is not on `main` or is dirty, and
a commit with no green `ci` row in the gate ledger. The gate that writes that row is
`scripts/check.sh`, run on the branch before the merge.

## Deploy

Each block below is its own shell: what a block reads, it sets.

```bash
PR=<merged PR number>
/var/www/pig-dice-game/scripts/deploy.sh "${PR:?}"
```

It prints one line per step, keeps the full transcript under
`/root/personal-vps-deploys/pig-dice-game/`, and ends with
`DONE #<PR> live <sha> was <sha> gated <how> page 200 dice 200 root-owned 0` — that line is
what the fleet ledger reads, and `was <sha>` is the rollback target.

## If it refuses

Read the refusal: it names the condition and what would satisfy it. Nothing has moved, because
the fast-forward happens after every check. One override exists, for transition and rescue only:

```bash
PR=<merged PR number>
/var/www/pig-dice-game/scripts/deploy.sh "${PR:?}" --gated-by-hand
```

It deploys a commit with no green `ci` row and records that in the DONE line as
`gated by hand over [...]` instead of refusing.

## Rollback

```bash
BEFORE=<the sha the DONE line printed after "was">
git-as ghiecode -C /var/www/pig-dice-game reset --hard "${BEFORE:?}"
curl -s -o /dev/null -w '%{http_code}\n' https://ghiecode.io/games/pig-dice/
```
