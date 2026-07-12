// ═══════════════════════════════════════════════════════════
// router.js — Unified View Manager (single source of truth)
// ═══════════════════════════════════════════════════════════

const VIEW_IDS = ['dashboard', 'stats', 'expenses', 'debts', 'settings', 'subscriptions'];

let _currentView = null;

function _viewEl(id) {
    return document.getElementById(id + '-view');
}

function _hideAll(excludeId) {
    VIEW_IDS.forEach(id => {
        if (id === excludeId) return;
        const el = _viewEl(id);
        if (el) {
            el.style.display = 'none';
            el.classList.remove('view-enter', 'slide-left', 'slide-right');
        }
    });
}

function _updateNav(tab) {
    document.querySelectorAll('.btn-nav[id^="nav-"]').forEach(btn => {
        const navId = btn.id.replace('nav-', '');
        btn.classList.toggle('active', navId === tab);
    });
    document.querySelectorAll('.mobile-nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.target === tab);
    });
}

function getCurrentView() {
    return _currentView;
}

function showView(id) {
    if (_currentView === id && _viewEl(id)?.style.display === 'block') return;
    _hideAll(id);
    const el = _viewEl(id);
    if (!el) return;
    el.style.display = 'block';
    el.classList.remove('view-enter', 'slide-left', 'slide-right');
    void el.offsetWidth;
    el.classList.add('view-enter');
    _currentView = id;
    _updateNav(id);

    // Trigger card stagger animation
    el.querySelectorAll('.settings-card, .stat-card, .debt-card, .card, .stats-chart-card').forEach(card => {
        card.style.animation = 'none';
        card.offsetHeight;
        card.style.animation = '';
    });
}

function initView(viewId) {
    // Show initial view on load (no animation)
    if (_currentView) return;
    VIEW_IDS.forEach(id => {
        const el = _viewEl(id);
        if (el) {
            el.style.display = id === viewId ? 'block' : 'none';
            el.classList.remove('view-enter', 'slide-left', 'slide-right');
        }
    });
    _currentView = viewId;
    _updateNav(viewId);
}
