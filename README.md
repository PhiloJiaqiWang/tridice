# Tridice

Replit: https://replit.com/@PhiloJiaqiWang/triDice

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

The minimum information you need to actually keep track of a dice in our game is the value of two of its faces, as the vertical and horizontal mirrors of a valid dice configuration are always invalid.

## GUI

We use the p5.js to create the GUI. 
![GUI picture]()
There are five classes used here.
- Board
  constructor(row, pointX, pointY, length) {
    this.row = row
    this.length = length
    this.pointX = pointX
    this.pointY = pointY
    this.cellLis = []
  }
- VisualCell
  constructor(position, up, down, left, right, isUp, pointX, pointY, length) {
    this.position = position
    this.up = up
    this.down = down
    this.right = right
    this.left = left
    this.isUp = isUp
    this.topOne = 0
    this.length = length
    this.pointX = pointX
    this.pointY = pointY
    this.color = "#2C1B47"
    this.player = 0
  }
- VisualDice
  constructor(pointX, pointY, length) {
    this.length = length
    this.pointX = pointX
    this.pointY = pointY
    this.color = "#2C1B47"
    this.show = true
  }
- VisualPlayer
  constructor(id,num,positionX, positionY,diceLength,showArrow) {
    this.id = id
   this.num = num
    this.diceLength = diceLength
    this.positionX = positionX
    this.positionY = positionY
    this.diceLis = []
    this.showArrow = showArrow
  }
- VisualGameManager
  constructor(player1, player2, board) {
    this.player1 = player1
    this.player2 = player2
    this.board = board
    this.triDice = new Tridice()
    this.clickedCell = null
    this.currentPlay = null
    this.latestStep = null
  }

Among these classes, the GameManager is the only one which receives feedback from the back end.
## AI

### Threatened Cells

We can calculate what cells are threated by an attack of each player by calculating all cells that can be reached in $n$ steps by a dice with $n$ moves.
A few considerations need to be made in calculating the paths. We are not interested in the single shortest path, and we cannot stop searching when we find a path of length $n$. That is because a dice could reach the same cell in more than one way, and the final configuration of the dice could be different for each path.

We use the information on threatened cells and reach of dice in our AI prototype. Our AI has the following behavior:

- It first checks if any of its currently placed dice can capture an enemy piece
  - If it can capture, it will
- If there are no available captures, the AI looks at all enemy dice, and checks if any of its own dice is under threat by the opponent
  - If some of its dice are under threat, it will try to move out of the way by checking if there are any safe cells to move to
- If it finds that none of the cells it can move the threatened dice to are safe, the AI will attempt to place a dice in a safe spot
- If there are no save spots available, it will move a dice that is not currently under threat to a position such that the number for is on top (and it could then move 4 steps next turn)

The two last points are still WIP and haven't been fully implemented.

### Board Cells Naming

Any cell on the board can be represented as a coordinate $(a,b)$. $a$ is a number representing what row the cell is located in, and $b$ tells us where in the row a cell is. Both numbers start at 1.

This convention was chosen to facilitate traversal in a non-grid board. $a$ and $b$ can be combined as $c=10a+b$. Moving up is just $c+11$, and moving left or right is just $c\plusmn1$.

This simple conversion also helps with pathfinding, as our algorithm calculates a path while keeping track of the cell coordinates. That path needs to then be converted into a list of intructions of what directions to move, as that is the only way that the Dice class is able to understand where to move.

## Dice Rolling

Currently, to roll the dice we simulate the 3d dice transformations, moving it and rotating it randomly. This is not very computationally complex, as we our operations have been abstracted into simple array operations, but there is a better way to do it. First, a simple improvement would be to use a JavaScript Map, as our use of array read-write operations is better suited to that kind of data structure.

An even better thing to do is use a lookup table. Because a dice has only $6\times 4$ possible configurations, we could have just kept a list of all possible dice states and just randomly pick one. That would have saved in calculations, as the lookup table would only have had to be calculated once.

## Heuristics

Because our game has turns with variable steps, using minimax proved complex, as checking possible future board states is an involved process. We started out by planning a MinMax algorithm before turning to our AI with simplified behavior. The main issue we encountered was with the ability to undo moves.

Nevertheless, the calculations we are currently performing for our AI provide a good base for a heuristics function.
We believe that the main considerentions for a heuristics function would be:

- Keeping track of the dice that haven't been placed on the board
  - Their value should likely be variable. For example, even if you have a dice in hand, it isn't very useful if there are no safe cells to place it (i.e., it would be captured right after being placed)
- Dice have different importance depending on what cell they are in
  - Cells in one of the three corners of the board aren't very powerful, since dice placed there have much of their possible threats blocked by the edge of the board
  - A cell in the center of the board is very valuable as most or all of its possible moves actually exist in the board.
- A heuristic function could also make use of our path finding functions to calculate the reach of dice and what cells are under threat or not

In any case, we believe that the reach of a dice is even more important than how many moves it can make, and is a good base for heuristics calculations.

### Game State Example

One situation that could be useful in thinking about a heuristics function is the following.

There are 3 dice on the board, dice $A$ and $B$ belong to player 1, dice $C$ belongs to player 2.
$A$ can reach $B$, $B$ and $C$ can only reach empty cells.
$A$'s value might be lower than if $B$ wasn't there, as $B$ is limiting $A$'s movement.

However, if we have the same situation, except $C$ can reach $B$ as well, $A$'s value could be higher than if $B$ wasn't there. In this case, $A$'s position means the players have the option of trading pieces.

## Complexity

The most expensive part of our project is probably our pathfinding function.
Still, because of the small size of our board and the fact that the highest reach for a dice is 4, it isn't costly in practice.
As previously mentioned, one downside specific to our situation is that we need to exaust all paths of a certain length, as opposed to finding the shortest path somewhere and stopping there.

The worst case scenario in our specific board configuration is the reach of cell $33$, as it can pass through all cells of the board.
We need to verify all paths even if they lead to the same place. For instance, $33$ can reach $11$ in two different ways.
