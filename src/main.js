// main.js
import { App } from './App.js';
import { MainMenu } from './ui/mainMenu.js';
import { GameLoader } from './ui/GameLoader.js';

document.addEventListener('DOMContentLoaded', () => {
    let app = null;
    let loader = null;

    const menu = new MainMenu({
        onStart: (level = 1) => {
            // Show loader overlay
            loader = new GameLoader();
            loader.show();
            // Begin constructing the app but keep overlay until world ready
            app = new App({ level });
            window.game = app;
            // Poll readiness (world + eve + structure + obstacles)
            const startTime = performance.now();
            const poll = () => {
                const worldReady = app?.world?.ready;
                const eveReady = app?.world?.eve?.ready;
                const platformReady = app?.world?.structure?.platform?.ready !== false;
                const obstaclesReady = app?.world?.obstaclesReady;
                
                const ready = worldReady && platformReady && eveReady && obstaclesReady;
                
                // progress heuristic
                let pct = 10;
                if (worldReady) pct += 15;
                if (platformReady) pct += 20;
                if (eveReady) pct += 25;
                if (obstaclesReady) pct += 30;
                
                // Show obstacle registration progress
                if (app?.world?.collisionManager && app.world.collisionManager.registrationStarted) {
                    const obstacleProgress = app.world.collisionManager.getRegistrationProgress();
                    pct = Math.min(98, pct + (obstacleProgress * 10));
                }
                
                pct = Math.min(98, pct);
                
                // Update loader message based on what's missing
                let message = 'Loading assets...';
                if (!worldReady) message = 'Loading world...';
                else if (!platformReady) message = 'Building platforms...';
                else if (!eveReady) message = 'Loading character...';
                else if (!obstaclesReady) {
                    const status = app?.world?.collisionManager?.getRegistrationStatus();
                    if (status) {
                        message = `Registering obstacles... ${status.registered}/${status.expected}`;
                    } else {
                        message = 'Registering obstacles...';
                    }
                } else {
                    message = 'Launching...';
                }
                
                loader.updateProgress(pct, message);
                
                if (ready) {
                    loader.updateProgress(100, 'Ready');
                    setTimeout(() => loader.hide(), 350);
                } else {
                    requestAnimationFrame(poll);
                }
            };
            poll();
        },
        onHelp: () => {}
    });
    menu.show();

    window.addEventListener('show-main-menu', () => {
        try { app?.destroy?.(); } catch {}
        app = null;
        menu.show();
    });
});
