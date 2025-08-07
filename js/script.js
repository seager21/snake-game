// Vaporwave Snake Game - Enhanced JavaScript
class VaporSnake {
    constructor() {
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        
        // Responsive canvas sizing
        this.setCanvasSize();
        window.addEventListener('resize', () => this.setCanvasSize());
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.snake = [];
        this.food = {};
        this.score = 0;
        this.level = 1;
        this.selectedLevel = 1;
        this.selectedColor = 'magenta';
        this.dx = 0;
        this.dy = 0;
        this.changingDirection = false;
        this.gameRunning = false;
        this.isPaused = false;
        this.rainbowHue = 0;
        
        // Speed settings based on level (1-10)
        this.speedSettings = {
            1: 200, 2: 180, 3: 160, 4: 140, 5: 120,
            6: 100, 7: 80, 8: 60, 9: 40, 10: 20
        };
        
        // High scores
        this.highScore = this.loadHighScore();
        this.updateHighScoreDisplay();
        
        // Mobile detection
        this.isMobile = this.detectMobile();
        
        this.init();
    }
    
    setCanvasSize() {
        const isMobile = window.innerWidth <= 768;
        let size;
        
        if (isMobile) {
            // Mobile sizing
            const maxSize = Math.min(window.innerWidth - 40, window.innerHeight - 250);
            size = Math.floor(maxSize / this.gridSize) * this.gridSize;
            size = Math.max(size, 320); // Minimum size
            size = Math.min(size, 500); // Maximum size for mobile
        } else {
            // Desktop sizing
            size = 600;
        }
        
        this.canvasSize = size;
        this.canvas.width = size;
        this.canvas.height = size;
        
        // Update canvas style for crisp rendering
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        
        // High DPI support
        const devicePixelRatio = window.devicePixelRatio || 1;
        if (devicePixelRatio > 1) {
            this.canvas.width = size * devicePixelRatio;
            this.canvas.height = size * devicePixelRatio;
            this.ctx.scale(devicePixelRatio, devicePixelRatio);
        }
    }
    
    init() {
        this.setupEventListeners();
        this.setupMobileControls();
        this.updatePersonalBest();
        this.adjustForMobile();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
               window.innerWidth <= 768;
    }
    
    adjustForMobile() {
        if (this.isMobile) {
            // Show mobile controls during game
            document.getElementById('mobile-controls').classList.add('active');
            
            // Update controls info text
            const controlsInfo = document.querySelector('.controls-info span');
            if (controlsInfo) {
                controlsInfo.textContent = 'Use touch controls below';
            }
            
            // Adjust canvas size for mobile
            const canvas = document.getElementById('game-board');
            const container = document.querySelector('.game-container');
            
            // Prevent zoom on mobile
            document.addEventListener('touchstart', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });
            
            // Prevent double-tap zoom
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (e) => {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, false);
        }
    }
    
    setupMobileControls() {
        if (!this.isMobile) return;
        
        // Touch pad controls
        const touchPad = document.getElementById('touch-pad');
        let startX, startY, currentX, currentY;
        
        touchPad.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = touchPad.getBoundingClientRect();
            startX = touch.clientX - rect.left - rect.width / 2;
            startY = touch.clientY - rect.top - rect.height / 2;
        }, { passive: false });
        
        touchPad.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = touchPad.getBoundingClientRect();
            currentX = touch.clientX - rect.left - rect.width / 2;
            currentY = touch.clientY - rect.top - rect.height / 2;
        }, { passive: false });
        
        touchPad.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!startX || !startY) return;
            
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;
            const threshold = 20;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal movement
                if (Math.abs(deltaX) > threshold) {
                    this.handleMobileDirection(deltaX > 0 ? 'right' : 'left');
                }
            } else {
                // Vertical movement
                if (Math.abs(deltaY) > threshold) {
                    this.handleMobileDirection(deltaY > 0 ? 'down' : 'up');
                }
            }
            
            startX = startY = currentX = currentY = null;
        }, { passive: false });
        
        // Directional buttons
        document.querySelectorAll('.dir-btn[data-direction]').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const direction = btn.dataset.direction;
                this.handleMobileDirection(direction);
                
                // Visual feedback
                btn.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 150);
            }, { passive: false });
            
            // Also handle click for testing on desktop
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const direction = btn.dataset.direction;
                this.handleMobileDirection(direction);
            });
        });
    }
    
    handleMobileDirection(direction) {
        if (this.gameState !== 'playing' || this.changingDirection) return;
        
        this.changingDirection = true;
        
        switch (direction) {
            case 'left':
                if (this.dx === 0) {
                    this.dx = -this.gridSize;
                    this.dy = 0;
                }
                break;
            case 'up':
                if (this.dy === 0) {
                    this.dx = 0;
                    this.dy = -this.gridSize;
                }
                break;
            case 'right':
                if (this.dx === 0) {
                    this.dx = this.gridSize;
                    this.dy = 0;
                }
                break;
            case 'down':
                if (this.dy === 0) {
                    this.dx = 0;
                    this.dy = this.gridSize;
                }
                break;
        }
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Level selector
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectLevel(e.target.dataset.level));
        });
        
        // Color selector
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectColor(e.target.dataset.color));
        });
        
        // Prevent arrow key scrolling
        window.addEventListener('keydown', (e) => {
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }
    
    handleKeyPress(event) {
        if (this.gameState !== 'playing' || this.changingDirection) return;
        
        this.changingDirection = true;
        const key = event.code;
        
        // Arrow keys and WASD
        if ((key === 'ArrowLeft' || key === 'KeyA') && this.dx === 0) {
            this.dx = -this.gridSize;
            this.dy = 0;
        }
        if ((key === 'ArrowUp' || key === 'KeyW') && this.dy === 0) {
            this.dx = 0;
            this.dy = -this.gridSize;
        }
        if ((key === 'ArrowRight' || key === 'KeyD') && this.dx === 0) {
            this.dx = this.gridSize;
            this.dy = 0;
        }
        if ((key === 'ArrowDown' || key === 'KeyS') && this.dy === 0) {
            this.dx = 0;
            this.dy = this.gridSize;
        }
        
        // Pause with spacebar or escape
        if (key === 'Space' || key === 'Escape') {
            this.pauseGame();
        }
    }
    
    selectLevel(level) {
        this.selectedLevel = parseInt(level);
        
        // Update UI
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-level="${level}"]`).classList.add('active');
    }
    
    selectColor(color) {
        this.selectedColor = color;
        
        // Update UI
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-color="${color}"]`).classList.add('active');
    }
    
    startGame() {
        this.level = this.selectedLevel;
        this.gameState = 'playing';
        this.score = 0;
        this.dx = this.gridSize;
        this.dy = 0;
        this.gameRunning = true;
        this.isPaused = false;
        this.changingDirection = false;
        
        // Initialize snake
        this.snake = [
            { x: 100, y: 100 },
            { x: 80, y: 100 },
            { x: 60, y: 100 }
        ];
        
        // Spawn first food
        this.spawnFood();
        
        // Update UI
        this.showScreen('game-screen');
        this.updateScore();
        this.updateLevel();
        
        // Start game loop
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.gameRunning || this.isPaused) return;
        
        setTimeout(() => {
            this.changingDirection = false;
            this.clearBoard();
            this.moveSnake();
            this.checkCollisions();
            this.checkFood();
            this.drawFood();
            this.drawSnake();
            this.updateRainbow();
            
            if (this.gameRunning) {
                this.gameLoop();
            }
        }, this.speedSettings[this.level]);
    }
    
    clearBoard() {
        // Create gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvasSize, this.canvasSize);
        gradient.addColorStop(0, '#0f0514');
        gradient.addColorStop(1, '#0a0208');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
        
        // Add subtle grid
        this.ctx.strokeStyle = 'rgba(255, 0, 110, 0.1)';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.canvasSize; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvasSize);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvasSize, i);
            this.ctx.stroke();
        }
    }
    
    moveSnake() {
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        
        // Wrap around borders
        if (head.x < 0) head.x = this.canvasSize - this.gridSize;
        if (head.x >= this.canvasSize) head.x = 0;
        if (head.y < 0) head.y = this.canvasSize - this.gridSize;
        if (head.y >= this.canvasSize) head.y = 0;
        
        this.snake.unshift(head);
        
        // Only remove tail if no food eaten
        if (head.x !== this.food.x || head.y !== this.food.y) {
            this.snake.pop();
        }
    }
    
    checkCollisions() {
        const head = this.snake[0];
        
        // Check collision with snake body
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.endGame();
                return;
            }
        }
    }
    
    checkFood() {
        const head = this.snake[0];
        
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.spawnFood();
            this.updateScore();
            
            // Level up every 50 points (but don't exceed selected level + 2)
            const newLevel = Math.min(this.selectedLevel + Math.floor(this.score / 50), 10);
            if (newLevel > this.level) {
                this.level = newLevel;
                this.updateLevel();
            }
        }
    }
    
    spawnFood() {
        let foodX, foodY;
        do {
            foodX = Math.floor(Math.random() * (this.canvasSize / this.gridSize)) * this.gridSize;
            foodY = Math.floor(Math.random() * (this.canvasSize / this.gridSize)) * this.gridSize;
        } while (this.snake.some(segment => segment.x === foodX && segment.y === foodY));
        
        this.food = { x: foodX, y: foodY };
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            this.ctx.save();
            
            // Apply glow effect
            this.ctx.shadowBlur = 20;
            
            if (index === 0) {
                // Head - slightly larger and brighter
                this.ctx.shadowColor = this.getSnakeColor(true);
                this.ctx.fillStyle = this.getSnakeColor(true);
                this.ctx.fillRect(segment.x + 1, segment.y + 1, this.gridSize - 2, this.gridSize - 2);
                
                // Add eyes
                this.ctx.shadowBlur = 5;
                this.ctx.fillStyle = '#ffffff';
                const eyeSize = 3;
                const eyeOffset = 4;
                
                if (this.dx > 0) { // Moving right
                    this.ctx.fillRect(segment.x + this.gridSize - eyeOffset - eyeSize, segment.y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x + this.gridSize - eyeOffset - eyeSize, segment.y + this.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (this.dx < 0) { // Moving left
                    this.ctx.fillRect(segment.x + eyeOffset, segment.y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x + eyeOffset, segment.y + this.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (this.dy < 0) { // Moving up
                    this.ctx.fillRect(segment.x + eyeOffset, segment.y + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x + this.gridSize - eyeOffset - eyeSize, segment.y + eyeOffset, eyeSize, eyeSize);
                } else { // Moving down
                    this.ctx.fillRect(segment.x + eyeOffset, segment.y + this.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x + this.gridSize - eyeOffset - eyeSize, segment.y + this.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                }
            } else {
                // Body
                this.ctx.shadowColor = this.getSnakeColor(false, index);
                this.ctx.fillStyle = this.getSnakeColor(false, index);
                this.ctx.fillRect(segment.x + 2, segment.y + 2, this.gridSize - 4, this.gridSize - 4);
            }
            
            this.ctx.restore();
        });
    }
    
    drawFood() {
        this.ctx.save();
        this.ctx.shadowBlur = 25;
        this.ctx.shadowColor = '#ffbe0b';
        
        // Pulsating effect
        const pulse = Math.sin(Date.now() * 0.01) * 0.1 + 0.9;
        const size = this.gridSize * pulse;
        const offset = (this.gridSize - size) / 2;
        
        // Create gradient for food
        const gradient = this.ctx.createRadialGradient(
            this.food.x + this.gridSize / 2, this.food.y + this.gridSize / 2, 0,
            this.food.x + this.gridSize / 2, this.food.y + this.gridSize / 2, size / 2
        );
        gradient.addColorStop(0, '#ffbe0b');
        gradient.addColorStop(1, '#ff8500');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x + this.gridSize / 2,
            this.food.y + this.gridSize / 2,
            size / 2,
            0,
            2 * Math.PI
        );
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    getSnakeColor(isHead, segmentIndex = 0) {
        switch (this.selectedColor) {
            case 'magenta':
                return isHead ? '#ff006e' : '#cc0055';
            case 'white':
                return isHead ? '#ffffff' : '#cccccc';
            case 'cyan':
                return isHead ? '#00f5ff' : '#0099cc';
            case 'amber':
                return isHead ? '#ffbe0b' : '#ff8500';
            case 'green':
                return isHead ? '#00ff41' : '#00cc33';
            case 'rainbow':
                const hue = (this.rainbowHue + segmentIndex * 20) % 360;
                return `hsl(${hue}, 100%, ${isHead ? '60%' : '50%'})`;
            default:
                return isHead ? '#ff006e' : '#cc0055';
        }
    }
    
    updateRainbow() {
        this.rainbowHue = (this.rainbowHue + 2) % 360;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.updateHighScoreDisplay();
        }
    }
    
    updateLevel() {
        document.getElementById('level').textContent = this.level;
    }
    
    updateHighScoreDisplay() {
        document.getElementById('high-score').textContent = this.highScore;
    }
    
    updatePersonalBest() {
        document.getElementById('personal-best-score').textContent = this.highScore;
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.isPaused = true;
            this.showModal('pause-modal');
        }
    }
    
    resumeGame() {
        if (this.gameState === 'playing') {
            this.isPaused = false;
            this.hideModal('pause-modal');
            this.gameLoop();
        }
    }
    
    endGame() {
        this.gameRunning = false;
        this.gameState = 'gameOver';
        
        // Update final score
        document.getElementById('final-score').textContent = this.score;
        
        // Check for new high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.updateHighScoreDisplay();
            this.updatePersonalBest();
            document.getElementById('new-high-score').classList.remove('hidden');
        } else {
            document.getElementById('new-high-score').classList.add('hidden');
        }
        
        this.showModal('game-over-modal');
    }
    
    restartGame() {
        this.hideModal('game-over-modal');
        this.hideModal('pause-modal');
        this.startGame();
    }
    
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show selected screen
        document.getElementById(screenId).classList.add('active');
    }
    
    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }
    
    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
    
    saveHighScore() {
        localStorage.setItem('vaporSnakeHighScore', this.highScore.toString());
    }
    
    loadHighScore() {
        const saved = localStorage.getItem('vaporSnakeHighScore');
        return saved ? parseInt(saved) : 0;
    }
}

// Global game instance
let game;

// Menu functions (called from HTML)
function showMainMenu() {
    if (game) {
        game.gameRunning = false;
        game.gameState = 'menu';
        game.hideModal('game-over-modal');
        game.hideModal('pause-modal');
    }
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById('main-menu').classList.add('active');
}

function showNewGameMenu() {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById('setup-menu').classList.add('active');
}

function showHighScores() {
    if (game) {
        game.updatePersonalBest();
    }
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById('highscores-menu').classList.add('active');
}

function startGame() {
    if (!game) {
        game = new VaporSnake();
    }
    game.startGame();
}

function pauseGame() {
    if (game) {
        game.pauseGame();
    }
}

function resumeGame() {
    if (game) {
        game.resumeGame();
    }
}

function restartGame() {
    if (game) {
        game.restartGame();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    game = new VaporSnake();
});