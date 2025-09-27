# BreakOut

BreakOut is a 3D browser-based game built with [Three.js](https://threejs.org/) and Vite. Explore a dynamic world, interact with models, and experience smooth controls and lighting effects. This project demonstrates modern web graphics and game development techniques.

## Features

- 3D graphics powered by Three.js
- WASD controls for movement
- Dynamic lighting and skybox
- GLTF model loading
- Modular code structure (components, controls, core)
- Asset management for models, textures, and sounds
- Responsive rendering and camera controls

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer recommended)

### Installation

1. Clone the repository:
	```sh
	git clone https://github.com/MakomaneTau/BreakOut.git
	cd BreakOut
	```
2. Install dependencies:
	```sh
	npm install
	```

### Running the Game

Start the development server:
```sh
npm run dev
```
Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

- `src/` — Main source code (App, components, controls, core, styles, utils)
- `public/assets/` — 3D models, textures, sounds
- `public/libs/` — External libraries (Three.js, Cannon.js, etc.)
- `index.html` — Entry point

## Controls

- **WASD** — Move around
- **Mouse** — Look/rotate camera (with dev controls)

## Credits

- [Three.js](https://threejs.org/) for 3D rendering
- [Cannon.js](https://github.com/pmndrs/cannon-es) for physics (if used)
- HDR, GLTF, and other assets from open sources (see `public/assets` for licenses)

## License

This project is licensed under the MIT License. See `LICENSE` for details.