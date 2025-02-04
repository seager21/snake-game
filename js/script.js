const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const restartBtn = document.getElementById('restart-btn');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');

const gridSize = 20;
const canvasSize = 400; // Increased canvas size
canvas.width = canvasSize;
canvas.height = 400; // Increased canvas size

let snake;
let food;
let score;
let highScore = 0;
let dx, dy;
let changingDirection = false;
let gameOver = false;
let speed = 150; // Slower speed (previously 100)

function initGame() {
    snake = [
        { x: 100, y: 100 },
        { x: 80, y: 100 },
        { x: 60, y: 100 }
    ];

    food = spawnFood();
    score = 0;
    dx = gridSize;
    dy = 0;
    changingDirection = false;
    gameOver = false;
    speed = 150; // Slower speed (previously 100)

    scoreElement.textContent = 'Score: ' + score;
    highScoreElement.textContent = 'High Score: ' + highScore;
    restartBtn.style.display = 'none';
}

document.addEventListener('keydown', changeDirection);

function changeDirection(event) {
    if (changingDirection) return;
    changingDirection = true;

    if (event.keyCode === 37 && dx === 0) {  // Left arrow
        dx = -gridSize;
        dy = 0;
    }
    if (event.keyCode === 38 && dy === 0) {  // Up arrow
        dx = 0;
        dy = -gridSize;
    }
    if (event.keyCode === 39 && dx === 0) {  // Right arrow
        dx = gridSize;
        dy = 0;
    }
    if (event.keyCode === 40 && dy === 0) {  // Down arrow
        dx = 0;
        dy = gridSize;
    }
}

function main() {
    if (gameOver) return;

    setTimeout(function () {
        changingDirection = false;
        clearBoard();
        moveSnake();
        checkCollisions();
        checkFood();
        drawSnake();
        drawFood();
        updateScore();
        main();
    }, speed);
}

function clearBoard() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function moveSnake() {
    let head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wrap around the borders
    if (head.x < 0) head.x = canvasSize - gridSize; // Left border
    if (head.x >= canvasSize) head.x = 0;          // Right border
    if (head.y < 0) head.y = canvasSize - gridSize; // Top border
    if (head.y >= canvasSize) head.y = 0;          // Bottom border

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        food = spawnFood();
        increaseSpeed();
    } else {
        snake.pop();
    }
}

function checkCollisions() {
    const head = snake[0];

    // Check collision with the snake itself
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver = true;
            endGame();
        }
    }
}

function checkFood() {
    if (snake[0].x === food.x && snake[0].y === food.y) {
        food = spawnFood();
        score++;
    }
}

function spawnFood() {
    const foodType = Math.random();
    let foodX = Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize;
    let foodY = Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize;

    if (foodType < 0.5) {
        return { x: foodX, y: foodY, type: 'apple' };
    } else {
        return { x: foodX, y: foodY, type: 'banana' };
    }
}

function drawSnake() {
    snake.forEach(function (segment, index) {
        ctx.beginPath();
        ctx.rect(segment.x, segment.y, gridSize, gridSize);
        ctx.fillStyle = index === 0 ? '#1abc9c' : '#16a085';
        ctx.fill();
    });
}

function drawFood() {
    ctx.beginPath();
    if (food.type === 'apple') {
        ctx.arc(food.x + gridSize / 2, food.y + gridSize / 2, gridSize / 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#e74c3c'; // Apple Red
    } else {
        ctx.rect(food.x, food.y, gridSize, gridSize);
        ctx.fillStyle = '#f39c12'; // Banana Yellow
    }
    ctx.fill();
}

function updateScore() {
    scoreElement.textContent = 'Score: ' + score;
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = 'High Score: ' + highScore;
    }
}

function increaseSpeed() {
    if (score % 5 === 0 && speed > 50) {  // Increase speed every 5 points
        speed -= 10;
    }
}

function endGame() {
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = 'High Score: ' + highScore;
    }
    alert('Game Over! Your score: ' + score);
    restartBtn.style.display = 'inline-block';
}

function restartGame() {
    initGame();
    main();
}

initGame();
main();