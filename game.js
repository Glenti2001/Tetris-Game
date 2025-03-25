let canvas, context;
const CELL_SIZE = 20; 
const COLS = 10;
const ROWS = 20; 
let board = [];
let activeShape;
let shapesQueue = [];
let points = 0;
let level = 1;
let isPaused = false;
let dropSpeed = 900; 
let dropInterval;

const colors = ["#ff5733", "#33ff57", "#3357ff", "#ff33a8", "#ff9f33"]; 
const shapes = [
    [[1, 1, 1, 1]], 
    [
        [1, 1],
        [1, 1],
    ], 
    [
        [0, 1, 0],
        [1, 1, 1],
    ], 
    [
        [1, 1, 0],
        [0, 1, 1],
    ], 
    [
        [0, 1, 1],
        [1, 1, 0],
    ], 
];

class Shape {
    constructor(matrix, color) {
        this.matrix = matrix;
        this.color = color;
        this.x = Math.floor(COLS / 2) - Math.ceil(matrix[0].length / 2);
        this.y = 0;
    }

    move(offsetX, offsetY) {
        this.x += offsetX;
        this.y += offsetY;

        if (this.isColliding()) {
            this.x -= offsetX;
            this.y -= offsetY;
            return false;
        }

        return true;
    }

    rotate() {
        const rotatedMatrix = this.matrix[0].map((_, colIndex) =>
            this.matrix.map((row) => row[colIndex]).reverse()
        );

        const originalMatrix = this.matrix;
        this.matrix = rotatedMatrix;

        if (this.isColliding()) {
            this.matrix = originalMatrix; 
        }
    }

    isColliding() {
        return this.matrix.some((row, rowIndex) =>
            row.some(
                (cell, colIndex) =>
                    cell &&
                    (board[this.y + rowIndex]?.[this.x + colIndex] === undefined ||
                        board[this.y + rowIndex][this.x + colIndex])
            )
        );
    }
}

function initializeBoard() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    board.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                context.fillStyle = cell;
                context.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                context.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        });
    });
}

function drawShape(shape) {
    shape.matrix.forEach((row, rowIndex) =>
        row.forEach((cell, colIndex) => {
            if (cell) {
                context.fillStyle = shape.color;
                const x = (shape.x + colIndex) * CELL_SIZE;
                const y = (shape.y + rowIndex) * CELL_SIZE;
                context.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                context.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
            }
        })
    );
}

function spawnNewShape() {
    if (shapesQueue.length === 0) {
        shapesQueue = [...shapes];
        shuffle(shapesQueue);
    }

    const matrix = shapesQueue.pop();
    const color = colors[Math.floor(Math.random() * colors.length)];
    activeShape = new Shape(matrix, color);

    if (activeShape.isColliding()) {
        gameOver();
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function dropShape() {
    if (!activeShape.move(0, 1)) {
        placeShape();
        clearFullRows();
        spawnNewShape();
    }
    updateGame();
}

function placeShape() {
    activeShape.matrix.forEach((row, rowIndex) =>
        row.forEach((cell, colIndex) => {
            if (cell) {
                board[activeShape.y + rowIndex][activeShape.x + colIndex] = activeShape.color;
            }
        })
    );
}

function clearFullRows() {
    let rowsCleared = 0;

    board = board.filter((row) => {
        if (row.every((cell) => cell)) {
            rowsCleared++;
            return false;
        }
        return true;
    });

    while (board.length < ROWS) {
        board.unshift(Array(COLS).fill(0));
    }

    if (rowsCleared) {
        points += rowsCleared * 100 * level;
        level += Math.floor(rowsCleared / 2);
        dropSpeed = Math.max(100, 1000 - level * 50); 
        updateScore();
    }
}

function updateScore() {
    document.getElementById("points").innerText = `Points: ${points}`;
    document.getElementById("level").innerText = `Level: ${level}`;
}

function gameOver() {
    clearInterval(dropInterval);
    alert("Game Over! Your score: " + points);
    restartGame();
}

function restartGame() {
    initializeBoard();
    points = 0;
    level = 1;
    dropSpeed = 1000;
    spawnNewShape();
    updateScore();
    startGame();
}

function startGame() {
    if (dropInterval) {
        clearInterval(dropInterval);
    }
    dropInterval = setInterval(dropShape, dropSpeed);
}

function handleInput(event) {
    if (isPaused && event.key !== " ") return;

    if (event.key === "ArrowLeft") {
        activeShape.move(-1, 0);
    } else if (event.key === "ArrowRight") {
        activeShape.move(1, 0);
    } else if (event.key === "ArrowDown") {
        dropShape();
    } else if (event.key === "ArrowUp") {
        activeShape.rotate();
    } else if (event.key === " ") {
        isPaused = !isPaused;
        if (isPaused) {
            clearInterval(dropInterval);
        } else {
            startGame();
        }
    }
    updateGame();
}

function updateGame() {
    drawBoard();
    drawShape(activeShape);
}

window.onload = function () {
    canvas = document.getElementById("myCanvas");
    canvas.width = COLS * CELL_SIZE;
    canvas.height = ROWS * CELL_SIZE;
    context = canvas.getContext("2d");

    initializeBoard();
    spawnNewShape();
    updateScore();
    startGame();
};

document.addEventListener("keydown", handleInput);
