/* ============================================================
   Yonlendirme — sekme gecisi, mobil nav, FAB, swipe, pull-to-refresh
   Kaynak: app.js (otomatik bolundu)
   ============================================================ */

/* Tum sekmeler tek yerde tanimli — yeni sayfa eklerken sadece buraya eklenir */
const TABS = [
    { id: 'dashboard',     inNav: true,  onShow: function () { updateUI(); } },
    { id: 'stats',         inNav: true,  onShow: function () { renderStats(); } },
    { id: 'expenses',      inNav: true,  onShow: function () { updateExpensesUI(); } },
    { id: 'debts',         inNav: true,  onShow: function () { updateDebtsUI(); } },
    { id: 'salary',        inNav: true,  onShow: function () { updateSalaryUI(); } },
    { id: 'subscriptions', inNav: false, onShow: function () { updateSubscriptionsUI(); } },
    { id: 'settings',      inNav: true,  onShow: null }
];

const TAB_IDS   = TABS.map(function (t) { return t.id; });
const SWIPE_TABS = TABS.filter(function (t) { return t.inNav; }).map(function (t) { return t.id; });

function getActiveTab() {
    const el = document.querySelector('[id$="-view"]:not([style*="display:none"]):not([style*="display: none"])');
    return el ? el.id.replace('-view', '') : 'dashboard';
}

function switchTab(tab, direction) {
    if (TAB_IDS.indexOf(tab) === -1) tab = 'dashboard';

    const targetId = tab + '-view';
    const isMobile = window.innerWidth <= 600;

    /* Yon: gidilen sekme mevcuttan sagdaysa sola kaydir */
    const fromIdx = SWIPE_TABS.indexOf(getActiveTab());
    const toIdx   = SWIPE_TABS.indexOf(tab);
    const slideDir = direction || (toIdx > fromIdx ? 'slide-left' : 'slide-right');

    /* HATA DUZELTME: salary-view dizide yoktu, bu yuzden Maasim sekmesi hic acilmiyordu.
       Artik TAB_IDS uzerinden donuluyor, sekme eklemek otomatik calisiyor. */
    TAB_IDS.forEach(function (id) {
        const el = document.getElementById(id + '-view');
        if (!el) return;
        el.style.display = (id === tab) ? 'block' : 'none';
        el.classList.remove('view-enter', 'slide-left', 'slide-right');
    });

    const targetEl = document.getElementById(targetId);
    if (targetEl) {
        void targetEl.offsetWidth;
        targetEl.classList.add(isMobile ? slideDir : 'view-enter');
        targetEl.querySelectorAll('.settings-card, .stat-card, .debt-card, .card').forEach(function (card) {
            card.style.animation = 'none';
            void card.offsetHeight;
            card.style.animation = '';
        });
    }

    document.querySelectorAll('.btn-nav[id^="nav-"]').forEach(function (btn) {
        btn.classList.toggle('active', btn.id.replace('nav-', '') === tab);
    });
    document.querySelectorAll('.mobile-nav-item').forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.target === tab);
    });

    /* Sekmeye ozel yenileme — her sekme kendi handler'ini TABS icinde tanimlar */
    const cfg = TABS.find(function (t) { return t.id === tab; });
    if (cfg && cfg.onShow) {
        try { cfg.onShow(); } catch (e) { console.error('[router] ' + tab + ' yenilenemedi', e); }
    }

    /* Derin baglanti: gecmise yaz, geri tusu calissin */
    if (window.location.hash.replace('#', '') !== tab) {
        try { history.replaceState(null, '', '#' + tab); } catch (e) {}
    }

    window.scrollTo({ top: 0, behavior: isMobile ? 'auto' : 'smooth' });
}

// Mobil Bottom Nav handler

function updateMobileNav() {
        const navItems = document.querySelectorAll('.mobile-nav-item');
        const currentView = getActiveTab();
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.target === currentView);
        });
    }

// Floating Action Button Menu

function toggleFabMenu() {
        const menu = document.getElementById('mobile-fab-menu');
        if (menu) menu.classList.toggle('is-open');
    }

document.addEventListener('click', (e) => {
        const fab = document.getElementById('mobile-fab');
        if (fab && !fab.contains(e.target)) {
            const menu = document.getElementById('mobile-fab-menu');
            if (menu) menu.classList.remove('is-open');
        }
    });

// Haptic feedback for mobile buttons

document.addEventListener('touchstart', (e) => {
        if (window.innerWidth > 600) return;
        const btn = e.target.closest('button, .mobile-nav-item, .mobile-fab-btn, .mobile-fab-menu-item');
        if (btn && navigator.vibrate) navigator.vibrate(6);
    }, { passive: true });

// Mobile bottom sheet forms (FAB)

function openFormSheet(type) {
        const tabMap = { asset: 'dashboard', debt: 'debts', expense: 'expenses' };
        switchTab(tabMap[type] || 'dashboard');
        setTimeout(() => {
            const sidebar = document.querySelector(`#${tabMap[type]}-view > .content-grid > .sidebar`);
            if (sidebar) {
                sidebar.classList.add('open');
                const backdrop = document.getElementById('sidebar-backdrop');
                if (backdrop) backdrop.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        }, 50);
    }

function closeFormSheet() {
        document.querySelectorAll('.sidebar.open').forEach(el => el.classList.remove('open'));
        const backdrop = document.getElementById('sidebar-backdrop');
        if (backdrop) backdrop.style.display = 'none';
        document.body.style.overflow = '';
    }

// Mobile swipe gesture navigation between tabs

let swipeTouchX = 0;

let swipeTouchY = 0;

let isSwiping = false;

document.addEventListener('touchstart', (e) => {
        if (e.target.closest('.modal-overlay') || e.target.closest('.mobile-bottom-nav') || e.target.closest('input,select,textarea')) {
            swipeTouchX = 0; return;
        }
        swipeTouchX = e.touches[0].clientX;
        swipeTouchY = e.touches[0].clientY;
        isSwiping = false;
    }, { passive: true });

document.addEventListener('touchmove', (e) => {
        if (swipeTouchX === 0) return;
        const deltaX = e.touches[0].clientX - swipeTouchX;
        const deltaY = e.touches[0].clientY - swipeTouchY;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
            isSwiping = true;
        }
    }, { passive: true });

document.addEventListener('touchend', (e) => {
        if (!isSwiping || swipeTouchX === 0) return;
        const deltaX = e.changedTouches[0].clientX - swipeTouchX;
        const threshold = 60;
        if (Math.abs(deltaX) < threshold) { swipeTouchX = 0; return; }
        const tabs = SWIPE_TABS;
        const currentIdx = tabs.indexOf(getActiveTab());
        if (deltaX < 0 && currentIdx < tabs.length - 1) {
            switchTab(tabs[currentIdx + 1]);
        } else if (deltaX > 0 && currentIdx > 0) {
            switchTab(tabs[currentIdx - 1]);
        }
        swipeTouchX = 0;
    }, { passive: true });

// Pull to Refresh - Mobil için

let pullStartY = 0;

let isPulling = false;

document.addEventListener('touchstart', (e) => {
        if (window.innerWidth > 600) return;
        /* HATA DUZELTME: burada swipeTouchX sifirlaniyordu; bu dinleyici swipe
           dinleyicisinden SONRA kayitli oldugu icin mobilde sekme kaydirma
           tamamen olu kaliyordu. Artik iki jest birbirini ezmiyor. */
        if (window.scrollY === 0) {
            pullStartY = e.touches[0].clientY;
        }
    }, { passive: true });

document.addEventListener('touchmove', (e) => {
        if (window.innerWidth > 600) return;
        if (window.scrollY === 0 && pullStartY > 0) {
            const touchY = e.touches[0].clientY;
            const pullDistance = touchY - pullStartY;
            
            if (pullDistance > 80 && !isPulling) {
                isPulling = true;
                const indicator = document.getElementById('pull-refresh-indicator');
                if (indicator) {
                    indicator.classList.add('visible');
                }
            }
        }
    }, { passive: true });

document.addEventListener('touchend', () => {
        if (window.innerWidth > 600) return;
        if (isPulling) {
            isPulling = false;
            const indicator = document.getElementById('pull-refresh-indicator');
            if (indicator) {
                indicator.classList.remove('visible');
            }
            fetchAndSavePrices();
        }
        pullStartY = 0;
    }, { passive: true });
