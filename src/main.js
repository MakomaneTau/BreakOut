// main.js
import { App } from './App.js';
import { MainMenu } from './ui/mainMenu.js';

// Initialize the app
const app = new App();

// Setup keyboard listeners for pause menu
app.setupKeyboardListeners();

// The menu system will automatically show on startup
// Players can start the game, access settings, and pause during gameplay
document.addEventListener('DOMContentLoaded', () => {
    let app = null;

    // Auto-start the app directly, skipping the main menu for now
    app = new App();
    window.game = app;

    // If anything triggers 'show-main-menu', just restart the app instead of showing menu
    window.addEventListener('show-main-menu', () => {
        try { app?.destroy?.(); } catch {}
        app = new App();
        window.game = app;
    });
});
