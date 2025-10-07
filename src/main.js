// main.js
import { App } from './App.js';
import { MainMenu } from './ui/mainMenu.js';
import { GameLoader } from './ui/GameLoader.js';

document.addEventListener('DOMContentLoaded', () => {
    let app = null;
    let loader = null;

    const menu = new MainMenu({
        onStart: () => {
            // Show loader overlay
            loader = new GameLoader();
            loader.show();
            // Begin constructing the app but keep overlay until world ready
            app = new App();
            window.game = app;
            // Poll readiness (world + eve + structure?)
            const startTime = performance.now();
            const poll = () => {
                const ready = app?.world?.ready && app?.world?.structure?.platform?.ready !== false && app?.world?.eve?.ready;
                // progress heuristic
                let pct = 20;
                if (app?.world?.eve?.ready) pct += 30;
                if (app?.world?.structure?.platform?.model) pct += 30;
                if (app?.world?.ready) pct += 20;
                pct = Math.min(98, pct);
                loader.updateProgress(pct, ready ? 'Launching...' : 'Loading assets...');
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
