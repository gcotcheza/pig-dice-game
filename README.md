# Pig Dice Game

Welcome to the Pig Dice Game repository! This game is a fun, interactive project developed as part of a JavaScript course on Udemy. It's designed to demonstrate the use of JavaScript in building web applications. The game is deployed and playable [here](https://pig-dice-game-rho.vercel.app/).

## Game Description

Pig is a simple dice game which involves rolling a single dice. It's played between two players who take turns. The goal is to be the first player to score 100 or more points.

## How to Play

1. **Start the Game**: Click on the "New Game" button to reset the game and start a new session.
2. **Roll the Dice**: On your turn, click the "Roll Dice" button to roll the dice. Your turn's score is added to your current score, which is temporary.
   - If you roll a 1, your current score for this turn is lost, and it's the next player's turn.
   - If you roll any other number, it is added to your current score for the turn. You can choose to roll again or hold.
3. **Hold**: If you decide to hold, click the "Hold" button. Your current score for the turn is added to your total score, and it becomes the next player's turn.
4. **Winning the Game**: The first player to reach or exceed 100 points wins the game. The game will automatically highlight the winner and disable the dice roll until a new game starts.

### Game Controls

- **Roll Button**: Roll the dice for your turn.
- **Hold Button**: Save your current points to your total score and switch turns.
- **New Game Button**: Resets the game to start over.

## Technical Implementation

The game logic is implemented in JavaScript using event listeners for user interactions:

- The game starts in the `init` function, setting up initial scores and states.
- Players can roll the dice using the `btnRoll` event listener, which generates a random dice roll and updates the UI accordingly.
- The `btnHold` event listener allows players to save their current score to their total and switch turns.
- The `init` function can be called again to reset the game at any point.

This project serves as a practical application of JavaScript, CSS, and HTML in creating interactive web applications.

## Deployment

The game is deployed using Vercel, which allows users to play the game online without needing to set it up locally. To play, simply visit the [game's website](https://pig-dice-game-rho.vercel.app/).

## Acknowledgements

This game was created as a project for [The Complete JavaScript Course 2024: From Zero to Expert!](https://www.udemy.com/course/the-complete-javascript-course/?couponCode=ST22FS22724). If you're interested in learning JavaScript or enhancing your web development skills, this course is a comprehensive resource covering everything from the basics to advanced topics in JavaScript.

A special thanks to [Jonas Schmedtmann](https://github.com/jonasschmedtmann), the instructor of the course, for creating such a comprehensive and engaging course on JavaScript! His expertise and teaching methodology have been invaluable in the learning process.


Thank you for checking out the Pig Dice Game. Have fun playing!


