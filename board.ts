export const ROLL_COUNT = 4;

function* cellIDIterator() {
  for (let a = 1; a <= ROLL_COUNT; a++)
    for (let b = 1; b <= a + 2; b++) yield a * 10 + b;
}

console.log(Array.from(cellIDIterator()));

type NeighborType = "up" | "down" | "left" | "right";
type CellID = number;
interface Neighborhood {
  up: Cell | number | null;
  down: Cell | number | null;
  left: Cell | number | null;
  right: Cell | number | null;
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
    if (this.nullIndex === this.faces.length - 1) return this.nullIndex - 1;
    return this.nullIndex + 1;
  }

  get canMoveUp() {
    return this.up === 0;
  }
  get canMoveDdown() {
    return this.down === 0;
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
      if (direction === "down" && !this.canMoveDdown)
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

  roll(count: number) {
    for (let _ = 0; _ < count; _++) {
      const choice = ["up", "down", "left", "right"][
        DiceFaces.randint(0, 4)
      ] as NeighborType;

      if (choice === "up" || choice === "down") {
        if (this.canMoveDdown) this.move("down");
        else this.move("up");
      } else this.move(choice);
    }
  }
}

export class Dice {
  readonly id: number;
  private currentCell: Cell | null;
  private faces: DiceFaces;

  moveCount: number;
  temporaryFaces: DiceFaces;
  movementTracking: Array<[Cell, NeighborType]>;

  state: string;

  constructor(id: number) {
    this.id = id;
    this.currentCell = null;
    this.movementTracking = [];
    this.faces = new DiceFaces();
    this.temporaryFaces = this.faces.copy();
    this.moveCount = this.faces.top;
    this.state = "";
  }

  moveTo(cell: Cell) {
    this.currentCell?.removeDice();
    this.currentCell = cell;
    this.movementTracking = [];
  }

  fixTemporaryFaces() {
    this.faces = this.temporaryFaces.copy();
    const lastMove = this.movementTracking[this.movementTracking.length - 1];
    this.currentCell = lastMove[0];
    this.movementTracking = [];
    this.moveCount = this.faces.top;
  }

  tryMoveTo(direction: NeighborType) {
    const nextNeighbor = this.cell?.getNeighbor(direction);

    if (nextNeighbor === null || nextNeighbor === undefined)
      throw new Error("Invalid direction");
    if (typeof nextNeighbor === "number")
      throw new Error("Neighbor not yet set to Cell instance");

    this.temporaryFaces.move(direction);

    const undoDirection = DiceFaces.faceDirectionInverter[
      direction
    ] as NeighborType;

    this.movementTracking.push([nextNeighbor, undoDirection]);
    this.moveCount--;
  }

  undoMove() {
    const lastMove = this.movementTracking.pop();
    if (lastMove === undefined) throw new Error("No moves to undo");
    this.temporaryFaces.move(lastMove[1]);
    this.moveCount++;
  }

  get cell() {
    return this.currentCell;
  }

  roll(count = 10) {
    this.faces.roll(count);
    this.moveCount = this.faces.top;
  }
}

export class Cell {
  private neighbors: Neighborhood;
  private content: Dice | null;
  readonly id: CellID;

  constructor(id: CellID, neighbors: Neighborhood) {
    this.neighbors = neighbors;
    this.id = id;
    this.content = null;
  }

  set dice(dice: Dice | null) {
    if (this.content === null) throw new Error("Cell already filled.");
    this.content = dice;
  }

  get dice(): Dice | null {
    return this.content;
  }

  removeDice(): Dice {
    const dice = this.content;
    if (dice === null)
      throw new Error("Trying to remove dice from empty cell.");
    this.content = null;
    return dice;
  }

  getNeighbor(neighbor: NeighborType) {
    return this.neighbors[neighbor];
  }

  setNeighbor(neighborID: NeighborType, neighborCell: Cell) {
    const neighbor = this.neighbors[neighborID];

    if (typeof neighbor !== "number") throw new Error("Neighbor already set.");
    if (neighbor !== neighborCell.id)
      throw new Error("Invalid neighbor setting.");

    this.neighbors[neighborID] = neighborCell;
  }
}

export class Board {
  constructor() {}
}
