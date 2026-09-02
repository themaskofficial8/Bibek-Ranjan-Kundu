import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Scene Setup
const scene = new THREE.Scene();
const bgColor = 0x050510;
// scene.background = new THREE.Color(bgColor); // Kept transparent to blend with dark website theme
scene.fog = new THREE.Fog(bgColor, 10, 60);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 25); // Centered camera

const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 50;
controls.enableZoom = false; // Disable scroll zoom so user can scroll page

// --- Post-Processing ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.2; // Increased threshold so fewer things glow
bloomPass.strength = 0.6;  // Reduced intensity (was 1.2)
bloomPass.radius = 0.3;    // Tighter glow radius

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// --- Model Assets ---
const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x6366f1, // primary color
    transparent: true,
    opacity: 0.3, // Reduced text opacity even more to not distract
});

// Trail Variables
const trailLength = 50;
const trailPositions = new Float32Array(trailLength * 3);
const trailGeometry = new THREE.BufferGeometry();
trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

const trailMaterial = new THREE.LineBasicMaterial({
    color: 0xec4899, // secondary color
    transparent: true,
    opacity: 0.4, // Reduced trail opacity
    blending: THREE.AdditiveBlending
});
const trailMesh = new THREE.Line(trailGeometry, trailMaterial);
scene.add(trailMesh);

// Orb
const orbGeometry = new THREE.SphereGeometry(0.2, 16, 16);
const orbMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const orb = new THREE.Mesh(orbGeometry, orbMaterial);
scene.add(orb);

// --- Star Field ---
const starGeometry = new THREE.BufferGeometry();
const starCount = 1000;
const starPositions = new Float32Array(starCount * 3);
const starSizes = new Float32Array(starCount);

for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    // Spread stars across a large volume
    starPositions[i3] = (Math.random() - 0.5) * 100;
    starPositions[i3 + 1] = (Math.random() - 0.5) * 100;
    starPositions[i3 + 2] = (Math.random() - 0.5) * 100;

    starSizes[i] = Math.random() * 0.1 + 0.05;
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Text
const loader = new FontLoader();
loader.load('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', function (font) {

    const geometry = new TextGeometry("BRK", {
        font: font,
        size: 5,
        height: 1.5,
        curveSegments: 4,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelOffset: 0,
        bevelSegments: 1
    });

    geometry.computeBoundingBox();
    const xMid = - 0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    const yMid = - 0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
    geometry.translate(xMid, yMid, 0);

    const edges = new THREE.EdgesGeometry(geometry, 15);
    const lines = new THREE.LineSegments(edges, lineMaterial);

    lines.position.y = 1.5;
    scene.add(lines);

    animate();
});

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const time = clock.getElapsedTime();

    // Orbit Logic
    const radiusX = 10;
    const radiusZ = 6;
    const speed = 1.0;

    const x = Math.sin(time * speed) * radiusX;
    const y = Math.cos(time * speed * 2) * 1.5 + 2;
    const z = Math.cos(time * speed) * radiusZ;

    orb.position.set(x, y, z);

    // Trail Logic
    for (let i = (trailLength - 1) * 3; i >= 3; i -= 3) {
        trailPositions[i] = trailPositions[i - 3];
        trailPositions[i + 1] = trailPositions[i - 2];
        trailPositions[i + 2] = trailPositions[i - 1];
    }
    trailPositions[0] = x;
    trailPositions[1] = y;
    trailPositions[2] = z;

    trailGeometry.attributes.position.needsUpdate = true;

    // Subtle rotation for star field
    stars.rotation.y += 0.0005;
    stars.rotation.x += 0.0002;

    composer.render();
}
