// scripts/ExampleScript.js
export default class ExampleScript {
    constructor(entity) {
        this.entity = entity;
    }

    async init() {
        // Called when script is attached
        // Can be async for loading resources

        // Bind render method to original entity
        this.entity.render = this.render.bind(this);
    }

    update(deltaTime) {
        // Called every frame while attached
    }

    render() {
        // Develope a custom render method here
        let ctx = window.mainCamera.ctx;
    }

    async onDetach() {
        // Called when script is detached
        // Clean up resources, event listeners, etc.
    }
}
