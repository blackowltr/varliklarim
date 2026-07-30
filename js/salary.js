// ═══════════════════════════════════════════════════════════
// salary.js — Salary & bonus tracking
// ═══════════════════════════════════════════════════════════

function getSalaryData() {
    const raw = localStorage.getItem('salaryData');
    if (raw) {
        try { return JSON.parse(raw); } catch(e) {}
    }
    return { entries: [] };
}

function saveSalaryData(data) {
    localStorage.setItem('salaryData', JSON.stringify(data));
}

function addSalaryEntry(e) {
    e.preventDefault();
    const data = getSalaryData();
    const month = document.getElementById('salary-month').value;
    const net = parseFloat(document.getElementById('salary-net').value);
    const bonuses = parseFloat(document.getElementById('salary-bonuses').value) || 0;

    if (!month) { showToast('Ay seçin', 'error'); return; }
    if (isNaN(net) || net <= 0) { showToast('Geçerli net maaş girin', 'error'); return; }

    const existingIdx = data.entries.findIndex(e => e.month === month);
    const entry = { month, netSalary: net, bonuses, id: Date.now() };

    if (existingIdx >= 0) {
        data.entries[existingIdx] = entry;
        showToast('Maaş güncellendi', 'success');
    } else {
        data.entries.push(entry);
        showToast('Maaş eklendi', 'success');
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
        label: 'Maaş',
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

    const countEl = document.getElementById('salary-count-entries');
    if (countEl) countEl.textContent = data.entries.length;

    let totalNet = 0, totalBonuses = 0;
    data.entries.forEach(e => {
        totalNet += e.netSalary || 0;
        totalBonuses += e.bonuses || 0;
    });

    document.getElementById('salary-total-net').textContent = totalNet.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';
    document.getElementById('salary-total-bonuses').textContent = totalBonuses.toLocaleString('tr-TR', {minimumFractionDigits:2}) + ' TL';

    container.innerHTML = '';
    if (data.entries.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:3rem 1rem;"><div class="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><strong>Henüz kayıt yok</strong><p>Maaş bilgilerinizi eklemeye başlayın.</p></div>';
        return;
    }

    const sorted = [...data.entries].sort((a, b) => b.month.localeCompare(a.month));
    sorted.forEach(e => {
        const monthName = formatMonth(e.month);
        const net = e.netSalary || 0;
        const bonuses = e.bonuses || 0;

        container.insertAdjacentHTML('beforeend', `
            <div class="s-card">
                <div class="s-card-header">
                    <div class="s-card-month">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${monthName}
                    </div>
                    <button class="s-card-del" onclick="deleteSalaryEntry(${e.id})" title="Sil">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
                <div class="s-card-body">
                    <div class="s-card-net">${net.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div>
                    <div class="s-card-meta">
                        ${bonuses > 0 ? `<span class="s-card-bonus">+${bonuses.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL promosyon</span>` : ''}
                    </div>
                </div>
            </div>
        `);
    });
}

function formatMonth(monthStr) {
    if (!monthStr) return '';
    const parts = monthStr.split('-');
    if (parts.length !== 2) return monthStr;
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const mIdx = parseInt(parts[1]) - 1;
    return months[mIdx] + ' ' + parts[0];
}
