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
        this.selectedGameMode = 'classic';
        this.dx = 0;
        this.dy = 0;
        this.changingDirection = false;
        this.gameRunning = false;
        this.isPaused = false;
        this.rainbowHue = 0;
        
        // Time Trial properties
        this.timeRemaining = 30;
        this.timeInterval = null;
        this.pointsEarned = 0;
        
        // Obstacle mode properties
        this.obstacles = [];
        
        // Speed settings based on level (1-10)
        this.speedSettings = {
            1: 200, 2: 180, 3: 160, 4: 140, 5: 120,
            6: 100, 7: 80, 8: 60, 9: 40, 10: 20
        };
        
        // High scores for different game modes
        this.highScores = {
            classic: this.loadHighScore('classic'),
            timetrial: this.loadHighScore('timetrial'),
            obstacle: this.loadHighScore('obstacle')
        };
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
        
        // Directional buttons only
        document.querySelectorAll('.dir-btn[data-direction]').forEach(btn => {
            // Remove any existing event listeners by cloning the node
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.gameState !== 'playing') return;
                
                const direction = newBtn.dataset.direction;
                this.handleMobileDirection(direction);
                
                // Visual feedback
                newBtn.style.transform = 'scale(0.9)';
                newBtn.style.background = 'var(--neon-purple)';
                newBtn.style.color = 'var(--dark-bg)';
                
                setTimeout(() => {
                    newBtn.style.transform = '';
                    newBtn.style.background = '';
                    newBtn.style.color = '';
                }, 150);
            }, { passive: false });
            
            // Also handle click for testing on desktop
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.gameState !== 'playing') return;
                
                const direction = newBtn.dataset.direction;
                this.handleMobileDirection(direction);
            });
        });
    }
    
    handleMobileDirection(direction) {
        if (this.gameState !== 'playing' || this.changingDirection) return;
        
        this.changingDirection = true;
        
        // Haptic feedback for mobile devices
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
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
        
        // Color dropdown
        this.setupColorDropdown();
        
        // Game mode selection
        this.setupGameModeSelection();
        
        // High score tabs
        this.setupHighScoreTabs();
        
        // Prevent arrow key scrolling
        window.addEventListener('keydown', (e) => {
            if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }
    
    setupColorDropdown() {
        const dropdownSelected = document.getElementById('color-selected');
        const dropdownOptions = document.getElementById('color-options');
        const options = document.querySelectorAll('.dropdown-option');
        
        // Toggle dropdown
        dropdownSelected.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownSelected.classList.toggle('open');
            dropdownOptions.classList.toggle('open');
        });
        
        // Select option
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const color = option.dataset.color;
                const colorName = option.querySelector('span').textContent;
                const colorPreview = option.querySelector('.color-preview').className;
                
                // Update selected display
                dropdownSelected.querySelector('span').textContent = colorName;
                dropdownSelected.querySelector('.color-preview').className = colorPreview;
                
                // Update active state
                options.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Close dropdown
                dropdownSelected.classList.remove('open');
                dropdownOptions.classList.remove('open');
                
                // Update game color
                this.selectColor(color);
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdownSelected.classList.remove('open');
            dropdownOptions.classList.remove('open');
        });
        
        // Close dropdown on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdownSelected.classList.remove('open');
                dropdownOptions.classList.remove('open');
            }
        });
    }
    
    setupGameModeSelection() {
        document.querySelectorAll('.gamemode-card').forEach(card => {
            card.addEventListener('click', () => {
                const mode = card.dataset.mode;
                this.selectGameMode(mode);
                
                // Proceed to setup after mode selection
                setTimeout(() => {
                    showNewGameMenu();
                }, 300);
            });
        });
    }
    
    setupHighScoreTabs() {
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mode;
                this.showHighScoreMode(mode);
                
                // Update active tab
                document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }
    
    selectGameMode(mode) {
        this.selectedGameMode = mode;
        
        // Update visual selection
        document.querySelectorAll('.gamemode-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('selected');
    }
    
    showHighScoreMode(mode) {
        // Hide all score lists
        document.querySelectorAll('.scores-list').forEach(list => {
            list.classList.add('hidden');
        });
        
        // Show selected mode scores
        document.getElementById(`scores-${mode}`).classList.remove('hidden');
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
        
        // Update traditional color buttons (if they exist)
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const colorBtn = document.querySelector(`[data-color="${color}"]`);
        if (colorBtn && colorBtn.classList.contains('color-btn')) {
            colorBtn.classList.add('active');
        }
        
        // Update dropdown selection
        const dropdownOptions = document.querySelectorAll('.dropdown-option');
        dropdownOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.color === color) {
                option.classList.add('active');
                
                // Update the dropdown display
                const dropdownSelected = document.getElementById('color-selected');
                const colorName = option.querySelector('span').textContent;
                const colorPreview = option.querySelector('.color-preview').className;
                
                dropdownSelected.querySelector('span').textContent = colorName;
                dropdownSelected.querySelector('.color-preview').className = colorPreview;
            }
        });
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
        this.pointsEarned = 0;
        
        // Initialize mode-specific properties
        this.initGameMode();
        
        // Initialize snake
        this.snake = [
            { x: 100, y: 100 },
            { x: 80, y: 100 },
            { x: 60, y: 100 }
        ];
        
        // Clear any existing obstacles
        this.obstacles = [];
        
        // Generate obstacles for obstacle mode
        if (this.selectedGameMode === 'obstacle') {
            this.generateObstacles();
        }
        
        // Spawn first food
        this.spawnFood();
        
        // Update UI
        this.showScreen('game-screen');
        this.updateScore();
        this.updateLevel();
        this.updateModeSpecificUI();
        
        // Start game loop
        this.gameLoop();
    }
    
    initGameMode() {
        if (this.selectedGameMode === 'timetrial') {
            this.timeRemaining = 30;
            this.startTimer();
            document.getElementById('timer-display').classList.remove('hidden');
            this.updateTimer();
        } else {
            document.getElementById('timer-display').classList.add('hidden');
            this.clearTimer();
        }
    }
    
    startTimer() {
        this.clearTimer();
        this.timeInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimer();
            
            if (this.timeRemaining <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    clearTimer() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
    }
    
    updateTimer() {
        const timerElement = document.getElementById('timer');
        const timerDisplay = document.getElementById('timer-display');
        
        if (timerElement) {
            timerElement.textContent = this.timeRemaining;
            
            // Add warning class when time is low
            if (this.timeRemaining <= 10) {
                timerDisplay.classList.add('warning');
            } else {
                timerDisplay.classList.remove('warning');
            }
        }
    }
    
    generateObstacles() {
        const numObstacles = Math.floor(Math.random() * 8) + 5; // 5-12 obstacles
        this.obstacles = [];
        
        for (let i = 0; i < numObstacles; i++) {
            let obstacleX, obstacleY;
            let validPosition = false;
            let attempts = 0;
            
            while (!validPosition && attempts < 50) {
                obstacleX = Math.floor(Math.random() * (this.canvasSize / this.gridSize)) * this.gridSize;
                obstacleY = Math.floor(Math.random() * (this.canvasSize / this.gridSize)) * this.gridSize;
                
                // Check if position conflicts with snake or other obstacles
                const conflictsWithSnake = this.snake.some(segment => 
                    segment.x === obstacleX && segment.y === obstacleY
                );
                
                const conflictsWithObstacles = this.obstacles.some(obstacle => 
                    obstacle.x === obstacleX && obstacle.y === obstacleY
                );
                
                // Keep obstacles away from snake's starting area
                const tooCloseToStart = (
                    Math.abs(obstacleX - 100) < this.gridSize * 3 && 
                    Math.abs(obstacleY - 100) < this.gridSize * 2
                );
                
                if (!conflictsWithSnake && !conflictsWithObstacles && !tooCloseToStart) {
                    validPosition = true;
                    this.obstacles.push({ x: obstacleX, y: obstacleY });
                }
                
                attempts++;
            }
        }
    }
    
    updateModeSpecificUI() {
        // Update high score display for current mode
        const currentHighScore = this.highScores[this.selectedGameMode] || 0;
        document.getElementById('high-score').textContent = currentHighScore;
    }
    
    gameLoop() {
        if (!this.gameRunning || this.isPaused) return;
        
        setTimeout(() => {
            this.changingDirection = false;
            this.clearBoard();
            this.moveSnake();
            this.checkCollisions();
            this.checkFood();
            this.drawObstacles();
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
        
        // Check collision with obstacles (obstacle mode only)
        if (this.selectedGameMode === 'obstacle') {
            for (let obstacle of this.obstacles) {
                if (head.x === obstacle.x && head.y === obstacle.y) {
                    this.endGame();
                    return;
                }
            }
        }
    }
    
    checkFood() {
        const head = this.snake[0];
        
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.pointsEarned += 10;
            
            // Time trial mode bonuses
            if (this.selectedGameMode === 'timetrial') {
                // Add 5 seconds for each food
                this.timeRemaining += 5;
                
                // Bonus time every 5 points (50 score)
                if (this.pointsEarned % 50 === 0) {
                    this.timeRemaining += 20;
                    this.showTimeBonus();
                }
                
                this.updateTimer();
            }
            
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
    
    showTimeBonus() {
        // Create a temporary bonus indicator
        const bonus = document.createElement('div');
        bonus.textContent = '+20 BONUS!';
        bonus.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: var(--neon-yellow);
            font-family: 'Orbitron', monospace;
            font-size: 1.5rem;
            font-weight: 700;
            text-shadow: 0 0 10px currentColor;
            pointer-events: none;
            z-index: 1000;
            animation: bonusFade 2s ease-out forwards;
        `;
        
        document.body.appendChild(bonus);
        
        setTimeout(() => {
            if (bonus.parentNode) {
                bonus.parentNode.removeChild(bonus);
            }
        }, 2000);
    }
    
    spawnFood() {
        let foodX, foodY;
        do {
            foodX = Math.floor(Math.random() * (this.canvasSize / this.gridSize)) * this.gridSize;
            foodY = Math.floor(Math.random() * (this.canvasSize / this.gridSize)) * this.gridSize;
        } while (
            this.snake.some(segment => segment.x === foodX && segment.y === foodY) ||
            (this.selectedGameMode === 'obstacle' && this.obstacles.some(obstacle => obstacle.x === foodX && obstacle.y === foodY))
        );
        
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
    
    drawObstacles() {
        if (this.selectedGameMode !== 'obstacle') return;
        
        this.obstacles.forEach(obstacle => {
            this.ctx.save();
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#8338ec';
            
            // Create gradient for obstacles
            const gradient = this.ctx.createLinearGradient(
                obstacle.x, obstacle.y,
                obstacle.x + this.gridSize, obstacle.y + this.gridSize
            );
            gradient.addColorStop(0, '#8338ec');
            gradient.addColorStop(1, '#5a2d91');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(obstacle.x + 1, obstacle.y + 1, this.gridSize - 2, this.gridSize - 2);
            
            // Add border
            this.ctx.strokeStyle = '#b794f6';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(obstacle.x + 1, obstacle.y + 1, this.gridSize - 2, this.gridSize - 2);
            
            this.ctx.restore();
        });
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
            case 'blue':
                return isHead ? '#0080ff' : '#0066cc';
            case 'purple':
                return isHead ? '#8338ec' : '#6a1b9a';
            case 'black':
                return isHead ? '#2c2c2c' : '#1a1a1a';
            case 'neon':
                const neonHue = (Date.now() * 0.1) % 360;
                return `hsl(${neonHue}, 100%, ${isHead ? '60%' : '50%'})`;
            case 'gold':
                return isHead ? '#ffd700' : '#ffb000';
            case 'silver':
                return isHead ? '#c0c0c0' : '#808080';
            case 'pink':
                return isHead ? '#ff69b4' : '#ff1493';
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
        const currentHighScore = this.highScores[this.selectedGameMode] || 0;
        if (this.score > currentHighScore) {
            this.highScores[this.selectedGameMode] = this.score;
            this.saveHighScore(this.selectedGameMode);
            this.updateHighScoreDisplay();
        }
    }
    
    updateLevel() {
        document.getElementById('level').textContent = this.level;
    }
    
    updateHighScoreDisplay() {
        const currentHighScore = this.highScores[this.selectedGameMode] || 0;
        document.getElementById('high-score').textContent = currentHighScore;
    }
    
    updatePersonalBest() {
        // Update personal best for all game modes
        Object.keys(this.highScores).forEach(mode => {
            const scoreElement = document.getElementById(`personal-best-score-${mode}`);
            if (scoreElement) {
                scoreElement.textContent = this.highScores[mode] || 0;
            }
        });
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
        
        // Clear timer for time trial mode
        this.clearTimer();
        
        // Update final score
        document.getElementById('final-score').textContent = this.score;
        
        // Check for new high score
        const currentHighScore = this.highScores[this.selectedGameMode] || 0;
        if (this.score > currentHighScore) {
            this.highScores[this.selectedGameMode] = this.score;
            this.saveHighScore(this.selectedGameMode);
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
    
    saveHighScore(gameMode) {
        localStorage.setItem(`vaporSnakeHighScore_${gameMode}`, this.highScores[gameMode].toString());
    }
    
    loadHighScore(gameMode) {
        const saved = localStorage.getItem(`vaporSnakeHighScore_${gameMode}`);
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
        game.clearTimer();
    }
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById('main-menu').classList.add('active');
}

function showGameModeSelection() {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById('gamemode-menu').classList.add('active');
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
    
    // Register service worker for mobile app experience
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
});