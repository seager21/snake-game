/**
 * GameState Usage Examples
 * 
 * This file demonstrates how to use the GameState class
 * for state management, save/load, and replay features.
 */

import { GameState } from './modules/GameState.js';

// ============================================================================
// BASIC USAGE
// ============================================================================

// Create a new game state instance
const gameState = new GameState();

// Get current state (read-only)
const currentState = gameState.getState();
console.log('Initial state:', currentState);

// Update state immutably
gameState.update({
    mode: 'timetrial',
    level: 5,
    score: 100
});

// ============================================================================
// STATE HISTORY & UNDO
// ============================================================================

// Start a game and make moves (each update saves to history)
gameState.update({ gameState: 'playing' });
gameState.update({ snake: [{ x: 100, y: 100 }], moveCount: 1 });
gameState.update({ snake: [{ x: 120, y: 100 }, { x: 100, y: 100 }], moveCount: 2 });
gameState.update({ score: 10, foodEaten: 1, moveCount: 3 });

// Check history
console.log('History size:', gameState.history.length);

// Undo last move
const previousState = gameState.undo();
console.log('After undo:', previousState);

// Get state from N moves ago
const fiveMovesAgo = gameState.getFromHistory(5);
console.log('5 moves ago:', fiveMovesAgo);

// ============================================================================
// SAVE & LOAD GAME
// ============================================================================

// Save current game state
const saved = gameState.saveState();
console.log('Game saved:', saved);

// Check if saved game exists
const hasSave = gameState.hasSavedGame();
console.log('Has saved game:', hasSave);

// Load saved game
const loaded = gameState.loadState();
console.log('Game loaded:', loaded);

// Delete saved game
gameState.deleteSavedState();

// ============================================================================
// STATE VALIDATION
// ============================================================================

// Valid update
gameState.update({ score: 200 }); // ✅ Works

// Invalid update (will be rejected)
gameState.update({ level: 99 }); // ❌ Rejected (level must be 1-10)
gameState.update({ score: -10 }); // ❌ Rejected (score can't be negative)

// ============================================================================
// REPLAY EXPORT
// ============================================================================

// Play a game and export replay data
gameState.reset();
gameState.update({ gameState: 'playing', startTime: Date.now() });

// Simulate some moves
for (let i = 0; i < 10; i++) {
    gameState.update({
        snake: [{ x: i * 20, y: 100 }],
        score: i * 10,
        moveCount: i + 1
    });
}

// Export replay
const replayData = gameState.exportReplay();
console.log('Replay data:', replayData);
console.log('Total moves recorded:', replayData.moves.length);

// ============================================================================
// STATE LISTENERS (React to state changes)
// ============================================================================

// Subscribe to state changes
const unsubscribe = gameState.subscribe((newState) => {
    console.log('State changed!', newState);
    
    // Update UI based on state
    if (newState.gameState === 'playing') {
        console.log('Game is running');
    }
    
    if (newState.gameState === 'gameOver') {
        console.log('Game over! Final score:', newState.score);
    }
});

// Make some state changes (listener will be called)
gameState.update({ score: 500 });
gameState.update({ gameState: 'gameOver' });

// Unsubscribe when done
unsubscribe();

// ============================================================================
// STATE SNAPSHOTS
// ============================================================================

// Get a snapshot of current state (deep copy)
const snapshot = gameState.getSnapshot();
console.log('Snapshot:', snapshot);

// Modify snapshot (won't affect actual state)
snapshot.score = 9999;
console.log('Modified snapshot:', snapshot.score);
console.log('Actual state:', gameState.current.score); // Unchanged

// ============================================================================
// STATISTICS & DEBUGGING
// ============================================================================

// Get game statistics
const stats = gameState.getStatistics();
console.log('Statistics:', stats);
/*
{
    historySize: 15,
    moveCount: 50,
    foodEaten: 5,
    sessionDuration: 120000,
    snakeLength: 8,
    score: 50
}
*/

// Debug print
gameState.debugPrint();

// ============================================================================
// RESET STATE
// ============================================================================

// Reset completely
gameState.reset();

// Reset but keep mode selection
gameState.update({ mode: 'obstacle', selectedLevel: 7 });
gameState.reset(true); // Keeps mode and selectedLevel

// ============================================================================
// INTEGRATION EXAMPLE (How GameEngine would use it)
// ============================================================================

class GameEngineExample {
    constructor() {
        this.state = new GameState();
        
        // Subscribe to state changes
        this.state.subscribe((newState) => {
            this.onStateChange(newState);
        });
    }
    
    startGame() {
        // Update state instead of setting properties directly
        this.state.update({
            gameState: 'playing',
            gameRunning: true,
            startTime: Date.now(),
            snake: [
                { x: 100, y: 100 },
                { x: 80, y: 100 },
                { x: 60, y: 100 }
            ],
            dx: 20,
            dy: 0
        });
    }
    
    moveSnake() {
        const state = this.state.current;
        const newHead = {
            x: state.snake[0].x + state.dx,
            y: state.snake[0].y + state.dy
        };
        
        const newSnake = [newHead, ...state.snake];
        newSnake.pop(); // Remove tail
        
        this.state.update({
            snake: newSnake,
            moveCount: state.moveCount + 1
        });
    }
    
    eatFood() {
        const state = this.state.current;
        
        this.state.update({
            score: state.score + 10,
            foodEaten: state.foodEaten + 1
        });
    }
    
    pauseGame() {
        this.state.update({
            gameState: 'paused',
            isPaused: true,
            pauseTime: Date.now()
        });
        
        // Auto-save when paused
        this.state.saveState();
    }
    
    resumeGame() {
        this.state.update({
            gameState: 'playing',
            isPaused: false,
            pauseTime: null
        });
    }
    
    gameOver() {
        this.state.update({
            gameState: 'gameOver',
            gameRunning: false,
            endTime: Date.now()
        });
        
        // Export replay
        const replay = this.state.exportReplay();
        console.log('Replay exported:', replay);
    }
    
    onStateChange(newState) {
        // React to state changes
        console.log('State updated:', newState);
        
        // Update UI
        this.updateUI(newState);
        
        // Save periodically
        if (newState.moveCount % 10 === 0) {
            this.state.saveState('autosave');
        }
    }
    
    updateUI(state) {
        // Update DOM based on state
        document.getElementById('score').textContent = state.score;
        document.getElementById('level').textContent = state.level;
        
        if (state.gameState === 'timetrial') {
            document.getElementById('timer').textContent = state.timeRemaining;
        }
    }
}

// ============================================================================
// ADVANCED: REPLAY PLAYBACK
// ============================================================================

class ReplayPlayer {
    constructor(replayData) {
        this.replayData = replayData;
        this.currentFrame = 0;
    }
    
    play() {
        if (this.currentFrame >= this.replayData.moves.length) {
            console.log('Replay finished');
            return;
        }
        
        const move = this.replayData.moves[this.currentFrame];
        console.log('Frame', this.currentFrame, ':', move.state);
        
        this.currentFrame++;
        
        // Continue playback
        setTimeout(() => this.play(), 100); // 100ms per frame
    }
    
    pause() {
        // Pause playback
    }
    
    seekTo(frame) {
        this.currentFrame = frame;
    }
}

// Use replay player
const replay = gameState.exportReplay();
const player = new ReplayPlayer(replay);
player.play();

// ============================================================================
// BEST PRACTICES
// ============================================================================

/*
1. Always use gameState.update() instead of directly modifying properties
2. Subscribe to state changes for UI updates
3. Save state when pausing or at key moments
4. Use state validation to prevent invalid states
5. Export replays for bug reports or sharing
6. Use snapshots for debugging without affecting state
7. Clear history periodically to prevent memory issues
8. Use state statistics for analytics
*/
