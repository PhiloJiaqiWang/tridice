// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function* cellIDIterator() {
    for(let a = 1; a <= 4; a++)for(let b = 1; b <= a + 2; b++){
        if (a === 1 && b > 1) continue;
        yield a * 10 + b;
    }
}
function throwCustomError(error, message) {
    error.message = message;
    throw error;
}
class DiceFaces {
    static faceNameToIndex = {
        left: 0,
        top: 1,
        right: 2,
        up: 3,
        down: 4
    };
    static faceDirectionInverter = {
        left: "right",
        top: "top",
        right: "left",
        up: "down",
        down: "up"
    };
    faces;
    constructor(faces = [
        1,
        2,
        3,
        4,
        0
    ]){
        this.faces = faces;
    }
    copy() {
        return new DiceFaces([
            ...this.faces
        ]);
    }
    get pointingDirection() {
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
    set realFaces(newRealFaces) {
        this.faces = [
            ...newRealFaces,
            this.faces[3],
            this.faces[4]
        ];
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
        if (this.nullIndex === this.faces.length - 1) return this.faces[this.nullIndex - 1];
        return this.faces[this.nullIndex + 1];
    }
    get canMoveUp() {
        return this.up === 0;
    }
    get canMoveDown() {
        return this.down === 0;
    }
    rotate(direction) {
        if (direction === "right" && this.nullIndex === this.faces.length - 2) direction = "left";
        else if (direction === "left" && this.nullIndex === this.faces.length - 1) direction = "right";
        if (direction === "right") {
            const oldNullZoneNumber = this.moveNumberToNullZone(this.lastRealFace);
            this.realFaces = [
                this.firstRealFace,
                this.middleRealFace,
                oldNullZoneNumber, 
            ];
        } else {
            const oldNullZoneNumber1 = this.moveNumberToNullZone(this.firstRealFace);
            this.realFaces = [
                oldNullZoneNumber1,
                this.middleRealFace,
                this.lastRealFace, 
            ];
        }
    }
    moveNumberToNullZone(newNullZoneNumber) {
        const oldNullZoneNumber = this.nullZoneNumber;
        const oldNullIndex = this.nullIndex;
        const newNullIndex = this.faces.indexOf(oldNullZoneNumber);
        this.faces[oldNullIndex] = newNullZoneNumber;
        this.faces[newNullIndex] = 0;
        return oldNullZoneNumber;
    }
    move(direction) {
        if (direction === "right") {
            const oldNullZoneNumber = this.moveNumberToNullZone(this.lastRealFace);
            this.realFaces = [
                oldNullZoneNumber,
                this.firstRealFace,
                this.middleRealFace, 
            ];
        } else if (direction === "left") {
            const oldNullZoneNumber1 = this.moveNumberToNullZone(this.firstRealFace);
            this.realFaces = [
                this.middleRealFace,
                this.lastRealFace,
                oldNullZoneNumber1, 
            ];
        } else if (direction === "down" || direction === "up") {
            if (direction === "down" && !this.canMoveDown) throw new Error("Can't move down");
            if (direction === "up" && !this.canMoveUp) throw new Error("Can't move up");
            const oldNullZoneNumber2 = this.moveNumberToNullZone(this.middleRealFace);
            this.realFaces = [
                this.firstRealFace,
                oldNullZoneNumber2,
                this.lastRealFace, 
            ];
        }
    }
    static randint(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    randomMove() {
        const choice = [
            "up",
            "down",
            "left",
            "right"
        ][DiceFaces.randint(0, 4)];
        if (choice === "up" || choice === "down") {
            if (this.canMoveDown) this.move("down");
            else if (this.canMoveUp) this.move("up");
        } else this.move(choice);
    }
    randomRotation() {
        const rot = Math.random() <= 0.5 ? "left" : "right";
        this.rotate(rot);
    }
    simulatedRoll(count) {
        for(let _ = 0; _ < count; _++){
            this.randomMove();
            const doRotate = Math.random() >= 0.5;
            if (doRotate) this.randomRotation();
        }
    }
    roll() {
        const newFaces = [
            0,
            0,
            0,
            0,
            0
        ];
        const availablePositions = new Set([
            0,
            1,
            2,
            3,
            4
        ]);
        const newNullPosition = DiceFaces.randint(this.faces.length - 2, this.faces.length);
        newFaces[newNullPosition] = 0;
        availablePositions.delete(newNullPosition);
        const leftoverFaceNumbers = [
            1,
            2,
            3,
            4
        ];
        for (const num of leftoverFaceNumbers){
            const randIndex = DiceFaces.randint(0, availablePositions.size);
            const newFacePosition = [
                ...availablePositions
            ][randIndex];
            newFaces[newFacePosition] = num;
            availablePositions.delete(newFacePosition);
        }
        this.faces = newFaces;
    }
}
class Dice {
    id;
    currentCell;
    faces;
    owner;
    static Directions = [
        "up",
        "down",
        "left",
        "right"
    ];
    static ERROR = {
        InvalidDirection: new Error("Invalid direction for dice movement."),
        CellNotSet: new Error("Cell not set to class instance."),
        NoMoves: new Error("Dice has no attempted moves."),
        NoMovesLeft: new Error("Dice has no moves left."),
        HasMovesLeft: new Error("Can't finish dice move with moves left on dice.")
    };
    moveCount;
    temporaryFaces;
    movementTracking;
    state;
    constructor(id, owner){
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
    rotate(direction) {
        this.faces.rotate(direction);
        this.temporaryFaces = this.faces.copy();
    }
    moveTo(cell) {
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
    fixTemporaryFaces() {
        if (!this.canFinishMoving) throwCustomError(Dice.ERROR.HasMovesLeft, `Dice [${this.id}] cannot finish moving because it still has ${this.moveCount} moves left.`);
        this.faces = this.temporaryFaces.copy();
        const lastMove = this.movementTracking[this.movementTracking.length - 1];
        this.moveTo(lastMove[0]);
        this.movementTracking = [];
        this.moveCount = this.faces.top;
    }
    get canFinishMoving() {
        return this.moveCount === 0;
    }
    tryMoveTo(direction) {
        if (this.canFinishMoving) throwCustomError(Dice.ERROR.NoMovesLeft, `Dice [${this.id}] cannot move because it's move count has reached 0.`);
        const nextNeighbor = this.cell?.getNeighbor(direction);
        if (nextNeighbor === undefined) throwCustomError(Dice.ERROR.InvalidDirection, `Dice [${this.id}] cannot move [${direction}] from [${this.cell}] because there is no cell there.`);
        if (typeof nextNeighbor === "number") throwCustomError(Dice.ERROR.InvalidDirection, `Dice [${this.id}] cannot move [${direction}] because ${nextNeighbor} is still a number.`);
        this.temporaryFaces.move(direction);
        const undoDirection = DiceFaces.faceDirectionInverter[direction];
        this.movementTracking.push([
            nextNeighbor,
            undoDirection
        ]);
        this.moveCount--;
    }
    undoMove() {
        const lastMove = this.movementTracking.pop();
        if (lastMove === undefined) throwCustomError(Dice.ERROR.NoMoves, `Dice [${this.id}] cannot undo moves because it has made none.`);
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
    simulatedRoll(count) {
        this.faces.simulatedRoll(count);
        this.moveCount = this.faces.top;
        this.temporaryFaces = this.faces.copy();
    }
    toString() {
        return this.faces.toString();
    }
    simplified() {
        return {
            top: this.faces.top,
            up: this.faces.up,
            down: this.faces.down,
            left: this.faces.left,
            right: this.faces.right
        };
    }
}
class Cell {
    neighbors;
    content;
    id;
    pointingDirection;
    static ERROR = {
        AlreadyFull: new Error("Cell already full."),
        EmptyCell: new Error("Trying to remove dice from empty cell."),
        NeighborAlreadySet: new Error("Trying to set already defined neighbor."),
        InvalidNeighbor: new Error("Trying to add an invalid neighbor."),
        DiceDoesntFit: new Error("Dice doesn't fit cell.")
    };
    constructor(id, neighbors, pointingDirection){
        this.neighbors = neighbors;
        this.id = id;
        this.content = null;
        this.pointingDirection = pointingDirection;
    }
    get neighborhood() {
        return this.neighbors;
    }
    get neighborsIDs() {
        return {
            up: this.neighbors.up instanceof Cell ? this.neighbors.up.id : null,
            down: this.neighbors.down instanceof Cell ? this.neighbors.down.id : null,
            left: this.neighbors.left instanceof Cell ? this.neighbors.left.id : null,
            right: this.neighbors.right instanceof Cell ? this.neighbors.right.id : null
        };
    }
    set dice(dice) {
        if (this.content !== null) throwCustomError(Cell.ERROR.AlreadyFull, `Cell [${this.id}] already contains the dice [${this.dice}].`);
        if (dice !== null && !this.diceFits(dice)) throwCustomError(Cell.ERROR.DiceDoesntFit, `Dice [${this.dice}] doesn't fit in cell [${this.id}].`);
        this.content = dice;
    }
    get dice() {
        return this.content;
    }
    diceFits(dice) {
        if (dice.currentPointingDirection !== this.pointingDirection) return false;
        return true;
    }
    removeDice() {
        const dice = this.content;
        if (dice === null) throwCustomError(Cell.ERROR.EmptyCell, `Cell [${this.id}] is empty.`);
        this.content = null;
        dice.removeFromCell();
        return dice;
    }
    getNeighbor(neighbor) {
        return this.neighbors[neighbor];
    }
    setNeighbor(neighborDirection, neighborCell, doReciprocate = true) {
        const neighbor = this.neighbors[neighborDirection];
        if (typeof neighbor !== "number") throwCustomError(Cell.ERROR.NeighborAlreadySet, `Cell [${this.id}] already has a(n) [${neighborDirection}] neighbor: [${neighbor.id}].`);
        if (neighbor !== neighborCell.id) throwCustomError(Cell.ERROR.InvalidNeighbor, `Cell [${this.id}] was expecting a neighbor with id [${neighbor}], instead got a neighbor with id [${neighborCell.id}].`);
        this.neighbors[neighborDirection] = neighborCell;
        if (neighborDirection !== "up" && neighborDirection !== "down" && doReciprocate) {
            const inverseDirection = DiceFaces.faceDirectionInverter[neighborDirection];
            neighborCell.setNeighbor(inverseDirection, this, false);
        }
    }
}
class Player {
    dice;
    id;
    lostDice;
    diceOnBoard;
    constructor(playerNumber, numberOfDice = 4){
        this.id = playerNumber;
        this.dice = new Map();
        for(let diceID = 0; diceID < numberOfDice; diceID++){
            const diceStringID = (this.id * 10 + diceID).toString();
            this.dice.set(diceStringID, new Dice(diceStringID, this));
        }
        this.lostDice = new Map();
        this.diceOnBoard = new Map();
    }
    loseDice(dice) {
        this.diceOnBoard.set(dice.id, dice);
        this.diceOnBoard.delete(dice.id);
    }
    placeDice(dice) {
        this.diceOnBoard.set(dice.id, dice);
    }
    getDice(num) {
        const diceID = (this.id * 10 + num).toString();
        return this.dice.get(diceID);
    }
}
class Tridice {
    cellMap;
    players;
    currentPlayerIndex;
    selectedDice;
    upFacingCells;
    downFacingCells;
    static ERROR = {
        UndefinedCell: new Error("Undefined cell."),
        WrongTurnMove: new Error("Player making move not on their turn."),
        NoSelectedDice: new Error("No current dice set.")
    };
    static PLAYER_DICE_COUNT = 4;
    constructor(){
        this.cellMap = new Map();
        this.players = [
            new Player(1, Tridice.PLAYER_DICE_COUNT),
            new Player(2, Tridice.PLAYER_DICE_COUNT), 
        ];
        this.currentPlayerIndex = 0;
        this.upFacingCells = new Map();
        this.downFacingCells = new Map();
        for (const id of cellIDIterator()){
            const neighbors = {
                up: id - 11,
                down: id + 11,
                left: id - 1,
                right: id + 1
            };
            const unitNumber = +id.toString()[1];
            const pointingDirection = unitNumber % 2 ? "up" : "down";
            const newCell = new Cell(id, neighbors, pointingDirection);
            this.cellMap.set(id, newCell);
            if (newCell.pointingDirection === "down") this.downFacingCells.set(id, newCell);
            else this.upFacingCells.set(id, newCell);
            this.selectedDice = null;
        }
        const neighborhoodKeys = [
            "up",
            "down",
            "left",
            "right"
        ];
        for (const cell of this.cellMap.values()){
            for (const neighborDirection of neighborhoodKeys){
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
    selectDice(dice) {
        this.selectedDice?.resetTemporaryMoves();
        this.selectedDice = dice;
    }
    nextTurn() {
        this.currentPlayerIndex++;
        this.currentPlayerIndex %= 2;
    }
    placeSelectedDiceAt(cellID) {
        const cell = this.cells.get(cellID);
        if (this.selectedDice === null) throwCustomError(Tridice.ERROR.NoSelectedDice, "Can't place selected dice because it hasn't been set. Call selectDice before running this function.");
        if (cell === undefined) throwCustomError(Tridice.ERROR.UndefinedCell, `Cell ${cellID} doesn't exist on board.`);
        this.selectedDice?.moveTo(cell);
        this.currentPlayer.placeDice(this.selectedDice);
    }
    captureDiceAt(cellID) {
        const cell = this.cells.get(cellID);
        if (cell === undefined) throwCustomError(Tridice.ERROR.UndefinedCell, `Cell ${cellID} is not on board, so it doesn't have a dice to be captured.`);
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
        return this.selectedDice?.movementTracking.map(([cell, _])=>cell.id);
    }
    lastMoveMade() {
        return this.selectedDice?.movementTracking[this.selectedDice?.movementTracking.length - 1][0].id;
    }
    selectedDiceNeighbors() {
        let currentCellVisiting = this.lastMoveMade();
        if (currentCellVisiting === undefined) currentCellVisiting = this.selectedDice?.cell.id;
        if (currentCellVisiting === undefined) throwCustomError(Tridice.ERROR.UndefinedCell, `Selected dice ${this.selectedDice?.id} hasn't been placed inside a cell.`);
        const { neighborsIDs  } = this.cellMap.get(currentCellVisiting);
        return neighborsIDs;
    }
    movesLeftInSelectedDice() {
        return this.selectedDice?.moveCount;
    }
    canSelectedDiceMove() {
        return !this.selectedDice?.canFinishMoving;
    }
    moveDice(direction) {
        if (this.selectedDice === null) throwCustomError(Tridice.ERROR.NoSelectedDice, "Can't move dice because board has no `selectedDice` set.");
        if (this.selectedDice.owner !== this.currentPlayer) throwCustomError(Tridice.ERROR.WrongTurnMove, `Dice being moved ([${this.selectedDice.id}]) doesn't belong to current player ([${this.currentPlayer.id}]).`);
        this.selectedDice.tryMoveTo(direction);
    }
    isGameOver() {
        return this.didPlayerLose(this.p1) || this.didPlayerLose(this.p2);
    }
    didPlayerLose(player) {
        return player.lostDice.size === Tridice.PLAYER_DICE_COUNT;
    }
    winner() {
        if (this.didPlayerLose(this.p1)) return this.p2;
        else if (this.didPlayerLose(this.p2)) return this.p1;
        return;
    }
    endTurn() {
        this.selectedDice?.fixTemporaryFaces();
        this.selectedDice = null;
        this.nextTurn();
    }
    canEndTurn() {
        return this.selectedDice?.canFinishMoving;
    }
    rollDiceToFit(cellID) {
        if (this.selectedDice === null) throwCustomError(Tridice.ERROR.NoSelectedDice, `Can't roll dice to fit ${cellID} because current dice has not been set. Call ${"`setSelectedDice`"} before rolling.`);
        this.selectedDice?.roll();
        const cell = this.cellMap.get(cellID);
        if (cell === undefined) throwCustomError(Tridice.ERROR.UndefinedCell, `Can't roll dice to fit ${cellID} because this cell doesn't exist in the board.`);
        while(!cell.diceFits(this.selectedDice)){
            this.selectedDice.rotate("right");
        }
    }
    board() {
        const boardRepresentation = new Map();
        for (const [cellID, cell] of this.cellMap.entries()){
            boardRepresentation.set(cellID, cell.dice?.simplified());
        }
        return boardRepresentation;
    }
    simulateDiceRoll(dice, count = 30) {
        dice.simulatedRoll(count);
    }
    getCellsFittingForDice(dice) {
        if (dice.currentPointingDirection === "down") return this.downFacingCells;
        return this.upFacingCells;
    }
    getCellsFittingForSelectedDice() {
        if (this.selectedDice?.currentPointingDirection === "down") return this.downFacingCells;
        return this.upFacingCells;
    }
    neighborIDsOfCell(cellID) {
        return this.cells.get(cellID)?.neighborsIDs;
    }
}
export { Tridice as Tridice };
