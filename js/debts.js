// ═══════════════════════════════════════════════════════════
// debts.js — Debt management (CRUD, installments, filtering)
// ═══════════════════════════════════════════════════════════

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

