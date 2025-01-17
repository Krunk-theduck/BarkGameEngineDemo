// scripts/PlayerController.js
export default class PlayerController {
    constructor(entity) {
        this.entity = entity;
        this.rotation = 0;

        this.player = entity instanceof Player ? entity : null;
        this.easterEgg = "Yippee! You found me!";

        // Add mouse position tracking
        this.mouseX = 0;
        this.mouseY = 0;
        this.setupMouseTracking();
    }

    init() {        
        if (!this.player) {
            console.error('PlayerController can only be attached to Player instances');
            return;
        }
        console.log('PlayerController initialized');

        const override = new Override(this.entity, this);
        override.after('render', this.render);
    }

    update(deltaTime) {
        const input = {
            space: this.player.input.action
        };
        if (input.space) console.log("space pressed");  

        // Get player's screen position
        const screenX = window.mainCamera.canvas.offsetParent.offsetLeft + this.entity.relativeX;
        const screenY = window.mainCamera.canvas.offsetParent.offsetTop + this.entity.relativeY;

        // Calculate angle between player's screen position and mouse
        const dx = this.mouseX - screenX;
        const dy = this.mouseY - screenY;
        this.rotation = Math.atan2(dy, dx);
    }

    render(ctx) {    
        ctx.save();
        ctx.translate(this.entity.x, this.entity.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.moveTo(55, 0); 
        ctx.lineTo(30, -10);
        ctx.lineTo(30, 10);
        ctx.closePath();

        ctx.fillStyle = '#0088ff';
        ctx.fill();

        ctx.restore();
    }

    setupMouseTracking() {
        window.addEventListener('mousemove', (e) => {
            const canvas = window.mainCamera.canvas;
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }

    onDetach() {
        window.removeEventListener('mousemove', this.setupMouseTracking);
        console.log('PlayerController detached');
    }
}