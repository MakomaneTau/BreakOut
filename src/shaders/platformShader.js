import * as THREE from '../../public/libs/three137/three.module.js';

export const platformShader = {
    uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0.3, 0.3, 0.35) }, // Dark industrial color
        uRoughness: { value: 0.8 },
        uMetallic: { value: 0.1 },
        uNoiseScale: { value: 0.1 },
        uWearIntensity: { value: 0.4 },
        uGrimeIntensity: { value: 0.3 },
        uPatternScale: { value: 0.5 },
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
            
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    
    fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uRoughness;
        uniform float uMetallic;
        uniform float uNoiseScale;
        uniform float uWearIntensity;
        uniform float uGrimeIntensity;
        uniform float uPatternScale;
        uniform vec3 uEmissive;
        uniform float uEmissiveIntensity;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        // Noise functions
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
        
        float fbm(vec2 st) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 0.0;
            
            for (int i = 0; i < 4; i++) {
                value += amplitude * noise(st);
                st *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }
        
        void main() {
            // Create industrial floor pattern
            vec2 patternCoord = vWorldPosition.xz * uPatternScale;
            
            // Grid pattern for industrial floor
            vec2 grid = abs(fract(patternCoord) - 0.5);
            float gridPattern = smoothstep(0.0, 0.1, min(grid.x, grid.y));
            
            // Add some wear patterns
            float wearNoise = fbm(vWorldPosition.xz * uNoiseScale);
            float wearPattern = step(0.7, wearNoise) * uWearIntensity;
            
            // Add grime and dirt
            float grimeNoise = noise(vWorldPosition.xz * uNoiseScale * 2.0 + uTime * 0.1);
            float grimePattern = step(0.6, grimeNoise) * uGrimeIntensity;
            
            // Create oil stains
            float oilStain = 1.0 - smoothstep(0.0, 0.3, length(vWorldPosition.xz - vec2(-25.0, 0.0)));
            oilStain += 1.0 - smoothstep(0.0, 0.2, length(vWorldPosition.xz - vec2(-15.0, 2.0)));
            oilStain += 1.0 - smoothstep(0.0, 0.25, length(vWorldPosition.xz - vec2(-5.0, -1.0)));
            oilStain *= 0.3;
            
            // Create base floor color
            vec3 floorColor = uColor;
            
            // Add grid lines (darker)
            floorColor = mix(floorColor, floorColor * 0.7, gridPattern);
            
            // Add wear marks (lighter)
            floorColor = mix(floorColor, floorColor * 1.2, wearPattern);
            
            // Add grime (darker)
            floorColor = mix(floorColor, floorColor * 0.6, grimePattern);
            
            // Add oil stains (dark)
            floorColor = mix(floorColor, vec3(0.1, 0.1, 0.15), oilStain);
            
            // Add some subtle color variation
            float colorVariation = noise(vWorldPosition.xz * 0.05) * 0.1;
            floorColor += vec3(colorVariation);
            
            // Add time-based subtle animation
            float timeVariation = sin(uTime * 0.5 + vWorldPosition.x * 0.1) * 0.02;
            floorColor += vec3(timeVariation);
            
            // Calculate lighting
            vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
            float NdotL = max(dot(normalize(vNormal), lightDirection), 0.0);
            
            // Ambient + diffuse lighting
            vec3 ambient = floorColor * 0.4;
            vec3 diffuse = floorColor * NdotL * 0.6;
            
            vec3 finalColor = ambient + diffuse;
            
            // Add emissive glow
            finalColor += uEmissive * uEmissiveIntensity;
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
};

export function createPlatformMaterial(options = {}) {
    const {
        color = new THREE.Color(0.3, 0.3, 0.35),
        roughness = 0.8,
        metallic = 0.1,
        noiseScale = 0.1,
        wearIntensity = 0.4,
        grimeIntensity = 0.3,
        patternScale = 0.5,
        emissive = new THREE.Color(0.0, 0.0, 0.0),
        emissiveIntensity = 0.0
    } = options;
    
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0.0 },
            uColor: { value: color },
            uRoughness: { value: roughness },
            uMetallic: { value: metallic },
            uNoiseScale: { value: noiseScale },
            uWearIntensity: { value: wearIntensity },
            uGrimeIntensity: { value: grimeIntensity },
            uPatternScale: { value: patternScale },
            uEmissive: { value: emissive },
            uEmissiveIntensity: { value: emissiveIntensity }
        },
        vertexShader: platformShader.vertexShader,
        fragmentShader: platformShader.fragmentShader,
        side: THREE.DoubleSide
    });
    
    return material;
}
