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
  private faces: string[];
  constructor() {
    this.faces = "1 2 3 4 0".split(" ");
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
  get bottom() {
    return this.faces[4];
  }

  get nullZone() {
    return this.faces.slice(3);
  }

  get nullIndex() {
    return this.faces.indexOf("0");
  }

  get nullZoneNumber() {
    if (this.nullIndex === this.faces.length) return this.nullIndex - 1;
    return this.nullIndex + 1;
  }

  addToNullZone(num: string) {
    const oldNullZoneNumber = this.nullZoneNumber;
  }

  move(direction: NeighborType) {}
}

export class Dice {
  readonly id: number;
  private currentCell: Cell | null;
  private faces: DiceFaces;
  movementTracking: Array<CellID>;

  constructor(id: number, faces: DiceFaces) {
    this.id = id;
    this.currentCell = null;
    this.movementTracking = [];
    this.faces = faces;
  }

  moveTo(cell: Cell) {
    this.currentCell?.removeDice();
    this.currentCell = cell;
    this.movementTracking = [];
  }

  get cell() {
    return this.currentCell;
  }

  setFaces(faces: DiceFaces) {
    this.faces = faces;
  }

  static diceFaces(): DiceFaces {
    return {
      top: 1,
      up: null,
      down: 4,
      left: 2,
      right: 3,
    };
  }

  static rollFaces(faces: DiceFaces) {}

  static moveFaces(faces: DiceFaces, orientation: NeighborType) {
    const { top, up, down, left, right } = faces;
    if (
      (orientation === "up" && faces["down"] === null) ||
      (orientation === "down" && faces["up"] === null)
    )
      throw new Error("Can't make move.");
    if (orientation === "up" || orientation === "down") {
      [faces.top, faces.up, faces.down, faces.left, faces.right] = [
        down,
        top,
        up,
        left,
        right,
      ];
    } else if (orientation === "left") {
      if (faces.up === null)
        [faces.top, faces.up, faces.down, faces.left, faces.right] = [
          left,
          right,
          up,
          down,
          top,
        ];
      else
        [faces.top, faces.up, faces.down, faces.left, faces.right] = [
          left,
          down,
          right,
          up,
          top,
        ];
    } else if (orientation === "right") {
      if (faces.up === null)
        [faces.top, faces.up, faces.down, faces.left, faces.right] = [
          right,
          left,
          up,
          top,
          down,
        ];
      else
        [faces.top, faces.up, faces.down, faces.left, faces.right] = [
          right,
          down,
          left,
          top,
          up,
        ];
    }
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

export class NeTS {
  constructor() {}
}
