/**
 * ScoreManager - Manages high scores and localStorage operations
 */
export class ScoreManager {
    constructor() {
        this.highScores = {
            classic: this.loadHighScore('classic'),
            timetrial: this.loadHighScore('timetrial'),
            obstacle: this.loadHighScore('obstacle')
        };
    }

    /**
     * Save high score for a specific game mode
     * @param {string} gameMode - The game mode (classic, timetrial, obstacle)
     * @param {number} score - The score to save
     */
    saveHighScore(gameMode, score) {
        try {
            this.highScores[gameMode] = score;
            localStorage.setItem(`vaporSnakeHighScore_${gameMode}`, score.toString());
            return true;
        } catch (error) {
            console.error('Failed to save high score:', error);
            return false;
        }
    }

    /**
     * Load high score for a specific game mode
     * @param {string} gameMode - The game mode to load score for
     * @returns {number} The high score or 0 if not found
     */
    loadHighScore(gameMode) {
        try {
            const saved = localStorage.getItem(`vaporSnakeHighScore_${gameMode}`);
            return saved ? parseInt(saved, 10) : 0;
        } catch (error) {
            console.error('Failed to load high score:', error);
            return 0;
        }
    }

    /**
     * Get high score for a specific game mode
     * @param {string} gameMode - The game mode
     * @returns {number} The high score
     */
    getHighScore(gameMode) {
        return this.highScores[gameMode] || 0;
    }

    /**
     * Get all high scores
     * @returns {Object} All high scores
     */
    getAllHighScores() {
        return { ...this.highScores };
    }

    /**
     * Update high score if current score is higher
     * @param {string} gameMode - The game mode
     * @param {number} currentScore - The current score
     * @returns {boolean} True if new high score was set
     */
    updateIfHighScore(gameMode, currentScore) {
        const currentHigh = this.getHighScore(gameMode);
        if (currentScore > currentHigh) {
            this.saveHighScore(gameMode, currentScore);
            return true;
        }
        return false;
    }

    /**
     * Reset high score for a specific game mode
     * @param {string} gameMode - The game mode to reset
     */
    resetHighScore(gameMode) {
        try {
            this.highScores[gameMode] = 0;
            localStorage.removeItem(`vaporSnakeHighScore_${gameMode}`);
        } catch (error) {
            console.error('Failed to reset high score:', error);
        }
    }

    /**
     * Reset all high scores
     */
    resetAllHighScores() {
        ['classic', 'timetrial', 'obstacle'].forEach(mode => {
            this.resetHighScore(mode);
        });
    }

    /**
     * Update personal best display in the UI for all game modes
     */
    updatePersonalBest() {
        // Update personal best for all game modes
        Object.keys(this.highScores).forEach(mode => {
            const scoreElement = document.getElementById(`personal-best-score-${mode}`);
            if (scoreElement) {
                scoreElement.textContent = this.highScores[mode] || 0;
            }
        });
    }
}
