// ═══════════════════════════════════════════════════════════
// app.js — Main entry, navigation, price fetching, PWA & mobile handlers
// ═══════════════════════════════════════════════════════════

    function switchTab(tab, direction) {
        const isMobile = window.innerWidth <= 600;
        const current = getCurrentView();
        const tabOrder = ['dashboard', 'stats', 'expenses', 'debts', 'settings'];
        const fromIdx = tabOrder.indexOf(current);
        const toIdx = tabOrder.indexOf(tab);
        const slideDir = (toIdx > fromIdx) ? 'slide-left' : 'slide-right';

        showView(tab);

        // Apply slide animation on mobile
        if (isMobile) {
            const el = document.getElementById(tab + '-view');
            if (el) {
                el.classList.remove('slide-left', 'slide-right');
                void el.offsetWidth;
                el.classList.add(slideDir);
            }
        }

        if (tab === 'stats') renderStats();
        if (tab === 'debts') updateDebtsUI();
        if (tab === 'expenses') updateExpensesUI();
        if (tab === 'dashboard') updateUI();
    }


    // --- Tek Tıkla Kur Güncelleme (API → Kaydet → Güncelle) ---
    // --- Otomatik Kur Çekme (Sessiz - Bildirim Göstermez) ---
    async function fetchPricesSilent() {
        try {
            const [altinRes, dovizRes] = await Promise.all([
                fetch('https://api.genelpara.com/json/?list=altin'),
                fetch('https://api.genelpara.com/json/?list=doviz&sembol=USD')
            ]);
            if (!altinRes.ok || !dovizRes.ok) return;
            const altinData = await altinRes.json();
            const dovizData = await dovizRes.json();
            if (!altinData.success || !dovizData.success) return;

            const a = altinData.data;
            const d = dovizData.data;
            const mapping = {
                '24k': a.GA?.alis, '22k': a['22']?.alis, 'cumhuriyet': a.CMR?.alis,
                'yarim': a.Y?.alis, 'ceyrek': a.C?.alis, '18k': a['18']?.alis,
                '14k': a['14']?.alis, 'usd': d.USD?.alis
            };

            let updated = 0;
            Object.entries(mapping).forEach(([key, value]) => {
                if (value) { prices[key] = parseFloat(value); updated++; }
            });

            if (updated === 0) return;

            localStorage.setItem('goldPrices', JSON.stringify(prices));

            const history = JSON.parse(localStorage.getItem('priceHistory') || '[]');
            history.push({ timestamp: Date.now(), prices: { ...prices } });
            if (history.length > 50) history.splice(0, history.length - 50);
            localStorage.setItem('priceHistory', JSON.stringify(history));

            updateUI();

            if (document.getElementById('stats-view').style.display === 'block') renderStats();

            if (currentPnlModalIndex >= 0 && currentPnlModalIndex < inventory.length) {
                const item = inventory[currentPnlModalIndex];
                if (item && (parseFloat(item.cost) || 0) > 0) populatePnlModal(item);
            }
        } catch (err) {
            console.log('Otomatik kur çekilemedi:', err.message);
        }
    }

    // --- Manuel Kur Güncelleme (Bildirimli) ---
    async function fetchAndSavePrices() {
        const btn = document.getElementById('btn-kur-guncelle');
        if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; btn.style.pointerEvents = 'none'; }
        showToast('Kurlar çekiliyor...', 'loading');

        try {
            const [altinRes, dovizRes] = await Promise.all([
                fetch('https://api.genelpara.com/json/?list=altin'),
                fetch('https://api.genelpara.com/json/?list=doviz&sembol=USD')
            ]);
            if (!altinRes.ok || !dovizRes.ok) throw new Error('API yanıt hatası');
            const altinData = await altinRes.json();
            const dovizData = await dovizRes.json();
            if (!altinData.success || !dovizData.success) throw new Error('API veri hatası');

            const a = altinData.data;
            const d = dovizData.data;
            const mapping = {
                '24k': a.GA?.alis, '22k': a['22']?.alis, 'cumhuriyet': a.CMR?.alis,
                'yarim': a.Y?.alis, 'ceyrek': a.C?.alis, '18k': a['18']?.alis,
                '14k': a['14']?.alis, 'usd': d.USD?.alis
            };

            const oldPrices = { ...prices };
            let updated = 0;
            Object.entries(mapping).forEach(([key, value]) => {
                if (value) { prices[key] = parseFloat(value); updated++; }
            });

            if (updated === 0) throw new Error('Hiçbir kur değeri alınamadı');

            localStorage.setItem('goldPrices', JSON.stringify(prices));

            // Fiyat geçmişini kaydet
            const history = JSON.parse(localStorage.getItem('priceHistory') || '[]');
            history.push({ timestamp: Date.now(), prices: { ...prices } });
            if (history.length > 50) history.splice(0, history.length - 50);
            localStorage.setItem('priceHistory', JSON.stringify(history));

            updateUI();

            if (document.getElementById('stats-view').style.display === 'block') renderStats();

            if (currentPnlModalIndex >= 0 && currentPnlModalIndex < inventory.length) {
                const item = inventory[currentPnlModalIndex];
                if (item && (parseFloat(item.cost) || 0) > 0) populatePnlModal(item);
            }

            // Değişim bilgisi göster
            const changes = [];
            Object.entries(mapping).forEach(([key, value]) => {
                if (value && oldPrices[key]) {
                    const diff = ((parseFloat(value) - oldPrices[key]) / oldPrices[key] * 100);
                    if (Math.abs(diff) > 0.01) {
                        const arrow = diff > 0 ? '↑' : '↓';
                        changes.push(`${key.toUpperCase()} ${arrow}%${Math.abs(diff).toFixed(1)}`);
                    }
                }
            });

            const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const changeText = changes.length > 0 ? ` (${changes.slice(0, 3).join(', ')})` : '';
            showToast(`${updated} kurlar güncellendi${changeText} (${now})`, 'success');

        } catch (err) {
            console.error('API Hatası:', err);
            showToast('API bağlantısı kurulamadı', 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.style.opacity = ''; btn.style.pointerEvents = ''; }
        }
    }


    window.addEventListener('DOMContentLoaded', () => {
        try {
            const manifestJSON = {
                "name": "Varlıklarım - Altın & Zekat Takip",
                "short_name": "Varlıklarım",
                "description": "Altın portföyünüzü ve zekat yükümlülüklerinizi takip edin",
                "start_url": "./",
                "display": "standalone",
                "orientation": "portrait-primary",
                "background_color": "#F0FAFA",
                "theme_color": "#00939E",
                "categories": ["finance", "productivity"],
                "scope": "./",
                "lang": "tr",
                "dir": "ltr",
                "icons": [
                    {
                        "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwOTM5RSIgcng9IjIwIi8+PHRleHQgeT0iNjUlIiB4PSI5MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjUwcHgiIGZpbGw9IiNmZmYiPuKCujwvdGV4dD48L3N2Zz4=",
                        "sizes": "192x192",
                        "type": "image/svg+xml",
                        "purpose": "any maskable"
                    },
                    {
                        "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwOTM5RSIgcng9IjIwIi8+PHRleHQgeT0iNjUlIiB4PSI5MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjUwcHgiIGZpbGw9IiNmZmYiPuKCujwvdGV4dD48L3N2Zz4=",
                        "sizes": "512x512",
                        "type": "image/svg+xml",
                        "purpose": "any maskable"
                    }
                ]
            };
            const blob = new Blob([JSON.stringify(manifestJSON)], {type: 'application/json'});
            document.getElementById('manifest-link').setAttribute('href', URL.createObjectURL(blob));
        } catch(e) {}

        // Otomatik tema: sistem ayarını oku (localStorage öncelikli)
        try {
            const savedTheme = localStorage.getItem('theme');
            const defaultTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            document.documentElement.setAttribute('data-theme', defaultTheme);
            document.querySelectorAll('.settings-segment-option').forEach(b => {
                if (b.closest('.settings-row')?.querySelector('.settings-row-label')?.textContent === 'Tema') {
                    b.classList.toggle('is-active', b.textContent.trim() === (defaultTheme === 'light' ? 'Açık' : 'Koyu'));
                }
            });
        } catch(e) {}

        // Renk şeması yükle
        try {
            const savedColorScheme = localStorage.getItem('colorScheme') || 'teal';
            document.documentElement.setAttribute('data-color-scheme', savedColorScheme);
            setTimeout(() => {
                document.querySelectorAll('.settings-swatch').forEach(opt => {
                    opt.classList.toggle('is-active', opt.dataset.theme === savedColorScheme);
                });
            }, 100);
        } catch(e) {}

        // Yazı boyutu yükle
        try {
            const savedFontSize = localStorage.getItem('fontSize') || 'normal';
            document.documentElement.setAttribute('data-font-size', savedFontSize);
            document.querySelectorAll('.settings-segment-option').forEach(b => {
                if (b.closest('.settings-row')?.querySelector('.settings-row-label')?.textContent === 'Yazı Boyutu') {
                    b.classList.toggle('is-active', b.textContent.trim() === ({normal:'Normal', large:'Büyük', xlarge:'Çok B.'})[savedFontSize]);
                }
            });
        } catch(e) {}

        // Başlangıç view'ını göster
        initView('dashboard');

        updateUI();
        updateDebtsUI();
        updateExpensesUI();
        // Sayfa yüklenirken sessizce kurları güncelle
        fetchPricesSilent();

        // Navbar scroll detection — glassmorphism shadow
        const mainNav = document.querySelector('nav:not(.mobile-bottom-nav)');
        if (mainNav) {
            let lastScrollY = 0;
            let ticking = false;
            window.addEventListener('scroll', () => {
                lastScrollY = window.scrollY;
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        mainNav.classList.toggle('scrolled', lastScrollY > 8);
                        ticking = false;
                    });
                    ticking = true;
                }
            }, { passive: true });
        }

        // URL hash ile gizli sayfa yönlendirmesi (örn: #expenses)
        if (window.location.hash) {
            const hashTab = window.location.hash.replace('#', '');
            const validTabs = ['dashboard', 'stats', 'expenses', 'debts', 'settings'];
            if (validTabs.includes(hashTab)) {
                setTimeout(() => switchTab(hashTab), 100);
            }
        }
    });

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

        // Swipe-to-delete: check if swiping on a deletable item
        if (deltaX < 0) {
            const deleteBtn = e.target.closest('.debt-card, .sub-card, tr')?.querySelector('[onclick*="delete"]');
            if (deleteBtn) {
                deleteBtn.click();
                swipeTouchX = 0;
                return;
            }
        }

        const tabs = ['dashboard', 'stats', 'expenses', 'debts', 'settings'];
        const currentView = document.querySelector('[id$="-view"][style*="block"]')?.id.replace('-view', '') || 'dashboard';
        const currentIdx = tabs.indexOf(currentView);
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
        swipeTouchX = 0; // disable swipe during pull
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

    if ('serviceWorker' in navigator) {
        try {
            const swCode = "self.addEventListener('install', e => self.skipWaiting()); self.addEventListener('activate', e => self.clients.claim()); self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); });";
            const swBlob = new Blob([swCode], {type: 'application/javascript'});
            navigator.serviceWorker.register(URL.createObjectURL(swBlob)).catch(()=>{});
        } catch(e) {}
    }

    // --- PWA Install Prompt Handler ---
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const settingsInstallBtn = document.getElementById('settings-pwa-install-btn');
        if (settingsInstallBtn) settingsInstallBtn.style.display = 'inline-flex';
    });

    function installPWA() {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                const settingsInstallBtn = document.getElementById('settings-pwa-install-btn');
                if (settingsInstallBtn) settingsInstallBtn.style.display = 'none';
            }
            deferredPrompt = null;
        });
    }

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        const settingsInstallBtn = document.getElementById('settings-pwa-install-btn');
        if (settingsInstallBtn) settingsInstallBtn.style.display = 'none';
    });