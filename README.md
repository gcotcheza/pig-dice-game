# Pig Dice Game

Welcome to the Pig Dice Game repository! This game is a fun, interactive project developed as part of a JavaScript course on Udemy. It's designed to demonstrate the use of JavaScript in building web applications. The game is deployed and playable [here](https://pig-dice-game-rho.vercel.app/).

## Game Description

Pig is a simple dice game which involves rolling a single dice. It's played between two players who take turns. The goal is to be the first player to score 100 or more points.

## How to Play

1. **Set Up**: Optionally edit each player's name and pick a target score with the "First to" input (default is 100).
2. **Start the Game**: Click "New Game" to reset and begin a session.
3. **Roll the Dice**: On your turn, click "Roll" to roll the die. The result is added to your *current* (turn) score.
   - Roll a **1** and your current score is wiped — it becomes the other player's turn.
   - Roll anything else and you can keep rolling or hold.
4. **Hold**: Click "Hold" to bank your current score into your total and pass the turn.
5. **Winning**: The first player to reach the target score wins — winner is highlighted and rolling is disabled until a new game starts.

### Game Controls

- **Roll** / **Hold** / **New Game** buttons, or keyboard shortcuts: <kbd>R</kbd> roll, <kbd>H</kbd> hold, <kbd>N</kbd> new game.
- **Rules** button opens an in-game rules modal.

## Features

- Editable player names
- Configurable target score
- 3D animated dice roll
- Per-turn roll history per player
- Confetti win animation
- Keyboard shortcuts and an in-game rules modal

## Technical Implementation

Vanilla HTML/CSS/JavaScript with no build step or dependencies. The game logic lives in `script.js` and uses `'use strict'` mode:

- `init()` sets up initial scores, current totals, the active player, and resets UI state. Called on load and whenever "New Game" is clicked.
- The roll handler generates a random 1–6, updates the dice cube, and either accumulates the value or switches the active player on a 1.
- The hold handler banks the current score; when a player reaches the target, the game ends and the winner is highlighted.
- Player elements use a `--0` / `--1` suffix convention (e.g. `score--0`, `current--1`) and are looked up via template literals.

## Deployment

The game is deployed using Vercel, which allows users to play the game online without needing to set it up locally. To play, simply visit the [game's website](https://pig-dice-game-rho.vercel.app/).

## Acknowledgements

This game was created as a project for [The Complete JavaScript Course 2024: From Zero to Expert!](https://www.udemy.com/course/the-complete-javascript-course/?couponCode=ST22FS22724). If you're interested in learning JavaScript or enhancing your web development skills, this course is a comprehensive resource covering everything from the basics to advanced topics in JavaScript.

A special thanks to [Jonas Schmedtmann](https://github.com/jonasschmedtmann), the instructor of the course, for creating such a comprehensive and engaging course on JavaScript! His expertise and teaching methodology have been invaluable in the learning process.


Thank you for checking out the Pig Dice Game. Have fun playing!


