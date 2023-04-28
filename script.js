let board = new Board(4, 200, 100, 100)

let player1 = new VisualPlayer(1, 4, 50, 100, 20, true)


let player2 = new VisualPlayer(2, 4, 300, 100, 20, false)

let gameManager = new VisualGameManager(player1, player2, board)



function setup() {
  createCanvas(windowWidth, windowHeight);
  background("#0B0205");
   stroke(255)
  board.pointX = windowWidth*0.5
  board.generateCellLis()
  player2.positionX = windowWidth - 50
  player1.generateDiceList()
  player2.generateDiceList()
}

function draw() {
  background("#0B0205")
  gameManager.draw()
}

function mouseClicked() {
  gameManager.mouseClicked()
}
