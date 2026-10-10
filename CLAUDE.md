# Pig Dice Game — house rules

Fleet engineering standards: docs/STANDARDS.md (also loaded via .claude/rules/standards.md).
They apply here in full; anything below overrides them and says why.

- Where work happens: a worktree under `/var/www/pig-dice-game-worktrees/` — this checkout is production, served live by nginx, so never edit, branch or build in it.
- Merging to main does not deploy. Runbook: `.claude/commands/deploy.md`.
- The gate: none — see Exceptions. Browser gate: none yet.
- Layers: none — a flat directory of static files loaded straight by the browser.
- Why-decisions: docs/DECISIONS.md.
- Project-specific rules below.

## Exceptions

Rules this project knowingly does not meet yet: the rule, why, and what would have to be true to drop it.

- **T1 — the gate is green before merge.** No gate exists: static files, no build, no test suite, so a gate would have nothing to run. Dropped the day a build step or a test suite exists.
- **T2 — the gate runs in the containers.** No gate and no image; the bytes in the repo are the bytes nginx serves, so there is no production runtime to reproduce. Dropped with T1, when there is a gate to containerise.
- **T5 — a test must be proven able to fail.** No suite to prove; this adoption's red/green was run against the fleet-level `scripts/fleet-versions.sh` instead of a project test. Dropped the day a suite exists.
- **T6 — browser tests in-repo against a throwaway stack.** None: no gate to hang Playwright on and no seeded stack. Dropped when a gate exists — a static server is cheap to seed.
- **T7 — the browser gate runs inside its caps.** Nothing to cap while T6 stands. Dropped with T6.
- **Drift check (ROLLOUT step 4).** Not an in-gate test: the fleet-level `scripts/fleet-versions.sh` is this project's drift check, hashing the vendored body against its own header and against canonical. Dropped into the repo the day a test runner exists.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pig Dice Game — a vanilla HTML/CSS/JavaScript implementation of the two-player Pig dice game. There is no build system, no package manager, and no test suite. The files are served as-is by nginx at https://ghiecode.io/games/pig-dice/.

## Commands

- **Run locally**: open `index.html` directly in a browser, or serve the directory with any static file server (e.g. `python3 -m http.server`). There is no install/build step.
- **Format**: no formatter is wired up via scripts. If using Prettier manually, it will pick up `.prettierrc` (`singleQuote: true`, `arrowParens: "avoid"`).
- **Tests/lint**: none configured.

## Architecture

All game logic is one `PigGame` class in `script.js`, built once at the bottom of the file. It reads its elements from `index.html` by id and class. Key points:

- **State** (fields on the instance): `scores` (length-2 array), `history` (per-player list of turn results, 0 for a bust), `currentScore`, `currentRolls`, `activePlayer` (0 or 1), `playing`, `rolling`, `targetScore`, `names`. `init()` sets them for a new game; `load()` restores them.
- **New Game**: `newGame()` takes the target from the target inputs and `init()` keeps the names typed in the name inputs. The target is 10–999 and is locked (inputs disabled) once a game has started.
- **Persistence**: `save()` writes the state to `localStorage` under the key `pigGame`; the constructor calls `load() || init()`.
- **Player indexing convention**: the two players share a duplicated structure in the DOM, distinguished by a numeric suffix `0` or `1`. Code reads elements by id such as `score--0`, `name--1`, `history--0`, and the active player's element by index. Keep this pattern when adding per-player elements — both the CSS classes (`player--0`, `player--1`, `player--active`, `player--winner`) and the IDs (`score--0`, `score--1`, `name--0`, `name--1`) follow it.
- **Turn flow**: `roll()` picks 1–6 and animates the dice; on landing, a 1 is a bust (`switchPlayer()` zeroes `currentScore`), anything else adds to `currentScore`. `hold()` banks `currentScore` into `scores[activePlayer]`; at `targetScore` or more the game ends (`playing = false`, winner shown, confetti and fireworks on a canvas). Keys: `r` roll, `h` hold, `n` new game, `Escape` closes the settings modal.
- **Dice**: a 3D cube whose six faces are the `dice-1.png` … `dice-6.png` images at the repo root, referenced by filename in `index.html`. New dice assets must keep this naming.
- **CSS state classes**: visual state is driven by toggling classes such as `player--active`, `player--winner`, `is-winner`, `dice--rolling`, `dice--landed` and `modal--open` on existing elements rather than re-rendering.

## Conventions

- Follow `.prettierrc`: single quotes, no parens on single-arg arrows.
- The codebase uses `'use strict'` at the top of `script.js`; preserve it.
- Prefer extending the existing DOM-manipulation style over introducing frameworks, bundlers, or modules — the deployment assumes a flat directory of static files served as-is.
