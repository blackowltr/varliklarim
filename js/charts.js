// ═══════════════════════════════════════════════════════════
// charts.js — Statistics, price history, Chart.js rendering
// ═══════════════════════════════════════════════════════════

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

