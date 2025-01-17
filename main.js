const engine = new Engine();
const mainCamera = new Camera(800, 600);
window.mainCamera = mainCamera;
window.engine = engine;

engine.setDebug(true, {
    pauseKey: 'F8',
    showFPS: true,
    showDelta: true,
    showEntityCount: true
});

const gameScene = new Scene();

async function initializeGame() {
    console.log('Bark Engine initializing...');
    try {
        const player = new Player(400, 300);
        gameScene.addEntity(player);

        mainCamera.follow(player);
        mainCamera.setSmoothing(true, 0.1);

        engine.addScene('main', gameScene);
        engine.loadScene('main');

        try {
            await gameScene.loadMap(
                'assets/maps/map.png',
                'assets/maps/map_col.png',
                32
            );
            mainCamera.setBounds(0, 0, 1920, 1080);
            console.log('Map assets loaded successfully');
        } catch (mapError) {
            console.warn('Maps not loaded:', mapError);
            mainCamera.setBounds(0, 0, 800, 600);
        }

        engine.initializeSystems();
        console.log('Bark Engine started successfully');

    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
}

window.addEventListener('load', initializeGame);