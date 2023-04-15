import {
  Player,
  Cell,
  CellID,
  Dice,
  cellIDIterator,
  NeighborType,
  Neighborhood,
  throwCustomError,
  SimplifiedDice,
} from "./cell.ts";

export class Tridice {
  private cellMap: Map<CellID, Cell>;
  private players!: [Player, Player];
  private currentPlayerIndex: number;
  selectedDice!: Dice | null;

  readonly upFacingCells: Map<CellID, Cell>;
  readonly downFacingCells: Map<CellID, Cell>;

  static ERROR = {
    UndefinedCell: new Error("Undefined cell."),
    WrongTurnMove: new Error("Player making move not on their turn."),
    NoSelectedDice: new Error("No current dice set."),
  };

  static PLAYER_DICE_COUNT = 4;

  constructor() {
    this.cellMap = new Map();
    this.players = [
      new Player(1, Tridice.PLAYER_DICE_COUNT),
      new Player(2, Tridice.PLAYER_DICE_COUNT),
    ];
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

      const pointingDirection = id % 2 ? "up" : "down";

      const newCell = new Cell(id, neighbors, pointingDirection);
      this.cellMap.set(id, newCell);

      if (newCell.pointingDirection === "down")
        this.downFacingCells.set(id, newCell);
      else this.upFacingCells.set(id, newCell);

      this.selectedDice = null;
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

  getCellAt(cellID: CellID) {
    return this.cellMap.get(cellID);
  }

  selectDice(dice: Dice) {
    this.selectedDice?.resetTemporaryMoves();
    this.selectedDice = dice;
  }

  nextTurn() {
    this.currentPlayerIndex++;
    this.currentPlayerIndex %= 2;
  }

  placeSelectedDiceAt(cellID: CellID) {
    const cell = this.cells.get(cellID);

    if (this.selectedDice === null)
      throwCustomError(
        Tridice.ERROR.NoSelectedDice,
        "Can't place selected dice because it hasn't been set. Call selectDice before running this function."
      );

    if (cell === undefined)
      throwCustomError(
        Tridice.ERROR.UndefinedCell,
        `Cell ${cellID} doesn't exist on board.`
      );

    this.selectedDice?.moveTo(cell);
    this.currentPlayer.placeDice(this.selectedDice);
  }

  captureDiceAt(cellID: CellID) {
    const cell = this.cells.get(cellID);

    if (cell === undefined)
      throwCustomError(
        Tridice.ERROR.UndefinedCell,
        `Cell ${cellID} is not on board, so it doesn't have a dice to be captured.`
      );

    const dice = cell.removeDice();
    this.nextPlayer.loseDice(dice);

    return dice;
  }

  get nextPlayer() {
    if (this.currentPlayer === this.players[0]) return this.players[1];
    return this.players[0];
  }

  undoMove() {
    this.selectedDice?.undoMove();
  }

  moveHistory() {
    return this.selectedDice?.movementTracking.map(([cell, _]) => cell.id);
  }

  lastMoveMade(): CellID | undefined {
    return this.selectedDice?.movementTracking[
      this.selectedDice?.movementTracking.length - 1
    ][0].id;
  }

  selectedDiceNeighbors() {
    let currentCellVisiting = this.lastMoveMade();
    if (currentCellVisiting === undefined)
      currentCellVisiting = this.selectedDice?.cell!.id;

    if (currentCellVisiting === undefined)
      throwCustomError(
        Tridice.ERROR.UndefinedCell,
        `Selected dice ${this.selectedDice?.id} hasn't been placed inside a cell.`
      );

    const { neighborsIDs } = this.cellMap.get(currentCellVisiting)!;

    return neighborsIDs;
  }

  movesLeftInSelectedDice() {
    return this.selectedDice?.moveCount;
  }

  canSelectedDiceMove() {
    return !this.selectedDice?.canFinishMoving;
  }

  moveDice(direction: NeighborType) {
    if (this.selectedDice === null)
      throwCustomError(
        Tridice.ERROR.NoSelectedDice,
        "Can't move dice because board has no `selectedDice` set."
      );

    if (this.selectedDice.owner !== this.currentPlayer)
      throwCustomError(
        Tridice.ERROR.WrongTurnMove,
        `Dice being moved ([${this.selectedDice.id}]) doesn't belong to current player ([${this.currentPlayer.id}]).`
      );

    this.selectedDice.tryMoveTo(direction);
  }

  isGameOver(): boolean {
    return this.didPlayerLose(this.p1) || this.didPlayerLose(this.p2);
  }

  private didPlayerLose(player: Player) {
    return player.lostDice.size === Tridice.PLAYER_DICE_COUNT;
  }

  winner(): Player | undefined {
    if (this.didPlayerLose(this.p1)) return this.p2;
    else if (this.didPlayerLose(this.p2)) return this.p1;
    return;
  }

  endTurn(placingDice = false) {
    if (!placingDice) this.selectedDice?.fixTemporaryFaces();
    this.selectedDice = null;
    this.nextTurn();
  }

  canEndTurn() {
    return this.selectedDice?.canFinishMoving;
  }

  rollDiceToFit(cellID: CellID) {
    if (this.selectedDice === null)
      throwCustomError(
        Tridice.ERROR.NoSelectedDice,
        `Can't roll dice to fit ${cellID} because current dice has not been set. Call ${"`setSelectedDice`"} before rolling.`
      );

    this.selectedDice?.roll();
    const cell = this.cellMap.get(cellID);

    if (cell === undefined)
      throwCustomError(
        Tridice.ERROR.UndefinedCell,
        `Can't roll dice to fit ${cellID} because this cell doesn't exist in the board.`
      );

    while (!cell.diceFits(this.selectedDice)) {
      this.selectedDice.rotate("right");
    }
  }

  board() {
    const boardRepresentation: Map<
      CellID,
      SimplifiedDice | undefined
    > = new Map();
    for (const [cellID, cell] of this.cellMap.entries())
      if (cell.dice !== null)
        boardRepresentation.set(cellID, cell.dice.simplified());

    return boardRepresentation;
  }

  simulateDiceRoll(dice: Dice, count = 30) {
    dice.simulatedRoll(count);
  }

  getCellsFittingForDice(dice: Dice) {
    if (dice.currentPointingDirection === "down") return this.downFacingCells;
    return this.upFacingCells;
  }

  getCellsFittingForSelectedDice() {
    if (this.selectedDice?.currentPointingDirection === "down")
      return this.downFacingCells;
    return this.upFacingCells;
  }

  neighborIDsOfCell(cellID: CellID) {
    return this.cells.get(cellID)?.neighborsIDs;
  }
}
