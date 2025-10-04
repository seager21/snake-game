/**
 * Renderer - Handles all canvas drawing and animations
 */
export class Renderer {
    constructor(canvas, gridSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = gridSize;
        this.canvasSize = canvas.width;
        this.rainbowHue = 0;
    }

    /**
     * Update canvas size
     * @param {number} size - New canvas size
     */
    updateCanvasSize(size) {
        this.canvasSize = size;
        this.canvas.width = size;
        this.canvas.height = size;
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

    /**
     * Clear the board and draw background grid
     */
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

    /**
     * Draw the snake
     * @param {Array} snake - Array of snake segments
     * @param {string} color - Snake color name
     */
    drawSnake(snake, color) {
        snake.forEach((segment, index) => {
            const isHead = index === 0;
            this.ctx.save();

            // Add glow effect
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = this.getColorValue(color);

            // Draw segment based on color
            if (color === 'rainbow') {
                this.drawRainbowSegment(segment, index);
            } else {
                this.drawRegularSegment(segment, color, isHead);
            }

            this.ctx.restore();
        });
    }

    /**
     * Draw a regular colored segment
     * @param {Object} segment - Segment position
     * @param {string} color - Color name
     * @param {boolean} isHead - Whether this is the snake head
     */
    drawRegularSegment(segment, color, isHead) {
        const colorValue = this.getColorValue(color);
        const gradient = this.ctx.createLinearGradient(
            segment.x, segment.y,
            segment.x + this.gridSize, segment.y + this.gridSize
        );

        if (isHead) {
            gradient.addColorStop(0, colorValue);
            gradient.addColorStop(1, this.darkenColor(colorValue));
        } else {
            gradient.addColorStop(0, colorValue);
            gradient.addColorStop(1, this.darkenColor(colorValue, 0.7));
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            segment.x + 1,
            segment.y + 1,
            this.gridSize - 2,
            this.gridSize - 2
        );
    }

    /**
     * Draw a rainbow segment
     * @param {Object} segment - Segment position
     * @param {number} index - Segment index for color offset
     */
    drawRainbowSegment(segment, index) {
        const hue = (this.rainbowHue + (index * 10)) % 360;
        this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        this.ctx.fillRect(
            segment.x + 1,
            segment.y + 1,
            this.gridSize - 2,
            this.gridSize - 2
        );
    }

    /**
     * Draw the food
     * @param {Object} food - Food position
     */
    drawFood(food) {
        this.ctx.save();
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#ffbe0b';

        const gradient = this.ctx.createRadialGradient(
            food.x + this.gridSize / 2, food.y + this.gridSize / 2, 0,
            food.x + this.gridSize / 2, food.y + this.gridSize / 2, this.gridSize / 2
        );
        gradient.addColorStop(0, '#ffbe0b');
        gradient.addColorStop(0.7, '#ff9500');
        gradient.addColorStop(1, '#ff6b00');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(
            food.x + this.gridSize / 2,
            food.y + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        this.ctx.restore();
    }

    /**
     * Draw obstacles
     * @param {Array} obstacles - Array of obstacle positions
     * @param {string} gameMode - Current game mode
     */
    drawObstacles(obstacles, gameMode) {
        // Only draw if in obstacle mode and obstacles exist
        if (gameMode !== 'obstacle') {
            return;
        }
        
        if (!obstacles || !Array.isArray(obstacles)) {
            console.log('⚠️ drawObstacles called but obstacles is invalid:', obstacles);
            return;
        }
        
        if (obstacles.length === 0) {
            console.log('⚠️ drawObstacles called but obstacles array is empty');
            return;
        }

        console.log('🎨 Drawing obstacles:', obstacles.length);
        obstacles.forEach(obstacle => {
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

    /**
     * Update rainbow hue for animated rainbow effect
     */
    updateRainbow() {
        this.rainbowHue = (this.rainbowHue + 2) % 360;
    }

    /**
     * Get color value from color name
     * @param {string} color - Color name
     * @returns {string} Color value
     */
    getColorValue(color) {
        const colors = {
            'magenta': '#ff006e',
            'white': '#ffffff',
            'cyan': '#00f5ff',
            'amber': '#ffbe0b',
            'rainbow': '#ff006e',
            'green': '#00ff41',
            'purple': '#8338ec',
            'blue': '#0096ff',
            'red': '#ff0000',
            'yellow': '#ffff00',
            'orange': '#ff9500',
            'pink': '#ff69b4',
            'lime': '#00ff00'
        };
        return colors[color] || '#ff006e';
    }

    /**
     * Darken a color
     * @param {string} color - Color to darken
     * @param {number} factor - Darken factor (0-1)
     * @returns {string} Darkened color
     */
    darkenColor(color, factor = 0.5) {
        // Simple darkening by reducing RGB values
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            const newR = Math.floor(r * factor);
            const newG = Math.floor(g * factor);
            const newB = Math.floor(b * factor);
            return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
        }
        return color;
    }
}
