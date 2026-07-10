// ═══════════════════════════════════════════════════════════
// expenses.js — Expenses & subscriptions management
// ═══════════════════════════════════════════════════════════

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
            document.getElementById('nav-expenses')?.classList.remove('active');
            document.getElementById('nav-subscriptions')?.classList.remove('active');
            document.querySelectorAll('.mobile-nav-item').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.target === 'expenses');
            });
            updateExpensesUI();
        } else {
            expView.style.display = 'none';
            subView.style.display = 'block';
            subView.classList.remove('view-enter');
            void subView.offsetWidth;
            subView.classList.add('view-enter');
            document.getElementById('nav-expenses')?.classList.remove('active');
            document.getElementById('nav-subscriptions')?.classList.add('active');
            document.querySelectorAll('.mobile-nav-item').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.target === 'subscriptions');
            });
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

