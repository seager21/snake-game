/**
 * Main Entry Point - Initializes the game and sets up global functions
 * 
 * This file creates the GameEngine instance and exposes global menu functions
 * that are called from the HTML onclick attributes.
 */

import '../css/style.css';
import { GameEngine } from './modules/GameEngine.js';

// Global game instance
let game;

// Menu functions (called from HTML)
window.showMainMenu = function() {
    if (game) {
        game.gameRunning = false;
        game.gameState = 'menu';
        game.hideModal('game-over-modal');
        game.hideModal('pause-modal');
        
        // Clear timer if in time trial mode
        if (game.selectedGameMode === 'timetrial' && game.gameModes) {
            game.gameModes.clearTimer();
        }
    }
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById('main-menu').classList.add('active');
}

window.showGameModeSelection = function() {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById('gamemode-menu').classList.add('active');
}

window.showNewGameMenu = function() {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById('setup-menu').classList.add('active');
}

window.showHighScores = function() {
    if (game && game.scoreManager) {
        game.scoreManager.updatePersonalBest();
    }
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById('highscores-menu').classList.add('active');
}

window.startGame = function() {
    console.log('🎮 startGame() called');
    console.log('   Game instance exists:', !!game);
    if (!game) {
        console.log('   Creating new GameEngine...');
        game = new GameEngine();
    }
    console.log('   Calling game.startGame()...');
    game.startGame();
    console.log('   ✅ game.startGame() completed');
}

window.pauseGame = function() {
    if (game) {
        game.pauseGame();
    }
}

window.resumeGame = function() {
    if (game) {
        game.resumeGame();
    }
}

window.restartGame = function() {
    if (game) {
        game.restartGame();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    game = new GameEngine();
    
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
