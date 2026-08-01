/* ============================================================
   MAAŞ / GELİR TAKİBİ
   HTML'de çağrılıyordu ama hiçbir yerde tanımlı değildi.
   Kayıtlar STORAGE_KEYS.salaries altında tutulur.
   ============================================================ */

function persistSalaries() {
    saveState(STORAGE_KEYS.salaries, salaries);
}

/* Aynı ay iki kez girilirse üzerine yazar — kopya kayıt oluşmaz */
function addSalaryEntry(event) {
    if (event) event.preventDefault();

    const month = document.getElementById('salary-month').value;
    const net = parseFloat(document.getElementById('salary-net').value);
    const bonus = parseFloat(document.getElementById('salary-bonuses').value) || 0;

    if (!month) { showToast('Lütfen ay seçin', 'error'); return; }
    if (isNaN(net) || net <= 0) { showToast('Geçerli bir net maaş girin', 'error'); return; }
    if (bonus < 0) { showToast('Promosyon negatif olamaz', 'error'); return; }

    const existing = salaries.findIndex(function (s) { return s.month === month; });
    const record = { id: makeId('sal'), month: month, net: net, bonus: bonus };

    if (existing !== -1) {
        record.id = salaries[existing].id;
        salaries[existing] = record;
        showToast(formatMonthTR(month) + ' kaydı güncellendi', 'success');
    } else {
        salaries.push(record);
        showToast(formatMonthTR(month) + ' kaydı eklendi', 'success');
    }

    salaries.sort(function (a, b) { return b.month.localeCompare(a.month); });
    persistSalaries();

    document.getElementById('salary-net').value = '';
    document.getElementById('salary-bonuses').value = '';

    if (typeof closeFormSheet === 'function') closeFormSheet();
    updateSalaryUI();
}

function deleteSalaryEntry(id) {
    const idx = salaries.findIndex(function (s) { return s.id === id; });
    if (idx === -1) return;
    if (!confirmAction(formatMonthTR(salaries[idx].month) + ' kaydını silmek istediğinize emin misiniz?')) return;
    salaries.splice(idx, 1);
    persistSalaries();
    showToast('Kayıt silindi', 'success');
    updateSalaryUI();
}

/* Son 12 ay penceresi — "Yıllık Net" kartı bunu gösterir */
function getSalaryTotals() {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 11);
    const cutoffKey = cutoff.toISOString().slice(0, 7);

    let net = 0, bonus = 0, months = 0;
    salaries.forEach(function (s) {
        if (s.month >= cutoffKey) {
            net += Number(s.net) || 0;
            bonus += Number(s.bonus) || 0;
            months++;
        }
    });
    return { net: net, bonus: bonus, months: months, average: months ? net / months : 0 };
}

/* Gider sayfasıyla ortak: tasarruf oranı hesabı buradan beslenir */
function getMonthlyIncome(monthKey) {
    const rec = salaries.find(function (s) { return s.month === monthKey; });
    if (!rec) return 0;
    return (Number(rec.net) || 0) + (Number(rec.bonus) || 0);
}

function updateSalaryUI() {
    const totals = getSalaryTotals();

    const netEl = document.getElementById('salary-total-net');
    const bonusEl = document.getElementById('salary-total-bonuses');
    const countEl = document.getElementById('salary-count-entries');

    if (netEl) netEl.textContent = formatTRY(totals.net + totals.bonus);
    if (bonusEl) bonusEl.textContent = formatTRY(totals.bonus);
    if (countEl) countEl.textContent = String(salaries.length);

    const list = document.getElementById('salary-list');
    if (!list) return;

    if (salaries.length === 0) {
        list.innerHTML =
            '<div class="empty-state">' +
            '<div class="empty-state-icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<circle cx="12" cy="12" r="9"/><line x1="8" y1="9" x2="16" y2="9"/>' +
            '<line x1="12" y1="7" x2="12" y2="17"/></svg></div>' +
            '<strong>Henüz Maaş Kaydı Yok</strong>' +
            '<p>Soldaki formdan ilk kaydınızı ekleyebilirsiniz.</p></div>';
        return;
    }

    const avgLine = totals.months > 1
        ? '<div class="salary-avg-note">Son ' + totals.months + ' ayın ortalaması: <strong>' +
          formatTRY(totals.average) + '</strong></div>'
        : '';

    const rows = salaries.map(function (s) {
        const total = (Number(s.net) || 0) + (Number(s.bonus) || 0);
        const bonusChip = s.bonus > 0
            ? '<span class="salary-row-bonus">+' + formatTRY(s.bonus) + ' promosyon</span>'
            : '';
        return '' +
            '<div class="salary-row">' +
                '<div class="salary-row-main">' +
                    '<div class="salary-row-month">' + escapeHtml(formatMonthTR(s.month)) + '</div>' +
                    '<div class="salary-row-meta">Net ' + formatTRY(s.net) + ' ' + bonusChip + '</div>' +
                '</div>' +
                '<div class="salary-row-total">' + formatTRY(total) + '</div>' +
                '<button type="button" class="btn-delete" title="Kaydı Sil" ' +
                        'onclick="deleteSalaryEntry(\'' + s.id + '\')">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
                    '<polyline points="3 6 5 6 21 6"/>' +
                    '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' +
                    '</svg>' +
                '</button>' +
            '</div>';
    }).join('');

    list.innerHTML = avgLine + '<div class="salary-list">' + rows + '</div>';
}
