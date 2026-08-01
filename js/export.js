// ═══════════════════════════════════════════════════════════
// export.js — Backup/restore, PDF export, CSV download
// ═══════════════════════════════════════════════════════════

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

    function generateMonthlyReport() {
        const now = new Date();
        const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
        const monthStr = monthNames[now.getMonth()] + ' ' + now.getFullYear();
        const dateStr = now.toLocaleDateString('tr-TR', {day:'2-digit', month:'long', year:'numeric'});
        const timeStr = now.toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});

        // Calculate monthly data
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

        const monthExpenses = expenses.filter(e => e.timestamp >= monthStart && e.timestamp < monthEnd);
        const expenseTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

        const monthDebts = debts.filter(d => {
            const dDate = new Date(d.date).getTime();
            return dDate >= monthStart && dDate < monthEnd;
        });
        const debtTotal = monthDebts.reduce((s, d) => s + d.totalAmount, 0);

        // Calculate portfolio value
        let totalAssetValue = 0;
        inventory.forEach(item => {
            const w = parseFloat(item.weight) || 0;
            totalAssetValue += w * (prices[item.ayar] || 0);
        });

        // Zekat calculation
        const zekatThreshold = totalAssetValue >= (80 * (prices['24k'] || 2540));
        const zekatAmount = zekatThreshold ? totalAssetValue * 0.025 : 0;

        // Subscriptions
        let monthlySubs = 0;
        subscriptions.forEach(s => {
            monthlySubs += s.period === 'yearly' ? s.amount / 12 : s.amount;
        });

        // Build printable content
        const style = `
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'DM Sans', -apple-system, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
                h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.03em; margin-bottom: 4px; }
                .meta { color: #666; font-size: 13px; margin-bottom: 30px; }
                .section { margin-bottom: 28px; }
                h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #00939E; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #00939E; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .card { background: #F5FAFA; border-radius: 12px; padding: 14px 16px; }
                .card-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #666; }
                .card-val { font-size: 22px; font-weight: 700; color: #00939E; margin-top: 4px; }
                .card-val.red { color: #C0392B; }
                .card-val.gold { color: #A87B00; }
                table { width: 100%; border-collapse: collapse; font-size: 13px; }
                th { text-align: left; padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; }
                td { padding: 8px 10px; border-bottom: 1px solid #eee; }
                .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #999; text-align: center; }
            </style>
        `;

        let expenseRows = '';
        monthExpenses.sort((a, b) => b.timestamp - a.timestamp).forEach(e => {
            expenseRows += `<tr><td>${new Date(e.date).toLocaleDateString('tr-TR')}</td><td>${expenseCategoryNames[e.category] || e.category}</td><td style="text-align:right;">${e.amount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</td><td>${e.note || '—'}</td></tr>`;
        });

        let debtRows = '';
        monthDebts.forEach(d => {
            debtRows += `<tr><td>${new Date(d.date).toLocaleDateString('tr-TR')}</td><td>${d.name}</td><td style="text-align:right;">${d.totalAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</td></tr>`;
        });

        // Category breakdown
        let catRows = '';
        const catTotals = {};
        monthExpenses.forEach(e => {
            const cat = expenseCategoryNames[e.category] || e.category || 'Diğer';
            catTotals[cat] = (catTotals[cat] || 0) + e.amount;
        });
        Object.entries(catTotals).sort((a, b) => b[1] - a[1]).forEach(([cat, amt]) => {
            const pct = expenseTotal > 0 ? (amt / expenseTotal * 100).toFixed(1) : 0;
            catRows += `<tr><td>${cat}</td><td style="text-align:right;">${amt.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</td><td style="text-align:right; color:#999;">%${pct}</td></tr>`;
        });

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(`
            <html><head><title>Aylık Rapor — ${monthStr}</title>${style}</head><body>
                <h1>Aylık Rapor</h1>
                <div class="meta">${monthStr} · ${dateStr} ${timeStr} · Varlıklarım</div>

                <div class="section">
                    <h2>Özet</h2>
                    <div class="grid">
                        <div class="card"><div class="card-label">Portföy Değeri</div><div class="card-val">${totalAssetValue.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div></div>
                        <div class="card"><div class="card-label">Aylık Gider</div><div class="card-val red">${expenseTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div></div>
                        <div class="card"><div class="card-label">Aylık Borç</div><div class="card-val red">${debtTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div></div>
                        <div class="card"><div class="card-label">Abonelikler/Ay</div><div class="card-val gold">${monthlySubs.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div></div>
                    </div>
                </div>

                ${expenseTotal > 0 ? `
                <div class="section">
                    <h2>Gider Kategorileri</h2>
                    <table><thead><tr><th>Kategori</th><th style="text-align:right;">Tutar</th><th style="text-align:right;">Oran</th></tr></thead><tbody>${catRows}</tbody></table>
                </div>` : ''}

                ${monthExpenses.length > 0 ? `
                <div class="section">
                    <h2>Gider Detayı (${monthExpenses.length} kayıt)</h2>
                    <table><thead><tr><th>Tarih</th><th>Kategori</th><th style="text-align:right;">Tutar</th><th>Açıklama</th></tr></thead><tbody>${expenseRows}</tbody></table>
                </div>` : ''}

                ${monthDebts.length > 0 ? `
                <div class="section">
                    <h2>Borç Detayı (${monthDebts.length} kayıt)</h2>
                    <table><thead><tr><th>Tarih</th><th>Borç</th><th style="text-align:right;">Tutar</th></tr></thead><tbody>${debtRows}</tbody></table>
                </div>` : ''}

                ${zekatThreshold ? `
                <div class="section">
                    <h2>Zekat Bilgisi</h2>
                    <div class="card"><div class="card-label">Tahmini Zekat</div><div class="card-val gold">${zekatAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})} TL</div></div>
                </div>` : ''}

                <div class="footer">Bu rapor Varlıklarım uygulaması tarafından ${dateStr} tarihinde oluşturulmuştur. · varliklarim.app</div>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 300);
    }

