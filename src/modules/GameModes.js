/**
 * GameModes - Manages different game modes (Classic, Time Trial, Obstacle)
 */
export class GameModes {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
    }

    /**
     * Initialize game mode specific features
     * @param {string} mode - Game mode (classic, timetrial, obstacle)
     */
    initMode(mode) {
        switch (mode) {
            case 'timetrial':
                this.initTimeTrial();
                break;
            case 'obstacle':
                this.initObstacle();
                break;
            case 'classic':
            default:
                this.initClassic();
                break;
        }
    }

    /**
     * Initialize classic mode
     */
    initClassic() {
        // Classic mode has no special initialization
        document.getElementById('timer-display')?.classList.add('hidden');
        this.clearTimer();
    }

    /**
     * Initialize time trial mode
     */
    initTimeTrial() {
        this.gameEngine.timeRemaining = 30;
        this.startTimer();
        document.getElementById('timer-display')?.classList.remove('hidden');
        this.updateTimer();
    }

    /**
     * Initialize obstacle mode
     */
    initObstacle() {
        this.generateObstacles();
        document.getElementById('timer-display')?.classList.add('hidden');
        this.clearTimer();
    }

    /**
     * Start the time trial timer
     */
    startTimer() {
        this.clearTimer();
        this.gameEngine.timeInterval = setInterval(() => {
            this.gameEngine.timeRemaining--;
            this.updateTimer();

            if (this.gameEngine.timeRemaining <= 0) {
                this.gameEngine.endGame();
            }
        }, 1000);
    }

    /**
     * Clear the timer
     */
    clearTimer() {
        if (this.gameEngine.timeInterval) {
            clearInterval(this.gameEngine.timeInterval);
            this.gameEngine.timeInterval = null;
        }
    }

    /**
     * Update timer display
     */
    updateTimer() {
        const timerElement = document.getElementById('timer');
        const timerDisplay = document.getElementById('timer-display');

        if (timerElement) {
            timerElement.textContent = this.gameEngine.timeRemaining;

            // Add warning class when time is low
            if (this.gameEngine.timeRemaining <= 10) {
                timerDisplay?.classList.add('warning');
            } else {
                timerDisplay?.classList.remove('warning');
            }
        }
    }

    /**
     * Add time bonus for time trial mode
     * @param {number} points - Points earned
     */
    addTimeBonus(points) {
        if (this.gameEngine.selectedGameMode !== 'timetrial') return;

        // Add 5 seconds for each food
        this.gameEngine.timeRemaining += 5;

        // Bonus time every 5 points (50 score)
        if (points % 50 === 0) {
            this.gameEngine.timeRemaining += 20;
            this.showTimeBonus();
        }

        this.updateTimer();
    }

    /**
     * Show time bonus notification
     */
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

    /**
     * Generate random obstacles for obstacle mode
     */
    generateObstacles() {
        const numObstacles = Math.floor(Math.random() * 8) + 5; // 5-12 obstacles
        this.gameEngine.obstacles = [];

        for (let i = 0; i < numObstacles; i++) {
            let obstacleX, obstacleY;
            let validPosition = false;
            let attempts = 0;

            while (!validPosition && attempts < 50) {
                obstacleX = Math.floor(Math.random() * (this.gameEngine.canvasSize / this.gameEngine.gridSize)) * this.gameEngine.gridSize;
                obstacleY = Math.floor(Math.random() * (this.gameEngine.canvasSize / this.gameEngine.gridSize)) * this.gameEngine.gridSize;

                // Check if position conflicts with snake or other obstacles
                const conflictsWithSnake = this.gameEngine.snake.some(segment =>
                    segment.x === obstacleX && segment.y === obstacleY
                );

                const conflictsWithObstacles = this.gameEngine.obstacles.some(obstacle =>
                    obstacle.x === obstacleX && obstacle.y === obstacleY
                );

                // Keep obstacles away from snake's starting area
                const tooCloseToStart = (
                    Math.abs(obstacleX - 100) < this.gameEngine.gridSize * 3 &&
                    Math.abs(obstacleY - 100) < this.gameEngine.gridSize * 2
                );

                if (!conflictsWithSnake && !conflictsWithObstacles && !tooCloseToStart) {
                    validPosition = true;
                    this.gameEngine.obstacles.push({ x: obstacleX, y: obstacleY });
                }

                attempts++;
            }
        }
    }

    /**
     * Check if position collides with obstacle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {boolean} True if collides with obstacle
     */
    checkObstacleCollision(x, y) {
        if (this.gameEngine.selectedGameMode !== 'obstacle') return false;

        return this.gameEngine.obstacles.some(obstacle =>
            obstacle.x === x && obstacle.y === y
        );
    }

    /**
     * Check if food position conflicts with obstacles
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {boolean} True if conflicts with obstacle
     */
    conflictsWithObstacle(x, y) {
        if (this.gameEngine.selectedGameMode !== 'obstacle') return false;

        return this.gameEngine.obstacles.some(obstacle =>
            obstacle.x === x && obstacle.y === y
        );
    }
}
