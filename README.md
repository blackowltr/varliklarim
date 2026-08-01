# Varlık Yönetimi — Altın Portföy & Zekat Hesaplayıcı

Kişisel altın varlıklarınızı takip etmek, zekat yükümlülüğünüzü hesaplamak, borç, gider, abonelik ve maaş kayıtlarınızı yönetmek için kullanılan PWA uygulaması.

> 🌐 **Canlı Site**: [blackowltr.github.io/varliklarim](https://blackowltr.github.io/varliklarim/)

---

## Dosya Yapısı

```
varliklarim/
├── index.html              # Uygulamanın tamamı (tek sayfa, 7 görünüm)
├── landing.html            # Tanıtım sayfası
├── css/
│   ├── base.css            # Reset, tema tokenları, tipografi
│   ├── layout.css          # Nav, grid, sidebar, mobil nav
│   ├── components.css      # Buton, input, kart, tablo, modal, toast
│   ├── dashboard.css       # Zekat banner, hedef halkası, özet kartları
│   ├── stats.css           # Grafik kartları, metrikler
│   ├── debts.css           # Borç kartları, taksit paneli
│   ├── expenses.css        # Giderler ve abonelikler
│   ├── salary.css          # Maaş sayfası
│   ├── settings.css        # Ayarlar
│   ├── animations.css      # Keyframes, geçişler
│   └── responsive.css      # Tüm @media sorguları (print dahil)
└── js/
    ├── state.js            # Durum, şema göçü, sabitler   ← ilk yüklenmeli
    ├── utils.js            # Toast, escapeHtml, biçimlendirme
    ├── router.js           # Sekme geçişi, swipe, pull-to-refresh
    ├── theme.js            # Açık/koyu, renk şeması, yazı boyutu
    ├── gold.js             # Envanter, saf ağırlık, zekat, kur çekme
    ├── debts.js            # Borç ekleme, taksit, ödeme
    ├── modals.js           # Modal yönetimi, K/Z detayı, zekat kaydı
    ├── expenses.js         # Giderler ve abonelikler
    ├── export.js           # Yedek, PDF, CSV, aylık rapor
    ├── charts.js           # Chart.js grafikleri, istatistikler
    ├── three-progress.js   # 3B hedef ilerleme halkası
    ├── salary.js           # Maaş / gelir takibi
    └── app.js              # Init, service worker, PWA
```

**Yükleme sırası önemlidir.** `state.js` tüm sabitleri ve koleksiyonları tanımlar; diğer modüller ona bağlıdır. `index.html` içindeki `<script>` sırası değiştirilmemelidir.

---

## Özellikler

### Altın Portföy Takibi
- 24 Ayar, 22 Ayar, 18 Ayar, 14 Ayar, Cumhuriyet, Yarım, Çeyrek
- Canlı kur ile otomatik değer hesaplama, kur bayatsa uyarı
- Kâr/Zarar analizi (maliyet girilen kalemlerde)

### Zekat Hesaplama
- Nisap kontrolü (Hanefi ölçüsü: 80.18 g saf altın)
- Borç düşülmüş ve düşülmemiş olmak üzere iki ayrı tutar
- Havl (dolanım yılı) takibi — nisap ilk aşıldığında tarih sabitlenir

### Borç Yönetimi
- Kredi kartı, kredi, taksitli, nakit avans, şahıs, kurum
- Taksit periyodu (aylık / 2, 3, 6 ayda bir), ilerleme çubukları
- Borç / Varlık oranı

### Gider, Abonelik ve Maaş
- Kategorize gider kaydı ve aylık trend grafikleri
- Abonelik takibi (aylık / yıllık karşılık)
- Maaş ve promosyon kaydı, son 12 ay ortalaması, tasarruf oranı

### Raporlama
- Aylık rapor (gelir, gider, nakit akışı, varlık durumu)
- PDF yazdırma ve CSV dışa aktarma
- JSON yedek alma ve geri yükleme

### Diğer
- Açık / koyu tema, renk şeması ve yazı boyutu ayarı
- Tam responsive, PWA olarak yüklenebilir
- **%100 özel**: bulut yok, sunucu yok, veriler tarayıcınızda kalır

---

## Veri Saklama

Tüm veriler `localStorage`'da tutulur. Anahtarlar `js/state.js` içindeki `STORAGE_KEYS` sabitinde tek noktada tanımlıdır.

Şema sürümü `appSchemaVersion` altında tutulur. Sürüm 2 ile birlikte envanter ve borç kayıtlarına kalıcı `id` alanı eklenmiştir; eski kayıtlar açılışta otomatik olarak göç ettirilir, veri kaybı olmaz.

---

## Kullanım

```bash
git clone https://github.com/blackowltr/varliklarim.git
cd varliklarim
```

Modüler dosya yapısı nedeniyle `file://` ile açıldığında bazı tarayıcılar CORS kısıtı uygulayabilir. Yerel bir sunucu önerilir:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

---

## Teknoloji

| Teknoloji | Kullanım |
|-----------|----------|
| HTML5 | Yapı |
| CSS3 | Tasarım, animasyonlar, tema sistemi |
| JavaScript (Vanilla) | İş mantığı, veri yönetimi |
| Chart.js | Grafikler (CDN) |
| three.js | 3B hedef halkası (CDN, opsiyonel — yoksa CSS yedeğine düşer) |
| localStorage | Veri saklama |

Framework veya build tool gerekmez.

---

## PWA Olarak Yükleme

1. Uygulamayı Safari veya Chrome'da açın
2. **Paylaş** → **Ana Ekrana Ekle**

---

## Lisans

MIT
