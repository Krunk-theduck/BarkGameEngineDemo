/**
 * Debug system for Bark Engine
 */
class Debug {
    constructor() {
        // Debug state
        this.enabled = false;
        this.showFPS = true;
        this.showDelta = true;
        this.showEntityCount = true;
        this.pauseKey = 'F8';

        // Performance metrics
        this.metrics = {
            fps: 0,
            frameCount: 0,
            lastFpsUpdate: 0,
            fpsUpdateInterval: 500, // Update FPS display every 500ms
        };

        // Debug console properties
        this.console = {
            isOpen: false,
            searchTerm: '',
            selectedPath: [],
            expandedPaths: new Set(),
            minWidth: 300,
            maxWidth: 0,  // Will be calculated based on canvas position
            headerHeight: 30,
            itemHeight: 20,
            searchHeight: 30
        };

        // Initialize if debug is enabled
        if (this.enabled) {
            this.createDebugConsole();
        }

        // Track all engine-related objects
        this.trackedObjects = new Map();
        
        // Bind methods
        this.handleDebugKeys = this.handleDebugKeys.bind(this);
        this.toggleConsole = this.toggleConsole.bind(this);
        this.updateConsole = this.updateConsole.bind(this);
        this.handleSearch = this.handleSearch.bind(this);

        // Set up key listeners
        window.addEventListener('keydown', this.handleDebugKeys);
    }

    /**
     * Configure debug settings
     * @param {Object} options Debug options
     */
    configure(options = {}) {
        if (typeof options.showFPS === 'boolean') this.showFPS = options.showFPS;
        if (typeof options.showDelta === 'boolean') this.showDelta = options.showDelta;
        if (typeof options.showEntityCount === 'boolean') this.showEntityCount = options.showEntityCount;
        if (options.pauseKey) this.pauseKey = options.pauseKey;

        // Create console if it hasn't been created yet
        if (this.enabled && !this.consoleElement) {
            this.createDebugConsole();
        }
    }

    /**
     * Handle debug keyboard controls
     * @param {KeyboardEvent} event 
     */
    handleDebugKeys(event) {
        if (!this.enabled) return;

        if (event.key === this.pauseKey) {
            if (window.engine) {
                window.engine.togglePause();
            }
        }
    }

    /**
     * Update debug metrics
     * @param {number} currentTime Current timestamp
     */
    updateMetrics(currentTime) {
        if (!this.enabled) return;

        const metrics = this.metrics;
        metrics.frameCount++;

        // Update FPS counter every interval
        if (currentTime - metrics.lastFpsUpdate >= metrics.fpsUpdateInterval) {
            metrics.fps = Math.round((metrics.frameCount * 1000) / (currentTime - metrics.lastFpsUpdate));
            metrics.frameCount = 0;
            metrics.lastFpsUpdate = currentTime;
        }
    }

    /**
     * Render debug information
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Engine} engine 
     */
    render(ctx, engine) {
        if (!this.enabled) return;

        const metrics = this.metrics;
        const padding = 10;
        let yPos = padding;
        
        // Save context state
        ctx.save();
        
        // Set up debug text style
        ctx.font = '14px monospace';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;

        // Helper function to draw outlined text
        const drawText = (text, y) => {
            ctx.strokeText(text, padding, y);
            ctx.fillText(text, padding, y);
            return y + 20; // Return next line position
        };

        // Draw metrics
        if (this.showFPS) {
            yPos = drawText(`FPS: ${metrics.fps}`, yPos);
        }
        if (this.showDelta) {
            yPos = drawText(`Delta: ${(engine.deltaTime * 1000).toFixed(2)}ms`, yPos);
        }
        if (this.showEntityCount && engine.currentScene) {
            yPos = drawText(`Entities: ${engine.currentScene.entities.size}`, yPos);
        }

        // Draw pause indicator if paused
        if (!engine.isRunning) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            drawText('PAUSED', yPos);
        }

        // Restore context state
        ctx.restore();
    }

    /**
     * Create debug console DOM elements
     */
    createDebugConsole() {
        // Calculate maximum width based on canvas position
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            const containerRect = gameContainer.getBoundingClientRect();
            this.console.maxWidth = containerRect.left - 20; // 20px buffer
        } else {
            this.console.maxWidth = window.innerWidth / 2;
        }

        // Create container
        this.consoleElement = document.createElement('div');
        this.consoleElement.className = 'debug-console';
        this.consoleElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: ${this.console.minWidth}px;
            height: 100vh;
            background: #1a1a1a;
            color: #e0e0e0;
            font-family: 'Consolas', monospace;
            font-size: 12px;
            transform: translateX(-100%);
            transition: transform 0.3s, width 0.3s;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            border-right: 1px solid #333;
            box-shadow: 2px 0 5px rgba(0,0,0,0.3);
        `;

        // Create toggle button
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'debug-console-toggle';
        this.toggleButton.innerHTML = `
            <div class="toggle-content" style="color: #e0e0e0;">
                <span class="toggle-arrow" style="color: #2ecc71;">▶</span>
                <div class="toggle-text-container">
                    <span class="toggle-text" style="color: #2ecc71;">BARK ENGINE</span>
                    <span class="toggle-subtext" style="color: #888;">Debug Console</span>
                </div>
            </div>
        `;
        this.toggleButton.style.cssText = `
            position: absolute;
            right: -120px;
            top: 20px;
            width: 120px;
            height: 60px;
            background: #1a1a1a;
            border: none;
            border-radius: 0 8px 8px 0;
            cursor: pointer;
            padding: 0;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-left: 3px solid #2ecc71;
            z-index: 999;
        `;

        // Add hover effect for toggle button
        this.toggleButton.addEventListener('mouseenter', () => {
            this.toggleButton.style.backgroundColor = '#333';
        });
        this.toggleButton.addEventListener('mouseleave', () => {
            this.toggleButton.style.backgroundColor = '#1a1a1a';
        });
        const style = document.createElement('style');
        // Add to style element
        style.textContent += `
            .debug-console-toggle .toggle-content {
                display: flex;
                align-items: center;
                justify-content: flex-start;
                gap: 12px;
                color: #e0e0e0;
                height: 100%;
                padding: 0 12px;
            }

            .debug-console-toggle .toggle-text-container {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 2px;
            }

            .debug-console-toggle .toggle-text {
                font-family: 'Arial Black', sans-serif;
                font-size: 14px;
                font-weight: 900;
                letter-spacing: 1px;
                color: #2ecc71;
                text-shadow: 0 0 10px rgba(46, 204, 113, 0.3);
            }

            .debug-console-toggle .toggle-subtext {
                font-family: Arial, sans-serif;
                font-size: 11px;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .debug-console-toggle .toggle-arrow {
                font-size: 18px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                color: #2ecc71;
            }

            .debug-console-toggle:hover {
                background: #2a2a2a;
                transform: translateX(-5px);
                box-shadow: 5px 0 15px rgba(0, 0, 0, 0.4);
            }

            .debug-console-toggle:hover .toggle-arrow {
                transform: translateX(-5px);
            }

            .debug-console-toggle.open {
                right: 0;
                border-radius: 0;
                width: 100px;
            }

            .debug-console-toggle.open:hover {
                transform: none;
            }

            .debug-console-toggle.open .toggle-text-container {
                display: none;
            }

            .debug-console-toggle.open .toggle-arrow {
                transform: rotate(180deg);
            }

            @keyframes pulseGlow {
                0% { box-shadow: 2px 0 10px rgba(46, 204, 113, 0.3); }
                50% { box-shadow: 2px 0 20px rgba(46, 204, 113, 0.5); }
                100% { box-shadow: 2px 0 10px rgba(46, 204, 113, 0.3); }
            }

            .debug-console-toggle:not(.open) {
                animation: pulseGlow 2s infinite;
            }
        `;

        // Create search input
        this.searchInput = document.createElement('input');
        this.searchInput.className = 'debug-console-search';
        this.searchInput.placeholder = 'Search objects...';
        this.searchInput.style.cssText = `
            width: 100%;
            height: ${this.console.searchHeight}px;
            background: #2a2a2a;
            color: #e0e0e0;
            border: none;
            border-bottom: 1px solid #333;
            padding: 5px 10px;
            outline: none;
            font-family: inherit;
            font-size: inherit;
        `;

        // Create content container
        this.contentContainer = document.createElement('div');
        this.contentContainer.className = 'debug-console-content';
        this.contentContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            background: #1a1a1a;
        `;

        // Add custom scrollbar styles
        style.textContent = `
            .debug-console-content::-webkit-scrollbar {
                width: 8px;
            }
            .debug-console-content::-webkit-scrollbar-track {
                background: #1a1a1a;
            }
            .debug-console-content::-webkit-scrollbar-thumb {
                background: #333;
                border-radius: 4px;
            }
            .debug-console-content::-webkit-scrollbar-thumb:hover {
                background: #444;
            }
            .debug-value {
                padding: 2px 0;
                cursor: default;
            }
            .debug-value .arrow {
                cursor: pointer;
                color: #666;
                padding: 0 4px;
                display: inline-block;
                transition: color 0.2s;
            }
            .debug-value .arrow:hover {
                color: #fff;
            }
            .debug-value .key {
                color: #88c4ff;
            }
            .debug-value .type {
                color: #666;
                margin-left: 4px;
            }
            .debug-value input {
                background: #2a2a2a;
                color: #e0e0e0;
                border: 1px solid #333;
                padding: 1px 4px;
                margin-left: 4px;
                border-radius: 2px;
            }
            .debug-value input:focus {
                outline: none;
                border-color: #4a4a4a;
            }
            .debug-boolean-control {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                margin-left: 8px;
            }
            .debug-bool-btn {
                padding: 2px 8px;
                border: none;
                border-radius: 12px;
                font-size: 11px;
                cursor: pointer;
                transition: all 0.2s ease;
                opacity: 0.5;
            }
            .debug-bool-btn.selected {
                opacity: 1;
            }
            .debug-bool-btn.true {
                background-color: #2ecc71;
                color: white;
            }
            .debug-bool-btn.true:hover {
                background-color: #27ae60;
            }
            .debug-bool-btn.false {
                background-color: #e74c3c;
                color: white;
            }
            .debug-bool-btn.false:hover {
                background-color: #c0392b;
            }
            .debug-bool-separator {
                color: #666;
                font-size: 12px;
                padding: 0 2px;
            }
            .debug-number-control {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                margin-left: 8px;
            }

            .debug-number-input {
                width: 60px;
                padding: 2px 6px;
                border: 1px solid #444;
                border-radius: 4px;
                background: #2a2a2a;
                color: #fff;
                font-size: 12px;
                font-family: monospace;
            }

            .debug-number-input:focus {
                outline: none;
                border-color: #666;
                background: #333;
            }

            .debug-number-buttons {
                display: flex;
                flex-direction: column;
                gap: 1px;
            }

            .debug-number-btn {
                padding: 0;
                width: 16px;
                height: 12px;
                border: none;
                background: #444;
                color: #fff;
                font-size: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }

            .debug-number-btn:hover {
                background: #555;
            }

            .debug-number-btn:active {
                background: #666;
            }

            .debug-number-btn.up {
                border-radius: 2px 2px 0 0;
            }

            .debug-number-btn.down {
                border-radius: 0 0 2px 2px;
            }

            .debug-power-btn {
                width: 30px;
                height: 30px;
                border: 2px solid #444;
                border-radius: 50%;
                background: #2a2a2a;
                color: #e0e0e0;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: all 0.3s ease;
                padding: 0;
                outline: none;
            }

            .debug-power-btn:hover {
                border-color: #666;
                transform: scale(1.05);
            }

            .debug-power-btn.active {
                border-color: #2ecc71;
                color: #2ecc71;
                box-shadow: 0 0 10px rgba(46, 204, 113, 0.3);
            }

            .debug-power-btn:active {
                transform: scale(0.95);
            }

            .debug-toggle-section {
                margin-bottom: 10px;
                background: #1f1f1f;
            }
        `;
        document.head.appendChild(style);

        // Create header container
        const headerContainer = document.createElement('div');
        headerContainer.className = 'debug-console-header';
        headerContainer.style.cssText = `
            height: ${this.console.headerHeight}px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px;
            background: #1a1a1a;
            border-bottom: 1px solid #333;
        `;

        // Create header title
        const headerTitle = document.createElement('span');
        headerTitle.textContent = 'Debug Console';
        headerTitle.style.cssText = `
            color: #e0e0e0;
            font-size: 12px;
            font-weight: bold;
        `;

        // Create refresh button
        const refreshButton = document.createElement('button');
        refreshButton.className = 'debug-refresh-btn';
        refreshButton.innerHTML = '⟳';  // Unicode refresh symbol
        refreshButton.title = 'Refresh Debug Console';
        refreshButton.style.cssText = `
            width: 24px;
            height: 24px;
            border: none;
            border-radius: 4px;
            background: #2a2a2a;
            color: #e0e0e0;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: all 0.2s ease;
            padding: 0;
            margin-left: auto;
        `;

        // Add hover and active states to the style element
        style.textContent += `
            .debug-refresh-btn:hover {
                background: #3a3a3a;
                transform: rotate(30deg);
            }
            
            .debug-refresh-btn:active {
                background: #444;
                transform: rotate(180deg);
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .debug-refresh-btn.spinning {
                animation: spin 0.5s ease;
                pointer-events: none;
                opacity: 0.7;
            }
        `;

        // Add click handler with animation
        refreshButton.addEventListener('click', () => {
            refreshButton.classList.add('spinning');
            this.updateConsole();
            setTimeout(() => {
                refreshButton.classList.remove('spinning');
            }, 500);
        });

        // Add elements to header
        headerContainer.appendChild(headerTitle);
        headerContainer.appendChild(refreshButton);

        // Assemble console (update the assembly order)
        this.consoleElement.appendChild(this.toggleButton);
        this.consoleElement.appendChild(headerContainer);
        this.consoleElement.appendChild(this.searchInput);
        this.consoleElement.appendChild(this.contentContainer);
        document.body.appendChild(this.consoleElement);

        // Add event listeners with proper binding
        this.toggleButton.addEventListener('click', () => this.toggleConsole());
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));

        // Initial tracking of engine objects
        if (window.engine) {
            this.trackObject('engine', window.engine);
            if (window.engine.currentScene) {
                this.trackObject('scene', window.engine.currentScene);
            }
            if (window.mainCamera) {
                this.trackObject('camera', window.mainCamera);
            }
        }

        this.updateConsole();
    }

    /**
     * Toggle debug console visibility
     */
    toggleConsole() {
        this.console.isOpen = !this.console.isOpen;
        this.consoleElement.style.transform = this.console.isOpen ? 'translateX(0)' : 'translateX(-100%)';
        this.consoleElement.style.width = this.console.isOpen ? 
            `${Math.min(this.console.maxWidth, window.innerWidth - 20)}px` : 
            `${this.console.minWidth}px`;
        
        // Update toggle button state
        this.toggleButton.classList.toggle('open');
        const arrow = this.toggleButton.querySelector('.toggle-arrow');
        arrow.textContent = this.console.isOpen ? '◀' : '▶';
        
        this.updateConsole();
    }

    /**
     * Handle search input
     * @param {Event} event 
     */
    handleSearch(event) {
        this.console.searchTerm = event.target.value.toLowerCase();
        this.updateConsole();
    }

    /**
     * Track an object in the debug console
     * @param {string} key 
     * @param {any} object 
     */
    trackObject(key, object) {
        this.trackedObjects.set(key, object);
        this.updateConsole();
    }

    /**
     * Get the full path for a tracked object
     * @param {string} path 
     * @returns {any}
     */
    getValueFromPath(path) {
        const parts = path.split('.');
        const root = this.trackedObjects.get(parts[0]);
        
        if (parts.length === 1) return root;
        
        let current = root;
        for (let i = 1; i < parts.length; i++) {
            if (!current || typeof current !== 'object') return undefined;
            current = current[parts[i]];
        }
        return current;
    }

    /**
     * Create an interactive element for a value
     * @param {any} value 
     * @param {string} path 
     * @returns {HTMLElement}
     */
    createValueElement(value, path) {
        const element = document.createElement('div');
        element.className = 'debug-value';
        
        if (typeof value === 'object' && value !== null) {
            // Handle special cases like Sets, Maps, and other collections
            if (value instanceof Set || value instanceof Map) {
                const entries = value instanceof Set ? 
                    Array.from(value) : 
                    Array.from(value.entries());
                value = entries.length ? Object.fromEntries(
                    entries.map((entry, i) => {
                        if (value instanceof Set) {
                            return [i, entry];
                        }
                        return entry;
                    })
                ) : {};
            }

            // Check if object is empty
            const isEmpty = Object.keys(value).length === 0;
            const keyName = path.split('.').pop();
            
            if (isEmpty) {
                // Display empty objects/arrays without arrow
                element.innerHTML = `
                    <span class="key">${keyName}</span>
                    <span class="type">${this.getTypeString(value)} (EMPTY)</span>
                `;
            } else {
                // Object has properties, show expandable arrow
                const isExpanded = this.console.expandedPaths.has(path);
                const arrow = isExpanded ? '▼' : '▶';
                
                const arrowSpan = document.createElement('span');
                arrowSpan.className = 'arrow';
                arrowSpan.textContent = arrow;
                
                const keySpan = document.createElement('span');
                keySpan.className = 'key';
                keySpan.textContent = keyName;
                
                const typeSpan = document.createElement('span');
                typeSpan.className = 'type';
                typeSpan.textContent = this.getTypeString(value);
                
                element.appendChild(arrowSpan);
                element.appendChild(keySpan);
                element.appendChild(typeSpan);
                
                // Only make arrow clickable
                arrowSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.console.expandedPaths.has(path)) {
                        this.console.expandedPaths.delete(path);
                    } else {
                        this.console.expandedPaths.add(path);
                    }
                    this.updateConsole();
                });

                if (isExpanded) {
                    const childContainer = document.createElement('div');
                    childContainer.style.marginLeft = '20px';
                    
                    Object.entries(value).forEach(([key, childValue]) => {
                        const childPath = path ? `${path}.${key}` : key;
                        childContainer.appendChild(this.createValueElement(childValue, childPath));
                    });
                    
                    element.appendChild(childContainer);
                }
            }
        } else {
            // Handle primitive values
            const keyName = path.split('.').pop();
            element.innerHTML = `<span class="key">${keyName}</span>: `;
            
            if (typeof value === 'function') {
                // Show functions as non-editable
                const typeSpan = document.createElement('span');
                typeSpan.className = 'type';
                typeSpan.textContent = 'Function';
                element.appendChild(typeSpan);
            } else if (typeof value === 'boolean') {
                const booleanControl = document.createElement('div');
                booleanControl.className = 'debug-boolean-control';
                
                const trueButton = document.createElement('button');
                trueButton.className = `debug-bool-btn true ${value ? 'selected' : ''}`;
                trueButton.textContent = 'True';
                
                const separator = document.createElement('span');
                separator.className = 'debug-bool-separator';
                separator.textContent = '/';
                
                const falseButton = document.createElement('button');
                falseButton.className = `debug-bool-btn false ${!value ? 'selected' : ''}`;
                falseButton.textContent = 'False';
                
                const updateValue = (newValue) => {
                    try {
                        const pathParts = path.split('.');
                        const rootKey = pathParts[0];
                        
                        // Get the root object
                        let targetObject = this.trackedObjects.get(rootKey);
                        console.log('Root object for', rootKey, ':', targetObject);
                        
                        // For direct properties of tracked objects
                        if (pathParts.length === 2) {
                            const prop = pathParts[1];
                            targetObject[prop] = newValue;
                            return true;
                        }
                        
                        // For nested properties
                        let current = targetObject;
                        for (let i = 1; i < pathParts.length - 1; i++) {
                            console.log('Navigating to', pathParts[i], 'Current:', current);
                            
                            if (!current) {
                                console.warn('Path broken at', pathParts[i]);
                                return false;
                            }

                            // Handle Sets specially
                            if (current instanceof Set) {
                                // Convert numeric index to Array access for Sets
                                const index = parseInt(pathParts[i]);
                                if (!isNaN(index)) {
                                    current = Array.from(current)[index];
                                    console.log('Accessed Set element:', current);
                                    continue;
                                }
                            }
                            
                            // Handle Maps specially
                            if (current instanceof Map) {
                                current = current.get(pathParts[i]);
                                continue;
                            }
                            
                            // Regular object property access
                            current = current[pathParts[i]];
                        }
                        
                        const finalProp = pathParts[pathParts.length - 1];
                        console.log('Final property:', finalProp, 'Current object:', current);
                        
                        if (current && (finalProp in current || current instanceof Map)) {
                            if (current instanceof Map) {
                                current.set(finalProp, newValue);
                            } else {
                                current[finalProp] = newValue;
                            }
                            return true;
                        } else {
                            console.warn(`Property ${finalProp} not found in`, current);
                            return false;
                        }
                    } catch (err) {
                        console.error('Error updating value:', err);
                        return false;
                    }
                };
                
                trueButton.addEventListener('click', () => {
                    if (!value && updateValue(true)) {
                        trueButton.classList.add('selected');
                        falseButton.classList.remove('selected');
                        value = true;
                    }
                });
                
                falseButton.addEventListener('click', () => {
                    if (value && updateValue(false)) {
                        falseButton.classList.add('selected');
                        trueButton.classList.remove('selected');
                        value = false;
                    }
                });
                
                booleanControl.appendChild(trueButton);
                booleanControl.appendChild(separator);
                booleanControl.appendChild(falseButton);
                element.appendChild(booleanControl);
            } else if (typeof value === 'number') {
                const numberControl = document.createElement('div');
                numberControl.className = 'debug-number-control';
                
                // Create number input
                const input = document.createElement('input');
                input.type = 'text';  // Using text instead of number for better control
                input.className = 'debug-number-input';
                input.value = value;
                
                // Create increment/decrement buttons container
                const buttons = document.createElement('div');
                buttons.className = 'debug-number-buttons';
                
                const upButton = document.createElement('button');
                upButton.className = 'debug-number-btn up';
                upButton.innerHTML = '▲';
                
                const downButton = document.createElement('button');
                downButton.className = 'debug-number-btn down';
                downButton.innerHTML = '▼';
                
                // Update function (using the same pattern as our boolean updater)
                const updateValue = (newValue) => {
                    try {
                        const pathParts = path.split('.');
                        const rootKey = pathParts[0];
                        
                        // Get the root object
                        let targetObject = this.trackedObjects.get(rootKey);
                        console.log('Root object for', rootKey, ':', targetObject);
                        
                        // For direct properties of tracked objects
                        if (pathParts.length === 2) {
                            const prop = pathParts[1];
                            targetObject[prop] = newValue;
                            return true;
                        }
                        
                        // For nested properties
                        let current = targetObject;
                        for (let i = 1; i < pathParts.length - 1; i++) {
                            if (current instanceof Set) {
                                const index = parseInt(pathParts[i]);
                                if (!isNaN(index)) {
                                    current = Array.from(current)[index];
                                    continue;
                                }
                            }
                            
                            if (current instanceof Map) {
                                current = current.get(pathParts[i]);
                                continue;
                            }
                            
                            current = current[pathParts[i]];
                            if (!current) {
                                console.warn('Path broken at', pathParts[i]);
                                return false;
                            }
                        }
                        
                        const finalProp = pathParts[pathParts.length - 1];
                        if (current && (finalProp in current)) {
                            current[finalProp] = newValue;
                            return true;
                        } else {
                            console.warn(`Property ${finalProp} not found in`, current);
                            return false;
                        }
                    } catch (err) {
                        console.error('Error updating value:', err);
                        return false;
                    }
                };
                
                // Input handling
                input.addEventListener('blur', () => {
                    const num = parseFloat(input.value);
                    if (!isNaN(num)) {
                        if (updateValue(num)) {
                            value = num;
                        } else {
                            input.value = value; // Reset to original if update failed
                        }
                    } else {
                        input.value = value; // Reset to original if invalid number
                    }
                });
                
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        input.blur();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        input.value = value;
                        input.blur();
                    }
                });
                
                // Button handling
                upButton.addEventListener('click', () => {
                    const currentValue = parseFloat(input.value);
                    if (!isNaN(currentValue)) {
                        if (updateValue(currentValue + 1)) {
                            input.value = currentValue + 1;
                            value = currentValue + 1;
                        }
                    }
                });
                
                downButton.addEventListener('click', () => {
                    const currentValue = parseFloat(input.value);
                    if (!isNaN(currentValue)) {
                        if (updateValue(currentValue - 1)) {
                            input.value = currentValue - 1;
                            value = currentValue - 1;
                        }
                    }
                });
                
                buttons.appendChild(upButton);
                buttons.appendChild(downButton);
                numberControl.appendChild(input);
                numberControl.appendChild(buttons);
                element.appendChild(numberControl);
            } else {
                // Create editable input for primitive values
                const valueElement = document.createElement('input');
                valueElement.value = value;
                valueElement.style.cssText = `
                    background: #2a2a2a;
                    color: #e0e0e0;
                    border: 1px solid #333;
                    padding: 1px 4px;
                    margin-left: 4px;
                    border-radius: 2px;
                    width: 100px;
                `;
                
                valueElement.addEventListener('change', () => {
                    const pathParts = path.split('.');
                    let current = this.trackedObjects.get(pathParts[0]);
                    for (let i = 1; i < pathParts.length - 1; i++) {
                        current = current[pathParts[i]];
                    }
                    current[pathParts[pathParts.length - 1]] = this.parseValue(valueElement.value);
                });

                element.appendChild(valueElement);
            }
        }

        return element;
    }

    /**
     * Get readable type string for a value
     * @param {any} value 
     * @returns {string}
     */
    getTypeString(value) {
        if (Array.isArray(value)) return 'Array';
        if (value instanceof Set) return 'Set';
        if (value instanceof Map) return 'Map';
        if (value instanceof Date) return 'Date';
        if (value instanceof RegExp) return 'RegExp';
        if (value instanceof Promise) return 'Promise';
        if (value instanceof Error) return 'Error';
        if (value instanceof WeakMap) return 'WeakMap';
        if (value instanceof WeakSet) return 'WeakSet';
        return 'Object';
    }

    /**
     * Parse string value to appropriate type
     * @param {string} value 
     * @returns {any}
     */
    parseValue(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null') return null;
        if (value === 'undefined') return undefined;
        const num = Number(value);
        return isNaN(num) ? value : num;
    }

    /**
     * Update debug console content
     */
    updateConsole() {
        if (!this.console.isOpen) return;

        this.contentContainer.innerHTML = '';
        
        // Add debug mode toggle section
        const toggleSection = document.createElement('div');
        toggleSection.className = 'debug-toggle-section';
        toggleSection.style.cssText = `
            padding: 10px;
            border-bottom: 1px solid #333;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        // Create power button
        const powerButton = document.createElement('button');
        powerButton.className = `debug-power-btn ${this.enabled ? 'active' : ''}`;
        powerButton.innerHTML = '⭘'; // Unicode power symbol
        powerButton.title = `${this.enabled ? 'Disable' : 'Enable'} Debug Mode`;
        
        // Add click handler
        powerButton.addEventListener('click', () => {
            this.setEnabled(!this.enabled);
            powerButton.classList.toggle('active');
            powerButton.title = `${this.enabled ? 'Disable' : 'Enable'} Debug Mode`;
            this.updateConsole();
        });

        // Add status text
        const statusText = document.createElement('span');
        statusText.textContent = `Debug Mode: ${this.enabled ? 'Active' : 'Inactive'}`;
        statusText.style.cssText = `
            color: ${this.enabled ? '#2ecc71' : '#e74c3c'};
            font-size: 12px;
            font-weight: bold;
        `;

        toggleSection.appendChild(powerButton);
        toggleSection.appendChild(statusText);
        this.contentContainer.appendChild(toggleSection);
        
        // Only show tracked objects if debug mode is enabled
        if (this.enabled) {
            for (const [name, object] of this.trackedObjects) {
                if (this.console.searchTerm && 
                    !name.toLowerCase().includes(this.console.searchTerm)) {
                    continue;
                }

                const element = this.createValueElement(object, name);
                element.style.marginBottom = '5px';
                this.contentContainer.appendChild(element);
            }
        }
    }

    /**
     * Enable or disable debug mode
     * @param {boolean} enabled 
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled && !this.consoleElement) {
            this.createDebugConsole();
        }
    }
} 