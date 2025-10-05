import * as THREE from '../../public/libs/three137/three.module.js';

export const concreteShader = {
    uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0.6, 0.6, 0.6) },
        uNoiseScale: { value: 0.1 },
        uRoughness: { value: 0.8 },
        uMetallic: { value: 0.1 },
        uEmissive: { value: new THREE.Color(0.0, 0.0, 0.0) },
        uEmissiveIntensity: { value: 0.0 }
    },
    
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            vUv = uv;
            
            // Calculate world position for texture coordinates
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            
            // Keep the original vertex position unchanged
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    
    fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uNoiseScale;
        uniform float uRoughness;
        uniform float uMetallic;
        uniform vec3 uEmissive;
        uniform float uEmissiveIntensity;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        // Simple noise function
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            
            vec2 u = f * f * (3.0 - 2.0 * f);
            
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        
        void main() {
            // Use local position instead of world position for more stable texture
            vec2 noiseCoord = vPosition.xz * uNoiseScale;
            float noiseValue = noise(noiseCoord);
            
            // Add some variation based on local position
            float heightVariation = sin(vPosition.y * 0.5) * 0.1;
            float timeVariation = sin(uTime * 0.5) * 0.05;
            
            // Create concrete color with variation
            vec3 concreteColor = uColor;
            concreteColor += vec3(noiseValue * 0.2);
            concreteColor += vec3(heightVariation);
            concreteColor += vec3(timeVariation);
            
            // Add some subtle cracks
            float crackPattern = step(0.95, noise(noiseCoord * 2.0));
            concreteColor = mix(concreteColor, concreteColor * 0.7, crackPattern);
            
            // Calculate lighting
            vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
            float NdotL = max(dot(normalize(vNormal), lightDirection), 0.0);
            
            // Ambient + diffuse lighting
            vec3 ambient = concreteColor * 0.3;
            vec3 diffuse = concreteColor * NdotL * 0.7;
            
            vec3 finalColor = ambient + diffuse;
            
            // Add emissive glow
            finalColor += uEmissive * uEmissiveIntensity;
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
};

export function createConcreteMaterial(options = {}) {
    const {
        color = new THREE.Color(0.6, 0.6, 0.6),
        roughness = 0.8,
        metallic = 0.1,
        emissive = new THREE.Color(0.0, 0.0, 0.0),
        emissiveIntensity = 0.0,
        noiseScale = 0.1
    } = options;
    
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uColor: { value: color },
            uNoiseScale: { value: noiseScale },
            uRoughness: { value: roughness },
            uMetallic: { value: metallic },
            uEmissive: { value: emissive },
            uEmissiveIntensity: { value: emissiveIntensity }
        },
        vertexShader: concreteShader.vertexShader,
        fragmentShader: concreteShader.fragmentShader,
        side: THREE.DoubleSide
    });
    
    return material;
}
