// scripts/Projectile.js
export default class Projectile {
    constructor(entity) {
        this.entity = entity;
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.speed = 1;
        this.collisionBounds = {
            offset: { x: -2.5, y: -2.5 },
            width: 5,
            height: 5,
            radius: 6,
        };
        this.entity.setCollisionBounds(this.collisionBounds);
    }

    init() {
        const override = new Override(this.entity, this);
        override.replace('render', this.render);
    }

    update(deltaTime) {
        const radian = this.entity.rotation * (Math.PI / 180);
        this.entity.x += Math.cos(radian) * this.speed * deltaTime;
        this.entity.y += Math.sin(radian) * this.speed * deltaTime;
    }

    render(ctx) {
        if (!this.entity.visible) return;
        
        ctx.save();
        ctx.translate(this.entity.x, this.entity.y);
        ctx.rotate(this.entity.rotation * Math.PI / 180);
        ctx.globalAlpha = this.entity.alpha;
        
        // Draw projectile
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(0, 0, this.collisionBounds.radius, 0, 2 * Math.PI);
        ctx.fill();
        
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