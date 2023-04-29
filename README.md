# Tridice

TriDice is a 2-player board game that uses 4-sided dice as movable pieces. Its basic mechanics of dice movement are inspired the game [dicetance](https://pierre-vandermaesen.itch.io/dicetance).

It was built using the P5JS library for the visuals and TypeScript for the backend game logic.
Deno was used for TS-JS transpilation.
The visuals were written in the Replit platform then uploaded to GitHub.

## Work Division

- Planning and Design: Philo and Rodrigo
- GUI: Philo
- Backend: Rodrigo

## Game Rules

Every turn a player is able to either: place a dice on the board; or move a dice already on the board.
Each player starts with 4 dice on hand, and no dices on the board.

- To place a dice, a player chooses a cell on the board that has no dice to place one.
  The dice will be rolled into a random configuration and then placed on the chosen cell.

- A dice already on the board can be moved exactly $n$ cells, where $n$ is the number on the top of the dice.
- Dice can only move to cells that share an edge with the cell it is currently at.
  Thus, at any given moment, a dice has at most 3 possible cells to move to.
- When a dice is being moved, it visit a cell it has already been to.
- Dice cannot move over other dice

- When a dice's last move places it on the same cell as the opponent's dice, the enemy dice can be captured on the dice's last move.

## Dice Faces Data Structure

The faces of the dice are kept in a 1d array with 4 integers that hold numbers between $[0, 4]$.
The array keeps track of each tip of the 4-sided dice in the following order:

- left, top, right, up, down

Because of the way our board is setup, our dice can either be pointing up or down. When a dice points up, its down-index on the array is 0.

We setup the array in that specific order so that it could be easily turned into an integer, and so that the up and down indices could be found at the end.

The array can be understood as having a null-zone (composed of the two last indices) and a real-zone.
All 3d transformations to a dice can be translated into an operation involving the shifting of numbers within and between these zones.

For the dice $[l,t,r,0,d]$, consider its faces to be $[l,t,r]$, and its null-zone faces to be $[0, d]$, where the up face is 0, and the dice's down face is the null-number (since it is in the null-zone). Because of that, we know that the dice is pointing down.

Here are some of its transformations and their resulting array configurations:

- move left: $[t,r,d,l,0]$. The null-zone number is moved to the right of the real-zone, and the first real number is moved into the null-zone. Note that the 0 shifts place. This happens on all transformations.
- rotate left: $[d, l, t, r, 0]$. The null-zone number is moved to the left of the real-zone, and the last real number is moved into the null-zone.

The notion of moving numbers in and out of the null zone is very useful, as certain transformations are equivalent when conceptualized through it.

### Improvements

The minimum information you need to actually keep track of a dice in our game is the value of two of its faces, as the mirror of a valid dice configuration is always invalid.

## Threatened Cells

## Dice Rolling

Currently, to roll the dice we simulate the 3d dice transformations, moving it and rotating it randomly. This is not very computationally complex, as we our operations have been abstracted into simple array operations, but there is a better way to do it. First, a simple improvement would be to use a JavaScript Map, as our use of array read-write operations is better suited to that kind of data structure.

An even better thing to do is use a lookup table. Because a dice has only $6\times 4$ possible configurations, we could have just kept a list of all possible dice states and just randomly pick one. That would have saved in calculations, as the lookup table would only have had to be calculated once.

## Notes on the AI

- Because our game has turns with variable steps, using minimax proved complex, as checking possible future board states is an involved process

### Possible Heuristics for MinMax
