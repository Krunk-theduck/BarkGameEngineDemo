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
    }

    init() {
        const override = new Override(this.entity, this);
        override.replace('render', this.render);
    }

    update(deltaTime) {
        const radian = this.rotation * (Math.PI / 180);
        this.x += Math.cos(radian) * this.speed * deltaTime;
        this.y += Math.sin(radian) * this.speed * deltaTime;
    }

    render() {
        const ctx = window.mainCamera.ctx;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.fillStyle = 'orange';

        ctx.beginPath();
        ctx.arc(
            this.collisionBounds.offset.x, 
            this.collisionBounds.offset.y, 
            this.collisionBounds.radius, 
            0, 
            2 * Math.PI
        );
        ctx.fill();
        ctx.restore();
    }
}