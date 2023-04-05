export const ROLL_COUNT = 4;

function* cellIDIterator() {
  for (let a = 1; a <= ROLL_COUNT; a++)
    for (let b = 1; b <= a + 2; b++) {
      if (a === 1 && b > 1) continue;
      yield a * 10 + b;
    }
}

// const CELL_IDS = Array.from(cellIDIterator());

type NeighborType = "up" | "down" | "left" | "right";
type CellID = number;
interface Neighborhood {
  up: Cell | number;
  down: Cell | number;
  left: Cell | number;
  right: Cell | number;
}

class DiceFaces {
  static faceNameToIndex = {
    left: 0,
    top: 1,
    right: 2,
    up: 3,
    down: 4,
  };

  static faceDirectionInverter = {
    left: "right",
    top: "top",
    right: "left",
    up: "down",
    down: "up",
  };

  private faces: number[];
  constructor(faces = [1, 2, 3, 4, 0]) {
    this.faces = faces;
  }

  copy() {
    return new DiceFaces([...this.faces]);
  }

  get pointingDirection(): "up" | "down" {
    if (this.nullIndex === this.faces.length - 1) return "up";
    return "down";
  }

  toString() {
    return this.faces.toString();
  }

  get left() {
    return this.faces[0];
  }
  get top() {
    return this.faces[1];
  }
  get right() {
    return this.faces[2];
  }
  get up() {
    return this.faces[3];
  }
  get down() {
    return this.faces[4];
  }

  get lastRealFace() {
    return this.faces[2];
  }

  get middleRealFace() {
    return this.faces[1];
  }

  get firstRealFace() {
    return this.faces[0];
  }

  set realFaces(newRealFaces: number[]) {
    this.faces = [...newRealFaces, this.faces[3], this.faces[4]];
  }

  get realFaces() {
    return this.faces.slice(0, 4);
  }

  get nullZone() {
    return this.faces.slice(3);
  }

  get nullIndex() {
    if (this.faces[this.faces.length - 1] === 0) return this.faces.length - 1;
    return this.faces.length - 2;
  }

  get nullZoneNumber() {
    if (this.nullIndex === this.faces.length - 1)
      return this.faces[this.nullIndex - 1];
    return this.faces[this.nullIndex + 1];
  }

  get canMoveUp() {
    return this.up === 0;
  }
  get canMoveDown() {
    return this.down === 0;
  }

  rotate(direction: "right" | "left") {
    if (direction === "right" && this.nullIndex === this.faces.length - 2)
      direction = "left";
    else if (direction === "left" && this.nullIndex === this.faces.length - 1)
      direction = "right";

    if (direction === "right") {
      const oldNullZoneNumber = this.moveNumberToNullZone(this.lastRealFace);
      this.realFaces = [
        this.firstRealFace,
        this.middleRealFace,
        oldNullZoneNumber,
      ];
    } else {
      const oldNullZoneNumber = this.moveNumberToNullZone(this.firstRealFace);
      this.realFaces = [
        oldNullZoneNumber,
        this.middleRealFace,
        this.lastRealFace,
      ];
    }
  }

  moveNumberToNullZone(newNullZoneNumber: number) {
    const oldNullZoneNumber = this.nullZoneNumber;
    const oldNullIndex = this.nullIndex;

    const newNullIndex = this.faces.indexOf(oldNullZoneNumber);

    this.faces[oldNullIndex] = newNullZoneNumber;
    this.faces[newNullIndex] = 0;

    return oldNullZoneNumber;
  }

  move(direction: NeighborType) {
    if (direction === "right") {
      const oldNullZoneNumber = this.moveNumberToNullZone(this.lastRealFace);
      this.realFaces = [
        oldNullZoneNumber,
        this.firstRealFace,
        this.middleRealFace,
      ];
    } else if (direction === "left") {
      const oldNullZoneNumber = this.moveNumberToNullZone(this.firstRealFace);
      this.realFaces = [
        this.middleRealFace,
        this.lastRealFace,
        oldNullZoneNumber,
      ];
    } else if (direction === "down" || direction === "up") {
      if (direction === "down" && !this.canMoveDown)
        throw new Error("Can't move down");
      if (direction === "up" && !this.canMoveUp)
        throw new Error("Can't move up");

      const oldNullZoneNumber = this.moveNumberToNullZone(this.middleRealFace);
      this.realFaces = [
        this.firstRealFace,
        oldNullZoneNumber,
        this.lastRealFace,
      ];
    }
  }

  static randint(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  randomMove() {
    const choice = ["up", "down", "left", "right"][
      DiceFaces.randint(0, 4)
    ] as NeighborType;

    if (choice === "up" || choice === "down") {
      if (this.canMoveDown) this.move("down");
      else if (this.canMoveUp) this.move("up");
    } else this.move(choice);
  }

  randomRotation() {
    const rot = Math.random() <= 0.5 ? "left" : "right";
    this.rotate(rot);
  }

  simulatedRoll(count: number) {
    for (let _ = 0; _ < count; _++) {
      this.randomMove();
      const doRotate = Math.random() >= 0.5;
      if (doRotate) this.randomRotation();
    }
  }

  roll() {
    const newFaces = [-1, -1, -1, -1, -1];
    const availablePositions = new Set([0, 1, 2, 3, 4]);
    const newNullPosition = DiceFaces.randint(
      this.faces.length - 2,
      this.faces.length
    );
    newFaces[newNullPosition] = 0;
    availablePositions.delete(newNullPosition);
    for (const number of [1, 2, 3, 4]) {
      const randIndex = DiceFaces.randint(0, availablePositions.size);
      const newFacePosition = [...availablePositions][randIndex];
      newFaces[newFacePosition] = number;
      availablePositions.delete(newFacePosition);
    }

    this.faces = newFaces;
  }
}

export class Dice {
  readonly id: number | string;
  private currentCell: Cell | null;
  private faces: DiceFaces;
  readonly owner: Player;

  static ERROR = {
    InvalidDirection: new Error("Invalid direction for dice movement."),
    CellNotSet: new Error("Cell not set to class instance."),
    NoMoves: new Error("Dice has no attempted moves."),
    NoMovesLeft: new Error("Dice has no moves left."),
    HasMovesLeft: new Error("Can't finish dice move with moves left on dice."),
  };

  moveCount: number;
  temporaryFaces: DiceFaces;
  movementTracking: Array<[Cell, NeighborType]>;

  state: string;

  constructor(id: number | string, owner: Player) {
    this.id = id;
    this.owner = owner;
    this.currentCell = null;
    this.movementTracking = [];
    this.faces = new DiceFaces();
    this.temporaryFaces = this.faces.copy();
    this.moveCount = this.faces.top;
    this.state = "";
  }

  get facesString() {
    return this.faces.toString;
  }

  get currentPointingDirection() {
    return this.faces.pointingDirection;
  }

  get temporaryPointingDirection() {
    return this.temporaryFaces.pointingDirection;
  }

  rotate(direction: "left" | "right") {
    this.faces.rotate(direction);
    this.temporaryFaces = this.faces.copy();
  }

  /**
   * Removes itself from previous cell, sets its `currentCell` to the new cell.
   *
   * Doesn't change faces.
   *
   * Ignores whether cell is occupied or not
   * @date 4/5/2023 - 11:37:02 AM
   *
   * @param {Cell} cell
   */
  moveTo(cell: Cell) {
    cell.dice = this;
    this.currentCell?.removeDice();
    this.currentCell = cell;
    this.movementTracking = [];
  }

  resetTemporaryMoves() {
    this.movementTracking = [];
    this.moveCount = this.faces.top;
    this.temporaryFaces = this.faces.copy();
  }

  removeFromCell() {
    this.currentCell = null;
  }

  /**
   * Sets faces to temporary faces.
   *
   * Uses `moveTo` with last cell on `movementTracking`.
   *
   * Move count reset to top face.
   * @date 4/5/2023 - 11:38:19 AM
   */
  fixTemporaryFaces() {
    if (!this.canFinishMoving) {
      const error = Dice.ERROR.HasMovesLeft;
      error.message = `Dice [${this.id}] cannot finish moving because it still has ${this.moveCount} moves left.`;
      throw error;
    }
    this.faces = this.temporaryFaces.copy();
    const lastMove = this.movementTracking[this.movementTracking.length - 1];
    this.moveTo(lastMove[0]);
    this.movementTracking = [];
    this.moveCount = this.faces.top;
  }

  get canFinishMoving() {
    return this.moveCount === 0;
  }

  /**
   * Attempts to move to given direction.
   *
   * Ignores whether cell it is trying to move to is empty.
   *
   * @date 4/5/2023 - 11:41:16 AM
   *
   * @throws {Dice.ERROR.InvalidDirection} if next neighbor is undefined
   * @param {NeighborType} direction
   */
  tryMoveTo(direction: NeighborType) {
    if (this.canFinishMoving) {
      const error = Dice.ERROR.NoMovesLeft;
      error.message = `Dice [${this.id}] cannot move because it's move count has reached 0.`;
      throw error;
    }

    const nextNeighbor = this.cell?.getNeighbor(direction);

    if (nextNeighbor === undefined) {
      const error = Dice.ERROR.InvalidDirection;
      error.message = `Dice [${this.id}] cannot move [${direction}] from [${this.cell}] because there is no cell there.`;
      throw error;
    }
    if (typeof nextNeighbor === "number") {
      const error = Dice.ERROR.InvalidDirection;
      error.message = `Dice [${this.id}] cannot move [${direction}] because ${nextNeighbor} is still a number.`;
      throw error;
    }

    this.temporaryFaces.move(direction);

    const undoDirection = DiceFaces.faceDirectionInverter[
      direction
    ] as NeighborType;

    this.movementTracking.push([nextNeighbor, undoDirection]);
    this.moveCount--;
  }

  undoMove() {
    const lastMove = this.movementTracking.pop();
    if (lastMove === undefined) {
      const error = Dice.ERROR.NoMoves;
      error.message = `Dice [${this.id}] cannot undo moves because it has made none.`;
      throw error;
    }
    this.temporaryFaces.move(lastMove[1]);
    this.moveCount++;
    return lastMove[0];
  }

  get cell() {
    return this.currentCell;
  }

  roll() {
    this.faces.roll();
    this.moveCount = this.faces.top;
    this.temporaryFaces = this.faces.copy();
  }

  simulatedRoll(count: number) {
    this.faces.simulatedRoll(count);
    this.moveCount = this.faces.top;
    this.temporaryFaces = this.faces.copy();
  }

  toString() {
    return this.faces.toString();
  }
}

export class Cell {
  private neighbors: Neighborhood;
  private content: Dice | null;
  readonly id: CellID;
  readonly pointingDirection: "up" | "down";

  static ERROR = {
    AlreadyFull: new Error("Cell already full."),
    EmptyCell: new Error("Trying to remove dice from empty cell."),
    NeighborAlreadySet: new Error("Trying to set already defined neighbor."),
    InvalidNeighbor: new Error("Trying to add an invalid neighbor."),
    DiceDoesntFit: new Error("Dice doesn't fit cell."),
  };

  constructor(
    id: CellID,
    neighbors: Neighborhood,
    pointingDirection: "up" | "down"
  ) {
    this.neighbors = neighbors;
    this.id = id;
    this.content = null;
    this.pointingDirection = pointingDirection;
  }

  get neighborhood() {
    return this.neighbors;
  }

  set dice(dice: Dice | null) {
    if (this.content !== null) {
      const error = Cell.ERROR.AlreadyFull;
      error.message = `Cell [${this.id}] already contains the dice [${this.dice}].`;
      throw error;
    }
    if (dice !== null && !this.diceFits(dice)) {
      const error = Cell.ERROR.DiceDoesntFit;
      error.message = `Dice [${this.dice}] doesn't fit in cell [${this.id}].`;
      throw error;
    }
    this.content = dice;
  }

  get dice(): Dice | null {
    return this.content;
  }

  diceFits(dice: Dice) {
    if (dice.currentPointingDirection !== this.pointingDirection) return false;
    return true;
  }

  removeDice(): Dice {
    const dice = this.content;
    if (dice === null) {
      const error = Cell.ERROR.EmptyCell;
      error.message = `Cell [${this.id}] is empty.`;
      throw error;
    }
    this.content = null;
    dice.removeFromCell();
    return dice;
  }

  getNeighbor(neighbor: NeighborType) {
    return this.neighbors[neighbor];
  }

  setNeighbor(
    neighborDirection: NeighborType,
    neighborCell: Cell,
    doReciprocate = true
  ) {
    const neighbor = this.neighbors[neighborDirection];

    if (typeof neighbor !== "number") {
      const error = Cell.ERROR.NeighborAlreadySet;
      error.message = `Cell [${this.id}] already has a(n) [${neighborDirection}] neighbor: [${neighbor.id}].`;
      throw error;
    }
    if (neighbor !== neighborCell.id) {
      const error = Cell.ERROR.InvalidNeighbor;
      error.message = `Cell [${this.id}] was expecting a neighbor with id [${neighbor}], instead got a neighbor with id [${neighborCell.id}].`;
      throw error;
    }

    this.neighbors[neighborDirection] = neighborCell;
    if (
      neighborDirection !== "up" &&
      neighborDirection !== "down" &&
      doReciprocate
    ) {
      const inverseDirection = DiceFaces.faceDirectionInverter[
        neighborDirection
      ] as NeighborType;
      neighborCell.setNeighbor(inverseDirection, this, false);
    }
  }
}

export class Player {
  readonly dice: Dice[];
  readonly id: number;

  constructor(playerNumber: number, numberOfDice = 4) {
    this.id = playerNumber;
    this.dice = [];
    for (let diceID = 0; diceID < numberOfDice; diceID++) {
      const diceStringID = (this.id * 10 + diceID).toString();
      this.dice.push(new Dice(diceStringID, this));
    }
  }
}

export class Board {
  private cellMap: Map<CellID, Cell>;
  private players!: [Player, Player];
  private currentPlayerIndex: number;
  private currentDice!: Dice | null;

  readonly upFacingCells: Map<CellID, Cell>;
  readonly downFacingCells: Map<CellID, Cell>;

  static ERROR = {
    UndefinedCell: new Error("Undefined cell."),
    WrongTurnMove: new Error("Player making move not on their turn."),
    NoCurrentDice: new Error("No current dice set."),
  };

  constructor() {
    this.cellMap = new Map();
    this.players = [new Player(1), new Player(2)];
    this.currentPlayerIndex = 0;
    this.upFacingCells = new Map();
    this.downFacingCells = new Map();

    for (const id of cellIDIterator()) {
      const neighbors = {
        up: id - 11,
        down: id + 11,
        left: id - 1,
        right: id + 1,
      } as Neighborhood;
      const unitNumber = +id.toString()[1];
      const pointingDirection = unitNumber % 2 ? "up" : "down";
      const newCell = new Cell(id, neighbors, pointingDirection);
      this.cellMap.set(id, newCell);

      if (newCell.pointingDirection === "down")
        this.downFacingCells.set(id, newCell);
      else this.upFacingCells.set(id, newCell);

      this.currentDice = null;
    }

    const neighborhoodKeys = ["up", "down", "left", "right"] as NeighborType[];
    for (const cell of this.cellMap.values()) {
      for (const neighborDirection of neighborhoodKeys) {
        const neighborID = cell.getNeighbor(neighborDirection);

        if (neighborID instanceof Cell) continue;

        const neighborCell = this.cellMap.get(neighborID);
        if (neighborCell === undefined) continue;

        cell.setNeighbor(neighborDirection, neighborCell);
      }
    }
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  get p1() {
    return this.players[0];
  }

  get p2() {
    return this.players[1];
  }

  get cells() {
    return this.cellMap;
  }

  setCurrentDice(dice: Dice) {
    this.currentDice?.resetTemporaryMoves();
    this.currentDice = dice;
  }

  nextTurn() {
    this.currentPlayerIndex++;
    this.currentPlayerIndex %= 2;
  }

  placeCurrentDiceAt(cellID: CellID) {
    const cell = this.cells.get(cellID);

    if (cell === undefined) {
      const error = Board.ERROR.UndefinedCell;
      error.message = `Cell ${cellID} doesn't exist on board.`;
      throw error;
    }

    this.currentDice?.moveTo(cell);
  }

  removeDiceFrom(cellID: CellID) {
    const cell = this.cells.get(cellID);

    return cell?.removeDice();
  }

  undoMove() {
    this.currentDice?.undoMove();
  }

  moveHistory() {
    return this.currentDice?.movementTracking.map(([cell, _]) => cell.id);
  }

  lastMoveMade() {
    return this.currentDice?.movementTracking[
      this.currentDice?.movementTracking.length - 1
    ][0].id;
  }

  moveDice(direction: NeighborType) {
    if (this.currentDice === null) {
      const error = Board.ERROR.NoCurrentDice;
      error.message = "Can't move dice because board has no `currentDice` set.";
      throw error;
    }

    if (this.currentDice.owner !== this.currentPlayer) {
      const error = Board.ERROR.WrongTurnMove;
      error.message = `Dice being moved ([${this.currentDice.id}]) doesn't belong to current player ([${this.currentPlayer.id}]).`;
      throw error;
    }

    this.currentDice.tryMoveTo(direction);
  }

  endTurn() {
    this.currentDice?.fixTemporaryFaces();
    this.currentDice = null;
    this.nextTurn();
  }

  canEndTurn() {
    return this.currentDice?.canFinishMoving;
  }

  rollCurrentDice() {
    this.currentDice?.roll();
  }

  rollDice(dice: Dice) {
    dice.roll();
  }

  simulateDiceRoll(dice: Dice, count = 30) {
    dice.simulatedRoll(count);
  }

  getCellsFittingForDice(dice: Dice) {
    if (dice.currentPointingDirection === "down") return this.downFacingCells;
    return this.upFacingCells;
  }

  getCellsFittingForCurrentDice() {
    if (this.currentDice?.currentPointingDirection === "down")
      return this.downFacingCells;
    return this.upFacingCells;
  }
}

function demo() {
  const b = new Board();
  const p1 = b.p1;
  const p2 = b.p2;
  const cell11 = b.cells.get(11)!;

  // Player 1 selects dice
  b.setCurrentDice(p1.dice[0]);
  // Rolls current dice
  b.rollCurrentDice();
  // Cells where rolled dice could fit
  let fittingCells = b.getCellsFittingForCurrentDice();
  // Player 1 places dice in cell
  b.placeCurrentDiceAt(11);
  // Player 1 finishes turn
  b.endTurn();

  // Player 2 selects dice
  b.setCurrentDice(p1.dice[0]);
  // Rolls current dice
  b.rollCurrentDice();
  // Player 2 places dice in cell 11
  b.placeCurrentDiceAt(11);
  // Player 2 finishes turn
  b.endTurn();
}

demo();
