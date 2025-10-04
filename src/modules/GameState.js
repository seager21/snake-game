/**
 * GameState - Centralized state management with immutable updates
 * 
 * Features:
 * - Immutable state updates (prevents accidental mutations)
 * - State history for undo/replay functionality
 * - State persistence (save/load from localStorage)
 * - State validation
 * - State snapshots for debugging
 */

export class GameState {
    constructor() {
        this.current = this.getInitialState();
        this.history = [];
        this.maxHistorySize = 1000; // Limit history to prevent memory issues
        this.listeners = new Set();
    }

    /**
     * Get initial state structure
     * @returns {Object} Initial game state
     */
    getInitialState() {
        return {
            // Game meta
            mode: 'classic', // classic, timetrial, obstacle
            level: 1,
            selectedLevel: 1,
            selectedColor: 'magenta',
            
            // Game status
            gameState: 'menu', // menu, playing, paused, gameOver
            gameRunning: false,
            isPaused: false,
            
            // Score
            score: 0,
            
            // Snake
            snake: [],
            dx: 0,
            dy: 0,
            
            // Food
            food: { x: 0, y: 0 },
            
            // Obstacles (for obstacle mode)
            obstacles: [],
            
            // Time Trial specific
            timeRemaining: 30,
            pointsEarned: 0,
            
            // Timestamps
            startTime: null,
            endTime: null,
            pauseTime: null,
            
            // Session info
            sessionId: this.generateSessionId(),
            moveCount: 0,
            foodEaten: 0
        };
    }

    /**
     * Generate unique session ID
     * @returns {string} Session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Update state immutably
     * @param {Object} changes - Changes to apply to state
     * @param {boolean} saveToHistory - Whether to save previous state to history
     * @returns {Object} New state
     */
    update(changes, saveToHistory = true) {
        // Save current state to history if requested
        if (saveToHistory && this.current.gameState === 'playing') {
            this.addToHistory(this.current);
        }

        // Create new state with changes (immutable)
        const newState = {
            ...this.current,
            ...changes
        };

        // Validate state
        if (!this.validateState(newState)) {
            console.error('Invalid state update attempted:', changes);
            return this.current;
        }

        // Update current state
        this.current = newState;

        // Notify listeners
        this.notifyListeners(this.current);

        return this.current;
    }

    /**
     * Add state to history
     * @param {Object} state - State to add to history
     */
    addToHistory(state) {
        // Create deep copy for history
        const stateCopy = JSON.parse(JSON.stringify(state));
        
        this.history.push({
            state: stateCopy,
            timestamp: Date.now()
        });

        // Trim history if too large
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * Get state from history
     * @param {number} stepsBack - How many steps back in history
     * @returns {Object|null} Historical state or null if not found
     */
    getFromHistory(stepsBack = 1) {
        const index = this.history.length - stepsBack;
        if (index >= 0 && index < this.history.length) {
            return this.history[index].state;
        }
        return null;
    }

    /**
     * Undo last state change
     * @returns {Object|null} Previous state or null if no history
     */
    undo() {
        if (this.history.length === 0) {
            console.warn('No history to undo');
            return null;
        }

        const previousState = this.history.pop();
        this.current = previousState.state;
        this.notifyListeners(this.current);
        
        return this.current;
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
        console.log('State history cleared');
    }

    /**
     * Validate state structure
     * @param {Object} state - State to validate
     * @returns {boolean} True if valid
     */
    validateState(state) {
        // Check required properties exist
        const requiredProps = [
            'mode', 'level', 'gameState', 'score', 
            'snake', 'food', 'dx', 'dy'
        ];

        for (const prop of requiredProps) {
            if (state[prop] === undefined) {
                console.error(`Missing required state property: ${prop}`);
                return false;
            }
        }

        // Validate value ranges
        if (state.level < 1 || state.level > 10) {
            console.error('Invalid level:', state.level);
            return false;
        }

        if (state.score < 0) {
            console.error('Invalid score:', state.score);
            return false;
        }

        if (!Array.isArray(state.snake)) {
            console.error('Snake must be an array');
            return false;
        }

        if (!['classic', 'timetrial', 'obstacle'].includes(state.mode)) {
            console.error('Invalid game mode:', state.mode);
            return false;
        }

        return true;
    }

    /**
     * Save state to localStorage
     * @param {string} key - Storage key
     * @returns {boolean} True if saved successfully
     */
    saveState(key = 'vaporSnake_savedGame') {
        try {
            const saveData = {
                state: this.current,
                savedAt: Date.now(),
                version: '1.0'
            };

            localStorage.setItem(key, JSON.stringify(saveData));
            console.log('✅ Game state saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save game state:', error);
            return false;
        }
    }

    /**
     * Load state from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} True if loaded successfully
     */
    loadState(key = 'vaporSnake_savedGame') {
        try {
            const saved = localStorage.getItem(key);
            
            if (!saved) {
                console.log('No saved game found');
                return false;
            }

            const saveData = JSON.parse(saved);
            
            // Validate loaded state
            if (!this.validateState(saveData.state)) {
                console.error('Saved state is invalid');
                return false;
            }

            // Restore state
            this.current = saveData.state;
            this.clearHistory(); // Clear history when loading saved game
            
            console.log('✅ Game state loaded successfully');
            console.log('   Saved at:', new Date(saveData.savedAt).toLocaleString());
            
            this.notifyListeners(this.current);
            return true;
        } catch (error) {
            console.error('Failed to load game state:', error);
            return false;
        }
    }

    /**
     * Delete saved state
     * @param {string} key - Storage key
     */
    deleteSavedState(key = 'vaporSnake_savedGame') {
        try {
            localStorage.removeItem(key);
            console.log('Saved game deleted');
        } catch (error) {
            console.error('Failed to delete saved game:', error);
        }
    }

    /**
     * Check if saved game exists
     * @param {string} key - Storage key
     * @returns {boolean} True if saved game exists
     */
    hasSavedGame(key = 'vaporSnake_savedGame') {
        try {
            return localStorage.getItem(key) !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Reset state to initial values
     * @param {boolean} keepMode - Keep current game mode selection
     */
    reset(keepMode = false) {
        const currentMode = this.current.mode;
        const currentSelectedLevel = this.current.selectedLevel;
        const currentSelectedColor = this.current.selectedColor;
        
        this.current = this.getInitialState();
        
        if (keepMode) {
            this.current.mode = currentMode;
            this.current.selectedLevel = currentSelectedLevel;
            this.current.selectedColor = currentSelectedColor;
        }
        
        this.clearHistory();
        this.notifyListeners(this.current);
        
        console.log('Game state reset');
    }

    /**
     * Get state snapshot (deep copy)
     * @returns {Object} State snapshot
     */
    getSnapshot() {
        return JSON.parse(JSON.stringify(this.current));
    }

    /**
     * Get state statistics
     * @returns {Object} State statistics
     */
    getStatistics() {
        return {
            historySize: this.history.length,
            moveCount: this.current.moveCount,
            foodEaten: this.current.foodEaten,
            sessionDuration: this.current.startTime 
                ? Date.now() - this.current.startTime 
                : 0,
            snakeLength: this.current.snake.length,
            score: this.current.score
        };
    }

    /**
     * Export replay data (for replay feature)
     * @returns {Object} Replay data
     */
    exportReplay() {
        return {
            initialState: this.history.length > 0 
                ? this.history[0].state 
                : this.getInitialState(),
            moves: this.history.map(h => ({
                state: h.state,
                timestamp: h.timestamp
            })),
            finalState: this.current,
            statistics: this.getStatistics(),
            metadata: {
                mode: this.current.mode,
                level: this.current.level,
                score: this.current.score,
                recordedAt: Date.now()
            }
        };
    }

    /**
     * Subscribe to state changes
     * @param {Function} listener - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        this.listeners.add(listener);
        
        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notify all listeners of state change
     * @param {Object} newState - New state
     */
    notifyListeners(newState) {
        this.listeners.forEach(listener => {
            try {
                listener(newState);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }

    /**
     * Get current state (read-only)
     * @returns {Object} Current state (frozen copy)
     */
    getState() {
        return Object.freeze({ ...this.current });
    }

    /**
     * Debug: Print current state
     */
    debugPrint() {
        console.group('🎮 Game State Debug');
        console.log('Current State:', this.current);
        console.log('History Size:', this.history.length);
        console.log('Statistics:', this.getStatistics());
        console.log('Listeners:', this.listeners.size);
        console.groupEnd();
    }
}
