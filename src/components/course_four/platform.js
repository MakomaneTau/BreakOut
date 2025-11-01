import * as THREE from '../../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../../public/libs/three137/GLTFLoader.js';
import { createPlatformMaterial } from '../../shaders/platformShader.js';

class platform {
	constructor(game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;
		this.shaderMaterials = []; // Store shader materials for time updates
		// No obstacles in play mode - just free exploration
		this.load();
	}

	load() {
		const loader = new GLTFLoader().setPath(`${this.assetsPath}models/platform/`);
		loader.load(
			'scene.gltf',
			gltf => {
				gltf.scene.rotation.y = Math.PI / 2; // Rotate 180 degrees if needed
				gltf.scene.scale.set(0.05, 1, 0.2); // Adjust scale as needed
				gltf.scene.position.set(-21.2, 4, 0); // Adjust position as needed

				// Enable shadows on platform meshes and apply shader
				const platformMaterial = createPlatformMaterial({
					color: new THREE.Color(0.3, 0.3, 0.35),
					noiseScale: 0.1,
					wearIntensity: 0.4,
					grimeIntensity: 0.3,
					patternScale: 0.5
				});

				// Store material reference once for time updates
				if (platformMaterial) {
					this.shaderMaterials.push(platformMaterial);
				}

				gltf.scene.traverse(node => {
					if (node.isMesh) {
						node.receiveShadow = true;
						node.castShadow = true;
						// Apply shader material to platform meshes
						if (platformMaterial) {
							node.material = platformMaterial;
						}
					}
				});

				this.scene.add(gltf.scene);
				this.model = gltf.scene;
				this.ready = true;
			},
			xhr => this.loadingBar.update('platform', xhr.loaded, xhr.total),
			err => console.error(err)
		);
	}

	update(time, delta) {
		if (!this.ready) return;
		// Update shader time uniforms
		this.shaderMaterials.forEach(mat => {
			if (mat.uniforms && mat.uniforms.uTime) {
				mat.uniforms.uTime.value = time;
			}
		});
		// No obstacles to update in play mode
	}
}

export { platform };

