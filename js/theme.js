// ═══════════════════════════════════════════════════════════
// theme.js — Theme & settings UI
// ═══════════════════════════════════════════════════════════

    function toggleTheme() {
        const doc = document.documentElement;
        const newTheme = doc.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        doc.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        if(document.getElementById('stats-view').style.display === 'block') renderStats();
    }

    // Tema Özelleştirme Fonksiyonları
    function changeThemeMode(mode) {
        document.documentElement.setAttribute('data-theme', mode);
        localStorage.setItem('theme', mode);
        document.querySelectorAll('.settings-segment-option').forEach(b => {
            if (b.closest('.settings-row')?.querySelector('.settings-row-label')?.textContent === 'Tema') {
                b.classList.toggle('is-active', b.textContent.trim() === (mode === 'light' ? 'Açık' : 'Koyu'));
            }
        });
        if(document.getElementById('stats-view').style.display === 'block') renderStats();
    }

    function changeColorScheme(scheme) {
        document.documentElement.setAttribute('data-color-scheme', scheme);
        localStorage.setItem('colorScheme', scheme);
        document.querySelectorAll('.settings-swatch').forEach(opt => {
            opt.classList.toggle('is-active', opt.dataset.theme === scheme);
        });
        showToast('Renk şeması değiştirildi', 'success');
    }

    function changeFontSize(size) {
        document.documentElement.setAttribute('data-font-size', size);
        localStorage.setItem('fontSize', size);
        document.querySelectorAll('.settings-segment-option').forEach(b => {
            if (b.closest('.settings-row')?.querySelector('.settings-row-label')?.textContent === 'Yazı Boyutu') {
                b.classList.toggle('is-active', b.textContent.trim() === ({normal:'Normal', large:'Büyük', xlarge:'Çok B.'})[size]);
            }
        });
        showToast('Yazı boyutu değiştirildi', 'success');
    }

    function saveGoalTarget() {
        const inp = document.getElementById('target-input');
        const val = inp ? inp.value : 1000000;
        localStorage.setItem('goldGoalTarget', val);
        const hint = document.getElementById('goal-save-hint');
        if (hint) {
            hint.textContent = '✅ Hedef kaydedildi: ' + Number(val).toLocaleString('tr-TR') + ' TL';
            hint.className = 'settings-goal-hint is-visible';
            hint.style.opacity = '1';
            hint.style.color = 'var(--green)';
            setTimeout(() => { hint.style.opacity = '0'; }, 3000);
        }
        updateUI();
        showToast('Hedef tutar kaydedildi', 'success');
    }

