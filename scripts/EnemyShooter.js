// scripts/EnemyShooter.js
export default class EnemyShooter {
    constructor(entity, x, y) {
        this.entity = entity;
        this.x = x;
        this.y = y;
        this.rotation = 0;

        this.target = null;
        
        this.shootTimer = 0;
        this.shootDelay = 1000;
    }

    async init() {
        this.target = engine.currentScene.entities.values().next().value;
    }

    update(deltaTime) {
        this.shootTimer += deltaTime;
        if(this.shootTimer >= this.shootDelay) {
            this.shoot();
            shootTimer = 0;
        }

        this.updateRotation();
    }

    shoot() {
        console.log("pew");
    }

    updateRotation() {
        const deltaX = (this.target.x + this.target.collisionBounds.offset.x) - this.x;
        const deltaY = (this.target.y + this.target.collisionBounds.offset.y) - this.y;
        
        // Calculate the angle in radians
        const angleRadians = Math.atan2(deltaY, deltaX);
        
        // Convert the angle to degrees (optional)
        let angleDegrees = angleRadians * (180 / Math.PI);
        
        // Normalize the angle to [0, 360] degrees if needed
        if (angleDegrees < 0) {
            angleDegrees += 360;
        }

        this.rotation = angleDegrees;
    }

    render(ctx) {
        ctx.save();
        
        // Position and transform
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale.x, this.scale.y);

        // Draw player (blue rectangle with direction indicator)
        ctx.fillStyle = '#0088ff';
        ctx.fillRect(-16, -16, 32, 32);
        
        // Direction indicator (front of player)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, -8, 16, 16);

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

    async onDetach() {
        // Called when script is detached
        // Clean up resources, event listeners, etc.
    }
}
