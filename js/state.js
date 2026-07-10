// ═══════════════════════════════════════════════════════════
// state.js — Data variables, localStorage loading & initialization
// ═══════════════════════════════════════════════════════════

// --- Data & Mappings ---
    let inventory = [];
    try {
        const storedInv = JSON.parse(localStorage.getItem('goldInventory'));
        if (Array.isArray(storedInv)) inventory = storedInv;
    } catch(e) { console.error(e); }

    let debts = [];
    try {
        const storedDebts = JSON.parse(localStorage.getItem('goldDebts'));
        if (Array.isArray(storedDebts)) debts = storedDebts;
    } catch(e) { console.error(e); }

    let zakatHistory = [];
    try {
        const storedHistory = JSON.parse(localStorage.getItem('zakatHistoryRecords'));
        if (Array.isArray(storedHistory)) zakatHistory = storedHistory;
    } catch(e) { console.error(e); }

    // Gider Takip Sistemi
    let expenses = [];
    try {
        const storedExpenses = JSON.parse(localStorage.getItem('monthlyExpenses'));
        if (Array.isArray(storedExpenses)) expenses = storedExpenses;
    } catch(e) { console.error(e); }

    // Abonelik Takip Sistemi
    let subscriptions = [];
    try {
        const storedSubs = JSON.parse(localStorage.getItem('userSubscriptions'));
        if (Array.isArray(storedSubs)) subscriptions = storedSubs;
    } catch(e) { console.error(e); }

    const defaultPrices = { "24k": 3000, "22k": 2850, "cumhuriyet": 20500, "yarim": 10250, "ceyrek": 5125, "18k": 2250, "14k": 1750, "usd": 34.50 };
    let prices = { ...defaultPrices };
    try {
        const storedPrices = JSON.parse(localStorage.getItem('goldPrices'));
        if (storedPrices && typeof storedPrices === 'object') {
            prices = { ...defaultPrices, ...storedPrices };
        }
    } catch(e) { console.error(e); }

    let zakatNextDueDate = null;
    try {
        const stored = localStorage.getItem('zakatNextDueDate');
        if (stored) {
            const d = new Date(stored);
            if (!isNaN(d.getTime())) zakatNextDueDate = d;
        }
    } catch(e) { console.error(e); }

    const storedTarget = localStorage.getItem('goldGoalTarget');
    if(storedTarget) {
        const tInp = document.getElementById('target-input');
        if(tInp) tInp.value = storedTarget;
    }

    const typeNames = {
        "24k": "24 Ayar (Saf)", "22k": "22 Ayar (Bilezik)", "cumhuriyet": "Cumhuriyet",
        "yarim": "Yarım", "ceyrek": "Çeyrek", "18k": "18 Ayar", "14k": "14 Ayar"
    };

    const purities = { "24k": 1.0, "22k": 0.916, "18k": 0.750, "14k": 0.585, "cumhuriyet": 0.916, "yarim": 0.916, "ceyrek": 0.916 };
    const coinWeights = { "cumhuriyet": 7.216, "yarim": 3.608, "ceyrek": 1.804 };

    const dateInput = document.getElementById('date');
    if(dateInput) dateInput.valueAsDate = new Date();
    
    const debtDateInput = document.getElementById('debt-date');
    if(debtDateInput) debtDateInput.valueAsDate = new Date();
    
    const expenseDateInput = document.getElementById('expense-date');
    if(expenseDateInput) expenseDateInput.valueAsDate = new Date();

    const subStartDateInput = document.getElementById('sub-start-date');
    if(subStartDateInput) subStartDateInput.valueAsDate = new Date();

