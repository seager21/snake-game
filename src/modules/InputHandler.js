/**
 * InputHandler - Manages keyboard, touch, and mobile controls
 */
export class InputHandler {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.isMobile = this.detectMobile();
        this.changingDirection = false;
        // Don't setup event listeners in constructor - will be called by GameEngine.init()
    }

    /**
     * Detect if device is mobile
     * @returns {boolean} True if mobile device
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
            window.innerWidth <= 768;
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Level selector
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.gameEngine.selectLevel(e.target.dataset.level));
        });

        // Color selector
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.gameEngine.selectColor(e.target.dataset.color));
        });

        // Color dropdown
        this.setupColorDropdown();

        // Game mode selection
        this.setupGameModeSelection();

        // High score tabs
        this.setupHighScoreTabs();

        // Prevent arrow key scrolling
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        // Mobile controls setup - always set up, not just on mobile
        this.setupMobileControls();
        
        // Mobile-specific adjustments
        if (this.isMobile) {
            this.adjustForMobile();
        }
    }

    /**
     * Setup color dropdown functionality
     */
    setupColorDropdown() {
        const dropdownSelected = document.getElementById('color-selected');
        const dropdownOptions = document.getElementById('color-options');
        const options = document.querySelectorAll('.dropdown-option');

        console.log('🎨 Setting up color dropdown...');
        console.log('   Dropdown selected element:', dropdownSelected);
        console.log('   Dropdown options element:', dropdownOptions);
        console.log('   Found options:', options.length);

        if (!dropdownSelected || !dropdownOptions) {
            console.log('   ⚠️ Missing dropdown elements!');
            return;
        }

        // Toggle dropdown
        dropdownSelected.addEventListener('click', (e) => {
            console.log('🖱️ Dropdown clicked');
            e.stopPropagation();
            dropdownSelected.classList.toggle('open');
            dropdownOptions.classList.toggle('open');
        });

        // Select option
        options.forEach((option, index) => {
            option.addEventListener('click', (e) => {
                console.log(`🎨 Color option clicked: ${option.dataset.color}`);
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
                console.log(`   Updating game engine color to: ${color}`);
                this.gameEngine.selectColor(color);
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
        
        console.log('   ✅ Color dropdown setup complete');
    }

    /**
     * Setup game mode selection
     */
    setupGameModeSelection() {
        const gamemodeCards = document.querySelectorAll('.gamemode-card');
        console.log('✅ Setting up game mode selection, found cards:', gamemodeCards.length);
        
        gamemodeCards.forEach((card, index) => {
            console.log(`   Card ${index}:`, card.dataset.mode, card);
            
            // Add multiple event types to ensure one works
            const handleClick = (e) => {
                console.log('🎮 GAME MODE CLICKED!', card.dataset.mode);
                e.preventDefault();
                e.stopPropagation();
                
                const mode = card.dataset.mode;
                this.gameEngine.selectGameMode(mode);

                // Proceed to setup after mode selection
                setTimeout(() => {
                    console.log('🚀 Showing new game menu...');
                    window.showNewGameMenu();
                }, 300);
            };
            
            card.addEventListener('click', handleClick, false);
            card.addEventListener('touchend', handleClick, { passive: false });
            
            console.log(`   ✓ Event listeners attached to card ${index}`);
        });
        
        console.log('✅ Game mode selection setup complete');
    }

    /**
     * Setup high score tabs
     */
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

    /**
     * Show high scores for specific mode
     * @param {string} mode - Game mode
     */
    showHighScoreMode(mode) {
        // Hide all score lists
        document.querySelectorAll('.scores-list').forEach(list => {
            list.classList.add('hidden');
        });

        // Show selected mode scores
        const scoresList = document.getElementById(`scores-${mode}`);
        if (scoresList) {
            scoresList.classList.remove('hidden');
        }
    }

    /**
     * Handle keyboard input
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyPress(event) {
        if (this.gameEngine.gameState !== 'playing' || this.changingDirection) return;

        this.changingDirection = true;
        const key = event.code;

        // Arrow keys and WASD
        if ((key === 'ArrowLeft' || key === 'KeyA') && this.gameEngine.dx === 0) {
            this.gameEngine.dx = -this.gameEngine.gridSize;
            this.gameEngine.dy = 0;
        }
        if ((key === 'ArrowUp' || key === 'KeyW') && this.gameEngine.dy === 0) {
            this.gameEngine.dx = 0;
            this.gameEngine.dy = -this.gameEngine.gridSize;
        }
        if ((key === 'ArrowRight' || key === 'KeyD') && this.gameEngine.dx === 0) {
            this.gameEngine.dx = this.gameEngine.gridSize;
            this.gameEngine.dy = 0;
        }
        if ((key === 'ArrowDown' || key === 'KeyS') && this.gameEngine.dy === 0) {
            this.gameEngine.dx = 0;
            this.gameEngine.dy = this.gameEngine.gridSize;
        }

        // Pause with spacebar or escape
        if (key === 'Space' || key === 'Escape') {
            this.gameEngine.pauseGame();
        }
    }

    /**
     * Setup mobile touch controls
     */
    setupMobileControls() {
        const dirButtons = document.querySelectorAll('.dir-btn[data-direction]');
        console.log('📱 Setting up mobile controls, found buttons:', dirButtons.length);
        
        // Directional buttons only
        dirButtons.forEach((btn, index) => {
            console.log(`   Button ${index}:`, btn.dataset.direction);
            
            // Remove any existing event listeners by cloning the node
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('touchstart', (e) => {
                console.log('👆 Touch detected on:', newBtn.dataset.direction);
                e.preventDefault();
                if (this.gameEngine.gameState !== 'playing') {
                    console.log('   Game not playing, ignoring');
                    return;
                }

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
                console.log('🖱️ Click detected on:', newBtn.dataset.direction);
                e.preventDefault();
                if (this.gameEngine.gameState !== 'playing') {
                    console.log('   Game not playing, ignoring');
                    return;
                }

                const direction = newBtn.dataset.direction;
                this.handleMobileDirection(direction);
            });
        });
        
        console.log('✅ Mobile controls setup complete');
    }

    /**
     * Handle mobile direction input
     * @param {string} direction - Direction (left, right, up, down)
     */
    handleMobileDirection(direction) {
        if (this.gameEngine.gameState !== 'playing' || this.changingDirection) return;

        this.changingDirection = true;

        // Haptic feedback for mobile devices
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        switch (direction) {
            case 'left':
                if (this.gameEngine.dx === 0) {
                    this.gameEngine.dx = -this.gameEngine.gridSize;
                    this.gameEngine.dy = 0;
                }
                break;
            case 'up':
                if (this.gameEngine.dy === 0) {
                    this.gameEngine.dx = 0;
                    this.gameEngine.dy = -this.gameEngine.gridSize;
                }
                break;
            case 'right':
                if (this.gameEngine.dx === 0) {
                    this.gameEngine.dx = this.gameEngine.gridSize;
                    this.gameEngine.dy = 0;
                }
                break;
            case 'down':
                if (this.gameEngine.dy === 0) {
                    this.gameEngine.dx = 0;
                    this.gameEngine.dy = this.gameEngine.gridSize;
                }
                break;
        }
    }

    /**
     * Adjust UI for mobile devices
     */
    adjustForMobile() {
        if (!this.isMobile) return;

        // Show mobile controls during game
        document.getElementById('mobile-controls').classList.add('active');

        // Update controls info text
        const controlsInfo = document.querySelector('.controls-info span');
        if (controlsInfo) {
            controlsInfo.textContent = 'Use touch controls below';
        }

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

    /**
     * Reset direction change flag
     */
    resetDirectionFlag() {
        this.changingDirection = false;
    }
}
