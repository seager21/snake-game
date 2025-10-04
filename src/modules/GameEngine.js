/**
 * GameEngine - Core game engine that integrates all modules
 * 
 * Responsibilities:
 * - Game loop management
 * - State management (menu, playing, paused, gameOver)
 * - Module coordination and integration
 * - Snake movement and collision detection
 * - Food spawning logic
 * - Level progression
 */

import { ScoreManager } from './ScoreManager.js';
import { Renderer } from './Renderer.js';
import { InputHandler } from './InputHandler.js';
import { GameModes } from './GameModes.js';
import { AudioManager } from './AudioManager.js';

export class GameEngine {
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
        
        // Speed settings based on level (1-10)
        this.speedSettings = {
            1: 200, 2: 180, 3: 160, 4: 140, 5: 120,
            6: 100, 7: 80, 8: 60, 9: 40, 10: 20
        };
        
        // Mobile detection
        this.isMobile = this.detectMobile();
        
        // Initialize modules
        this.scoreManager = new ScoreManager();
        this.renderer = new Renderer(this.canvas, this.gridSize);
        this.inputHandler = new InputHandler(this);
        this.gameModes = new GameModes(this);
        this.audioManager = new AudioManager();
        
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
        
        // Update renderer with new canvas size
        if (this.renderer) {
            this.renderer.updateCanvasSize(size);
        }
    }
    
    init() {
        this.inputHandler.setupEventListeners();
        this.scoreManager.updatePersonalBest();
        this.inputHandler.adjustForMobile();
        
        // Initialize audio (placeholder)
        this.audioManager.init();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
               window.innerWidth <= 768;
    }
    
    selectLevel(level) {
        this.selectedLevel = parseInt(level);
        
        // Update UI
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-level="${level}"]`)?.classList.add('active');
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
    
    selectGameMode(mode) {
        this.selectedGameMode = mode;
        
        // Update visual selection
        document.querySelectorAll('.gamemode-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-mode="${mode}"]`)?.classList.add('selected');
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
        
        // Initialize mode-specific properties
        this.gameModes.initMode(this.selectedGameMode);
        
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
        this.updateModeSpecificUI();
        
        // Start game loop
        this.gameLoop();
    }
    
    updateModeSpecificUI() {
        // Update high score display for current mode
        const currentHighScore = this.scoreManager.getHighScore(this.selectedGameMode);
        document.getElementById('high-score').textContent = currentHighScore;
    }
    
    gameLoop() {
        if (!this.gameRunning || this.isPaused) return;
        
        setTimeout(() => {
            this.inputHandler.resetDirectionFlag();
            this.renderer.clearBoard(this.canvasSize);
            this.moveSnake();
            this.checkCollisions();
            this.checkFood();
            this.renderer.drawObstacles(this.gameModes.obstacles, this.selectedGameMode);
            this.renderer.drawFood(this.food);
            this.renderer.drawSnake(this.snake, this.selectedColor, this.dx, this.dy);
            this.renderer.updateRainbow();
            
            if (this.gameRunning) {
                this.gameLoop();
            }
        }, this.speedSettings[this.level]);
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
            if (this.gameModes.checkObstacleCollision(head.x, head.y)) {
                this.endGame();
                return;
            }
        }
    }
    
    checkFood() {
        const head = this.snake[0];
        
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            
            // Time trial mode bonuses
            if (this.selectedGameMode === 'timetrial') {
                this.gameModes.addTimeBonus(10);
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
    
    spawnFood() {
        let foodX, foodY;
        do {
            foodX = Math.floor(Math.random() * (this.canvasSize / this.gridSize)) * this.gridSize;
            foodY = Math.floor(Math.random() * (this.canvasSize / this.gridSize)) * this.gridSize;
        } while (
            this.snake.some(segment => segment.x === foodX && segment.y === foodY) ||
            (this.selectedGameMode === 'obstacle' && this.gameModes.checkObstacleCollision(foodX, foodY))
        );
        
        this.food = { x: foodX, y: foodY };
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        
        // Update high score if needed
        if (this.scoreManager.updateIfHighScore(this.selectedGameMode, this.score)) {
            this.updateHighScoreDisplay();
        }
    }
    
    updateLevel() {
        document.getElementById('level').textContent = this.level;
    }
    
    updateHighScoreDisplay() {
        const currentHighScore = this.scoreManager.getHighScore(this.selectedGameMode);
        document.getElementById('high-score').textContent = currentHighScore;
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
        if (this.selectedGameMode === 'timetrial') {
            this.gameModes.clearTimer();
        }
        
        // Update final score
        document.getElementById('final-score').textContent = this.score;
        
        // Check for new high score
        const currentHighScore = this.scoreManager.getHighScore(this.selectedGameMode);
        if (this.score > currentHighScore) {
            this.scoreManager.saveHighScore(this.selectedGameMode, this.score);
            this.updateHighScoreDisplay();
            this.scoreManager.updatePersonalBest();
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
        document.getElementById(screenId)?.classList.add('active');
    }
    
    showModal(modalId) {
        document.getElementById(modalId)?.classList.add('active');
    }
    
    hideModal(modalId) {
        document.getElementById(modalId)?.classList.remove('active');
    }
}
