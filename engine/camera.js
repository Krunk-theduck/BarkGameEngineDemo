/**
 * Camera class for managing viewports and world-to-screen transformations
 */
class Camera {
    constructor(width = 800, height = 600) {
        // Create canvas for this camera
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');

        // Camera properties
        this.x = 0;
        this.y = 0;
        this.scale = 1;
        this.rotation = 0;

        // Target entity to follow (if any)
        this.target = null;
        this.followOffset = { x: 0, y: 0 };
        
        // Viewport boundaries
        this.bounds = {
            min: { x: 0, y: 0 },
            max: { x: Infinity, y: Infinity }
        };

        // Smoothing properties
        this.smoothing = {
            enabled: false,
            speed: 0.1
        };

        // Add canvas to game container
        const container = document.getElementById('game-container');
        if (container) {
            container.appendChild(this.canvas);
        }
    }

    /**
     * Set camera viewport size
     * @param {number} width 
     * @param {number} height 
     */
    setSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    /**
     * Set camera boundaries
     * @param {number} minX 
     * @param {number} minY 
     * @param {number} maxX 
     * @param {number} maxY 
     */
    setBounds(minX, minY, maxX, maxY) {
        this.bounds.min.x = minX;
        this.bounds.min.y = minY;
        this.bounds.max.x = maxX;
        this.bounds.max.y = maxY;
    }

    /**
     * Set entity for camera to follow
     * @param {Entity} entity 
     * @param {Object} offset 
     */
    follow(entity, offset = { x: 0, y: 0 }) {
        this.target = entity;
        this.followOffset = offset;
    }

    /**
     * Stop following current target
     */
    unfollow() {
        this.target = null;
    }

    /**
     * Enable or disable smooth camera movement
     * @param {boolean} enabled 
     * @param {number} speed 
     */
    setSmoothing(enabled, speed = 0.1) {
        this.smoothing.enabled = enabled;
        this.smoothing.speed = speed;
    }

    /**
     * Convert world coordinates to screen coordinates
     * @param {number} worldX 
     * @param {number} worldY 
     * @returns {Object} Screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.scale + this.canvas.width / 2,
            y: (worldY - this.y) * this.scale + this.canvas.height / 2
        };
    }

    /**
     * Convert screen coordinates to world coordinates
     * @param {number} screenX 
     * @param {number} screenY 
     * @returns {Object} World coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.canvas.width / 2) / this.scale + this.x,
            y: (screenY - this.canvas.height / 2) / this.scale + this.y
        };
    }

    /**
     * Update camera position and follow target if set
     */
    update() {
        if (this.target) {
            const targetX = this.target.x + this.followOffset.x;
            const targetY = this.target.y + this.followOffset.y;

            if (this.smoothing.enabled) {
                // Smooth camera movement
                this.x += (targetX - this.x) * this.smoothing.speed;
                this.y += (targetY - this.y) * this.smoothing.speed;
            } else {
                this.x = targetX;
                this.y = targetY;
            }
        }

        // Clamp camera position to bounds
        this.x = Math.max(this.bounds.min.x, Math.min(this.bounds.max.x, this.x));
        this.y = Math.max(this.bounds.min.y, Math.min(this.bounds.max.y, this.y));
    }

    /**
     * Clear the camera's canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Begin drawing scene for this camera
     */
    begin() {
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.rotate(this.rotation);
        this.ctx.translate(-this.x, -this.y);
    }

    /**
     * End drawing scene for this camera
     */
    end() {
        this.ctx.restore();
    }

    /**
     * Render the scene for this camera
     * @param {Scene} scene Current game scene
     * @param {Engine} engine Game engine instance
     */
    render(scene, engine) {
        if (!scene) {
            console.error('Camera: No scene provided for rendering');
            return;
        }

        this.clear();
        this.begin();

        // Draw background
        if (scene.backgroundColor) {
            this.ctx.fillStyle = scene.backgroundColor;
            this.ctx.fillRect(
                this.x - this.canvas.width / (2 * this.scale),
                this.y - this.canvas.height / (2 * this.scale),
                this.canvas.width / this.scale,
                this.canvas.height / this.scale
            );
        }

        // Draw map if exists
        if (scene.map) {
            this.ctx.drawImage(scene.map, 0, 0);
        }

        // Debug: draw collision map
        if (window.engine?.debug?.enabled) {    
            scene.renderCollisionMap(this.ctx);
        }

        // Draw entities
        const entities = Array.from(scene.entities);
        entities.sort((a, b) => b.renderOrder - a.renderOrder);

        for (const entity of entities) {
            if (entity.visible) {
                try {
                    entity.render(this.ctx);
                } catch (error) {
                    console.error('Failed to render entity:', error);
                }
            }
        }

        this.end();

        // Render debug information on top if enabled
        if (engine.debug.enabled) {
            engine.debug.render(this.ctx, engine);
        }
    }
}
