# Deploy Pig Dice

**Project:** Pig Dice game (static HTML/CSS/JS)
**Directory:** `/var/www/pig-dice-game`
**URL:** https://ghiecode.io/games/pig-dice/
**Remote:** https://github.com/gcotcheza/pig-dice-game.git
**Branch:** main
**Owner:** ghiecode:ghiecode

Served by nginx via an `alias` block in the ghiecode server config (`/etc/nginx/sites-available/ghiecode`). No PHP, no build step, no process to restart.

Merging to `main` does not deploy — this runbook is the deploy, and it is run by hand.

## Pre-flight checks

1. Confirm the current git branch in `/var/www/pig-dice-game` is `main`. If not, warn the user and stop.
2. Show the latest 3 commit messages so the user can confirm what will be deployed.

## Deploy steps

If any step fails, stop and report the error.

1. **Pull latest code**
   ```bash
   git-as ghiecode -C /var/www/pig-dice-game pull origin main
   ```

2. **Fix ownership** (in case git pull created root-owned files)
   ```bash
   find /var/www/pig-dice-game -user root | wc -l   # must print 0 — git-as leaves nothing root-owned; repair narrowly with find … -user root -exec chown ghiecode:ghiecode {} +
   ```

## Post-deploy verification

1. Run `curl -s -o /dev/null -w "%{http_code}" https://ghiecode.io/games/pig-dice/` and confirm HTTP 200.
2. Run `curl -s -o /dev/null -w "%{http_code}" https://ghiecode.io/games/pig-dice/dice-1.png` and confirm HTTP 200.
3. Report deploy status with a summary of commits that were pulled.
