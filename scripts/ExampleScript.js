// scripts/ExampleScript.js
export default class ExampleScript {
    constructor(entity) {
        this.entity = entity;
    }

    async init() {
        // Called when script is attached
        // Can be async for loading resources
    }

    update(deltaTime) {
        // Called every frame while attached
    }

    async onDetach() {
        // Called when script is detached
        // Clean up resources, event listeners, etc.
    }
}
