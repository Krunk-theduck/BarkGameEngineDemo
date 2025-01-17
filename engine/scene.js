/**
 * Scene class for managing game maps, collisions, and scene-specific logic
 */
class Scene {
    constructor() {
        // Map properties
        this.map = null;
        this.mapWidth = 0;
        this.mapHeight = 0;

        // Collision data (Uint8Array for performance)
        this.collisionData = null;
        
        // Scene entities
        this.entities = new Set();
        
        // Background properties
        this.backgroundColor = '#000000';
        this.backgroundImage = null;
        this.parallaxLayers = [];

        // Scene state
        this.isActive = false;
        this.isPaused = false;
        
        // Scene data storage
        this.sceneData = new Map();
    }

    /**
     * Load map and its corresponding collision map
     * @param {string} mapSource - Path to visible map image
     * @param {string} collisionMapSource - Path to collision map image
     * @returns {Promise} Resolves when both maps are loaded
     */
    loadMap(mapSource, collisionMapSource) {
        return new Promise((resolve, reject) => {
            // Load the visible map
            const mapImg = new Image();
            const collisionImg = new Image();
            let mapsLoaded = 0;

            const checkBothLoaded = () => {
                mapsLoaded++;
                if (mapsLoaded === 2) {
                    // Both images loaded, generate collision data
                    this.generateCollisionData(collisionImg);
                    resolve();
                }
            };

            // Load visible map
            mapImg.onload = () => {
                this.map = mapImg;
                this.mapWidth = mapImg.width;
                this.mapHeight = mapImg.height;
                checkBothLoaded();
            };
            mapImg.onerror = reject;

            // Load collision map
            collisionImg.onload = () => {
                checkBothLoaded();
            };
            collisionImg.onerror = reject;

            // Start loading both images
            mapImg.src = mapSource;
            collisionImg.src = collisionMapSource;
        });
    }

    /**
     * Generate collision data from collision image
     * @param {HTMLImageElement} collisionImg - The collision map image
     * @private
     */
    generateCollisionData(collisionImg) {
        // Create temporary canvas to read pixel data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = collisionImg.width;
        canvas.height = collisionImg.height;
        ctx.drawImage(collisionImg, 0, 0);

        // Get raw pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Create collision data array (1 byte per pixel)
        this.collisionData = new Uint8Array(canvas.width * canvas.height);

        // Check each pixel's collision status
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            
            // Check if pixel is red (or nearly red to account for compression)
            const isRed = r > 200 && g < 10 && b < 10;
            this.collisionData[i/4] = isRed ? 1 : 0;
        }
    }

    /**
     * Check if a point collides with the map
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {boolean}
     */
    checkCollision(x, y) {
        if (!this.collisionData) return false;
        
        x = Math.floor(x);
        y = Math.floor(y);

        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return true; // Out of bounds counts as collision
        }

        const index = y * this.mapWidth + x;
        return this.collisionData[index] === 1;
    }

    /**
     * Check if a rectangle collides with the map
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @returns {boolean}
     */
    checkRectCollision(x, y, width, height) {
        if (!this.collisionData) return false;

        // Convert to integers
        x = Math.floor(x);
        y = Math.floor(y);
        width = Math.floor(width);
        height = Math.floor(height);

        // Only check the perimeter pixels to improve performance
        // Check top and bottom edges
        for (let i = x; i < x + width; i++) {
            if (this.checkCollision(i, y) || this.checkCollision(i, y + height - 1)) {
                return true;
            }
        }

        // Check left and right edges
        for (let i = y; i < y + height; i++) {
            if (this.checkCollision(x, i) || this.checkCollision(x + width - 1, i)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get collision pixels in a specific area
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {number} width - Area width
     * @param {number} height - Area height
     * @returns {Array<{x: number, y: number}>} Array of pixel coordinates that are solid
     */
    getCollisionPixelsInArea(x, y, width, height) {
        const collisionPixels = [];
        
        x = Math.floor(x);
        y = Math.floor(y);
        width = Math.floor(width);
        height = Math.floor(height);

        // Bounds checking
        const startX = Math.max(0, x);
        const startY = Math.max(0, y);
        const endX = Math.min(this.mapWidth - 1, x + width);
        const endY = Math.min(this.mapHeight - 1, y + height);

        for (let py = startY; py <= endY; py++) {
            for (let px = startX; px <= endX; px++) {
                if (this.checkCollision(px, py)) {
                    collisionPixels.push({x: px, y: py});
                }
            }
        }

        return collisionPixels;
    }

    /**
     * Add a parallax background layer
     * @param {string} imageSource - Path to layer image
     * @param {number} scrollSpeed - Layer scroll speed multiplier
     */
    addParallaxLayer(imageSource, scrollSpeed) {
        const layer = {
            image: new Image(),
            scrollSpeed: scrollSpeed,
            x: 0,
            y: 0
        };
        layer.image.src = imageSource;
        this.parallaxLayers.push(layer);
    }

    /**
     * Add an entity to the scene
     * @param {Entity} entity - Entity to add
     */
    addEntity(entity) {
        this.entities.add(entity);
    }

    /**
     * Remove an entity from the scene
     * @param {Entity} entity - Entity to remove
     */
    removeEntity(entity) {
        this.entities.delete(entity);
    }

    /**
     * Called when scene becomes active
     */
    onEnter() {
        this.isActive = true;
        // Initialize scene-specific elements
        for (const entity of this.entities) {
            if (entity.onSceneEnter) {
                entity.onSceneEnter();
            }
        }
    }

    /**
     * Called when scene becomes inactive
     */
    onExit() {
        this.isActive = false;
        // Clean up scene-specific elements
        for (const entity of this.entities) {
            if (entity.onSceneExit) {
                entity.onSceneExit();
            }
        }
    }

    /**
     * Update scene state
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.isActive || this.isPaused) return;

        // Update parallax layers
        for (const layer of this.parallaxLayers) {
            // Update layer positions based on camera movement
        }

        // Update all entities in the scene
        for (const entity of this.entities) {
            if (entity.active && entity.solid) {
                // Store old position for collision response
                const oldX = entity.x;
                const oldY = entity.y;

                // Update entity
                entity.update(deltaTime);
                
                // Get entity bounds
                const bounds = entity.collisionBounds;
                const entityLeft = entity.x + bounds.offset.x;
                const entityTop = entity.y + bounds.offset.y;

                // Check collision
                if (this.checkRectCollision(
                    entityLeft,
                    entityTop,
                    bounds.width,
                    bounds.height
                )) {
                    // Collision occurred, revert to old position
                    entity.x = oldX;
                    entity.y = oldY;

                    // Optional: Trigger collision event on entity
                    if (entity.onCollision) {
                        entity.onCollision();
                    }
                }
            } else if (entity.active) {
                // Update non-solid entities without collision
                entity.update(deltaTime);
            }
        }
    }

    /**
     * Store scene-specific data
     * @param {string} key - Data identifier
     * @param {any} value - Data to store
     */
    setSceneData(key, value) {
        this.sceneData.set(key, value);
    }

    /**
     * Retrieve scene-specific data
     * @param {string} key - Data identifier
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any}
     */
    getSceneData(key, defaultValue = null) {
        return this.sceneData.has(key) ? this.sceneData.get(key) : defaultValue;
    }

    /**
     * Pause the scene
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * Resume the scene
     */
    resume() {
        this.isPaused = false;
    }

    /**
     * Get entities by tag
     * @param {string} tag - Tag to search for
     * @returns {Array<Entity>}
     */
    getEntitiesByTag(tag) {
        return Array.from(this.entities).filter(entity => entity.hasTag(tag));
    }

    /**
     * Create and cache collision map visualization
     * @private
     */
    createCollisionMapCache() {
        if (!this.collisionData) return;

        // Create offscreen canvas for caching
        const canvas = document.createElement('canvas');
        canvas.width = this.mapWidth;
        canvas.height = this.mapHeight;
        const ctx = canvas.getContext('2d');

        // Draw collision data to canvas
        const imageData = ctx.createImageData(this.mapWidth, this.mapHeight);
        for (let i = 0; i < this.collisionData.length; i++) {
            if (this.collisionData[i]) {
                // Red
                imageData.data[i * 4] = 255;     // R
                imageData.data[i * 4 + 1] = 0;   // G
                imageData.data[i * 4 + 2] = 0;   // B
                imageData.data[i * 4 + 3] = 256; // A
            }
        }
        ctx.putImageData(imageData, 0, 0);
        
        // Store the cached collision map
        this.collisionMapCache = canvas;
    }

    /**
     * Render the collision map visualization
     * @param {CanvasRenderingContext2D} ctx 
     */
    renderCollisionMap(ctx) {
        if (!this.collisionData) return;

        // Create cache if it doesn't exist
        if (!this.collisionMapCache) {
            this.createCollisionMapCache();
        }

        // Draw cached collision map
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.drawImage(this.collisionMapCache, 0, 0);
        ctx.restore();
    }
}
