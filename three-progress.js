/* ============================================================
   3B HEDEF İLERLEME HALKASI
   index.html three.js'i CDN'den yüklüyordu ama hiç kullanmıyordu;
   #stats-ring-wrap boş bir div olarak duruyordu. Bu modül orayı doldurur.

   three.js yüklenemezse (çevrimdışı, CDN engeli) sessizce CSS conic-gradient
   yedeğine düşer — sayfa hiçbir koşulda kırılmaz.
   ============================================================ */

(function () {
    'use strict';

    let renderer = null, scene = null, camera = null;
    let progressMesh = null, trackMesh = null;
    let rafId = null, currentPct = 0, targetPct = 0;

    const RADIUS = 1.0;
    const TUBE = 0.13;

    function themeColors() {
        const css = getComputedStyle(document.documentElement);
        const read = function (name, fallback) {
            const v = css.getPropertyValue(name).trim();
            return v || fallback;
        };
        return {
            accent: read('--teal', '#00939E'),
            track: read('--bg-input', '#F2F3F5')
        };
    }

    function buildProgressGeometry(pct) {
        const arc = Math.max(0.0001, (Math.min(pct, 100) / 100) * Math.PI * 2);
        const segments = Math.max(8, Math.round(128 * (arc / (Math.PI * 2))));
        return new THREE.TorusGeometry(RADIUS, TUBE, 16, segments, arc);
    }

    function init(wrap) {
        const size = Math.min(wrap.clientWidth || 160, 220);
        if (size < 40) return false;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 0, 4.2);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(size, size, false);
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = 'auto';
        renderer.domElement.setAttribute('aria-hidden', 'true');
        wrap.appendChild(renderer.domElement);

        const colors = themeColors();

        trackMesh = new THREE.Mesh(
            new THREE.TorusGeometry(RADIUS, TUBE * 0.72, 16, 128),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(colors.track) })
        );
        scene.add(trackMesh);

        progressMesh = new THREE.Mesh(
            buildProgressGeometry(0),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(colors.accent) })
        );
        /* Saat 12'den başlasın, saat yönünde ilerlesin */
        progressMesh.rotation.z = Math.PI / 2;
        progressMesh.scale.y = -1;
        scene.add(progressMesh);

        return true;
    }

    function animate() {
        rafId = requestAnimationFrame(animate);

        /* Hedefe yumuşak yaklaşma */
        const delta = targetPct - currentPct;
        if (Math.abs(delta) > 0.05) {
            currentPct += delta * 0.08;
            progressMesh.geometry.dispose();
            progressMesh.geometry = buildProgressGeometry(currentPct);
        } else if (currentPct !== targetPct) {
            currentPct = targetPct;
            progressMesh.geometry.dispose();
            progressMesh.geometry = buildProgressGeometry(currentPct);
        }

        /* Hafif salınım — sabit durmasın ama dikkat dağıtmasın */
        const t = Date.now() * 0.0004;
        scene.rotation.y = Math.sin(t) * 0.18;
        scene.rotation.x = Math.cos(t * 0.8) * 0.08;

        renderer.render(scene, camera);
    }

    /* CSS yedeği: three.js yoksa da halka görünür kalsın */
    function fallback(wrap, pct) {
        const colors = themeColors();
        wrap.style.background =
            'conic-gradient(' + colors.accent + ' ' + pct + '%, ' + colors.track + ' ' + pct + '% 100%)';
        wrap.style.borderRadius = '50%';
        wrap.style.aspectRatio = '1';
        wrap.style.setProperty('-webkit-mask', 'radial-gradient(circle, transparent 58%, #000 60%)');
        wrap.style.mask = 'radial-gradient(circle, transparent 58%, #000 60%)';
    }

    /* Dışa açılan tek API — charts.js/gold.js hedef yüzdesini buraya iletir */
    window.setGoalRingProgress = function (pct) {
        targetPct = Math.max(0, Math.min(Number(pct) || 0, 100));

        const wrap = document.getElementById('stats-ring-wrap');
        if (!wrap) return;

        if (typeof THREE === 'undefined' || !window.WebGLRenderingContext) {
            fallback(wrap, targetPct);
            return;
        }

        if (!renderer) {
            try {
                if (!init(wrap)) return;
                animate();
            } catch (e) {
                console.warn('[three-progress] WebGL başlatılamadı, CSS yedeğine düşülüyor.', e);
                renderer = null;
                fallback(wrap, targetPct);
            }
        }
    };

    /* Tema değişince renkleri tazele */
    window.refreshGoalRingTheme = function () {
        if (!renderer) return;
        const colors = themeColors();
        trackMesh.material.color = new THREE.Color(colors.track);
        progressMesh.material.color = new THREE.Color(colors.accent);
    };

    /* Sekme arkaplandayken boşuna çizme */
    document.addEventListener('visibilitychange', function () {
        if (!renderer) return;
        if (document.hidden) {
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        } else if (!rafId) {
            animate();
        }
    });
})();
