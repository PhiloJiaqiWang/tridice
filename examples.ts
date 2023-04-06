import { CellID, Dice } from "./cell.ts";
import { Tridice } from "./tridice.ts";

/**
 * ## Player decides to place a dice on the board
 *
 * Example also works for the first turn of either player.
 *
 * In this example, the player chose to move the dice to cell 11.
 * The dice selected by the player is dice 0.
 * @date 4/5/2023 - 8:39:37 PM
 *
 * @param {Tridice} game
 */
function placeDiceExample(
  game: Tridice,
  chosenCell: CellID = 11,
  chosenDice = game.currentPlayer.getDice(0)!
) {
  // Set game dice to chosen dice
  game.selectDice(chosenDice);
  // Roll dice to fit the chosen cell
  game.rollDiceToFit(chosenCell);
  // Place dice at given cell
  game.placeSelectedDiceAt(chosenCell);
  // End turn
  game.endTurn();
}

/**
 * Dice at cell `diceCell` is being moved.
 * @date 4/6/2023 - 11:35:12 AM
 *
 * @param {Tridice} game
 * @param {CellID} diceCell
 */
function moveDiceExample(game: Tridice, diceCell: CellID) {
  // Extracting the dice from the cell
  const dice = game.cells.get(diceCell)?.dice!;

  // Making it the selected dice
  game.selectDice(dice);

  // The number of moves left in the dice can be retrieved as such
  while (game.canSelectedDiceMove()) {
    // Getting the possible moves for this dice
    const neighbors = game.selectedDiceNeighbors();
  }
}
