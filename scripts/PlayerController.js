// scripts/PlayerController.js
export default class PlayerController {
    constructor(entity) {
        this.entity = entity;
        this.rotation = 0;

        this.player = entity instanceof Player ? entity : null;
        this.easterEgg = "Yippee! You found me!";
    }

    init() {        
        if (!this.player) {
            console.error('PlayerController can only be attached to Player instances');
            return;
        }
        console.log('PlayerController initialized');
    }

    update(deltaTime) {
    }

    onDetach() {
        console.log('PlayerController detached');
    }
}