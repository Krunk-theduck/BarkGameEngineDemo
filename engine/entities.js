/**
 * Base Entity class that all game objects inherit from
 */
class Entity {
    constructor(x = 0, y = 0) {
        // Position and movement
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;

        // Dimensions
        this.width = 0;
        this.height = 0;

        // Rendering
        this.renderOrder = 0;  // Lower numbers render on top
        this.visible = true;
        this.alpha = 1;
        this.rotation = 0;
        this.scale = { x: 1, y: 1 };

        // State
        this.active = true;
        this.tags = new Set();
        this.customData = new Map();  // Dictionary for custom key-value pairs

        // Sprite/Animation
        this.sprite = null;
        this.currentAnimation = null;
        this.animationFrame = 0;
        this.animationTimer = 0;

        // Collision
        this.solid = false;
        this.collisionBounds = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            offset: { x: 0, y: 0 }
        };

        // Script management
        this.scripts = new Map(); // Store active scripts
        this.scriptInstances = new Map(); // Store script instance data
    }

    /**
     * Attach a script to this entity
     * @param {string} scriptName Name of the script to attach
     * @returns {Promise<Object|null>} The script instance or null if failed
     */
    async attachScript(scriptName) {
        try {
            // If script isn't loaded yet, load it
            if (!window.engine.isScriptLoaded(scriptName)) {
                const success = await window.engine.loadScript(scriptName);
                if (!success) {
                    throw new Error(`Failed to load script: ${scriptName}`);
                }
            }

            // Don't attach if already attached
            if (this.scripts.has(scriptName)) {
                console.warn(`Script ${scriptName} is already attached to this entity`);
                return this.scripts.get(scriptName);
            }

            // Get script class and create instance
            const ScriptClass = window.engine.scripts.get(scriptName);
            const scriptInstance = new ScriptClass(this);
            this.scripts.set(scriptName, scriptInstance);

            // Initialize if it has init method
            if (typeof scriptInstance.init === 'function') {
                await scriptInstance.init();
            }

            if (window.engine.debug.enabled) {
                window.engine.debug.trackObject(scriptName, scriptInstance);
            }

            return scriptInstance;
        } catch (error) {
            console.error(`Error attaching script ${scriptName}:`, error);
            return null;
        }
    }

    /**
     * Detach a script from this entity
     * @param {string} scriptName Name of the script to detach
     */
    async detachScript(scriptName) {
        const script = this.scripts.get(scriptName);
        if (script) {
            // Call cleanup method if it exists
            if (typeof script.onDetach === 'function') {
                await script.onDetach();
            }
            this.scripts.delete(scriptName);
        }
    }

    /**
     * Update entity state
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.active) return;

        // Update all attached scripts
        for (const script of this.scripts.values()) {
            if (typeof script.update === 'function') {
                script.update(deltaTime);
            }
        }

        // Update position based on velocity
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;

        // Update animation if one is playing
        if (this.currentAnimation) {
            this.updateAnimation(deltaTime);
        }
    }

    /**
     * Update animation frame
     * @param {number} deltaTime - Time since last frame in seconds
     */
    updateAnimation(deltaTime) {
        if (!this.currentAnimation) return;

        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.currentAnimation.frameTime) {
            this.animationFrame = (this.animationFrame + 1) % this.currentAnimation.frames.length;
            this.animationTimer = 0;
        }
    }

    /**
     * Store custom data on the entity
     * @param {string} key - The identifier for the data
     * @param {any} value - The value to store
     */
    setData(key, value) {
        this.customData.set(key, value);
    }

    /**
     * Retrieve custom data from the entity
     * @param {string} key - The identifier for the data
     * @param {any} defaultValue - Value to return if key doesn't exist
     * @returns {any} The stored value or defaultValue
     */
    getData(key, defaultValue = null) {
        return this.customData.has(key) ? this.customData.get(key) : defaultValue;
    }

    /**
     * Add a tag to the entity
     * @param {string} tag - Tag to add
     */
    addTag(tag) {
        this.tags.add(tag);
    }

    /**
     * Check if entity has a specific tag
     * @param {string} tag - Tag to check
     * @returns {boolean}
     */
    hasTag(tag) {
        return this.tags.has(tag);
    }

    /**
     * Set the collision bounds for the entity
     * @param {number} width - Width of collision box
     * @param {number} height - Height of collision box
     * @param {number} offsetX - X offset from entity position
     * @param {number} offsetY - Y offset from entity position
     */
    setCollisionBounds(width, height, offsetX = 0, offsetY = 0) {
        this.collisionBounds.width = width;
        this.collisionBounds.height = height;
        this.collisionBounds.offset.x = offsetX;
        this.collisionBounds.offset.y = offsetY;
    }

    /**
     * Check collision with another entity
     * @param {Entity} other - Entity to check collision with
     * @returns {boolean}
     */
    isColliding(other) {
        const myBounds = {
            x: this.x + this.collisionBounds.offset.x,
            y: this.y + this.collisionBounds.offset.y,
            width: this.collisionBounds.width,
            height: this.collisionBounds.height
        };

        const otherBounds = {
            x: other.x + other.collisionBounds.offset.x,
            y: other.y + other.collisionBounds.offset.y,
            width: other.collisionBounds.width,
            height: other.collisionBounds.height
        };

        return myBounds.x < otherBounds.x + otherBounds.width &&
               myBounds.x + myBounds.width > otherBounds.x &&
               myBounds.y < otherBounds.y + otherBounds.height &&
               myBounds.y + myBounds.height > otherBounds.y;
    }

    /**
     * Render the entity
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        if (!this.visible) return;

        // Save context state
        ctx.save();

        // Transform
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale.x, this.scale.y);
        ctx.globalAlpha = this.alpha;

        // Default entity visualization (override in subclasses for custom rendering)
        ctx.fillStyle = '#ff0000';  // Default red color
        ctx.fillRect(
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );

        // Debug: draw collision bounds if debug is enabled
        if (window.engine.debug.enabled) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                this.collisionBounds.offset.x,
                this.collisionBounds.offset.y,
                this.collisionBounds.width,
                this.collisionBounds.height
            );
        }

        // Restore context state
        ctx.restore();
    }
}

/**
 * Player class - Singleton controller for the player character
 */
class Player extends Entity {
    constructor(x = 0, y = 0) {
        super(x, y);
        
        if (Player.instance) {
            return Player.instance;
        }
        Player.instance = this;

        // Player properties
        this.renderOrder = -1;
        this.speed = 200;
        this.width = 32;
        this.height = 32;
        this.relativeX = 0;
        this.relativeY = 0;
        
        // Collision properties
        this.solid = true;
        this.collisionBounds = {
            offset: { x: -16, y: -16 },  // Center the collision box
            width: 32,
            height: 32
        };

        // Input state
        this.input = {
            up: false,
            down: false,
            left: false,
            right: false,
            action: false
        };

        this.setupInputHandlers();
    }

    /**
     * Set up keyboard input handlers
     */
    setupInputHandlers() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} e 
     */
    handleKeyDown(e) {
        switch(e.key.toLowerCase()) {
            case 'w': case 'arrowup': this.input.up = true; break;
            case 's': case 'arrowdown': this.input.down = true; break;
            case 'a': case 'arrowleft': this.input.left = true; break;
            case 'd': case 'arrowright': this.input.right = true; break;
            case ' ': case 'space': this.input.action = true; break;
            case 'enter': this.input.action = true; break;
        }
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} e 
     */
    handleKeyUp(e) {
        switch(e.key.toLowerCase()) {
            case 'w': case 'arrowup': this.input.up = false; break;
            case 's': case 'arrowdown': this.input.down = false; break;
            case 'a': case 'arrowleft': this.input.left = false; break;
            case 'd': case 'arrowright': this.input.right = false; break;
            case ' ': case 'space': this.input.action = false; break;
            case 'enter': this.input.action = false; break;
        }
    }

    /**
     * Update player state
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Store previous position for collision resolution
        const previousX = this.x;
        const previousY = this.y;

        // Calculate movement based on input
        this.velocityX = 0;
        this.velocityY = 0;

        if (this.input.up) this.velocityY = -this.speed;
        if (this.input.down) this.velocityY = this.speed;
        if (this.input.left) this.velocityX = -this.speed;
        if (this.input.right) this.velocityX = this.speed;

        // Normalize diagonal movement
        if (this.velocityX !== 0 && this.velocityY !== 0) {
            const normalizer = 1 / Math.sqrt(2);
            this.velocityX *= normalizer;
            this.velocityY *= normalizer;
        }

        // Move X and Y separately to allow sliding along walls
        // Try X movement
        this.x += this.velocityX * deltaTime;
        if (this.checkCollision()) {
            // Collision occurred, revert X movement
            this.x = previousX;
            this.velocityX = 0;
        }

        // Try Y movement
        this.y += this.velocityY * deltaTime;
        if (this.checkCollision()) {
            // Collision occurred, revert Y movement
            this.y = previousY;
            this.velocityY = 0;
        }

        for (const script of this.scripts.values()) {
            if (typeof script.update === 'function') {
                script.update(deltaTime);
            }
        }
    }

    /**
     * Check if player is colliding with the map
     * @returns {boolean} True if collision detected
     */
    checkCollision() {
        const scene = window.engine.currentScene;
        if (!scene) return false;

        // Get player's collision bounds in world space
        const bounds = {
            x: this.x + this.collisionBounds.offset.x,
            y: this.y + this.collisionBounds.offset.y,
            width: this.collisionBounds.width,
            height: this.collisionBounds.height
        };

        // Check collision with map
        return scene.checkRectCollision(
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height
        );
    }

    /**
     * Override render for custom player visualization
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        ctx.save();
        
        let translatedX = this.x;
        let translatedY = this.y;
        ctx.translate(translatedX, translatedY);
        let matrix = ctx.getTransform();
        this.relativeX = matrix.e;
        this.relativeY = matrix.f;
        ctx.rotate(this.rotation);
        ctx.scale(this.scale.x, this.scale.y);

        // Draw player (blue rectangle with direction indicator)
        ctx.fillStyle = '#0088ff';
        ctx.fillRect(-16, -16, 32, 32);

        // Debug: draw collision bounds if debug is enabled
        if (window.engine?.debug?.enabled) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                this.collisionBounds.offset.x,
                this.collisionBounds.offset.y,
                this.collisionBounds.width,
                this.collisionBounds.height
            );
        }

        ctx.restore();
    }
}
