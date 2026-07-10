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

