// ═══════════════════════════════════════════════════════════
// gold.js — Gold tracking, search, sort, dashboard UI, add/delete
// ═══════════════════════════════════════════════════════════

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
        const timeText = document.getElementById('nav-time-text');
        if (timeText) {
            const last = getLastPriceUpdate();
            if (last) {
                const d = new Date(last.timestamp);
                const timeStr = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                const dateStr = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
                timeText.textContent = `${dateStr} ${timeStr}`;
            } else {
                timeText.textContent = '';
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

