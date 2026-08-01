/* ============================================================
   UYGULAMA DURUMU
   localStorage yükleme, şema göçü, sabitler ve sözlükler.
   Bu dosya diğer tüm modüllerden ÖNCE yüklenmelidir.
   ============================================================ */

/* ---- Depolama anahtarları — tek kaynak ---- */
const STORAGE_KEYS = {
    schema:        'appSchemaVersion',
    inventory:     'goldInventory',
    debts:         'goldDebts',
    zakatHistory:  'zakatHistoryRecords',
    expenses:      'monthlyExpenses',
    subscriptions: 'userSubscriptions',
    salaries:      'monthlySalaries',
    prices:        'goldPrices',
    priceHistory:  'priceHistory',
    zakatDueDate:  'zakatNextDueDate',
    zakatAnchor:   'zakatHaulAnchor',
    goalTarget:    'goldGoalTarget',
    theme:         'theme',
    colorScheme:   'colorScheme',
    fontSize:      'fontSize'
};

const SCHEMA_VERSION = 2;

/* ---- Güvenli okuma yardımcıları ---- */
function readArray(key) {
    try {
        const raw = JSON.parse(localStorage.getItem(key));
        return Array.isArray(raw) ? raw : [];
    } catch (e) {
        console.warn('[state] "' + key + '" okunamadı, boş dizi kullanılıyor.', e);
        return [];
    }
}

function readObject(key, fallback) {
    try {
        const raw = JSON.parse(localStorage.getItem(key));
        return (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : fallback;
    } catch (e) {
        console.warn('[state] "' + key + '" okunamadı, varsayılan kullanılıyor.', e);
        return fallback;
    }
}

function saveState(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('[state] "' + key + '" yazılamadı.', e);
        if (typeof showToast === 'function') {
            showToast('Kayıt başarısız — tarayıcı depolaması dolu olabilir', 'error');
        }
        return false;
    }
}

/* Kalemlere kalıcı kimlik üretir (index tabanlı silmenin yerini alır) */
function makeId(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' +
           Math.random().toString(36).slice(2, 8);
}

/* ---- Koleksiyonlar ---- */
let inventory     = readArray(STORAGE_KEYS.inventory);
let debts         = readArray(STORAGE_KEYS.debts);
let zakatHistory  = readArray(STORAGE_KEYS.zakatHistory);
let expenses      = readArray(STORAGE_KEYS.expenses);
let subscriptions = readArray(STORAGE_KEYS.subscriptions);
let salaries      = readArray(STORAGE_KEYS.salaries);

/* ---- Şema göçü: v1 kayıtlarına id ekle ---- */
(function migrateSchema() {
    const current = parseInt(localStorage.getItem(STORAGE_KEYS.schema), 10) || 1;
    if (current >= SCHEMA_VERSION) return;

    let touched = false;
    inventory.forEach(function (it) {
        if (!it.id) { it.id = makeId('inv'); touched = true; }
    });
    debts.forEach(function (d) {
        if (!d.id) { d.id = makeId('debt'); touched = true; }
    });
    if (touched) {
        saveState(STORAGE_KEYS.inventory, inventory);
        saveState(STORAGE_KEYS.debts, debts);
        console.info('[state] Şema v' + current + ' → v' + SCHEMA_VERSION + ' göçü tamamlandı.');
    }
    try { localStorage.setItem(STORAGE_KEYS.schema, String(SCHEMA_VERSION)); } catch (e) {}
})();

/* ---- Fiyatlar ----
   Varsayılanlar yalnızca ilk açılış / çevrimdışı için geçici zemindir;
   fetchPricesSilent() açılışta bunları canlı kurla değiştirir.
   Referans seviye: Temmuz 2026 sonu (gram altın ~6.175 TL, USD/TRY ~47,5). */
const defaultPrices = {
    "24k":        6175,
    "22k":        5660,
    "cumhuriyet": 42000,
    "yarim":      21000,
    "ceyrek":     10500,
    "18k":        4630,
    "14k":        3610,
    "usd":        47.50
};

let prices = Object.assign({}, defaultPrices, readObject(STORAGE_KEYS.prices, {}));

/* Kaydedilmiş kurun ne kadar bayat olduğunu bilmek zekat doğruluğu için önemli */
function pricesAreStale(maxHours) {
    const last = (typeof getLastPriceUpdate === 'function') ? getLastPriceUpdate() : null;
    if (!last) return true;
    return (Date.now() - new Date(last.timestamp).getTime()) > (maxHours || 24) * 3600 * 1000;
}

/* ---- Zekat havl (dönüm) tarihi ---- */
let zakatNextDueDate = null;
try {
    const storedDue = localStorage.getItem(STORAGE_KEYS.zakatDueDate);
    if (storedDue) {
        const d = new Date(storedDue);
        if (!isNaN(d.getTime())) zakatNextDueDate = d;
    }
} catch (e) { console.warn('[state] Zekat tarihi okunamadı.', e); }

/* ---- Hedef tutar ---- */
const storedTarget = localStorage.getItem(STORAGE_KEYS.goalTarget);
if (storedTarget) {
    const tInp = document.getElementById('target-input');
    if (tInp) tInp.value = storedTarget;
}

/* ---- Altın türü sözlükleri ---- */
const typeNames = {
    "24k":        "24 Ayar (Saf)",
    "22k":        "22 Ayar (Bilezik)",
    "cumhuriyet": "Cumhuriyet",
    "yarim":      "Yarım",
    "ceyrek":     "Çeyrek",
    "18k":        "18 Ayar",
    "14k":        "14 Ayar"
};

/* Milyem cinsinden saflık oranları */
const purities = {
    "24k": 1.000, "22k": 0.916, "18k": 0.750, "14k": 0.585,
    "cumhuriyet": 0.916, "yarim": 0.916, "ceyrek": 0.916
};

/* Ziynet altınlarının gram karşılıkları (brüt) */
const coinWeights = { "cumhuriyet": 7.216, "yarim": 3.608, "ceyrek": 1.804 };

/* Adet ile işlem gören türler — tek yerde tanımlı */
const COIN_TYPES = ["cumhuriyet", "yarim", "ceyrek"];
function isCoinType(t) { return COIN_TYPES.indexOf(t) !== -1; }

/* Nisap sınırı: 20 miskal = 85 g saf altın (Hanefi ölçüsü 80.18 g).
   Uygulama Hanefi ölçüsünü kullanır. */
const NISAP_GRAMS = 80.18;
const ZAKAT_DIVISOR = 40;          /* %2.5 */
const HIJRI_YEAR_DAYS = 354;

/* ---- Form tarihlerini bugüne ayarla ---- */
['date', 'debt-date', 'expense-date', 'sub-start-date'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.valueAsDate = new Date();
});

const salaryMonthInput = document.getElementById('salary-month');
if (salaryMonthInput && !salaryMonthInput.value) {
    salaryMonthInput.value = new Date().toISOString().slice(0, 7);
}
