// ═══════════════════════════════════════════════════════════
// three-progress.js — 3D animated torus progress ring (Three.js)
// ═══════════════════════════════════════════════════════════

let threeScene = null;
let threeCamera = null;
let threeRenderer = null;
let threeAnimId = null;
let threeRingBg = null;
let threeRingFg = null;
let threeTargetPct = 0;
let threeCurrentPct = 0;
let threeRingGroup = null;
let threeIsRunning = false;

function initProgressRing() {
    const wrap = document.getElementById('stats-ring-wrap');
    if (!wrap) return;

    if (threeIsRunning && threeRenderer) {
        resizeProgressRing();
        return;
    }

    const w = Math.max(wrap.clientWidth || 120, 60);
    const h = Math.max(wrap.clientHeight || 120, 60);

    const scene = new THREE.Scene();
    scene.background = null;
    scene.transparent = true;

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    wrap.innerHTML = '';
    wrap.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x2ecbd6, 1.5, 20);
    pointLight.position.set(-3, 2, 3);
    scene.add(pointLight);

    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const R = 1.2;
    const tube = 0.18;
    const seg = 64;

    const bgGeo = new THREE.TorusGeometry(R, tube, 16, seg);
    const bgMat = new THREE.MeshPhongMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.6,
        shininess: 30,
    });
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    ringGroup.add(bgMesh);

    const fgGeo = new THREE.TorusGeometry(R, tube, 16, seg, 0.01);
    const fgMat = new THREE.MeshPhongMaterial({
        color: 0x00939e,
        emissive: 0x00939e,
        emissiveIntensity: 0.35,
        shininess: 80,
        transparent: true,
        opacity: 0.95,
    });
    const fgMesh = new THREE.Mesh(fgGeo, fgMat);
    ringGroup.add(fgMesh);

    threeScene = scene;
    threeCamera = camera;
    threeRenderer = renderer;
    threeRingBg = bgMesh;
    threeRingFg = fgMesh;
    threeRingGroup = ringGroup;
    threeCurrentPct = 0;
    threeTargetPct = 0;
    threeIsRunning = true;

    tickThreeRing();
}

function tickThreeRing() {
    if (!threeIsRunning || !threeRenderer) return;

    threeAnimId = requestAnimationFrame(tickThreeRing);

    const diff = threeTargetPct - threeCurrentPct;
    let needsGeoUpdate = false;
    if (Math.abs(diff) > 0.05) {
        threeCurrentPct += diff * 0.08;
        needsGeoUpdate = true;
    } else if (Math.abs(threeCurrentPct - threeTargetPct) > 0.001) {
        threeCurrentPct = threeTargetPct;
        needsGeoUpdate = true;
    }

    if (needsGeoUpdate) {
        const arc = Math.max(0.001, (threeCurrentPct / 100) * Math.PI * 2);
        threeRingFg.geometry.dispose();
        threeRingFg.geometry = new THREE.TorusGeometry(1.2, 0.18, 16, 64, arc);
    }

    threeRingGroup.rotation.y += 0.004;
    threeRingGroup.rotation.x = Math.sin(Date.now() * 0.0005) * 0.08;

    threeRenderer.render(threeScene, threeCamera);
}

function setGoalProgress(pct) {
    threeTargetPct = Math.max(0, Math.min(100, pct));
}

function destroyProgressRing() {
    threeIsRunning = false;
    if (threeAnimId) cancelAnimationFrame(threeAnimId);
    if (threeRenderer) {
        threeRenderer.dispose();
        threeRenderer = null;
    }
    threeScene = null;
    threeCamera = null;
    threeRingBg = null;
    threeRingFg = null;
    threeRingGroup = null;
    threeCurrentPct = 0;
    threeTargetPct = 0;
}

function resizeProgressRing() {
    if (!threeRenderer || !threeCamera) return;
    const wrap = document.getElementById('stats-ring-wrap');
    if (!wrap) return;
    const w = Math.max(wrap.clientWidth || 120, 60);
    const h = Math.max(wrap.clientHeight || 120, 60);
    threeRenderer.setSize(w, h);
    threeCamera.aspect = w / h;
    threeCamera.updateProjectionMatrix();
}