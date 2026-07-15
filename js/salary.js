// ═══════════════════════════════════════════════════════════
// salary.js — Salary & income tracking with Polsan integration
// ═══════════════════════════════════════════════════════════

function getSalaryData() {
    const raw = localStorage.getItem('salaryData');
    if (raw) {
        try { return JSON.parse(raw); } catch(e) {}
    }
    return { entries: [], polsan: { shares: 0, dividends: [] } };
}

function saveSalaryData(data) {
    localStorage.setItem('salaryData', JSON.stringify(data));
}

function addSalaryEntry(e) {
    e.preventDefault();
    const data = getSalaryData();
    const month = document.getElementById('salary-month').value;
    const gross = parseFloat(document.getElementById('salary-gross').value);
    const net = parseFloat(document.getElementById('salary-net').value);
    const polsan = parseFloat(document.getElementById('salary-polsan').value) || 0;
    const otherDed = parseFloat(document.getElementById('salary-other-ded').value) || 0;
    const bonuses = parseFloat(document.getElementById('salary-bonuses').value) || 0;
    const savings = parseFloat(document.getElementById('salary-savings').value) || 0;
    const notes = document.getElementById('salary-notes').value.trim();

    if (!month) { showToast('Ay seçin', 'error'); return; }
    if (isNaN(gross) || gross <= 0) { showToast('Geçerli brüt maaş girin', 'error'); return; }
    if (isNaN(net) || net <= 0) { showToast('Geçerli net maaş girin', 'error'); return; }

    const existingIdx = data.entries.findIndex(e => e.month === month);
    const entry = { month, grossSalary: gross, netSalary: net, polsanDeduction: polsan, otherDeductions: otherDed, bonuses, savings, notes, id: Date.now() };

    if (existingIdx >= 0) {
        data.entries[existingIdx] = entry;
        showToast('Maaş bilgisi güncellendi', 'success');
    } else {
        data.entries.push(entry);
        showToast('Maaş bilgisi eklendi', 'success');
    }

    saveSalaryData(data);
    document.getElementById('salary-form').reset();
    document.getElementById('salary-month').valueAsDate = new Date();
    closeFormSheet();
    updateSalaryUI();
}

function deleteSalaryEntry(id) {
    const data = getSalaryData();
    const item = data.entries.find(e => e.id === id);
    if (!item) return;
    deleteWithUndo(item, {
        label: 'Maaş Kaydı',
        onDelete: () => {
            data.entries = data.entries.filter(e => e.id !== id);
            saveSalaryData(data);
            updateSalaryUI();
        },
        onRestore: () => {
            data.entries.push(item);
            saveSalaryData(data);
            updateSalaryUI();
        }
    });
}

function updateSalaryUI() {
    const data = getSalaryData();
    const container = document.getElementById('salary-list');
    if (!container) return;

    // Stats
    const countEl = document.getElementById('salary-count-entries');
    if (countEl) countEl.textContent = data.entries.length;
    let totalGross = 0, totalNet = 0, totalSavings = 0, totalBonuses = 0, totalPolsan = 0;
    data.entries.forEach(e => {
        totalGross += e.grossSalary || 0;
        totalNet += e.netSalary || 0;
        totalSavings += e.savings || 0;
        totalBonuses += e.bonuses || 0;
        totalPolsan += e.polsanDeduction || 0;
    });
    const savingsRate = totalNet > 0 ? (totalSavings / totalNet) * 100 : 0;

    document.getElementById('salary-total-gross').textContent = totalGross.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
    document.getElementById('salary-total-net').textContent = totalNet.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
    document.getElementById('salary-total-savings').textContent = totalSavings.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
    document.getElementById('salary-savings-rate').textContent = `%${savingsRate.toFixed(1)}`;
    document.getElementById('salary-total-bonuses').textContent = totalBonuses.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
    document.getElementById('salary-total-polsan-ded').textContent = totalPolsan.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';

    // Polsan dividend stats
    const divs = data.polsan.dividends || [];
    let totalDividends = 0;
    divs.forEach(d => { totalDividends += d.amount || 0; });
    if (document.getElementById('salary-total-dividends')) {
        document.getElementById('salary-total-dividends').textContent = totalDividends.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
    }
    if (document.getElementById('salary-polsan-shares')) {
        document.getElementById('salary-polsan-shares').textContent = (data.polsan.shares || 0) + ' Adet';
    }

    // Monthly list
    container.innerHTML = '';
    if (data.entries.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:3rem 1rem;"><div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><strong>Henüz kayıt yok</strong><p>Maaş bilgilerinizi eklemeye başlayın.</p></div>';
        return;
    }

    // Sort by month desc
    const sorted = [...data.entries].sort((a, b) => b.month.localeCompare(a.month));
    sorted.forEach(e => {
        const monthName = formatMonth(e.month);
        const gross = e.grossSalary || 0;
        const net = e.netSalary || 0;
        const polsan = e.polsanDeduction || 0;
        const otherDed = e.otherDeductions || 0;
        const bonuses = e.bonuses || 0;
        const savings = e.savings || 0;
        const savingsPct = net > 0 ? (savings / net) * 100 : 0;

        const totalDed = polsan + otherDed;
        const dedPct = gross > 0 ? (totalDed / gross) * 100 : 0;

        container.insertAdjacentHTML('beforeend', `
            <div class="salary-card">
                <div class="salary-card-accent"></div>
                <div class="salary-card-body">
                    <div class="salary-card-top">
                        <div class="salary-card-month">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;opacity:0.5;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            ${monthName}
                        </div>
                        <button class="salary-card-delete" onclick="deleteSalaryEntry(${e.id})" title="Sil">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                    <div class="salary-card-hero">
                        <div class="salary-card-hero-label">Net Maaş</div>
                        <div class="salary-card-hero-value">${net.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div>
                        <div class="salary-card-hero-sub">Brüt: ${gross.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL · Kesinti: ${totalDed.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL (%${dedPct.toFixed(1)})</div>
                    </div>
                    <div class="salary-card-details">
                        <div class="salary-card-detail">
                            <div class="salary-cd-icon salary-cd-polsan">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                            </div>
                            <div class="salary-cd-body">
                                <span class="salary-cd-label">Polsan Kesinti</span>
                                <span class="salary-cd-value">${polsan.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
                            </div>
                        </div>
                        <div class="salary-card-detail">
                            <div class="salary-cd-icon salary-cd-other">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
                            </div>
                            <div class="salary-cd-body">
                                <span class="salary-cd-label">Diğer Kesinti</span>
                                <span class="salary-cd-value">${otherDed.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
                            </div>
                        </div>
                        <div class="salary-card-detail">
                            <div class="salary-cd-icon salary-cd-bonus">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                            </div>
                            <div class="salary-cd-body">
                                <span class="salary-cd-label">Promosyon</span>
                                <span class="salary-cd-value">${bonuses > 0 ? '+' + bonuses.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL' : '—'}</span>
                            </div>
                        </div>
                        <div class="salary-card-detail">
                            <div class="salary-cd-icon salary-cd-save">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><circle cx="12" cy="15" r="2"/></svg>
                            </div>
                            <div class="salary-cd-body">
                                <span class="salary-cd-label">Tasarruf</span>
                                <span class="salary-cd-value">${savings.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
                            </div>
                        </div>
                    </div>
                    <div class="salary-card-savings-bar">
                        <div class="salary-card-savings-bar-track">
                            <div class="salary-card-savings-bar-fill" style="width:${Math.min(savingsPct, 100)}%"></div>
                        </div>
                        <span class="salary-card-savings-bar-label">%${savingsPct.toFixed(0)} tasarruf</span>
                    </div>
                    ${e.notes ? `<div class="salary-card-notes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;flex-shrink:0;opacity:0.4;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>${e.notes}</div>` : ''}
                </div>
            </div>
        `);
    });

    // Polsan dividend list
    updatePolsanDividendsUI(data);
}

function updatePolsanDividendsUI(data) {
    const divContainer = document.getElementById('salary-dividend-list');
    if (!divContainer) return;
    divContainer.innerHTML = '';
    const divs = data.polsan.dividends || [];
    if (divs.length === 0) {
        divContainer.innerHTML = '<div class="empty-state" style="padding:1.5rem 1rem;"><p style="color:var(--text-tertiary);font-size:0.85rem;">Henüz temettü kaydı yok.</p></div>';
        return;
    }
    const sorted = [...divs].sort((a, b) => b.year - a.year);
    sorted.forEach(d => {
        divContainer.insertAdjacentHTML('beforeend', `
            <div class="salary-dividend-row">
                <span class="salary-dividend-year">${d.year}</span>
                <span class="salary-dividend-amount">${(d.amount || 0).toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</span>
                <button class="salary-dividend-del" onclick="deleteSalaryDividend(${d.year})" title="Sil">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px;height:12px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        `);
    });
}

function savePolsanShares() {
    const val = parseInt(document.getElementById('salary-polsan-shares-input').value) || 0;
    const data = getSalaryData();
    data.polsan.shares = val;
    saveSalaryData(data);
    updateSalaryUI();
    showToast('Polsan hisse adedi güncellendi', 'success');
}

function addSalaryDividend(e) {
    e.preventDefault();
    const year = parseInt(document.getElementById('dividend-year').value);
    const amount = parseFloat(document.getElementById('dividend-amount').value);
    if (!year || isNaN(amount) || amount <= 0) { showToast('Geçerli yıl ve tutar girin', 'error'); return; }

    const data = getSalaryData();
    const existingIdx = data.polsan.dividends.findIndex(d => d.year === year);
    if (existingIdx >= 0) {
        data.polsan.dividends[existingIdx].amount = amount;
    } else {
        data.polsan.dividends.push({ year, amount });
    }
    saveSalaryData(data);
    document.getElementById('dividend-form').reset();
    updateSalaryUI();
    showToast('Temettü kaydedildi', 'success');
}

function deleteSalaryDividend(year) {
    const data = getSalaryData();
    data.polsan.dividends = data.polsan.dividends.filter(d => d.year !== year);
    saveSalaryData(data);
    updateSalaryUI();
    showToast('Temettü silindi', 'success');
}

function formatMonth(monthStr) {
    if (!monthStr) return '';
    const parts = monthStr.split('-');
    if (parts.length !== 2) return monthStr;
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const mIdx = parseInt(parts[1]) - 1;
    return months[mIdx] + ' ' + parts[0];
}
