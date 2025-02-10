/**
 * Core Engine class that manages the game loop, entities, and scenes
 */
class Engine {
    constructor() {
        // Singleton instance check
        if (Engine.instance) {
            return Engine.instance;
        }
        Engine.instance = this;

        // Core properties
        this.entities = new Map();
        this.scenes = new Map();
        this.currentScene = null;
        this.isRunning = true;
        this.lastFrameTime = 0;
        this.deltaTime = 0;

        // Debug properties
        this.debug = new Debug();

        // Resource management
        this.resources = new Map();
        
        // Initialize core systems
        this.initializeSystems();
        
        // Script system
        this.scripts = new Map(); // Registered script classes
        this.scriptCache = new Map(); // Cached script modules
        
        // Register engine components with debug console
        if (this.debug) {
            this.debug.trackObject('engine', this);
            this.debug.trackObject('scene', this.currentScene);
            this.debug.trackObject('camera', window.mainCamera);
            
            // Track collections separately for better visibility
            if (this.currentScene) {
                this.debug.trackObject('entities', this.currentScene.entities);
                this.debug.trackObject('resources', this.resources);
            }
        }
    }

    /**
     * Dynamically load and register a script
     * @param {string} scriptName Name of the script to load (without .js extension)
     * @returns {Promise<boolean>} Success state of loading
     */
    async loadScript(scriptName) {
        try {
            // Check if already loaded
            if (this.scripts.has(scriptName)) {
                console.log(`Script ${scriptName} is already loaded`);
                return true;
            }

            // Dynamically import the script module
            const scriptModule = await import(`../scripts/${scriptName}.js`);
            
            // Store in cache and register
            this.scriptCache.set(scriptName, scriptModule);
            if (scriptModule.default) {
                this.scripts.set(scriptName, scriptModule.default);
                console.log(`Successfully loaded script: ${scriptName}`);
                return true;
            } else {
                console.error(`Script ${scriptName} has no default export`);
                return false;
            }
        } catch (error) {
            console.error(`Failed to load script ${scriptName}:`, error);
            return false;
        }
    }

    /**
     * Unload a script from the engine
     * @param {string} scriptName Name of script to unload
     */
    unloadScript(scriptName) {
        // Remove from registries
        this.scripts.delete(scriptName);
        this.scriptCache.delete(scriptName);

        // Find all entities using this script and detach it
        if (this.currentScene) {
            for (const entity of this.currentScene.entities) {
                if (entity.scripts?.has(scriptName)) {
                    entity.detachScript(scriptName);
                }
            }
        }
    }

    /**
     * Check if a script is loaded
     * @param {string} scriptName Name of script to check
     * @returns {boolean}
     */
    isScriptLoaded(scriptName) {
        return this.scripts.has(scriptName);
    }

    /**
     * Initialize core engine systems
     */
    async initializeSystems() {
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleDebugKeys = this.handleDebugKeys.bind(this);

        // Set up debug key listeners if debug is enabled
        window.addEventListener('keydown', this.handleDebugKeys);

        // Start the game Loop
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Enable or disable debug mode
     * @param {boolean} enabled Whether debug mode should be enabled
     * @param {Object} options Debug options
     */
    setDebug(enabled, options = {}) {
        this.debug.setEnabled(enabled);
        this.debug.configure(options);
    }

    /**
     * Handle debug keyboard controls
     * @param {KeyboardEvent} event 
     */
    handleDebugKeys(event) {
        if (!this.debug.enabled) return;

        if (event.key === this.debug.pauseKey) {
            this.isRunning = !this.isRunning;
            if (this.isRunning) {
                this.lastFrameTime = performance.now();
                requestAnimationFrame(this.gameLoop);
            }
        }
    }

    /**
     * Main game loop
     * @param {number} currentTime Current timestamp
     */
    gameLoop(currentTime) {
        currentTime = performance.now();
        // Calculate delta time first
        this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        // Update debug metrics
        if (this.debug.enabled) {
            this.debug.updateMetrics(currentTime, this.deltaTime);
        }
        
        if (!this.isRunning) {
            this.debug.render(window.mainCamera.ctx, this);
            return;
        }

        // Update current scene and entities
        this.update();

        // Render debug overlay last
        this.debug.render(window.mainCamera.ctx, this);

        // Request next frame
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Update game state
     */
    update() {
        if (!this.currentScene) return;

        // Update scene
        this.currentScene.update(this.deltaTime);

        // Update and render all cameras
        // For now, we'll just use the main camera
        if (window.mainCamera) {
            window.mainCamera.update();
            window.mainCamera.render(this.currentScene, this);
        }
    }

    /**
     * Add an entity to the engine
     * @param {string} id - Unique identifier for the entity
     * @param {Object} entity - Entity instance to add
     */
    addEntity(id, entity) {
        if (!this.entities.has(id)) {
            this.entities.set(id, entity);
            if (this.currentScene) {
                this.currentScene.onEntityAdded(entity);
            }
        }
    }

    /**
     * Remove an entity from the engine
     * @param {string} id - Entity identifier to remove
     */
    removeEntity(id) {
        if (this.entities.has(id)) {
            const entity = this.entities.get(id);
            if (this.currentScene) {
                this.currentScene.onEntityRemoved(entity);
            }
            this.entities.delete(id);
        }
    }

    /**
     * Add a scene to the engine
     * @param {string} id - Unique identifier for the scene
     * @param {Object} scene - Scene instance to add
     */
    addScene(id, scene) {
        this.scenes.set(id, scene);
    }

    /**
     * Load and set the current scene
     * @param {string} id - Identifier of the scene to load
     */
    loadScene(id) {
        if (this.scenes.has(id)) {
            // Clean up current scene if it exists
            if (this.currentScene) {
                this.currentScene.onExit();
            }

            // Set and initialize new scene
            this.currentScene = this.scenes.get(id);
            this.currentScene.onEnter();
        }
    }

    /**
     * Get the current delta time
     * @returns {number} Delta time in seconds
     */
    getDeltaTime() {
        return this.deltaTime;
    }

    /**
     * Get an entity by ID
     * @param {string} id - Entity identifier
     * @returns {Object|null} Entity instance or null if not found
     */
    getEntity(id) {
        return this.entities.get(id) || null;
    }

    /**
     * Start the engine
     */
    start() {
        console.log('Bark Engine started successfully');
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Pause/Unpause the engine
     */
    togglePause() {
        this.isRunning = !this.isRunning;
        if (this.isRunning) {
            this.lastFrameTime = performance.now();
            requestAnimationFrame(this.gameLoop);
        }
    }

    /**
     * Get the override class
     * @returns {Override}
     */
    getOverride() {
        return Override;
    }
}

const Override = class {
    constructor(entity, instance) {
        this.entity = entity;
        this.instance = instance;
    }

    getFunctionByName(functionName) {
        if (!this.entity || typeof functionName !== 'string') {
            return null;
        }

        const fn = this.entity[functionName];
        if (typeof fn === 'function') {
            return fn.bind(this.entity);
        }

    return null;
    }

    /**
     * Adds a function to run before the original entity function
     * @param {string} functionName - Name of the function to modify
     * @param {Function} fn - Function to run before
     * @returns {boolean} Success status of the operation
     */
    before(functionName, fn) {
        const originalFn = this.getFunctionByName(functionName);
        if (!originalFn) {
            return false;
        }

        const boundNewFn = fn.bind(this.instance);
        
        this.entity[functionName] = function(...args) {
            boundNewFn.apply(this.instance, args);
            return originalFn.apply(this.instance, args);
        }.bind(this.entity);

        return true;
    }

    /**
     * Replaces the original entity function
     * @param {string} functionName - Name of the function to replace
     * @param {Function} fn - Function to replace with
     * @returns {boolean} Success status of the operation
     */
    replace(functionName, fn) {
        console.log('replace', functionName, fn);
        const originalFn = this.getFunctionByName(functionName);
        if (!originalFn) {
            return false;
        }

        this.entity[functionName] = fn.bind(this.instance);
        return true;
    }

    /**
     * Adds a function to run after the original entity function
     * @param {string} functionName - Name of the function to modify
     * @param {Function} fn - Function to run after
     * @returns {boolean} Success status of the operation
     */
    after(functionName, fn) {
        const originalFn = this.getFunctionByName(functionName);
        if (!originalFn) {
            return false;
        }

        const boundNewFn = fn.bind(this.instance);
        
        this.entity[functionName] = function(...args) {
            const result = originalFn.apply(this.instance, args);
            boundNewFn.apply(this.instance, args);
            return result;
        }.bind(this.entity);

        return true;
    }

    /**
     * @deprecated Use before(), after(), or replace() instead
     */
    modifyEntityFunction(functionName, type, newFn) {
        if (type === 'before') {
            return this.before(functionName, newFn);
        } else if (type === 'after') {
            return this.after(functionName, newFn);
        } else if (type === 'replace') {
            return this.replace(functionName, newFn);
        }
        return false;
    }

}