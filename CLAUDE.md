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

Pig Dice Game — a vanilla HTML/CSS/JavaScript implementation of the two-player Pig dice game. There is no build system, no package manager, and no test suite. The project is deployed on Vercel as a static site.

## Commands

- **Run locally**: open `index.html` directly in a browser, or serve the directory with any static file server (e.g. `python3 -m http.server`). There is no install/build step.
- **Format**: no formatter is wired up via scripts. If using Prettier manually, it will pick up `.prettierrc` (`singleQuote: true`, `arrowParens: "avoid"`).
- **Tests/lint**: none configured.

## Architecture

The entire game logic lives in `script.js` and relies on DOM element selectors defined in `index.html`. Key points:

- **Global mutable state** (declared with `let`): `scores` (length-2 array), `currentScore`, `activePlayer` (0 or 1), `playing` (boolean). `init()` both initializes these on page load and resets them when "New Game" is clicked.
- **Player indexing convention**: the two players share a duplicated structure in the DOM, distinguished by a numeric suffix `0` or `1`. Code references elements via template strings like `` `current--${activePlayer}` ``, `` `score--${activePlayer}` ``, `` `.player--${activePlayer}` ``. Keep this pattern when adding per-player elements — both the CSS classes (`player--0`, `player--1`, `player--active`, `player--winner`) and the IDs (`score--0`, `score--1`, `current--0`, `current--1`) follow it.
- **Turn flow**: `btnRoll` click → random 1–6 → if 1, `switchPlayer()` resets `currentScore` and toggles `player--active`; otherwise accumulate into `currentScore` and update the active player's current display. `btnHold` commits `currentScore` to `scores[activePlayer]`; at ≥100 the game ends (sets `playing = false`, hides dice, adds `player--winner`).
- **Dice images**: `dice-1.png` … `dice-6.png` at the repo root are referenced by filename (`diceEl.src = \`dice-${dice}.png\``). New dice assets must keep this naming.
- **CSS state classes**: visual state is driven by toggling `player--active`, `player--winner`, and `hidden` on existing elements rather than re-rendering.

## Conventions

- Follow `.prettierrc`: single quotes, no parens on single-arg arrows.
- The codebase uses `'use strict'` at the top of `script.js`; preserve it.
- Prefer extending the existing DOM-manipulation style over introducing frameworks, bundlers, or modules — the deployment assumes a flat directory of static files served as-is.
