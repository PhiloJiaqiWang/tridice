import { Cell, CellID, Dice, NeighborType, throwCustomError } from "./cell.ts";
import { Tridice } from "./tridice.ts";

/**
 * Tridice AI
 *
 * ## Ruleset
 * 1. Capture pieces if possible
 * 2. Move out of capture range
 * 3. Place piece out of capture range
 * 4. Move piece so that 4 is on top
 *
 * @date 4/14/2023 - 3:41:08 PM
 *
 * @class AI
 * @typedef {AI}
 */
export class AI {
  readonly boardHeight: number;

  constructor(boardHeight = 4) {
    this.boardHeight = boardHeight;
  }

  makeTurn(game: Tridice) {
    console.log("Making turn");
    if (this.tryCapture(game)) {
      console.log("Capture successful");
      return game.endTurn();
    }
    console.log("Capture unsuccessful, tyring move out of range");
    if (this.tryMoveOutOfRange(game)) {
      console.log("Move out of range successful");
      return game.endTurn();
    }
  }

  tryCapture(game: Tridice) {
    console.log("Trying capture");
    const allPlacedDice = game.board();
    const player = game.currentPlayer;

    const { diceOnBoard } = player;

    if (diceOnBoard.size === 0) return false;

    let possibleCapture:
      | { originDice: Dice; capture: CellID; topFace: number; path: CellID[] }
      | undefined;

    for (const dice of diceOnBoard.values()) {
      if (dice.cell === null)
        throw throwCustomError(
          Tridice.ERROR.UndefinedCell,
          `Dice ${dice.id} is not inside a cell`
        );
      const moveToCells = this.reachFrom(dice.cell.id, dice.topFace);
      moveToCells.forEach((path, cellID) => {
        if (path.length !== dice.topFace) return;

        const endMoveCell = allPlacedDice.get(cellID);
        if (endMoveCell === undefined || endMoveCell.owner === player) return;
        if (
          possibleCapture === undefined ||
          possibleCapture.topFace < endMoveCell.top
        )
          possibleCapture = {
            originDice: dice,
            capture: cellID,
            topFace: endMoveCell.top,
            path: [...path, cellID],
          };
      });
    }

    if (possibleCapture === undefined) return false;

    console.log(`Capture successful: ${possibleCapture.path}`);

    game.selectDice(possibleCapture.originDice);
    game.captureDiceAt(possibleCapture.capture);

    const { path } = possibleCapture;

    AI.moveDiceThroughPath(game, path);

    return true;
  }

  static moveDiceThroughPath(game: Tridice, path: CellID[]) {
    for (const [idx, cell1] of path.entries()) {
      if (idx + 1 >= path.length) continue;
      const cell2 = path[idx + 1];
      const direction = AI.direction(cell1, cell2);
      console.log(`Moving ${direction}`);
      game.moveDice(direction);
    }
  }

  tryMoveOutOfRange(game: Tridice) {
    console.log("Trying to move out of range");
    const diceOnBoard = game.board();
    const playerDiceOnBoard = game.currentPlayer.diceOnBoard;
    for (const cellWithDice of diceOnBoard.keys()) {
      const { dice } = game.getCellAt(cellWithDice)!;
      if (dice === null)
        throwCustomError(
          Cell.ERROR.EmptyCell,
          `Cell [${cellWithDice}] contains no dice`
        );
      if (dice.owner === game.currentPlayer) continue;
      for (const playerDice of playerDiceOnBoard.values()) {
        if (this.diceCanReachCell(dice, playerDice.cell!.id)) {
          if (this.moveOutOfRange(playerDice, dice, game)) return true;
        }
      }
    }
    return false;
  }

  moveOutOfRange(dice: Dice, attacker: Dice, game: Tridice): boolean {
    game.selectDice(dice);

    console.log(`Attacker: ${attacker.cell!.id}`);

    let escapeRoute: CellID[] = [];

    const escapeRoutes = this.reachFrom(dice.cell!.id, dice.topFace);
    console.log(`Possible escape routes: `, escapeRoutes);
    escapeRoutes.forEach((path, endCell) => {
      console.log(`Trying ${path} to ${endCell}`);
      if (path.length !== dice.topFace) return;
      attacker.owner.diceOnBoard.forEach((enemyDice) => {
        if (this.diceCanReachCell(enemyDice, endCell) || escapeRoute.length > 0)
          return;
        escapeRoute = [...path, endCell];
      });
    });

    if (escapeRoute.length > 0) {
      console.log(`Escaping through ${escapeRoute}`);
      AI.moveDiceThroughPath(game, escapeRoute);
      return true;
    }

    game.deselectDice();

    return false;
  }

  diceCanReachCell(
    dice: Dice,
    cellID: CellID,
    maxMoves = dice.topFace
  ): boolean {
    const reach = this.reachFrom(dice.cell!.id, maxMoves);
    return reach.has(cellID) && reach.get(cellID)?.length === maxMoves;
  }

  static direction(origin: CellID, destination: CellID): NeighborType {
    if (destination === origin + 1) return "right";
    else if (destination === origin - 1) return "left";
    else if (destination === origin - 11) return "up";
    return "down";
  }

  neighborsOf(cell: CellID): CellID[] {
    const neighbors = [cell - 1, cell + 1];

    const isPointedDown = !((cell - 10 * Math.floor(cell / 10)) % 2);
    if (isPointedDown) neighbors.push(cell - 11);
    else neighbors.push(cell + 11);

    return neighbors.filter((n) => {
      const tens = Math.floor(n / 10);
      const units = n - 10 * tens;
      const maxUnits = 2 * tens - 1;
      return (
        n % 10 !== 0 && n > 0 && units <= maxUnits && tens <= this.boardHeight
      );
    });
  }

  /**
   * Returns a set with all cell IDs reachable from the given cell when taking at most `maxSteps` number of steps.
   * @date 4/14/2023 - 4:09:34 PM
   *
   * @param {CellID} cell Starting cell ID
   * @param {number} maxSteps Max steps to be taken
   * @param {number} [stepsTaken=0]
   * @param {Set<{ cell: CellID; steps: number }>} [reachSet=new Set()]
   * @returns {Map<CellID, CellID[]>}
   */
  reachFrom(
    cell: CellID,
    maxSteps: number,
    stepsTaken = 0,
    reachSet: Map<CellID, CellID[]> = new Map(),
    comingFrom: CellID[] = []
  ): Map<CellID, CellID[]> {
    if (stepsTaken > maxSteps) return reachSet;
    const cellSteps = reachSet.get(cell);
    if (cellSteps === undefined || maxSteps === stepsTaken)
      reachSet.set(cell, comingFrom);

    const neighbors = this.neighborsOf(cell);
    for (const n of neighbors) {
      if (comingFrom[comingFrom.length - 1] === n) continue;
      this.reachFrom(n, maxSteps, stepsTaken + 1, reachSet, [
        ...comingFrom,
        cell,
      ]);
    }

    return reachSet;
  }
}

function placeDice(
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
  game.endTurn(true);
}

function moveDice(
  game: Tridice,
  diceCell: CellID,
  movementOrder: NeighborType[]
) {
  // Extracting the dice from the cell
  const dice = game.cells.get(diceCell)?.dice!;

  // Making it the selected dice
  game.selectDice(dice);

  let moveIdx = 0;
  // The number of moves left in the dice can be retrieved as such
  while (game.canSelectedDiceMove()) {
    const moveDirection = movementOrder[moveIdx];
    moveIdx += 1;
    game.moveDice(moveDirection);
  }

  //Finish moving dice
  game.endTurn();
}

function tester() {
  const game = new Tridice();
  const ai = new AI();

  placeDice(game, 11, game.currentPlayer.getDice(0));
  placeDice(game, 33, game.currentPlayer.getDice(0));
  const enemyDice = game.nextPlayer.getDice(0)!;
  const aiDice = game.currentPlayer.getDice(0)!;
  while (enemyDice.topFace !== 4 || !game.getCellAt(33)?.diceFits(enemyDice))
    enemyDice.simulatedRoll(3);
  while (aiDice.topFace !== 1 || !game.getCellAt(11)?.diceFits(aiDice))
    aiDice.simulatedRoll(3);

  ai.makeTurn(game);

  console.log(game.board());
  // console.log(game.currentPlayer.lostDice, game.currentPlayer.id);
}

tester();
