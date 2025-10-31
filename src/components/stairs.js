import * as THREE from '../../public/libs/three137/three.module.js';
import { GLTFLoader } from '../../public/libs/three137/GLTFLoader.js';

class stairs {
	constructor(game) {
		this.assetsPath = game.assetsPath;
		this.loadingBar = game.loadingBar;
		this.scene = game.scene;
		this.ready = false;
		this.model = null;
		this.load();
	}

	load() {
		const loader = new GLTFLoader().setPath(`${this.assetsPath}models/stairs/`);
		const textureLoader = new THREE.TextureLoader();


		const colorMap = textureLoader.load('src/components/texture_stairs/textures/rock_face_diff_2k.jpg');
		const normalMap = textureLoader.load('src/components/texture_stairs/textures/rock_face_nor_gl_2k.jpg');
		// const roughnessMap = textureLoader.load('src/components/texture_stairs/textures/rock_face_rough_2k.jpg');
		const aoMap = textureLoader.load('src/components/texture_stairs/textures/rock_face_ao_2k.jpg');
		const displacementMap = textureLoader.load('src/components/texture_stairs/textures/rock_face_disp_2k.jpg');

		//
		[colorMap, normalMap, aoMap, displacementMap].forEach(tex => {
			tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
			tex.repeat.set(2, 2);
		});
		colorMap.colorSpace = THREE.SRGBColorSpace;


		const rockMaterial = new THREE.MeshStandardMaterial({
			map: colorMap,
			normalMap: normalMap,
			// roughnessMap: roughnessMap,
			aoMap: aoMap,
			displacementMap: displacementMap,
			roughness: 0.9,
			metalness: 0.1,
			displacementScale: 0.05,
		});


		loader.load(
			'scene.gltf',
			gltf => {
				gltf.scene.rotation.y = Math.PI / 2;
				gltf.scene.scale.set(5, 3.5, 5);
				gltf.scene.position.set(-80, -21, -62.9);

				gltf.scene.traverse(child => {
					if (child.isMesh) {
						child.material = rockMaterial;
						child.castShadow = true;
						child.receiveShadow = true;
					}
				});

				this.scene.add(gltf.scene);
				this.model = gltf.scene;
				this.ready = true;
			},
			xhr => this.loadingBar.update('stairs', xhr.loaded, xhr.total),
			err => console.error(err)
		);
	}

	update(time, delta) {
		if (!this.ready) return;

	}
}

export { stairs };
