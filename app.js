// --- Data & Mappings ---
    let inventory = [];
    try {
        const storedInv = JSON.parse(localStorage.getItem('goldInventory'));
        if (Array.isArray(storedInv)) inventory = storedInv;
    } catch(e) { console.error(e); }

    let debts = [];
    try {
        const storedDebts = JSON.parse(localStorage.getItem('goldDebts'));
        if (Array.isArray(storedDebts)) debts = storedDebts;
    } catch(e) { console.error(e); }

    let zakatHistory = [];
    try {
        const storedHistory = JSON.parse(localStorage.getItem('zakatHistoryRecords'));
        if (Array.isArray(storedHistory)) zakatHistory = storedHistory;
    } catch(e) { console.error(e); }

    // Gider Takip Sistemi
    let expenses = [];
    try {
        const storedExpenses = JSON.parse(localStorage.getItem('monthlyExpenses'));
        if (Array.isArray(storedExpenses)) expenses = storedExpenses;
    } catch(e) { console.error(e); }

    // Abonelik Takip Sistemi
    let subscriptions = [];
    try {
        const storedSubs = JSON.parse(localStorage.getItem('userSubscriptions'));
        if (Array.isArray(storedSubs)) subscriptions = storedSubs;
    } catch(e) { console.error(e); }

    const defaultPrices = { "24k": 3000, "22k": 2850, "cumhuriyet": 20500, "yarim": 10250, "ceyrek": 5125, "18k": 2250, "14k": 1750, "usd": 34.50 };
    let prices = { ...defaultPrices };
    try {
        const storedPrices = JSON.parse(localStorage.getItem('goldPrices'));
        if (storedPrices && typeof storedPrices === 'object') {
            prices = { ...defaultPrices, ...storedPrices };
        }
    } catch(e) { console.error(e); }

    let zakatNextDueDate = null;
    try {
        const stored = localStorage.getItem('zakatNextDueDate');
        if (stored) {
            const d = new Date(stored);
            if (!isNaN(d.getTime())) zakatNextDueDate = d;
        }
    } catch(e) { console.error(e); }

    const storedTarget = localStorage.getItem('goldGoalTarget');
    if(storedTarget) {
        const tInp = document.getElementById('target-input');
        if(tInp) tInp.value = storedTarget;
    }

    const typeNames = {
        "24k": "24 Ayar (Saf)", "22k": "22 Ayar (Bilezik)", "cumhuriyet": "Cumhuriyet",
        "yarim": "Yarım", "ceyrek": "Çeyrek", "18k": "18 Ayar", "14k": "14 Ayar"
    };

    const purities = { "24k": 1.0, "22k": 0.916, "18k": 0.750, "14k": 0.585, "cumhuriyet": 0.916, "yarim": 0.916, "ceyrek": 0.916 };
    const coinWeights = { "cumhuriyet": 7.216, "yarim": 3.608, "ceyrek": 1.804 };

    const dateInput = document.getElementById('date');
    if(dateInput) dateInput.valueAsDate = new Date();
    
    const debtDateInput = document.getElementById('debt-date');
    if(debtDateInput) debtDateInput.valueAsDate = new Date();
    
    const expenseDateInput = document.getElementById('expense-date');
    if(expenseDateInput) expenseDateInput.valueAsDate = new Date();

    const subStartDateInput = document.getElementById('sub-start-date');
    if(subStartDateInput) subStartDateInput.valueAsDate = new Date();

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

    function switchTab(tab, direction) {
        const views = ['dashboard-view', 'stats-view', 'expenses-view', 'debts-view', 'settings-view'];
        const targetId = tab + '-view';
        const isMobile = window.innerWidth <= 600;

        // Determine slide direction for mobile transitions
        const currentView = document.querySelector('[id$="-view"]:not([style*="display: none"])')?.id || 'dashboard-view';
        const currentTab = currentView.replace('-view', '');
        const tabOrder = ['dashboard', 'stats', 'expenses', 'debts', 'settings'];
        const fromIdx = tabOrder.indexOf(currentTab);
        const toIdx = tabOrder.indexOf(tab);
        const slideDir = (toIdx > fromIdx) ? 'slide-left' : 'slide-right';

        views.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (id === targetId) {
                el.style.display = 'block';
                el.classList.remove('view-enter', 'slide-left', 'slide-right');
                void el.offsetWidth;
                if (isMobile) {
                    el.classList.add(slideDir);
                } else {
                    el.classList.add('view-enter');
                }
            } else {
                el.style.display = 'none';
                el.classList.remove('view-enter', 'slide-left', 'slide-right');
            }
        });
        
        // Trigger card stagger: remove & re-add animation on cards inside target
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
            targetEl.querySelectorAll('.settings-card, .stat-card, .debt-card, .card').forEach((card, i) => {
                card.style.animation = 'none';
                card.offsetHeight; // reflow
                card.style.animation = '';
            });
        }
        
        document.getElementById('nav-dashboard')?.classList.toggle('active', tab === 'dashboard');
        document.getElementById('nav-stats')?.classList.toggle('active', tab === 'stats');
        document.getElementById('nav-debts')?.classList.toggle('active', tab === 'debts');
        document.getElementById('nav-expenses')?.classList.toggle('active', tab === 'expenses');
        document.getElementById('nav-settings')?.classList.toggle('active', tab === 'settings');
        
        // Mobile navigation update
        document.querySelectorAll('.mobile-nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.target === tab);
        });
        
        if(tab === 'stats') renderStats();
        if(tab === 'debts') updateDebtsUI();
        if(tab === 'expenses') updateExpensesUI();
        if(tab === 'dashboard') updateUI();
    }

    function openModal(id) {
        document.getElementById(id).classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeModal(id) {
        document.getElementById(id).classList.remove('active');
        document.body.style.overflow = '';
    }
    function closePaymentModal() { closeModal('payment-modal'); }
    function closeZakatConfirmModal() { closeModal('zakat-confirm-modal'); }
    function closeDebtDetailModal() { closeModal('debt-detail-modal'); }
    let currentPnlModalIndex = -1;
    function closePnlModal() { currentPnlModalIndex = -1; closeModal('pnl-detail-modal'); }

    function openPnlModal(index) {
        const item = inventory[index];
        if (!item) return;

        const cost = parseFloat(item.cost) || 0;
        if (cost <= 0) { showToast('Bu kayıtta maliyet bilgisi bulunmuyor', 'error'); return; }

        currentPnlModalIndex = index;
        populatePnlModal(item);
        openModal('pnl-detail-modal');
    }

    function populatePnlModal(item) {
        const cost = parseFloat(item.cost) || 0;
        const w = parseFloat(item.weight) || 0;
        const val = w * (prices[item.ayar] || 0);
        const profit = val - cost;
        const pct = (profit / cost) * 100;
        const isCoin = ["cumhuriyet", "yarim", "ceyrek"].includes(item.ayar);
        const unit = isCoin ? 'adet' : 'g';
        const unitCost = w > 0 ? cost / w : 0;
        const unitPrice = prices[item.ayar] || 0;
        const pure = getPureWeight(item);
        const isProfit = profit >= 0;
        const cls = isProfit ? 'is-profit' : 'is-loss';
        const diffCls = isProfit ? '' : 'pnl-negative-box';
        const sign = profit >= 0 ? '+' : '';
        const pnlCls = isProfit ? 'pnl-positive' : 'pnl-negative';
        const dateParts = (item.date || '').split('-');
        const dateFormatted = dateParts.length === 3 ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}` : (item.date || '-');

        document.getElementById('pnl-modal-title').textContent = typeNames[item.ayar] || item.ayar;
        document.getElementById('pnl-modal-type-sub').textContent = isCoin ? `${w} Adet` : `${w.toFixed(2)} g • ${pure.toFixed(2)} g saf`;

        document.getElementById('pnl-modal-hero-icon').className = 'pnl-modal-hero-icon ' + cls;
        document.getElementById('pnl-modal-hero-label').textContent = isProfit ? 'Kâr Elde Edildi' : 'Zarar Oluştu';
        document.getElementById('pnl-modal-total').innerHTML = `<span class="${pnlCls}">${sign}${profit.toLocaleString('tr-TR', {maximumFractionDigits:0})} TL</span>`;
        document.getElementById('pnl-modal-pct').className = 'pnl-modal-hero-pct ' + cls;
        document.getElementById('pnl-modal-pct').textContent = `Ana paraya göre ${sign}%${pct.toFixed(1)}`;

        document.getElementById('pnl-modal-buy-price').textContent = unitCost.toFixed(0);
        document.getElementById('pnl-modal-buy-unit').textContent = 'TL/' + unit;
        document.getElementById('pnl-modal-cur-price').textContent = unitPrice.toFixed(0);
        document.getElementById('pnl-modal-cur-unit').textContent = 'TL/' + unit;

        const unitDiff = unitPrice - unitCost;
        const diffBox = document.getElementById('pnl-modal-diff-box');
        diffBox.className = 'pnl-modal-compact-box pnl-modal-compact-box-diff' + (unitDiff < 0 ? ' pnl-negative-box' : '');
        document.getElementById('pnl-modal-diff-price').textContent = (unitDiff >= 0 ? '+' : '') + unitDiff.toFixed(0);
        document.getElementById('pnl-modal-diff-price').className = 'pnl-modal-compact-value' + (unitDiff >= 0 ? ' pnl-positive' : ' pnl-negative');

        document.getElementById('pnl-modal-weight').textContent = isCoin ? `${w} Adet` : `${w.toFixed(2)} g`;
        document.getElementById('pnl-modal-pure').textContent = pure.toFixed(2) + ' g';
        document.getElementById('pnl-modal-date').textContent = dateFormatted;
        document.getElementById('pnl-modal-note').textContent = item.note || '—';

        document.getElementById('pnl-modal-cost').innerHTML = `<span style="color:var(--text-tertiary);">${cost.toLocaleString('tr-TR', {maximumFractionDigits:0})} TL</span>`;
        document.getElementById('pnl-modal-value').innerHTML = `<span style="color:var(--text-tertiary);">${val.toLocaleString('tr-TR', {maximumFractionDigits:0})} TL</span>`;
        document.getElementById('pnl-modal-diff-total').innerHTML = `<span class="${pnlCls}">${sign}${profit.toLocaleString('tr-TR', {maximumFractionDigits:0})} TL</span>`;
        document.getElementById('pnl-modal-return').innerHTML = `<span class="${pnlCls}">${sign}%${pct.toFixed(1)}</span>`;
    }

    function getPureWeight(item) {
        if(!item || !item.ayar || typeof item.weight === 'undefined') return 0;
        const w = parseFloat(item.weight) || 0;
        if (["cumhuriyet", "yarim", "ceyrek"].includes(item.ayar)) {
            return w * (coinWeights[item.ayar] || 0) * (purities[item.ayar] || 1);
        }
        return w * (purities[item.ayar] || 1);
    }

    const searchInp = document.getElementById('searchInput');
    if(searchInp) {
        searchInp.addEventListener('input', function(e) {
            const term = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#inventory-table tbody tr');
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }

    let currentSort = { col: -1, asc: true };
    function sortTable(colIndex, isNumeric) {
        const tbody = document.querySelector('#inventory-table tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const asc = currentSort.col === colIndex ? !currentSort.asc : true;
        currentSort = { col: colIndex, asc: asc };

        rows.sort((a, b) => {
            let valA = a.cells[colIndex].innerText.trim();
            let valB = b.cells[colIndex].innerText.trim();
            
            if (isNumeric) {
                valA = parseFloat((valA.match(/[+-]?[\d.,]+/) || ['0'])[0].replace(/\./g, '').replace(',', '.'));
                valB = parseFloat((valB.match(/[+-]?[\d.,]+/) || ['0'])[0].replace(/\./g, '').replace(',', '.'));
            }

            if (valA < valB) return asc ? -1 : 1;
            if (valA > valB) return asc ? 1 : -1;
            return 0;
        });
        rows.forEach(row => tbody.appendChild(row));
    }

    function updateUI() {
        // Fiyat geçmişi göstergesi
        const lastUpdateEl = document.getElementById('price-last-update');
        if (lastUpdateEl) {
            const last = getLastPriceUpdate();
            if (last) {
                const d = new Date(last.timestamp);
                const timeStr = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                const dateStr = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
                lastUpdateEl.textContent = `${dateStr} ${timeStr}`;
            } else {
                lastUpdateEl.textContent = '';
            }
        }

        const tbody = document.querySelector('#inventory-table tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        let totalVal = 0, totalPure = 0, totalCost = 0;
        let itemsWithCost = 0, totalProfit = 0;

        inventory.forEach((item, index) => {
            const pure = getPureWeight(item);
            const w = parseFloat(item.weight) || 0;
            const val = w * (prices[item.ayar] || 0);
            const cost = parseFloat(item.cost) || 0;
            totalPure += pure;
            totalVal += val;
            totalCost += cost;

            const hasCost = cost > 0;
            if (hasCost) itemsWithCost++;
            const profit = hasCost ? val - cost : 0;
            totalProfit += profit;

            const isCoin = ["cumhuriyet", "yarim", "ceyrek"].includes(item.ayar);
            const dateParts = (item.date || '').split('-');
            const dateFormatted = dateParts.length === 3 ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}` : (item.date || '-');
            const dayNames = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
            const dayName = item.date ? dayNames[new Date(item.date).getDay()] : '';

            let pnlHtml = '<span style="color:var(--text-tertiary); font-size:0.75rem;">—</span>';
            if (hasCost) {
                const pct = cost > 0 ? ((profit / cost) * 100) : 0;
                const cls = profit >= 0 ? 'pnl-positive' : 'pnl-negative';
                const unit = isCoin ? 'adet' : 'g';
                const unitCost = w > 0 ? cost / w : 0;
                const unitPrice = prices[item.ayar] || 0;
                pnlHtml = `<span class="row-value ${cls}">${profit >= 0 ? '+' : ''}${profit.toLocaleString('tr-TR', {maximumFractionDigits:0})} TL</span><br><span style="font-size:0.7rem; color:var(--text-tertiary);">${pct >= 0 ? '+' : ''}%${pct.toFixed(1)}</span><br><span style="font-size:0.62rem; color:var(--text-tertiary);">Alış: ${unitCost.toFixed(0)} TL/${unit} → Güncel: ${unitPrice.toFixed(0)} TL/${unit}</span>`;
            }

            tbody.insertAdjacentHTML('beforeend', `
                <tr onclick="openPnlModal(${index})" style="cursor:pointer;">
                    <td data-label="Tarih">
                        <div class="td-date">
                            <span class="td-date-main">${dateFormatted}</span>
                            <span class="td-date-sub">${dayName}</span>
                        </div>
                    </td>
                    <td data-label="Tür"><span class="ayar-tag">${typeNames[item.ayar] || item.ayar}</span></td>
                    <td data-label="Miktar" style="font-variant-numeric:tabular-nums;">${isCoin ? `${w} Adet` : `${w.toFixed(2)} g`}</td>
                    <td data-label="Saf" style="font-variant-numeric:tabular-nums; color:var(--text-secondary);">${pure.toFixed(2)} g</td>
                    <td data-label="Değer"><span class="row-value">${val.toLocaleString('tr-TR', {maximumFractionDigits:0})} TL</span></td>
                    <td data-label="Kar/Zarar" style="text-align:center;">${pnlHtml}</td>
                    <td data-label="Not" style="color:var(--text-tertiary); font-size:0.8rem;">${item.note || '<span style="color:var(--border-strong);">—</span>'}</td>
                    <td data-label="İşlem" style="text-align:right;"><button class="btn-delete" onclick="event.stopPropagation();deleteItem(${index})" title="Kaydı Sil"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></td>
                </tr>
            `);
        });

        if (inventory.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg></div><strong>Kayıt Bulunamadı</strong><p>Sol panelden ilk kaydınızı oluşturabilirsiniz.</p></div></td></tr>`;
        }

        document.getElementById('total-val').textContent = totalVal.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
        document.getElementById('total-pure').textContent = totalPure.toFixed(2) + ' g';
        document.getElementById('record-count').textContent = `${inventory.length} Kayıt`;
        
        const usdExchange = prices.usd || defaultPrices.usd;
        const totalUSD = totalVal / usdExchange;
        document.getElementById('total-usd').textContent = `~ ${totalUSD.toLocaleString('tr-TR', {maximumFractionDigits:0})} USD`;

        // Toplam Borç Değerini Getir (Ödenenler Düşülmüş - Zekat Entegrasyonu İçin)
        let totalDebtVal = 0;
        debts.forEach(d => {
            const paid = parseFloat(d.paid) || 0;
            totalDebtVal += Math.max((parseFloat(d.amount) || 0) - paid, 0);
        });

        // Net Değer
        const netWorth = totalVal - totalDebtVal;
        const netWorthEl = document.getElementById('net-worth-val');
        const netWorthSub = document.getElementById('net-worth-sub');
        if (netWorthEl) {
            netWorthEl.textContent = netWorth.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
            netWorthEl.className = 'stat-value' + (netWorth >= 0 ? ' is-teal' : ' is-red');
        }
        if (netWorthSub) {
            const ratio = totalVal > 0 ? ((netWorth / totalVal) * 100) : 0;
            netWorthSub.textContent = `Varlıkların %${ratio.toFixed(0)}'ı net durumda`;
        }

        const zBanner = document.getElementById('zekat-banner');
        const zBadge = document.getElementById('zekat-badge-status');
        const zVal = document.getElementById('zekat-val');
        const nBar = document.getElementById('nisap-bar');
        const nPct = document.getElementById('nisap-pct');
        const zLabel = document.getElementById('zekat-label');
        const hBox = document.getElementById('hijri-box');

        const nisapRatio = Math.min((totalPure / 80.18) * 100, 100);
        nBar.style.width = nisapRatio + '%';
        nPct.textContent = `%${nisapRatio.toFixed(1)}`;
        hBox.style.display = 'flex';

        // İkili Detay Tutar Hesaplamaları
        const zakatWithoutDebts = totalVal / 40;
        const netZakatBase = Math.max(totalVal - totalDebtVal, 0);
        const zakatWithDebts = netZakatBase / 40;

        document.getElementById('zakat-without-debts').textContent = zakatWithoutDebts.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
        document.getElementById('zakat-with-debts').textContent = zakatWithDebts.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';

        // Borç sonrası kalan net varlığın saf altın karşılığını bul (Nisap kontrolü için)
        const pureGramPrice24k = prices["24k"] || defaultPrices["24k"];
        const netPureGoldAfterDebts = pureGramPrice24k > 0 ? (netZakatBase / pureGramPrice24k) : 0;

        if (totalPure >= 80.18) {
            // Borç düşüldükten sonraki net varlık kontrolü
            if (netZakatBase <= 0 || netPureGoldAfterDebts < 80.18) {
                zBanner.classList.add('is-inactive');
                zBadge.className = 'zekat-badge is-inactive';
                zBadge.textContent = "Borç Nedeniyle Muaf";
                zLabel.textContent = "Tahakkuk Eden Net Zekat Tutarı";
                zVal.textContent = "0,00 TL";
                nBar.classList.add('teal');
                document.getElementById('btn-pay-zakat').style.display = 'none';
                document.getElementById('nisap-text-left').textContent = "Borçlarınız düşüldüğünde kalan net varlık nisap sınırının altında kalıyor.";
            } else {
                zBanner.classList.remove('is-inactive');
                zBadge.className = 'zekat-badge';
                zBadge.textContent = "Zekat Yükümlüsü";
                zLabel.textContent = "Tahakkuk Eden Net Zekat Tutarı";
                zVal.textContent = zakatWithDebts.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
                nBar.classList.remove('teal');
                document.getElementById('btn-pay-zakat').style.display = 'inline-block';
                document.getElementById('nisap-text-left').textContent = "Nisap sınırına ulaşıldı.";
            }
            
            const now = new Date();
            const dueDate = zakatNextDueDate && zakatNextDueDate > now ? zakatNextDueDate : new Date(now.getTime() + 354 * 24 * 60 * 60 * 1000);
            const remainingDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            const fG = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
            document.getElementById('zakat-date-greg').textContent = `${fG.format(dueDate)} (${remainingDays} gün kaldı)`;
            
            try {
                const fH = new Intl.DateTimeFormat('tr-TR-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' });
                document.getElementById('zakat-date-hijri').textContent = fH.format(dueDate) + ' (Hicri)';
            } catch(e) { document.getElementById('zakat-date-hijri').textContent = "Hicri Dönüm Vakti"; }
        } else {
            zBanner.classList.add('is-inactive');
            zBadge.className = 'zekat-badge is-inactive';
            zBadge.textContent = "Nisap Altı";
            zLabel.textContent = "Tahakkuk Eden Net Zekat Tutarı";
            zVal.textContent = "0,00 TL";
            nBar.classList.add('teal');
            document.getElementById('btn-pay-zakat').style.display = 'none';
            document.getElementById('nisap-text-left').textContent = `Nisap sınırına ${(80.18 - totalPure).toFixed(2)} g kaldı`;
            document.getElementById('zakat-date-greg').textContent = "Nisap Sınırı Bekleniyor";
            document.getElementById('zakat-date-hijri').textContent = "-";
        }
    }

    const addForm = document.getElementById('add-form');
    if(addForm) {
        addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const dateVal = document.getElementById('date').value;
            const weightVal = parseFloat(document.getElementById('weight').value);
            const ayarVal = document.getElementById('ayar').value;

            if (!dateVal) { showToast('Lütfen tarih seçin', 'error'); return; }
            if (isNaN(weightVal) || weightVal <= 0) { showToast('Geçerli bir miktar girin (> 0)', 'error'); return; }
            
            const isCoin = ["cumhuriyet", "yarim", "ceyrek"].includes(ayarVal);
            if (isCoin) {
                if (weightVal !== Math.floor(weightVal)) { showToast('Adet tam sayı olmalıdır', 'error'); return; }
                if (weightVal > 10000) { showToast('Adet miktarı çok yüksek, kontrol edin', 'error'); return; }
            } else {
                if (weightVal > 10000) { showToast('Gram miktarı çok yüksek, kontrol edin', 'error'); return; }
            }

            inventory.push({
                date: dateVal,
                ayar: ayarVal,
                weight: weightVal,
                cost: parseFloat(document.getElementById('cost').value) || 0,
                note: document.getElementById('note').value
            });
            localStorage.setItem('goldInventory', JSON.stringify(inventory));
            document.getElementById('weight').value = '';
            document.getElementById('cost').value = '';
            document.getElementById('note').value = '';
            showToast('Varlık başarıyla eklendi', 'success');
            closeFormSheet();
            updateUI();
        });
    }

    const ayarSelect = document.getElementById('ayar');
    if(ayarSelect) {
        ayarSelect.addEventListener('change', (e) => {
            const isCoin = ["cumhuriyet", "yarim", "ceyrek"].includes(e.target.value);
            document.getElementById('weight-label').textContent = isCoin ? "Adet" : "Miktar (Gram)";
            document.getElementById('weight').placeholder = isCoin ? "Örn: 2" : "Örn: 10.5";
            document.getElementById('cost-label').textContent = isCoin ? "Toplam Maliyet (TL) — İsteğe Bağlı" : "Toplam Maliyet (TL) — İsteğe Bağlı";
        });
    }

    function deleteItem(index) {
        if(confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
            inventory.splice(index, 1);
            localStorage.setItem('goldInventory', JSON.stringify(inventory));
            updateUI();
        }
    }

    // --- Borç Takip Fonksiyonları ---
    const debtCategoryNames = {
        'kredi-karti': 'Kredi Kartı',
        'kredi': 'Kredi',
        'taksitli': 'Taksitli Alışveriş',
        'nakit-avans': 'Nakit Avans',
        'sahis': 'Şahıs',
        'kurum': 'Kurum',
        'diger': 'Diğer'
    };
    const debtCategoryIcons = {
        'kredi-karti': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
        'kredi': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M12 8v8M9 11h6"/></svg>',
        'taksitli': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>',
        'nakit-avans': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M8 10h8"/></svg>',
        'sahis': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        'kurum': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h.01M9 13h.01M9 17h.01"/></svg>',
        'diger': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>'
    };

    // Taksitli borç formu: panel aç/kapat, otomatik hesaplama
    function toggleInstallmentFields() {
        const cat = document.getElementById('debt-category').value;
        const panel = document.getElementById('installment-panel');
        const ekstrePanel = document.getElementById('ekstre-panel');
        const interestGroup = document.getElementById('debt-interest-group');
        const amountLabel = document.getElementById('debt-amount-label');
        const dateLabel = document.getElementById('debt-date-label');
        const installmentTotal = document.getElementById('debt-installment-total');
        const hint = document.getElementById('installment-hint');

        const showForCategories = ['taksitli', 'kredi', 'kredi-karti', 'nakit-avans'];
        if (showForCategories.includes(cat)) {
            panel.classList.add('is-visible');
            amountLabel.textContent = 'Toplam Tutar (TL)';
            dateLabel.textContent = 'İlk Taksit Tarihi';
            installmentTotal.removeAttribute('required');
            hint.innerHTML = '<em>İsteğe bağlı:</em> Taksit bilgisi girilmezse tek seferlik borç olarak kaydedilir.';
        } else {
            panel.classList.remove('is-visible');
            amountLabel.textContent = 'Tutar (TL)';
            dateLabel.textContent = 'Vade Tarihi';
            installmentTotal.removeAttribute('required');
            hint.innerHTML = '';
        }

        // Faiz alanı: kredi ve nakit-avans için göster, taksitli/kk için gizle
        if (cat === 'kredi' || cat === 'nakit-avans') {
            interestGroup.style.display = '';
        } else {
            interestGroup.style.display = 'none';
        }

        if (cat === 'kredi-karti') {
            ekstrePanel.classList.add('is-visible');
        } else {
            ekstrePanel.classList.remove('is-visible');
        }
    }

    function calcLoanMonthly(amount, ratePercent, numPayments) {
        if (!numPayments || numPayments <= 0) return 0;
        if (!ratePercent || ratePercent <= 0) return amount / numPayments;
        const r = ratePercent / 100 / 12; // Aylık faiz oranı
        if (r <= 0) return amount / numPayments;
        const compound = Math.pow(1 + r, numPayments);
        return amount * r * compound / (compound - 1);
    }

    // Taksit ipucu hesaplama
    function updateInstallmentHint() {
        const total = parseFloat(document.getElementById('debt-installment-total').value);
        const monthly = parseFloat(document.getElementById('debt-installment-monthly').value);
        const amount = parseFloat(document.getElementById('debt-amount').value);
        const interest = parseFloat(document.getElementById('debt-interest-rate').value);
        const hint = document.getElementById('installment-hint');
        const cat = document.getElementById('debt-category').value;
        const showForCategories = ['taksitli', 'kredi', 'kredi-karti', 'nakit-avans'];

        if (!showForCategories.includes(cat) || !total || total < 2) { hint.innerHTML = ''; return; }

        const hasInterest = interest > 0 && (cat === 'kredi' || cat === 'nakit-avans');

        if (total > 0 && amount > 0 && (!monthly || monthly <= 0)) {
            let calc, label;
            if (hasInterest) {
                calc = calcLoanMonthly(amount, interest, total);
                const totalPay = calc * total;
                const totalInterest = totalPay - amount;
                label = `Aylık taksit (faiz dahil): <strong>${calc.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</strong> — Toplam faiz: ${totalInterest.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL`;
            } else {
                calc = amount / total;
                label = `Otomatik hesaplanan aylık taksit: <strong>${calc.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</strong>`;
            }
            hint.innerHTML = label;
        } else if (total > 0 && monthly > 0 && (!amount || amount <= 0)) {
            const calc = monthly * total;
            hint.innerHTML = `Hesaplanan toplam tutar: <strong>${calc.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</strong>`;
        } else if (total > 0 && monthly > 0 && amount > 0) {
            if (hasInterest) {
                const calc = calcLoanMonthly(amount, interest, total);
                const totalPay = calc * total;
                const totalInterest = totalPay - amount;
                hint.innerHTML = `Aylık taksit (faiz dahil): <strong>${calc.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</strong> — Toplam faiz: ${totalInterest.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL`;
            } else {
                const diff = Math.abs(amount - (monthly * total));
                if (diff > 0.01) {
                    hint.innerHTML = `Tutar × Taksit = <strong>${(monthly * total).toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</strong> (Toplam tutarla uyuşmuyor)`;
                } else {
                    hint.innerHTML = `<strong>${total} taksit × ${monthly.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</strong> = ${amount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL ✓`;
                }
            }
        } else {
            hint.innerHTML = '';
        }

        if (cat === 'kredi-karti') {
            const ratio = parseFloat(document.getElementById('debt-min-payment-ratio').value) || 40;
            const minPayInput = document.getElementById('debt-min-payment');
            const aAmount = parseFloat(document.getElementById('debt-amount').value);
            if (aAmount > 0 && (!minPayInput.value || parseFloat(minPayInput.value) <= 0)) {
                const calcMin = Math.round(aAmount * ratio / 100 * 100) / 100;
                minPayInput.placeholder = `~ ${calcMin.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL (borcun %${ratio})`;
            }
        }
    }

    ['debt-installment-total', 'debt-installment-monthly', 'debt-amount', 'debt-interest-rate', 'debt-min-payment-ratio'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateInstallmentHint);
    });

    function addDebt(e) {
        e.preventDefault();
        const dName = document.getElementById('debt-name').value.trim();
        const dAmount = parseFloat(document.getElementById('debt-amount').value);
        const dDate = document.getElementById('debt-date').value;
        const dCategory = document.getElementById('debt-category').value;

        if(!dName) { showToast('Borç adı boş olamaz', 'error'); return; }
        if(dName.length > 100) { showToast('Borç adı çok uzun (maks 100 karakter)', 'error'); return; }
        if(isNaN(dAmount) || dAmount <= 0) { showToast('Geçerli bir tutar girin (> 0)', 'error'); return; }
        if(dAmount > 10000000) { showToast('Tutar çok yüksek, kontrol edin', 'error'); return; }
        if(!dDate) { showToast('Vade/taksit tarihi seçin', 'error'); return; }

        const debtObj = { name: dName, amount: dAmount, date: dDate, category: dCategory || 'diger' };

        const interestRate = parseFloat(document.getElementById('debt-interest-rate').value);
        const showForCategories = ['taksitli', 'kredi', 'kredi-karti', 'nakit-avans'];
        if (showForCategories.includes(dCategory)) {
            const instTotal = parseInt(document.getElementById('debt-installment-total').value) || 0;
            let instMonthly = parseFloat(document.getElementById('debt-installment-monthly').value) || 0;
            if (instTotal >= 2) {
                if (!instMonthly || instMonthly <= 0) {
                    if (interestRate > 0 && (dCategory === 'kredi' || dCategory === 'nakit-avans')) {
                        instMonthly = calcLoanMonthly(dAmount, interestRate, instTotal);
                    } else {
                        instMonthly = dAmount / instTotal;
                    }
                }
                if (instMonthly <= 0) {
                    showToast('Taksit tutarı hesaplanamadı, kontrol edin', 'error');
                    return;
                }
                debtObj.installmentTotal = instTotal;
                debtObj.installmentMonthly = Math.round(instMonthly * 100) / 100;
                debtObj.installmentPaid = 0;
            }
        }

        if (interestRate > 0 && (dCategory === 'kredi' || dCategory === 'nakit-avans')) {
            debtObj.interestRate = interestRate;
        }

        if (dCategory === 'kredi-karti') {
            const sDay = parseInt(document.getElementById('debt-statement-day').value);
            const dDay = parseInt(document.getElementById('debt-due-day').value);
            const ratio = parseFloat(document.getElementById('debt-min-payment-ratio').value) || 40;
            let minPay = parseFloat(document.getElementById('debt-min-payment').value);
            debtObj.minPaymentRatio = ratio;
            if (!minPay || minPay <= 0) {
                minPay = Math.round(dAmount * ratio / 100 * 100) / 100;
            }
            if (sDay) debtObj.statementDay = sDay;
            if (dDay) debtObj.dueDay = dDay;
            if (minPay && minPay > 0) debtObj.minPayment = minPay;
        }

        debts.push(debtObj);
        localStorage.setItem('goldDebts', JSON.stringify(debts));

        document.getElementById('debt-name').value = '';
        document.getElementById('debt-amount').value = '';
        document.getElementById('debt-date').valueAsDate = new Date();
        document.getElementById('debt-installment-total').value = '';
        document.getElementById('debt-installment-monthly').value = '';
        document.getElementById('debt-interest-rate').value = '';
        document.getElementById('installment-hint').innerHTML = '';
        document.getElementById('debt-statement-day').value = '';
        document.getElementById('debt-due-day').value = '';
        document.getElementById('debt-min-payment').value = '';
        document.getElementById('debt-min-payment-ratio').value = '40';
        showToast('Borç başarıyla eklendi', 'success');
        closeFormSheet();
        updateDebtsUI();
        updateUI();
    }

    function deleteDebt(index) {
        if(confirm('Bu borç kaydını silmek istediğinize emin misiniz?')) {
            debts.splice(index, 1);
            localStorage.setItem('goldDebts', JSON.stringify(debts));
            updateDebtsUI();
            updateUI();
        }
    }

    function filterDebts() {
        updateDebtsUI();
    }

    function getInstallmentProgress(debt) {
        if (!debt.installmentTotal || debt.installmentTotal < 2) return null;
        // installmentPaid varsa (0 dahil) onu kullan, yoksa zaman bazlı hesapla
        let paid;
        if (typeof debt.installmentPaid === 'number') {
            paid = Math.min(Math.max(debt.installmentPaid, 0), debt.installmentTotal);
        } else {
            const startDate = new Date(debt.date);
            const now = new Date();
            const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
            paid = Math.min(Math.max(monthsDiff, 0), debt.installmentTotal);
        }
        const remaining = debt.installmentTotal - paid;
        const remainingAmount = remaining * (debt.installmentMonthly || 0);
        const pct = Math.min((paid / debt.installmentTotal) * 100, 100);
        return { paid, total: debt.installmentTotal, remaining, remainingAmount, monthly: debt.installmentMonthly, pct, isDone: paid >= debt.installmentTotal };
    }

    function updateDebtsUI() {
        const container = document.getElementById('debt-list');
        if(!container) return;
        container.innerHTML = '';
        let totalAssetVal = 0;
        inventory.forEach(item => {
            totalAssetVal += (parseFloat(item.weight) || 0) * (prices[item.ayar] || 0);
        });

        const filterCat = document.getElementById('debt-filter')?.value || 'all';
        const filtered = filterCat === 'all' ? debts : debts.filter(d => (d.category || 'diger') === filterCat);

        filtered.forEach((debt) => {
            const paid = parseFloat(debt.paid) || 0;
            const remaining = Math.max(debt.amount - paid, 0);
            const originalIndex = debts.indexOf(debt);
            const dateParts = (debt.date || '').split('-');
            const dateFormatted = dateParts.length === 3 ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}` : (debt.date || '-');
            const cat = debt.category || 'diger';
            const catName = debtCategoryNames[cat] || 'Diğer';
            const catTag = `<span class="debt-card-badge"><span class="debt-card-badge-dot"></span>${catName}</span>`;

            // Taksit progress
            const prog = getInstallmentProgress(debt);
            let installmentBlock = '';
            if (prog) {
                const fillCls = prog.isDone ? 'green' : 'teal';
                installmentBlock = `
                    <div class="debt-installment-progress">
                        <div class="dip-header">
                            <span>Taksit ${prog.paid}/${prog.total}</span>
                            <span>%${prog.pct.toFixed(0)}</span>
                        </div>
                        <div class="dip-track"><div class="dip-fill ${fillCls}" style="width:${prog.pct}%"></div></div>
                        <div class="${prog.isDone ? 'dip-done' : 'dip-detail'}">${prog.isDone ? '✓ Tamamlandı' : `Kalan ${Math.ceil(prog.remaining)} taksit (${prog.remainingAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL)`}</div>
                    </div>`;
            }

            const amountMonthly = prog && !prog.isDone ? `<div class="debt-card-amount-monthly">Aylık ${prog.monthly.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div>` : '';
            const amountDate = !prog ? `<div class="debt-card-date"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${dateFormatted}</div>` : '';

            // Ödeme progress
            let paymentBlock = '';
            if (paid > 0) {
                const payPct = Math.min((paid / debt.amount) * 100, 100);
                const isFullyPaid = remaining <= 0;
                paymentBlock = `
                    <div class="debt-card-payment">
                        <div class="debt-card-payment-row">
                            <div class="debt-card-payment-stats">
                                <span class="stat-paid">✓ ${paid.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
                                <span class="stat-remaining">Kalan ${remaining.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
                            </div>
                        </div>
                        <div class="debt-card-bar">
                            <div class="debt-card-bar-fill ${isFullyPaid ? 'done' : 'partial'}" style="width:${payPct}%"></div>
                        </div>
                    </div>`;
            }

            // Aksiyon butonları
            const isFullyPaid = remaining <= 0;
            const payBtnHTML = isFullyPaid
                ? `<span class="debt-action-paid"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px;"><polyline points="20 6 9 17 4 12"/></svg>Ödendi</span>`
                : `<button class="debt-action-btn debt-action-pay" onclick="payDebt(${originalIndex})" title="Ödeme Yap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M8 10h8"/></svg>
                    Ödeme Yap
                   </button>`;

            container.insertAdjacentHTML('beforeend', `
                <div class="debt-card" data-category="${cat}" onclick="openDebtDetail(${originalIndex})" style="cursor:pointer;">
                    <div class="debt-card-top">
                        <div class="debt-card-info">
                            ${catTag}
                            <div class="debt-card-name">${debt.name}</div>
                            <div class="debt-card-meta">${amountDate}</div>
                        </div>
                        <div class="debt-card-amount">
                            <div class="debt-card-amount-label">Borç</div>
                            <div class="debt-card-amount-val">${debt.amount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div>
                            ${amountMonthly}
                        </div>
                    </div>
                    ${paymentBlock}
                    ${installmentBlock}
                    <div class="debt-card-bottom" onclick="event.stopPropagation()">
                        <span style="font-size:0.7rem; color:var(--text-tertiary); font-weight:500;">
                            ${prog || paid > 0 ? '' : 'Henüz ödeme yapılmadı'}
                        </span>
                        <div class="debt-card-actions">
                            ${payBtnHTML}
                            <button class="debt-action-btn debt-action-delete" onclick="deleteDebt(${originalIndex})" title="Borcu Sil">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            `);
        });

        if(filtered.length === 0) {
            const msg = filterCat === 'all' ? 'Tüm borçlarınız ödenmiş veya hiç eklenmemiş görünüyor.' : 'Bu kategoride borç bulunmuyor.';
            container.innerHTML = `<div class="empty-state" style="padding:3rem 1rem;"><div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><strong>Borç Kaydı Bulunmuyor</strong><p>${msg}</p></div>`;
        }

        let displayTotal = 0;
        let displayPaid = 0;
        const sourceList = filterCat === 'all' ? debts : filtered;
        sourceList.forEach(d => { displayTotal += (parseFloat(d.amount) || 0); displayPaid += (parseFloat(d.paid) || 0); });

        document.getElementById('debt-count').textContent = `${sourceList.length} Borç`;
        const displayRemaining = Math.max(displayTotal - displayPaid, 0);
        document.getElementById('total-debt-val').textContent = `Kalan: ${displayRemaining.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL`;

        const allDebtsTotal = debts.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
        const allDebtsPaid = debts.reduce((sum, d) => sum + (parseFloat(d.paid) || 0), 0);
        const allDebtsRemaining = Math.max(allDebtsTotal - allDebtsPaid, 0);
        const debtRatio = totalAssetVal > 0 ? ((allDebtsRemaining / totalAssetVal) * 100) : 0;
        const maxDebt = debts.length > 0 ? Math.max(...debts.map(d => (parseFloat(d.amount) || 0) - (parseFloat(d.paid) || 0))) : 0;

        document.getElementById('ds-total-debt').textContent = allDebtsRemaining.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
        document.getElementById('ds-debt-ratio').textContent = debtRatio > 0 ? `%${debtRatio.toFixed(1)}` : '%0';
        document.getElementById('ds-active-count').textContent = `${debts.length} Adet`;
        document.getElementById('ds-max-debt').textContent = debts.length > 0 ? `${maxDebt.toLocaleString('tr-TR', {minimumFractionDigits:0})} TL` : '—';

        const ratioEl = document.getElementById('ds-debt-ratio');
        const ratioCard = document.querySelector('.debt-stat-ratio');
        if (ratioCard) {
            ratioEl.style.color = '';
            if (debtRatio > 100) ratioEl.style.color = 'var(--red)';
            else if (debtRatio > 50) ratioEl.style.color = 'var(--gold)';
        }
    }

    // --- Borç Detay Modalı ---
    function openDebtDetail(index) {
        const debt = debts[index];
        if (!debt) return;

        const paid = parseFloat(debt.paid) || 0;
        const remaining = Math.max(debt.amount - paid, 0);
        const isInstallment = debt.installmentTotal && debt.installmentTotal >= 2;
        const instMonthly = isInstallment ? (debt.installmentMonthly || debt.amount / debt.installmentTotal) : 0;
        const instPaid = debt.installmentPaid || 0;
        const cat = debt.category || 'diger';
        const catName = debtCategoryNames[cat] || 'Diğer';
        const dateParts = (debt.date || '').split('-');
        const dateFormatted = dateParts.length === 3 ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}` : (debt.date || '-');
        const hasInterest = debt.interestRate > 0;
        const totalRepayment = isInstallment && instMonthly > 0 ? instMonthly * debt.installmentTotal : debt.amount;
        const totalInterest = totalRepayment - debt.amount;

        const body = document.getElementById('debt-detail-body');
        document.getElementById('debt-detail-title').textContent = debt.name;

        let html = `
            <div class="dd-header">
                <div class="dd-cat-tag debt-cat-${cat}">${debtCategoryIcons[cat] || ''}${catName}</div>
                <div class="dd-date">${dateFormatted}</div>
            </div>
            <div class="dd-summary">
                <div class="dd-summary-item">
                    <span class="dd-si-label">Toplam Borç</span>
                    <span class="dd-si-value">${debt.amount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
                </div>
                <div class="dd-summary-item">
                    <span class="dd-si-label">Ödenen</span>
                    <span class="dd-si-value dd-green">${paid.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
                </div>
                <div class="dd-summary-item">
                    <span class="dd-si-label">Kalan</span>
                    <span class="dd-si-value">${remaining.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
                </div>
            </div>`;

        // Faiz bilgisi (kredi / nakit-avans)
        if (hasInterest) {
            html += `
            <div class="dd-section">
                <div class="dd-section-title">Kredi Bilgileri</div>
                <div class="dd-detail-grid">
                    <div class="dd-detail-item">
                        <span class="dd-detail-label">Faiz Oranı</span>
                        <span class="dd-detail-value">%${debt.interestRate} (yıllık)</span>
                    </div>
                    <div class="dd-detail-item">
                        <span class="dd-detail-label">Aylık Taksit</span>
                        <span class="dd-detail-value">${instMonthly.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
                    </div>
                    <div class="dd-detail-item">
                        <span class="dd-detail-label">Toplam Geri Ödeme</span>
                        <span class="dd-detail-value">${totalRepayment.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
                    </div>
                    <div class="dd-detail-item">
                        <span class="dd-detail-label">Toplam Faiz</span>
                        <span class="dd-detail-value dd-red">${totalInterest.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
                    </div>
                </div>
            </div>`;
        }

        // Ekstre bilgisi (kredi kartı)
        if (cat === 'kredi-karti') {
            html += `
            <div class="dd-section">
                <div class="dd-section-title">Ekstre Bilgileri</div>
                <div class="dd-detail-grid">
                    ${debt.statementDay ? `<div class="dd-detail-item"><span class="dd-detail-label">Kesim Günü</span><span class="dd-detail-value">Her ay ${debt.statementDay}</span></div>` : ''}
                    ${debt.dueDay ? `<div class="dd-detail-item"><span class="dd-detail-label">Son Ödeme</span><span class="dd-detail-value">Her ay ${debt.dueDay}</span></div>` : ''}
                    ${debt.minPaymentRatio ? `<div class="dd-detail-item"><span class="dd-detail-label">Asgari Ödeme Oranı</span><span class="dd-detail-value">%${debt.minPaymentRatio}</span></div>` : ''}
                    ${debt.minPayment ? `<div class="dd-detail-item"><span class="dd-detail-label">Asgari Ödeme Tutarı</span><span class="dd-detail-value">${debt.minPayment.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span></div>` : ''}
                </div>
            </div>`;
        }

        // Taksit listesi
        if (isInstallment) {
            const pctDone = Math.min((paid / debt.amount) * 100, 100);
            html += `
            <div class="dd-section">
                <div class="dd-section-title">
                    Taksit Takvimi
                    <span class="dd-inst-meta">${Math.floor(instPaid)}/${debt.installmentTotal} ödendi</span>
                </div>
                <div class="dd-installment-list" id="dd-installment-list">`;

            const startDate = new Date(debt.date);
            for (let i = 1; i <= debt.installmentTotal; i++) {
                const instDate = new Date(startDate);
                instDate.setMonth(instDate.getMonth() + (i - 1));
                const instDateStr = instDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
                const isPaid = instPaid >= i;
                const isPartial = !isPaid && instPaid > i - 1 && instPaid < i;
                const checked = isPaid || isPartial;
                const cls = isPaid ? 'dd-inst-paid' : (isPartial ? 'dd-inst-partial' : '');

                html += `
                <div class="dd-inst-row ${cls}" onclick="toggleInstallmentPaid(${index}, ${i})">
                    <div class="dd-inst-check">
                        ${checked
                            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`
                            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`}
                    </div>
                    <div class="dd-inst-info">
                        <span class="dd-inst-num">Taksit ${i}</span>
                        <span class="dd-inst-date">${instDateStr}</span>
                    </div>
                    <div class="dd-inst-amount">${instMonthly.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div>
                    <div class="dd-inst-status">${isPaid ? 'Ödendi' : (isPartial ? 'Kısmi' : '')}</div>
                </div>`;
            }

            html += `</div></div>`;
        }

        // Ödeme yüzdesi
        const payPct = Math.min((paid / debt.amount) * 100, 100);
        html += `
            <div class="dd-section">
                <div class="dd-section-title">Ödeme Durumu</div>
                <div class="dd-history-bar">
                    <div class="dd-history-fill" style="width:${payPct}%"></div>
                </div>
                <div class="dd-history-text">%${payPct.toFixed(1)} ödendi — ${paid.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL / ${debt.amount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div>
            </div>`;

        html += `
            <div class="modal-actions">
                <button type="button" class="modal-btn-cancel" onclick="closeDebtDetailModal()">Kapat</button>
            </div>`;

        body.innerHTML = html;
        openModal('debt-detail-modal');
    }

    function toggleInstallmentPaid(index, installmentNum) {
        const debt = debts[index];
        if (!debt || !debt.installmentTotal) return;

        const instMonthly = debt.installmentMonthly || (debt.amount / debt.installmentTotal);
        let instPaid = debt.installmentPaid || 0;

        if (instPaid >= installmentNum) {
            // Unmark this and all after
            debt.installmentPaid = Math.max(installmentNum - 1, 0);
        } else {
            // Mark this and all before as paid
            debt.installmentPaid = installmentNum;
        }

        // Recalculate paid amount based on installments
        const newInstallmentPaid = debt.installmentPaid;
        const newPaidAmount = Math.round(newInstallmentPaid * instMonthly * 100) / 100;
        debt.paid = Math.min(newPaidAmount, debt.amount);

        localStorage.setItem('goldDebts', JSON.stringify(debts));
        updateDebtsUI();
        updateUI();
        openDebtDetail(index);
    }

    // --- Borç Ödeme Yap (Modal) ---
    function payDebt(index) {
        const debt = debts[index];
        if (!debt) return;

        const paid = parseFloat(debt.paid) || 0;
        const remaining = Math.max(debt.amount - paid, 0);
        if (remaining <= 0) { showToast('Bu borç zaten ödenmiş', 'success'); return; }

        const isInstallment = debt.installmentTotal && debt.installmentTotal >= 2;
        const instMonthly = isInstallment ? (debt.installmentMonthly || debt.amount / debt.installmentTotal) : 0;
        const instPaidSoFar = debt.installmentPaid || 0;
        const instRemaining = isInstallment ? Math.max(debt.installmentTotal - instPaidSoFar, 0) : 0;

        const body = document.getElementById('payment-modal-body');
        let html = `
            <div class="modal-info-row">
                <span class="modal-info-label">Borç</span>
                <span class="modal-info-value">${debt.name}</span>
            </div>
            <div class="modal-info-row">
                <span class="modal-info-label">Kalan Borç</span>
                <span class="modal-info-value">${remaining.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
            </div>`;
        if (isInstallment && instRemaining > 0) {
            html += `
            <div class="modal-info-row">
                <span class="modal-info-label">Aylık Taksit</span>
                <span class="modal-info-value">${instMonthly.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
            </div>
            <div class="modal-info-row">
                <span class="modal-info-label">Kalan Taksit</span>
                <span class="modal-info-value" id="payment-inst-remaining">${Math.ceil(instRemaining)}</span>
            </div>`;
        }
        html += `
            <div style="margin-top:1.2rem;">
                <label style="font-size:0.8rem; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:6px;">Ödeme Tutarı (TL)</label>
                <input type="text" class="modal-input" id="payment-amount-input" inputmode="decimal" placeholder="0,00">
                <div id="payment-inst-hint" style="font-size:0.75rem; color:var(--text-tertiary); margin-top:6px; min-height:1.2em;"></div>
            </div>
            <div class="modal-actions">
                <button type="button" class="modal-btn-cancel" onclick="closePaymentModal()">İptal</button>
                <button type="button" class="modal-btn-confirm" id="payment-confirm-btn">Öde</button>
            </div>`;
        body.innerHTML = html;
        openModal('payment-modal');

        const inp = document.getElementById('payment-amount-input');
        const hintEl = document.getElementById('payment-inst-hint');
        const instRemEl = document.getElementById('payment-inst-remaining');

        function updateInstHint() {
            const val = parseFloat(inp.value.replace(',', '.'));
            if (isInstallment && instMonthly > 0 && !isNaN(val) && val > 0) {
                const covered = val / instMonthly;
                const newRemaining = Math.max(debt.installmentTotal - (instPaidSoFar + covered), 0);
                if (instRemEl) instRemEl.textContent = Math.ceil(newRemaining);
                hintEl.textContent = `Bu tutar ${covered.toFixed(1)} taksite denk geliyor`;
            } else if (isInstallment && instMonthly > 0) {
                if (instRemEl) instRemEl.textContent = Math.ceil(instRemaining);
                hintEl.textContent = '';
            }
        }

        inp.addEventListener('input', updateInstHint);
        inp.focus();
        inp.addEventListener('keydown', function onEnter(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('payment-confirm-btn').click();
            }
        });

        document.getElementById('payment-confirm-btn').addEventListener('click', function() {
            const payAmount = parseFloat(inp.value.replace(',', '.'));
            if (isNaN(payAmount) || payAmount <= 0) { showToast('Geçerli bir tutar girin', 'error'); return; }
            if (payAmount > remaining) { showToast(`Kalan tutardan fazla ödeme yapamazsınız (Kalan: ${remaining.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL)`, 'error'); return; }

            closePaymentModal();

            debt.paid = Math.round((paid + payAmount) * 100) / 100;

            if (isInstallment && instRemaining > 0) {
                const covered = payAmount / instMonthly;
                debt.installmentPaid = Math.min(instPaidSoFar + covered, debt.installmentTotal);
            }

            localStorage.setItem('goldDebts', JSON.stringify(debts));

            const newRemaining = Math.max(debt.amount - debt.paid, 0);
            if (newRemaining <= 0) {
                showToast(`Borç tamamlandı! (${debt.amount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL)`, 'success');
            } else {
                showToast(`${payAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL ödeme kaydedildi. Kalan: ${newRemaining.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL`, 'success');
            }

            updateDebtsUI();
            updateUI();
        });
    }

    // --- Zekat Ödeme Kaydı Arşiv Sistemi (Modal) ---
    function recordZakatPayment() {
        let totalVal = 0, totalPure = 0;
        inventory.forEach(item => {
            totalPure += getPureWeight(item);
            totalVal += (parseFloat(item.weight) || 0) * (prices[item.ayar] || 0);
        });

        let totalDebtVal = 0;
        debts.forEach(d => {
            const paid = parseFloat(d.paid) || 0;
            totalDebtVal += Math.max((parseFloat(d.amount) || 0) - paid, 0);
        });
        
        const netZakatBase = Math.max(totalVal - totalDebtVal, 0);
        const finalZakatAmount = netZakatBase / 40;

        const body = document.getElementById('zakat-confirm-body');
        body.innerHTML = `
            <div class="modal-info-row">
                <span class="modal-info-label">Toplam Varlık Değeri</span>
                <span class="modal-info-value">${totalVal.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
            </div>
            <div class="modal-info-row">
                <span class="modal-info-label">Kalan Borçlar</span>
                <span class="modal-info-value">${totalDebtVal.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
            </div>
            <div class="modal-info-row">
                <span class="modal-info-label">Net Zekat Matrahı</span>
                <span class="modal-info-value">${netZakatBase.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
            </div>
            <div style="margin-top:1rem; padding:14px; background:var(--teal-light); border-radius:var(--radius-md); text-align:center;">
                <div style="font-size:0.75rem; font-weight:600; color:var(--teal); text-transform:uppercase; letter-spacing:0.5px;">Ödenecek Net Tutar</div>
                <div style="font-size:1.6rem; font-weight:700; color:var(--teal); margin-top:4px;">${finalZakatAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div>
            </div>
            <div class="modal-note">Bu işlem dondurulmuş bir arşiv kopyası oluşturacaktır.</div>
            <div class="modal-actions">
                <button type="button" class="modal-btn-cancel" onclick="closeZakatConfirmModal()">İptal</button>
                <button type="button" class="modal-btn-confirm" id="zakat-confirm-btn">Onayla</button>
            </div>`;
        openModal('zakat-confirm-modal');

        document.getElementById('zakat-confirm-btn').addEventListener('click', function() {
            closeZakatConfirmModal();

            const snapshotRecord = {
                id: Date.now(),
                paymentDate: new Date().toLocaleDateString('tr-TR'),
                savedTotalVal: totalVal.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL (Borç Öncesi)',
                savedZakatVal: finalZakatAmount.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL (Net)',
                frozenInventory: JSON.parse(JSON.stringify(inventory))
            };

            zakatHistory.push(snapshotRecord);
            localStorage.setItem('zakatHistoryRecords', JSON.stringify(zakatHistory));

            zakatNextDueDate = new Date(Date.now() + 354 * 24 * 60 * 60 * 1000);
            localStorage.setItem('zakatNextDueDate', zakatNextDueDate.toISOString());

            showToast("Zekat ödemeniz net tutar üzerinden başarıyla arşivlendi. Bir sonraki zekat dönemi güncellendi.", 'success');
            updateUI();
        });
    }

    function openHistoryModal() {
        const tbody = document.getElementById('history-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        zakatHistory.forEach((record) => {
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td>${record.paymentDate}</td>
                    <td style="font-weight:600; color:var(--green);">${record.savedZakatVal}</td>
                    <td style="text-align:right;">
                        <button type="button" class="btn-nav btn-accent" style="height:26px; font-size:0.75rem; padding:0 12px;" onclick="viewSnapshotDetails(${record.id})">İncele</button>
                    </td>
                </tr>
            `);
        });

        if(zakatHistory.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:2rem; color:var(--text-tertiary);">Kayıtlı ödeme geçmişi bulunmamaktadır.</td></tr>`;
        }
        openModal('history-modal');
    }

    function viewSnapshotDetails(id) {
        const record = zakatHistory.find(x => x.id === id);
        if(!record) return;

        document.getElementById('snap-title').textContent = `${record.paymentDate} Tarihli Ödeme Arşivi`;
        document.getElementById('snap-total-val').textContent = record.savedTotalVal;
        document.getElementById('snap-zakat-val').textContent = record.savedZakatVal;

        const tbody = document.getElementById('snapshot-table-body');
        tbody.innerHTML = '';

        record.frozenInventory.forEach(item => {
            const w = parseFloat(item.weight) || 0;
            const isCoin = ["cumhuriyet", "yarim", "ceyrek"].includes(item.ayar);
            let pure = w * (purities[item.ayar] || 1);
            if (isCoin) pure = w * (coinWeights[item.ayar] || 0) * (purities[item.ayar] || 1);

            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td style="color:var(--text-tertiary);">${item.date || '-'}</td>
                    <td><span class="ayar-tag" style="background:var(--bg); border:1px solid var(--border-strong); color:var(--text-secondary);">${typeNames[item.ayar] || item.ayar}</span></td>
                    <td style="font-weight:500;">${isCoin ? `${w} Adet` : `${w.toFixed(2)} g`}</td>
                    <td style="color:var(--gold); font-weight:600;">${pure.toFixed(2)} g</td>
                </tr>
            `);
        });

        closeModal('history-modal');
        openModal('snapshot-modal');
    }

    // --- Merkezi Sistem Genel Yedekleme ---
    function exportSystemBackup() {
        let expInventory = inventory;
        let expDebts = debts;
        let expZakatHistory = zakatHistory;
        let expPrices = prices;
        let expPriceHistory = [];
        let expExpenses = expenses;
        let expSubscriptions = subscriptions;

        try { const s = localStorage.getItem('goldInventory'); if(s) expInventory = JSON.parse(s); } catch(e){}
        try { const s = localStorage.getItem('goldDebts');     if(s) expDebts     = JSON.parse(s); } catch(e){}
        try { const s = localStorage.getItem('zakatHistoryRecords'); if(s) expZakatHistory = JSON.parse(s); } catch(e){}
        try { const s = localStorage.getItem('goldPrices');    if(s) expPrices    = JSON.parse(s); } catch(e){}
        try { const s = localStorage.getItem('priceHistory');  if(s) expPriceHistory = JSON.parse(s); } catch(e){}
        try { const s = localStorage.getItem('monthlyExpenses'); if(s) expExpenses = JSON.parse(s); } catch(e){}
        try { const s = localStorage.getItem('userSubscriptions'); if(s) expSubscriptions = JSON.parse(s); } catch(e){}

        const fullData = {
            inventory:    expInventory,
            prices:       expPrices,
            debts:        expDebts,
            zakatHistory: expZakatHistory,
            priceHistory: expPriceHistory,
            expenses:     expExpenses,
            subscriptions: expSubscriptions,
            targetGoal:   localStorage.getItem('goldGoalTarget') || "1000000"
        };
        const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "sistem_genel_yedek.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function importSystemBackup(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);

                if (Array.isArray(data.inventory)) {
                    inventory = data.inventory;
                    localStorage.setItem('goldInventory', JSON.stringify(inventory));
                }

                if (Array.isArray(data.debts)) {
                    debts = data.debts;
                    localStorage.setItem('goldDebts', JSON.stringify(debts));
                }

                if (Array.isArray(data.zakatHistory)) {
                    zakatHistory = data.zakatHistory;
                    localStorage.setItem('zakatHistoryRecords', JSON.stringify(zakatHistory));
                }

                if (Array.isArray(data.expenses)) {
                    expenses = data.expenses;
                    localStorage.setItem('monthlyExpenses', JSON.stringify(expenses));
                }

                if (Array.isArray(data.subscriptions)) {
                    subscriptions = data.subscriptions;
                    localStorage.setItem('userSubscriptions', JSON.stringify(subscriptions));
                }

                if (data.prices && typeof data.prices === 'object') {
                    prices = { ...defaultPrices, ...data.prices };
                    localStorage.setItem('goldPrices', JSON.stringify(prices));
                }

                if (Array.isArray(data.priceHistory)) {
                    localStorage.setItem('priceHistory', JSON.stringify(data.priceHistory));
                }

                if (data.targetGoal !== undefined) {
                    localStorage.setItem('goldGoalTarget', data.targetGoal);
                    const tInp = document.getElementById('target-input');
                    if (tInp) tInp.value = data.targetGoal;
                }

                updateUI();
                updateDebtsUI();
                updateExpensesUI();
                alert('Yedek başarıyla yüklendi! Altın kayıtları, borçlar, giderler, fiyatlar ve tüm ayarlar geri getirildi.');
            } catch (err) {
                alert('Hatalı dosya formatı! Lütfen geçerli bir yedek dosyası seçin.');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    }

    function printPDF() {
        const totalValEl  = document.getElementById('total-val');
        const totalPureEl = document.getElementById('total-pure');
        const totalVal  = totalValEl  ? totalValEl.textContent  : '—';
        const totalPure = totalPureEl ? totalPureEl.textContent : '—';

        const now = new Date();
        const dateStr = now.toLocaleDateString('tr-TR', { day:'2-digit', month:'long', year:'numeric' });
        const timeStr = now.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });

        // Temizle
        document.getElementById('pdf-accent-line')?.remove();
        document.getElementById('pdf-summary-strip')?.remove();
        document.getElementById('pdf-meta-block')?.remove();
        document.getElementById('pdf-footer')?.remove();

        // Üst vurgu çizgisi
        const accentLine = document.createElement('div');
        accentLine.id = 'pdf-accent-line';
        accentLine.className = 'pdf-accent-line';

        // Başlık bloğu
        const header = document.querySelector('.page-header');
        header.parentNode.insertBefore(accentLine, header);

        const metaEl = document.createElement('div');
        metaEl.id = 'pdf-meta-block';
        metaEl.className = 'pdf-meta-block';
        metaEl.innerHTML = `${dateStr}<br>${timeStr}<br><span style="font-weight:600;">Altın Portföyü &amp; Zekat Hesaplayıcı</span>`;
        header.appendChild(metaEl);

        // Özet kartlar
        const netWorthEl = document.getElementById('net-worth-val');
        const netWorth = netWorthEl ? netWorthEl.textContent : '—';
        const statStrip = document.querySelector('.stat-strip');
        const summaryEl = document.createElement('div');
        summaryEl.id = 'pdf-summary-strip';
        summaryEl.className = 'pdf-summary-strip';
        summaryEl.innerHTML = `
            <div class="pdf-summary-cell">
                <div class="pdf-summary-label">Toplam Varlık Değeri</div>
                <div class="pdf-summary-value">${totalVal}</div>
                <div class="pdf-summary-sub">Güncel kur fiyatlarıyla</div>
            </div>
            <div class="pdf-summary-cell">
                <div class="pdf-summary-label">24 Ayar Karşılığı</div>
                <div class="pdf-summary-value">${totalPure}</div>
                <div class="pdf-summary-sub">Saf altın eşdeğeri</div>
            </div>
            <div class="pdf-summary-cell">
                <div class="pdf-summary-label">Nisap Sınırı</div>
                <div class="pdf-summary-value">80,18 g</div>
                <div class="pdf-summary-sub">Diyanet İşleri Başkanlığı</div>
            </div>
            <div class="pdf-summary-cell">
                <div class="pdf-summary-label">Net Değer</div>
                <div class="pdf-summary-value">${netWorth}</div>
                <div class="pdf-summary-sub">Varlık - Borç</div>
            </div>`;
        statStrip.parentNode.insertBefore(summaryEl, statStrip.nextSibling);

        // Footer
        const footerEl = document.createElement('div');
        footerEl.id = 'pdf-footer';
        footerEl.className = 'pdf-footer';
        footerEl.innerHTML = `
            <div class="pdf-footer-left">
                <span class="pdf-footer-dot"></span>
                <span>Altın Portföyü &amp; Zekat Hesaplayıcı — Kişisel Kayıt</span>
            </div>
            <div class="pdf-footer-right">${dateStr}, ${timeStr}</div>`;
        document.querySelector('#dashboard-view').appendChild(footerEl);

        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.getElementById('pdf-accent-line')?.remove();
                document.getElementById('pdf-summary-strip')?.remove();
                document.getElementById('pdf-meta-block')?.remove();
                document.getElementById('pdf-footer')?.remove();
            }, 500);
        }, 100);
    }

    function downloadCSV() {
        if(!inventory || inventory.length === 0) return alert("Dışa aktarılacak kayıt yok.");
        let csv = "Tarih;Tur;Miktar;Saf Gram;Deger (TL);Maliyet (TL);Kar/Zarar (TL);Not\n";
        inventory.forEach(item => {
            const pure = getPureWeight(item) || 0;
            const w = parseFloat(item.weight) || 0;
            const val = w * (prices[item.ayar] || 0);
            const cost = parseFloat(item.cost) || 0;
            const profit = cost > 0 ? val - cost : 0;
            const miktar = ["cumhuriyet", "yarim", "ceyrek"].includes(item.ayar) ? `${w} Adet` : `${w.toFixed(2).replace('.', ',')} g`;
            csv += `${item.date || ''};${typeNames[item.ayar] || item.ayar};${miktar};${pure.toFixed(2).replace('.', ',')};${val.toFixed(2).replace('.', ',')};${cost > 0 ? cost.toFixed(2).replace('.', ',') : ''};${cost > 0 ? profit.toFixed(2).replace('.', ',') : ''};${item.note || ''}\n`;
        });
        const blob = new Blob(["\uFEFF"+csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "varlik_gecmisi.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- GİDER YÖNETİM FONKSİYONLARI ---
    const expenseCategoryNames = {
        kira: '🏠 Ev Kirası',
        elektrik: '💡 Elektrik',
        su: '💧 Su',
        dogalgaz: '🔥 Doğalgaz',
        internet: '🌐 İnternet',
        telefon: '📱 Telefon',
        market: '🛒 Market',
        ulasim: '🚌 Ulaşım',
        saglik: '🏥 Sağlık',
        egitim: '📚 Eğitim',
        giyim: '👔 Giyim',
        eglence: '🎬 Eğlence',
        diger: '📦 Diğer'
    };

    function addExpense(event) {
        event.preventDefault();
        const category = document.getElementById('expense-category').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const date = document.getElementById('expense-date').value;
        const note = document.getElementById('expense-note').value.trim();

        if (!category || !amount || amount <= 0 || !date) {
            showToast('Lütfen tüm zorunlu alanları doldurun', 'error');
            return;
        }

        const expense = {
            id: Date.now(),
            category,
            amount,
            date,
            note,
            timestamp: new Date(date).getTime()
        };

        expenses.push(expense);
        localStorage.setItem('monthlyExpenses', JSON.stringify(expenses));

        document.getElementById('expense-form').reset();
        const expenseDateInput = document.getElementById('expense-date');
        if(expenseDateInput) expenseDateInput.valueAsDate = new Date();

        showToast(`${expenseCategoryNames[category]} gideri eklendi: ${amount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL`, 'success');
        closeFormSheet();
        updateExpensesUI();
    }

    function deleteExpense(id) {
        if (!confirm('Bu gider kaydını silmek istediğinize emin misiniz?')) return;
        
        expenses = expenses.filter(e => e.id !== id);
        localStorage.setItem('monthlyExpenses', JSON.stringify(expenses));
        
        showToast('Gider kaydı silindi', 'success');
        updateExpensesUI();
    }

    function updateExpensesUI() {
        const period = document.getElementById('expense-period-filter')?.value || '12';
        
        // Calculate date threshold based on period
        const now = new Date();
        let threshold = 0;
        
        if (period === 'all') {
            threshold = 0;
        } else {
            const months = parseInt(period);
            threshold = new Date(now.getFullYear(), now.getMonth() - months, now.getDate()).getTime();
        }

        // Filter expenses by period
        const filteredExpenses = period === 'all' 
            ? [...expenses] 
            : expenses.filter(e => e.timestamp >= threshold);

        // Sort by date descending
        filteredExpenses.sort((a, b) => b.timestamp - a.timestamp);

        // Update statistics
        updateExpenseStats(filteredExpenses);

        // Update category summary
        updateCategorySummary(filteredExpenses);

        // Update expense list
        updateExpenseList(filteredExpenses);
    }

    function updateExpenseStats(filteredExpenses) {
        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).getTime();
        const oneYearAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate()).getTime();

        const monthExpenses = filteredExpenses.filter(e => e.timestamp >= oneMonthAgo);
        const sixMonthExpenses = filteredExpenses.filter(e => e.timestamp >= sixMonthsAgo);
        const yearExpenses = filteredExpenses.filter(e => e.timestamp >= oneYearAgo);

        const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
        const sixMonthTotal = sixMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
        const yearTotal = yearExpenses.reduce((sum, e) => sum + e.amount, 0);

        // Calculate average (actual months with data)
        const distinctMonths = new Set(sixMonthExpenses.map(e => {
            const d = new Date(e.timestamp);
            return d.getFullYear() + '-' + d.getMonth();
        })).size;
        const avgMonth = sixMonthExpenses.length > 0 && distinctMonths > 0 ? sixMonthTotal / Math.min(distinctMonths, 6) : 0;

        document.getElementById('exp-month-total').textContent = monthTotal.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
        document.getElementById('exp-6month-total').textContent = sixMonthTotal.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
        document.getElementById('exp-year-total').textContent = yearTotal.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
        document.getElementById('exp-avg-month').textContent = avgMonth.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
    }

    function updateCategorySummary(filteredExpenses) {
        const categoryTotals = {};
        const categoryCounts = {};
        
        filteredExpenses.forEach(e => {
            if (!categoryTotals[e.category]) {
                categoryTotals[e.category] = 0;
                categoryCounts[e.category] = 0;
            }
            categoryTotals[e.category] += e.amount;
            categoryCounts[e.category]++;
        });

        const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

        // Sort categories by amount descending
        const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

        const container = document.getElementById('expense-category-summary');
        if (!container) return;

        if (sortedCategories.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-tertiary); padding:2rem;">Bu dönemde kayıtlı gider bulunmamaktadır.</p>';
            return;
        }

        let html = '<div style="display:flex; flex-direction:column; gap:12px;">';
        
        sortedCategories.forEach(([category, amount]) => {
            const percentage = total > 0 ? (amount / total) * 100 : 0;
            const recordCount = categoryCounts[category] || 0;
            html += `
                <div style="display:flex; flex-direction:column; gap:6px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.9rem; font-weight:500; color:var(--text-primary);">${expenseCategoryNames[category]}</span>
                        <span style="font-size:0.9rem; font-weight:600; color:var(--teal);">${amount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
                    </div>
                    <div style="background:var(--bg-input); height:8px; border-radius:100px; overflow:hidden; position:relative;">
                        <div style="background:var(--teal); height:100%; width:${percentage}%; border-radius:100px; transition:width 0.5s ease;"></div>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-tertiary);">%${percentage.toFixed(1)} (${recordCount} kayıt)</div>
                </div>`;
        });

        html += '</div>';
        html += `<div style="margin-top:1rem; padding:1rem; background:var(--teal-light); border-radius:var(--radius-md); text-align:center;">
            <div style="font-size:0.75rem; font-weight:600; color:var(--teal); text-transform:uppercase;">Dönem Toplam</div>
            <div style="font-size:1.8rem; font-weight:700; color:var(--teal); margin-top:4px;">${total.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div>
        </div>`;

        container.innerHTML = html;
    }

    function updateExpenseList(filteredExpenses) {
        const container = document.getElementById('expense-list-container');
        const subtitle = document.getElementById('expense-list-subtitle');
        
        if (!container) return;

        if (subtitle) {
            subtitle.textContent = `Toplam ${filteredExpenses.length} gider kaydı`;
        }

        if (filteredExpenses.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-tertiary); padding:2rem;">Bu dönemde kayıtlı gider bulunmamaktadır.</p>';
            return;
        }

        let html = '<div class="inventory-table-wrapper"><table class="inventory-table"><thead><tr>';
        html += '<th>Tarih</th><th>Kategori</th><th>Tutar</th><th>Açıklama</th><th style="text-align:right;">İşlem</th>';
        html += '</tr></thead><tbody>';

        filteredExpenses.forEach(expense => {
            const dateStr = new Date(expense.date).toLocaleDateString('tr-TR', {day:'2-digit', month:'short', year:'numeric'});
            html += `<tr>
                <td data-label="Tarih" style="color:var(--text-tertiary);">${dateStr}</td>
                <td data-label="Kategori"><span class="ayar-tag" style="background:var(--bg); border:1px solid var(--border-strong); color:var(--text-secondary);">${expenseCategoryNames[expense.category]}</span></td>
                <td data-label="Tutar" style="font-weight:600; color:var(--red);">${expense.amount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</td>
                <td data-label="Açıklama" style="color:var(--text-secondary); font-size:0.85rem;">${expense.note || '—'}</td>
                <td data-label="İşlem" style="text-align:right;">
                    <button type="button" onclick="deleteExpense(${expense.id})" class="btn-icon-danger" title="Sil">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </td>
            </tr>`;
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
    }

    function clearAllData() {
        if (!confirm('Tüm veriler kalıcı olarak silinecek. Bu işlem geri alınamaz!\n\nDevam etmek istiyor musunuz?')) return;
        const keys = ['goldInventory', 'goldPrices', 'goldDebts', 'zakatHistoryRecords', 'goldGoalTarget', 'zakatNextDueDate', 'priceHistory', 'monthlyExpenses', 'userSubscriptions'];
        keys.forEach(k => localStorage.removeItem(k));
        inventory = [];
        debts = [];
        zakatHistory = [];
        expenses = [];
        subscriptions = [];
        zakatNextDueDate = null;
        prices = { ...defaultPrices };
        updateUI();
        updateDebtsUI();
        updateExpensesUI();
        alert('Tüm veriler başarıyla silindi.');
    }

    // ═══════════════════════════════════════════════════════════════
    // ABONELİK TAKİP SİSTEMİ
    // ═══════════════════════════════════════════════════════════════

    const subscriptionCategoryNames = {
        streaming: '📺 Streaming',
        music: '🎵 Müzik',
        software: '💻 Yazılım',
        cloud: '☁️ Bulut',
        gaming: '🎮 Oyun',
        news: '📰 Haber/Medya',
        fitness: '🏋️ Spor/Sağlık',
        education: '📚 Eğitim',
        telefon: '📱 Telefon/İnternet',
        diger: '📦 Diğer'
    };

    const subscriptionCategoryColors = {
        streaming: '#E74C3C',
        music: '#1DB954',
        software: '#0078D4',
        cloud: '#3498DB',
        gaming: '#9B59B6',
        news: '#E67E22',
        fitness: '#2ECC71',
        education: '#F1C40F',
        telefon: '#00939E',
        diger: '#7A9FA5'
    };

    function toggleSubscriptionsView() {
        const expView = document.getElementById('expenses-view');
        const subView = document.getElementById('subscriptions-view');
        if (!expView || !subView) return;

        const isSubVisible = subView.style.display !== 'none';
        if (isSubVisible) {
            subView.style.display = 'none';
            expView.style.display = 'block';
            expView.classList.remove('view-enter');
            void expView.offsetWidth;
            expView.classList.add('view-enter');
            updateExpensesUI();
        } else {
            expView.style.display = 'none';
            subView.style.display = 'block';
            subView.classList.remove('view-enter');
            void subView.offsetWidth;
            subView.classList.add('view-enter');
            updateSubscriptionsUI();
        }
    }

    function addSubscription(event) {
        event.preventDefault();
        const name = document.getElementById('sub-name').value.trim();
        const category = document.getElementById('sub-category').value;
        const amount = parseFloat(document.getElementById('sub-amount').value);
        const period = document.getElementById('sub-period').value;
        const startDate = document.getElementById('sub-start-date').value;
        const note = document.getElementById('sub-note').value.trim();

        if (!name || !amount || amount <= 0 || !startDate) {
            showToast('Lütfen tüm zorunlu alanları doldurun', 'error');
            return;
        }

        const sub = {
            id: Date.now(),
            name,
            category,
            amount,
            period,
            startDate,
            note,
            timestamp: new Date(startDate).getTime()
        };

        subscriptions.push(sub);
        localStorage.setItem('userSubscriptions', JSON.stringify(subscriptions));

        document.getElementById('subscription-form').reset();
        const subDateInput = document.getElementById('sub-start-date');
        if (subDateInput) subDateInput.valueAsDate = new Date();

        showToast(`${name} aboneliği eklendi: ${amount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL/${period === 'yearly' ? 'yıl' : 'ay'}`, 'success');
        updateSubscriptionsUI();
    }

    function deleteSubscription(id) {
        if (!confirm('Bu aboneliği silmek istediğinize emin misiniz?')) return;
        
        subscriptions = subscriptions.filter(s => s.id !== id);
        localStorage.setItem('userSubscriptions', JSON.stringify(subscriptions));
        
        showToast('Abonelik silindi', 'success');
        updateSubscriptionsUI();
    }

    function updateSubscriptionsUI() {
        if (!document.getElementById('subscriptions-view')) return;

        let totalMonthly = 0;
        let totalCount = subscriptions.length;
        let mostExpensive = { name: '—', amount: 0, monthlyAmount: 0 };

        subscriptions.forEach(s => {
            const monthlyAmount = s.period === 'yearly' ? s.amount / 12 : s.amount;
            totalMonthly += monthlyAmount;

            if (monthlyAmount > mostExpensive.monthlyAmount) {
                mostExpensive = { name: s.name, amount: s.amount, monthlyAmount };
            }
        });

        const yearlyTotal = totalMonthly * 12;

        const countEl = document.getElementById('subs-total-count');
        const monthlyEl = document.getElementById('subs-monthly-total');
        const yearlyEl = document.getElementById('subs-yearly-total');
        const expensiveEl = document.getElementById('subs-most-expensive');

        if (countEl) countEl.textContent = totalCount;
        if (monthlyEl) monthlyEl.textContent = totalMonthly.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
        if (yearlyEl) yearlyEl.textContent = yearlyTotal.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
        if (expensiveEl) {
            if (totalCount > 0) {
                expensiveEl.innerHTML = `${mostExpensive.name}<br><span style="font-size:0.7rem;color:var(--text-tertiary);font-family:inherit;">${mostExpensive.monthlyAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL/ay</span>`;
            } else {
                expensiveEl.textContent = '—';
            }
        }

        renderSubscriptionList();
    }

    function renderSubscriptionList() {
        const container = document.getElementById('subs-list-container');
        const subtitle = document.getElementById('subs-list-subtitle');

        if (!container) return;

        if (subtitle) {
            subtitle.textContent = `Toplam ${subscriptions.length} abonelik`;
        }

        if (subscriptions.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:2.5rem 1rem;"><div style="width:48px;height:48px;border-radius:14px;background:var(--gold-light);color:var(--gold);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div><p style="color:var(--text-tertiary); font-size:0.88rem; font-weight:500;">Henüz abonelik eklenmemiş</p><p style="color:var(--text-tertiary); font-size:0.76rem; margin-top:4px;">Sol panelden düzenli ödemelerinizi ekleyin</p></div>';
            return;
        }

        const sorted = [...subscriptions].sort((a, b) => {
            const mA = a.period === 'yearly' ? a.amount / 12 : a.amount;
            const mB = b.period === 'yearly' ? b.amount / 12 : b.amount;
            return mB - mA;
        });

        let html = '<div style="display:flex; flex-direction:column; gap:10px;">';

        sorted.forEach(sub => {
            const monthlyAmount = sub.period === 'yearly' ? sub.amount / 12 : sub.amount;
            const yearlyAmount = monthlyAmount * 12;
            const catColor = subscriptionCategoryColors[sub.category] || '#7A9FA5';
            const catName = subscriptionCategoryNames[sub.category] || sub.category;
            const dateStr = new Date(sub.startDate).toLocaleDateString('tr-TR', {day:'2-digit', month:'short', year:'numeric'});
            const monthsActive = Math.max(1, Math.floor((Date.now() - sub.timestamp) / (1000 * 60 * 60 * 24 * 30)));
            const totalPaid = monthlyAmount * monthsActive;

            html += `
            <div class="sub-card" style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-lg); padding:1rem 1.1rem; transition:all 0.22s ease; position:relative; overflow:hidden;">
                <div style="position:absolute; top:0; left:0; right:0; height:3px; background:${catColor}; opacity:0.8;"></div>
                <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px;">
                    <div style="flex:1; min-width:0;">
                        <div style="display:inline-flex; align-items:center; gap:4px; font-size:0.65rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:${catColor}; background:${catColor}14; padding:2px 8px; border-radius:100px; margin-bottom:6px;">
                            <span style="width:5px;height:5px;border-radius:50%;background:${catColor};"></span>
                            ${catName}
                        </div>
                        <div style="font-weight:650; font-size:0.9rem; color:var(--text-primary); margin-bottom:2px;">${sub.name}</div>
                        <div style="font-size:0.68rem; color:var(--text-tertiary);">${dateStr}den beri · ${monthsActive} aydır aktif</div>
                        ${sub.note ? `<div style="font-size:0.7rem; color:var(--text-secondary); margin-top:3px;">${sub.note}</div>` : ''}
                    </div>
                    <div style="text-align:right; flex-shrink:0;">
                        <div style="font-family:'DM Serif Display',serif; font-size:1.15rem; font-weight:400; color:${catColor}; line-height:1.2; letter-spacing:-0.01em;">
                            ${monthlyAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL
                        </div>
                        <div style="font-size:0.6rem; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.05em; font-weight:600;">
                            /ay
                        </div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:0.7rem; padding-top:0.6rem; border-top:1px solid var(--border);">
                    <div style="display:flex; gap:12px; font-size:0.7rem; color:var(--text-secondary);">
                        <span>Yıllık: <strong>${yearlyAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</strong></span>
                        <span>·</span>
                        <span>Ödenen: <strong style="color:var(--gold);">${totalPaid.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</strong></span>
                    </div>
                    <button type="button" onclick="deleteSubscription(${sub.id})" class="btn-icon-danger" title="Sil" style="flex-shrink:0;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>`;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    function openPricesModal() {
        Object.keys(defaultPrices).forEach(k => {
            const el = document.getElementById(`p-${k}`);
            if(el) el.value = prices[k] || defaultPrices[k];
        });
        document.getElementById('prices-modal').classList.add('active');
    }
    function closePricesModal() { document.getElementById('prices-modal').classList.remove('active'); }
    
    function savePrices() {
        Object.keys(defaultPrices).forEach(k => {
            const el = document.getElementById(`p-${k}`);
            if(el) prices[k] = parseFloat(el.value) || prices[k] || defaultPrices[k];
        });
        localStorage.setItem('goldPrices', JSON.stringify(prices));
        closePricesModal();
        updateUI();
    }

    // --- Toast Bildirim Sistemi ---
    let toastTimer = null;
    function showToast(message, type) {
        const toast = document.getElementById('toast');
        const text = document.getElementById('toast-text');
        const icon = toast.querySelector('.toast-icon');
        if (!toast || !text) return;

        clearTimeout(toastTimer);
        toast.className = 'toast';

        text.textContent = message;

        if (type === 'success') {
            toast.classList.add('is-success');
            icon.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';
        } else if (type === 'error') {
            toast.classList.add('is-error');
            icon.innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>';
        } else {
            toast.classList.add('is-loading');
            icon.innerHTML = '<path d="M21 12a9 9 0 1 1-6.219-8.56"/><polyline points="21 3 21 9 15 9"/>';
        }

        requestAnimationFrame(() => toast.classList.add('is-visible'));

        if (type !== 'loading') {
            toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
        }
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

    // --- Birim Fiyat Geçmişi ---
    function getPriceHistory() {
        return JSON.parse(localStorage.getItem('priceHistory') || '[]');
    }
    function getLastPriceUpdate() {
        const h = getPriceHistory();
        if (h.length === 0) return null;
        return h[h.length - 1];
    }
    function formatPriceChange(key) {
        const h = getPriceHistory();
        if (h.length < 2) return '';
        const curr = h[h.length - 1]?.prices?.[key];
        const prev = h[h.length - 2]?.prices?.[key];
        if (!curr || !prev) return '';
        const diff = ((curr - prev) / prev * 100);
        if (Math.abs(diff) < 0.01) return '';
        const arrow = diff > 0 ? '↑' : '↓';
        const color = diff > 0 ? 'var(--green)' : 'var(--red)';
        return `<span style="color:${color}; font-size:0.72rem; font-weight:600;">${arrow} %${Math.abs(diff).toFixed(1)}</span>`;
    }

    let pieChartInstance = null;
    let lineChartInstance = null;
    let expenseChartInstance = null;
    let expenseCatChartInstance = null;
    let plTrendChartInstance = null;
    let expenseVsAssetChartInstance = null;

    function renderStats() {
        if(!inventory) return;
        const now = new Date();
        let val1m = 0, val6m = 0, val1y = 0, totalVal = 0;
        let monthFlow = 0;
        let totalCost = 0, totalProfit = 0, itemsWithCost = 0;
        const distribution = {};
        const monthlyGrowth = {};

        inventory.forEach(item => {
            if(!item.date) return;
            const itemDate = new Date(item.date);
            const diffMonths = (now.getFullYear() - itemDate.getFullYear()) * 12 + now.getMonth() - itemDate.getMonth();
            const w = parseFloat(item.weight) || 0;
            const val = w * (prices[item.ayar] || 0);
            totalVal += val;

            const cost = parseFloat(item.cost) || 0;
            totalCost += cost;
            if (cost > 0) { itemsWithCost++; totalProfit += (val - cost); }

            if(diffMonths <= 1) val1m += val;
            if(diffMonths <= 6) val6m += val;
            if(diffMonths <= 12) val1y += val;
            if(diffMonths === 0) monthFlow += val;

            const tName = typeNames[item.ayar] || item.ayar;
            distribution[tName] = (distribution[tName] || 0) + val;
            const monthKey = item.date.substring(0, 7);
            monthlyGrowth[monthKey] = (monthlyGrowth[monthKey] || 0) + val;
        });

        document.getElementById('stat-1m').innerText = val1m.toLocaleString('tr-TR', {maximumFractionDigits:0}) + " TL";
        document.getElementById('stat-6m').innerText = val6m.toLocaleString('tr-TR', {maximumFractionDigits:0}) + " TL";
        document.getElementById('stat-1y').innerText = val1y.toLocaleString('tr-TR', {maximumFractionDigits:0}) + " TL";
        document.getElementById('stat-month-flow').innerText = monthFlow.toLocaleString('tr-TR', {maximumFractionDigits:0}) + " TL";

        // Kâr/Zarar özet kartı
        const pnlSummary = document.getElementById('pnl-summary');
        const pnlVal = document.getElementById('stat-total-pnl');
        const pnlPct = document.getElementById('stat-total-pnl-pct');
        const pnlDetailCard = document.getElementById('pnl-detail-card');
        if (itemsWithCost > 0) {
            pnlSummary.style.display = 'grid';
            pnlSummary.style.gridTemplateColumns = '1fr';
            const pnlPctVal = totalCost > 0 ? ((totalProfit / totalCost) * 100) : 0;
            const cls = totalProfit >= 0 ? 'pnl-positive' : 'pnl-negative';
            pnlVal.innerHTML = `<span class="${cls}">${totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString('tr-TR', {maximumFractionDigits:0})} TL</span>`;
            pnlPct.textContent = `${pnlPctVal >= 0 ? '+' : ''}%${pnlPctVal.toFixed(1)} (${itemsWithCost} kalemde maliyet girilmiş)`;

            // Detay kartı
            pnlDetailCard.style.display = 'block';

            // Ağırlıklı ortalama birim maliyet ve birim fiyat
            let totalWeightWithCost = 0, totalCostSum = 0, totalValueSum = 0;
            let hasCoin = false, hasGram = false;
            inventory.forEach(item => {
                const cost = parseFloat(item.cost) || 0;
                const w = parseFloat(item.weight) || 0;
                if (cost > 0) {
                    totalWeightWithCost += w;
                    totalCostSum += cost;
                    totalValueSum += w * (prices[item.ayar] || 0);
                    if (["cumhuriyet", "yarim", "ceyrek"].includes(item.ayar)) hasCoin = true;
                    else hasGram = true;
                }
            });
            const unitLabel = hasCoin && !hasGram ? 'TL/adet' : hasGram ? 'TL/g' : 'TL/birim';
            const avgCostUnit = totalWeightWithCost > 0 ? totalCostSum / totalWeightWithCost : 0;
            const avgPriceUnit = totalWeightWithCost > 0 ? totalValueSum / totalWeightWithCost : 0;
            const unitDiff = avgPriceUnit - avgCostUnit;
            const unitCls = unitDiff >= 0 ? 'pnl-positive' : 'pnl-negative';
            document.getElementById('pnl-avg-cost').innerHTML = `<span style="color:var(--text-tertiary);">${avgCostUnit.toFixed(0)}</span> ${unitLabel}`;
            document.getElementById('pnl-avg-price').innerHTML = `<span style="color:var(--text-tertiary);">${avgPriceUnit.toFixed(0)}</span> ${unitLabel}`;
            document.getElementById('pnl-unit-diff').innerHTML = `<span class="${unitCls}">${unitDiff >= 0 ? '+' : ''}${unitDiff.toFixed(0)}</span> ${unitLabel}`;
            document.getElementById('pnl-total-return').innerHTML = `<span class="${cls}">${pnlPctVal >= 0 ? '+' : ''}${pnlPctVal.toFixed(1)}%</span>`;
            document.getElementById('pnl-detail-badge').textContent = `${itemsWithCost} Kalem`;

            // Kârlı kalem oranı
            const profitableItems = inventory.filter(item => {
                const cost = parseFloat(item.cost) || 0;
                if (cost <= 0) return false;
                const w = parseFloat(item.weight) || 0;
                const val = w * (prices[item.ayar] || 0);
                return val - cost >= 0;
            }).length;
            const profitablePct = (profitableItems / itemsWithCost) * 100;
            document.getElementById('pnl-bar-fill').style.width = profitablePct + '%';
            document.getElementById('pnl-bar-pct').textContent = '%' + profitablePct.toFixed(0);
        } else {
            pnlSummary.style.display = 'none';
            pnlDetailCard.style.display = 'none';
        }

        // --- Yeni İstatistik Hesaplamaları ---
        let totalDebtVal = 0;
        let totalDebtPaid = 0;
        let activeDebtCount = 0;
        debts.forEach(d => {
            const amt = parseFloat(d.amount) || 0;
            const paid = parseFloat(d.paid) || 0;
            totalDebtVal += amt;
            totalDebtPaid += paid;
            if (amt > paid) activeDebtCount++;
        });
        const totalDebtRemaining = Math.max(totalDebtVal - totalDebtPaid, 0);

        // Tasarruf Oranı
        const thisMonthExpenses = expenses.filter(e => {
            const d = new Date(e.timestamp || e.date);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }).reduce((s, e) => s + (e.amount || 0), 0);
        const savingsRate = thisMonthExpenses > 0 ? Math.max(((monthFlow - thisMonthExpenses) / thisMonthExpenses) * 100, 0) : (monthFlow > 0 ? 100 : 0);
        document.getElementById('stat-savings-rate').textContent = `%${Math.min(savingsRate, 999).toFixed(0)}`;

        // Büyüme Hızı (aylık ortalama)
        const monthCount = Object.keys(monthlyGrowth).length;
        const growthRate = monthCount > 1 ? ((totalVal / Object.values(monthlyGrowth)[0]) - 1) / monthCount * 100 : 0;
        document.getElementById('stat-growth-rate').textContent = `%${growthRate.toFixed(1)}`;

        // Risk Oranı
        const riskRatio = totalVal > 0 ? (totalDebtRemaining / totalVal) * 100 : 0;
        document.getElementById('stat-risk-ratio').textContent = `%${riskRatio.toFixed(1)}`;

        // Borç Özeti Kartı
        const debtSummaryEl = document.getElementById('stats-debt-summary');
        if (activeDebtCount > 0 || totalDebtVal > 0) {
            debtSummaryEl.style.display = 'block';
            document.getElementById('stats-total-debt').textContent = totalDebtVal.toLocaleString('tr-TR', {maximumFractionDigits:0}) + ' TL';
            document.getElementById('stats-debt-paid').textContent = totalDebtPaid.toLocaleString('tr-TR', {maximumFractionDigits:0}) + ' TL';
            document.getElementById('stats-debt-remaining').textContent = totalDebtRemaining.toLocaleString('tr-TR', {maximumFractionDigits:0}) + ' TL';
            document.getElementById('stats-debt-count').textContent = activeDebtCount;
            const debtPct = totalDebtVal > 0 ? Math.min((totalDebtPaid / totalDebtVal) * 100, 100) : 0;
            document.getElementById('stats-debt-progress-pct').textContent = '%' + debtPct.toFixed(0);
            document.getElementById('stats-debt-progress-fill').style.width = debtPct + '%';
        } else {
            debtSummaryEl.style.display = 'none';
        }

        // En Değerli 3 Varlık
        const top3El = document.getElementById('stats-top3-list');
        const sortedItems = inventory.map(item => {
            const w = parseFloat(item.weight) || 0;
            const val = w * (prices[item.ayar] || 0);
            const typeNames = { '24': '24 Ayar', '22': '22 Ayar', 'cumhuriyet': 'Cumhuriyet', 'yarim': 'Yarım', 'ceyrek': 'Çeyrek', 'ata': 'Ata', 'bes': 'BES', 'gram-altin': 'Gram Altın', 'diger': 'Diğer' };
            return { name: typeNames[item.ayar] || item.ayar, weight: w, value: val, pct: totalVal > 0 ? (val / totalVal) * 100 : 0 };
        }).sort((a, b) => b.value - a.value).slice(0, 3);
        if (sortedItems.length > 0) {
            top3El.innerHTML = sortedItems.map((item, i) => `
                <div class="stats-top3-item">
                    <div class="stats-top3-rank stats-top3-rank-${i + 1}">${i + 1}</div>
                    <div class="stats-top3-name">${item.name}</div>
                    <div class="stats-top3-weight">${item.weight.toLocaleString('tr-TR', {maximumFractionDigits:2})} g</div>
                    <div class="stats-top3-value">${item.value.toLocaleString('tr-TR', {maximumFractionDigits:0})} TL</div>
                    <div class="stats-top3-pct">%${item.pct.toFixed(0)}</div>
                </div>
            `).join('');
        }

        const goalInp = document.getElementById('target-input');
        const goal = (goalInp ? parseFloat(goalInp.value) : 1000000) || 1000000;
        const pct = Math.min((totalVal / goal) * 100, 100);
        const pctFixed = pct.toFixed(1);

        // SVG Ring
        const ringFill = document.getElementById('goal-ring-fill');
        if (ringFill) {
            const circumference = 2 * Math.PI * 52;
            const offset = circumference * (1 - pct / 100);
            ringFill.style.strokeDashoffset = offset;
        }
        const ringPct = document.getElementById('goal-ring-pct');
        if (ringPct) ringPct.innerText = `%${pctFixed}`;

        document.getElementById('goal-pct-text').innerText = `%${pctFixed} Tamamlandı`;
        document.getElementById('goal-val-text').innerText = `${totalVal.toLocaleString('tr-TR', {maximumFractionDigits:0})} TL / ${goal.toLocaleString('tr-TR')} TL hedefine ulaşıldı.`;

        if(typeof Chart !== 'undefined') {
            const pieCanvas = document.getElementById('pieChart');
            const lineCanvas = document.getElementById('lineChart');
            if(!pieCanvas || !lineCanvas) return;
            
            const pieCtx = pieCanvas.getContext('2d');
            const lineCtx = lineCanvas.getContext('2d');
            const nowYear = now.getFullYear();
            const nowMonth = now.getMonth();

            if(pieChartInstance) pieChartInstance.destroy();
            if(lineChartInstance) lineChartInstance.destroy();

            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const tColor = isDark ? '#E8F6F7' : '#0D1F22';
            const gColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

            pieChartInstance = new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(distribution),
                    datasets: [{
                        data: Object.values(distribution),
                        backgroundColor: ['#00939E', '#A87B00', '#1A7F37', '#7A9FA5', '#C0392B', '#2ECBD6', '#E8F6F7'],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: tColor } } } }
            });

            const sortedMonths = Object.keys(monthlyGrowth).sort();
            let cumulative = 0;
            const growthData = sortedMonths.map(m => { cumulative += monthlyGrowth[m]; return cumulative; });

            // Toplam borç (net)
            let totalDebtVal = 0;
            debts.forEach(d => {
                const paid = parseFloat(d.paid) || 0;
                totalDebtVal += Math.max((parseFloat(d.amount) || 0) - paid, 0);
            });
            // Net değer = her ayın kümülatif değerinden toplam borcu çıkar
            const netWorthData = growthData.map(v => Math.max(v - totalDebtVal, 0));

            lineChartInstance = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: sortedMonths,
                    datasets: [{
                        label: 'Kümülatif Değer (TL)',
                        data: growthData,
                        borderColor: '#00939E',
                        backgroundColor: 'rgba(0,147,158,0.1)',
                        fill: true,
                        tension: 0.3
                    }, {
                        label: 'Net Değer (TL)',
                        data: netWorthData,
                        borderColor: '#1A7F37',
                        backgroundColor: 'rgba(26,127,55,0.08)',
                        borderDash: [5, 4],
                        fill: false,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: tColor }, grid: { color: gColor } },
                        y: { ticks: { color: tColor }, grid: { color: gColor } }
                    },
                    plugins: { legend: { labels: { color: tColor } } }
                }
            });

            // --- Gider Grafiği (çubuk) ---
            const expenseMonthlyData = {};
            for (let i = 11; i >= 0; i--) {
                const y = nowMonth - i < 0 ? nowYear - 1 : nowYear;
                const m = ((nowMonth - i) % 12 + 12) % 12;
                const key = y + '-' + String(m + 1).padStart(2, '0');
                expenseMonthlyData[key] = 0;
            }
            expenses.forEach(e => {
                const d = new Date(e.timestamp || e.date);
                if (isNaN(d.getTime())) return;
                const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                if (expenseMonthlyData[key] !== undefined) {
                    expenseMonthlyData[key] += e.amount;
                }
            });
            const expLabels = Object.keys(expenseMonthlyData);
            const expData = Object.values(expenseMonthlyData);

            const expenseCanvas = document.getElementById('expenseChart');
            if (expenseCanvas) {
                if (expenseChartInstance) expenseChartInstance.destroy();
                const expenseCtx = expenseCanvas.getContext('2d');

                expenseChartInstance = new Chart(expenseCtx, {
                    type: 'bar',
                    data: {
                        labels: expLabels,
                        datasets: [{
                            label: 'Gider (TL)',
                            data: expData,
                            backgroundColor: expData.map(v => v > 0 ? '#00939E' : 'rgba(0,147,158,0.15)'),
                            borderRadius: 4,
                            borderSkipped: false
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: {
                            x: { ticks: { color: tColor }, grid: { display: false } },
                            y: { ticks: { color: tColor }, grid: { color: gColor }, beginAtZero: true }
                        },
                        plugins: { legend: { display: false } }
                    }
                });
            }

            // --- Gider Kategorileri Dağılımı (Pasta) ---
            const expenseCatCanvas = document.getElementById('expenseCatChart');
            if (expenseCatCanvas) {
                if (expenseCatChartInstance) expenseCatChartInstance.destroy();
                const expenseCatCtx = expenseCatCanvas.getContext('2d');
                const catData = {};
                const expenseCategoryNames = { 'fatura': 'Faturalar', 'market': 'Market', 'ulasim': 'Ulaşım', 'yeme': 'Yeme-İçme', 'saglik': 'Sağlık', 'eglence': 'Eğlence', 'kira': 'Kira', 'diger': 'Diğer' };
                expenses.forEach(e => {
                    const cat = expenseCategoryNames[e.category] || e.category || 'Diğer';
                    catData[cat] = (catData[cat] || 0) + (e.amount || 0);
                });
                if (Object.keys(catData).length > 0) {
                    const catColors = ['#00939E', '#A87B00', '#1A7F37', '#C0392B', '#7A9FA5', '#2ECBD6', '#E8A01C', '#95A5A6'];
                    expenseCatChartInstance = new Chart(expenseCatCtx, {
                        type: 'doughnut',
                        data: {
                            labels: Object.keys(catData),
                            datasets: [{ data: Object.values(catData), backgroundColor: catColors.slice(0, Object.keys(catData).length), borderWidth: 0 }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: tColor, padding: 12 } } } }
                    });
                }
            }

            // --- Aylık K/Z Trendi ---
            const plTrendCanvas = document.getElementById('plTrendChart');
            if (plTrendCanvas) {
                if (plTrendChartInstance) plTrendChartInstance.destroy();
                const plTrendCtx = plTrendCanvas.getContext('2d');
                const plMonthly = {};
                for (let i = 11; i >= 0; i--) {
                    const y = nowMonth - i < 0 ? nowYear - 1 : nowYear;
                    const m = ((nowMonth - i) % 12 + 12) % 12;
                    const key = y + '-' + String(m + 1).padStart(2, '0');
                    plMonthly[key] = 0;
                }
                inventory.forEach(item => {
                    const cost = parseFloat(item.cost) || 0;
                    if (cost <= 0) return;
                    const d = new Date(item.date);
                    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                    if (plMonthly[key] !== undefined) {
                        const w = parseFloat(item.weight) || 0;
                        plMonthly[key] += (w * (prices[item.ayar] || 0)) - cost;
                    }
                });
                const plLabels = Object.keys(plMonthly);
                const plData = Object.values(plMonthly);
                plTrendChartInstance = new Chart(plTrendCtx, {
                    type: 'bar',
                    data: {
                        labels: plLabels,
                        datasets: [{
                            label: 'Kâr/Zarar (TL)',
                            data: plData,
                            backgroundColor: plData.map(v => v >= 0 ? 'rgba(26,127,55,0.7)' : 'rgba(192,57,43,0.7)'),
                            borderRadius: 4,
                            borderSkipped: false
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: {
                            x: { ticks: { color: tColor }, grid: { display: false } },
                            y: { ticks: { color: tColor }, grid: { color: gColor } }
                        },
                        plugins: { legend: { display: false } }
                    }
                });
            }

            // --- Gider vs Varlık Artışı ---
            const evaCanvas = document.getElementById('expenseVsAssetChart');
            if (evaCanvas) {
                if (expenseVsAssetChartInstance) expenseVsAssetChartInstance.destroy();
                const evaCtx = evaCanvas.getContext('2d');
                const evaLabels = expLabels;
                const assetGrowthData = [];
                sortedMonths.forEach(m => { assetGrowthData.push(monthlyGrowth[m] || 0); });
                expenseVsAssetChartInstance = new Chart(evaCtx, {
                    type: 'bar',
                    data: {
                        labels: evaLabels,
                        datasets: [
                            { label: 'Gider', data: expData, backgroundColor: 'rgba(192,57,43,0.6)', borderRadius: 4, borderSkipped: false },
                            { label: 'Varlık Artışı', data: assetGrowthData, backgroundColor: 'rgba(0,147,158,0.6)', borderRadius: 4, borderSkipped: false }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: {
                            x: { ticks: { color: tColor }, grid: { display: false } },
                            y: { ticks: { color: tColor }, grid: { color: gColor }, beginAtZero: true }
                        },
                        plugins: { legend: { labels: { color: tColor } } }
                    }
                });
            }
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

        updateUI();
        updateDebtsUI();
        updateExpensesUI();
        // Sayfa yüklenirken sessizce kurları güncelle
        fetchPricesSilent();
        
        // Mobil Bottom Navigation aktif durumu
        updateMobileNav();

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

    // Mobil Bottom Nav handler
    function updateMobileNav() {
        const navItems = document.querySelectorAll('.mobile-nav-item');
        const currentView = document.querySelector('[id$="-view"][style*="block"]')?.id.replace('-view', '') || 'dashboard';
        
        navItems.forEach(item => {
            const target = item.dataset.target;
            if (target === currentView) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
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