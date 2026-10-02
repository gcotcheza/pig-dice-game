# Decisions

Why things are the way they are. Newest first.

## The deploy is a script, and its gate check reads ci alone (2026-10-02)

`scripts/deploy.sh` replaces the steps the runbook used to list by hand. The reason is the last
line it prints: `finish()` in the vendored fleet library writes `DONE #<PR> live <sha> was <sha>
gated <how>` into `/root/personal-vps-deploys/pig-dice-game/`, and that line is what the fleet's
days page reads to say whether this project deployed. A runbook of `git pull` steps writes
nothing, so the answer for pig-dice was "cannot tell".

**Why the gate check is not the library's `gated()`.** Every other adopter calls it. It demands a
green ledger row for both `ci` and `e2e` and the kinds are not configurable, so a project with no
browser gate can never satisfy it: calling it here would mean passing `--gated-by-hand` on every
deploy, which turns an override meant for rescue into the normal path and makes the DONE line read
"ungated" when the gate this project does have was green. `gated_ci()` in `scripts/deploy.sh` reads
the same ledger file and the same row format for the `ci` kind only, keeps the same
`--gated-by-hand` override, and names the missing half in the DONE line as `e2e none`. The day T6
is met that function goes and `gated` replaces it.

**What a static site can honestly gate.** `scripts/check.sh` runs three static steps, cheapest
first: `bash -n` over the shell scripts, a drift check that recomputes each vendored library file's
body hash against the hash declared in its own first line, and the library's own suite. No network,
no containers, no build. It carries no dependency-advisory step because there is no manifest and no
lockfile to audit. Step 1 counts the files it read because a loop over a list that went empty passes
every assertion inside it: with that count's own line deleted the gate printed `bash -n over 0 shell
scripts` and exited 0.

**What is not covered.** `scripts/deploy.sh` has no `deploy-test.sh`, where the other adopters do,
so its landing, its verification and its refusals are reviewed rather than exercised against fakes.

## Adopted the fleet standard (2026-09-20)

The fleet engineering standard is vendored at `docs/STANDARDS.md` (version 2026-09-20.2), with
`.claude/rules/standards.md` symlinked to it: one file, two doors — one for a person reading the
repo, one for a session loading its rules.

**Why there is no `scripts/check.sh` here.** Pig Dice is a flat directory of static files —
`index.html`, `script.js`, `style.css` and six dice PNGs — served by an nginx `alias`. There is no
package manager, no lockfile, no build step and no test runner, so a gate would have nothing to run
but itself. T2 asks that a gate run in the containers production uses; for a project with no runtime
of its own the honest reading is that there is nothing to reproduce, because the bytes in the repo
are the bytes nginx serves. Writing a gate would mean first inventing a toolchain for it to invoke,
which is a larger and riskier change than the thing it would guard.

**Why the drift check is fleet-level instead of a test.** ROLLOUT step 4 puts the drift check in the
project's gate: a test that hashes the vendored standard, compares it to the hash in its own header,
and asserts the symlink resolves. With no gate and no test framework, that assertion lives one level
up: `scripts/fleet-versions.sh` in the canonical standards repo performs exactly the same three
checks from outside, and distinguishes a local edit (DRIFTED), a re-stamped local edit (DIVERGED), a
stale version (STALE) and a mismatched header (VERSION). It was exercised red and green for this
adoption rather than read.

**What would drop the exceptions.** The day this project gains a build step, a package manager or a
single test, `scripts/check.sh` gets written and T1/T2/T5 stop being exceptions; the day it gains any
test runner, the drift check moves in-repo where ROLLOUT wants it; and once there is a gate to hang
it on, T6/T7 get a Playwright run against a disposable static server, which is cheap for a site with
no database and no login.

**Why the deploy runbook moved into the repo.** W8 asks each project to keep one runbook, followed
literally, at `.claude/commands/deploy.md`. It previously existed only in the operator's home
directory, where a clone of this repo could not see it. It now says in writing what was previously
only convention: merging to `main` does not deploy, because the live checkout at
`/var/www/pig-dice-game` is updated by a hand-run `git pull`.
