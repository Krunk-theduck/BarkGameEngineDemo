// scripts/PlayerController.js
export default class PlayerController {
    constructor(entity) {
        this.entity = entity;

        // Cast entity to Player type for better access to Player-specific properties
        this.player = entity instanceof Player ? entity : null;
        this.easterEgg = "Yippee! You found me!";
    }

    init() {        
        if (!this.player) {
            console.error('PlayerController can only be attached to Player instances');
            return;
        }

        // Called when the script is first attached
        console.log('PlayerController initialized');
    }

    update(deltaTime) {
        const input = {
            space: this.player.input.space
        };

        // Custom movement behavior
        if (input.space) console.log("space pressed");  
    }

    onDetach() {
        // Cleanup when script is detached
        console.log('PlayerController detached');
    }
}
