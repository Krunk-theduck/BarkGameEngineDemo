// scripts/EnemyShooter.js
import Projectile from './Projectile.js';

export default class EnemyShooter {
    constructor(entity) {
        this.entity = entity;
        this.x = entity.x;
        this.y = entity.y;

        this.scale = {
            x: 1,
            y: 1,
        }
        this.collisionBounds = {
            offset: { x: -16, y: -16 },  // Center the collision box
            width: 32,
            height: 32
        };
        this.entity.setCollisionBounds(this.collisionBounds);

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

        /*
        const override = new Override(this.entity, this);
        override.replace('render', this.render);
        */
    }

    update(deltaTime) {
        
        this.shootTimer += deltaTime;
        if(this.shootTimer >= this.shootDelay) {
            this.shoot();
            this.shootTimer = 0;
        }

        this.updateRotation();
    }

    async shoot() {

        let entity = new Entity(this.entity.x, this.entity.y);
        engine.currentScene.entities.add(entity);

        const projectile = await entity.attachScript('Projectile');
        if (!projectile) return;
        
        entity.rotation = this.entity.rotation;
        projectile.speed = 800;
    }


    updateRotation() {
        const deltaX = (this.target.x) - this.x;
        const deltaY = (this.target.y) - this.y;
    
        const angleRadians = Math.atan2(deltaY, deltaX);

        let angleDegrees = angleRadians * (180 / Math.PI);
        

        if (angleDegrees < 0) {
            angleDegrees += 360;
        }

        this.entity.rotation = angleDegrees;
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
