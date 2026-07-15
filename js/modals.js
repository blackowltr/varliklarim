// ═══════════════════════════════════════════════════════════
// modals.js — All modal content rendering (PnL, debt detail, payment, zakat, prices)
// ═══════════════════════════════════════════════════════════

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

            const instDates = debt.installmentDates || [];
            for (let i = 1; i <= debt.installmentTotal; i++) {
                let instDateStr;
                if (instDates[i - 1]) {
                    const parts = instDates[i - 1].split('-');
                    instDateStr = parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : instDates[i - 1];
                } else {
                    const startDate = new Date(debt.date);
                    const instDate = new Date(startDate);
                    const period = debt.installmentPeriod || 1;
                    instDate.setMonth(instDate.getMonth() + ((i - 1) * period));
                    instDateStr = instDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
                }
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

