// scripts/EnemyShooter.js
export default class EnemyShooter {
    constructor(entity) {
        this.entity = entity;
        this.x = entity.x;
        this.y = entity.y;
        this.rotation = 0;

        this.scale = {
            x: 1,
            y: 1,
        }
        this.collisionBounds = {
            offset: { x: -7.5, y: -7.5 },
            width: 15,
            height: 15,
        }

        this.target = null;
        
        this.shootTimer = 0;
        this.shootDelay = 3;

        this.pointerBounds = {
            offset: {
                x: 8,
                y: -2,
            },
            width: 8,
            height: 8,
        }

        
    }

    async init() {
        this.target = engine.currentScene.entities.values().next().value;
        this.entity.render = this.render.bind(this);

        const override = new Override(this.entity, this);
        override.replace('render', this.render);
    }

    update(deltaTime) {
        this.shootTimer += deltaTime;
        if(this.shootTimer >= this.shootDelay) {
            this.shoot();
            this.shootTimer = 0;
        }

        this.updateRotation();
    }

    shoot() {
        console.log(this.getPointerCenter());
    }

    updateRotation() {
        const deltaX = (this.target.x - this.target.collisionBounds.offset.x) - this.x;
        const deltaY = (this.target.y - this.target.collisionBounds.offset.y) - this.y;
    
        const angleRadians = Math.atan2(deltaY, deltaX);

        let angleDegrees = angleRadians * (180 / Math.PI);
        

        if (angleDegrees < 0) {
            angleDegrees += 360;
        }

        this.rotation = angleDegrees;
    }

    render() {
        let ctx = window.mainCamera.ctx;
        ctx.save();
        
        ctx.translate(this.x, this.y);
        
        ctx.rotate(this.rotation * Math.PI / 180);
        
        ctx.scale(this.scale.x, this.scale.y);

        ctx.fillStyle = 'red';
        
        ctx.fillRect(this.collisionBounds.offset.x, this.collisionBounds.offset.y, this.collisionBounds.width, this.collisionBounds.height);
        
        ctx.fillStyle = 'red';
        ctx.fillRect(this.pointerBounds.offset.x + this.pointerBounds.offset.x, this.pointerBounds.offset.y + this.pointerBounds.offset.y, this.pointerBounds.width, this.pointerBounds.height);

        ctx.restore();

        if (window.engine.debug.enabled) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.strokeStyle = 'purple';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(
                this.collisionBounds.offset.x,
                this.collisionBounds.offset.y,
                this.collisionBounds.width,
                this.collisionBounds.height
            );
            ctx.restore();
        }
    }

    getPointerCenter() {
        const relativeX = this.pointerBounds.offset.x + this.pointerBounds.offset.x + (this.pointerBounds.width / 2);
        const relativeY = this.pointerBounds.offset.y + this.pointerBounds.offset.y + (this.pointerBounds.height / 2);
        
        const rotationRad = this.rotation * Math.PI / 180;
        
        const rotatedX = relativeX * Math.cos(rotationRad) - relativeY * Math.sin(rotationRad);
        const rotatedY = relativeX * Math.sin(rotationRad) + relativeY * Math.cos(rotationRad);

        return {
            x: this.x + rotatedX,
            y: this.y + rotatedY,
            rotation: this.rotation
        };
    }

    async onDetach() {
        // Called when script is detached
        // Clean up resources, event listeners, etc.
    }
}
