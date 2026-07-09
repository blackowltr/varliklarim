# Varlık Yönetimi — Altın Portföy & Zekat Hesaplayıcı

Kişisel altın varlıklarınızı takip etmek, zekat yükümlülüklerinizi hesaplamak ve giderlerinizi yönetmek için kullanılan PWA uygulaması.

> 🌐 **Canlı Site**: [blackowltr.github.io/varliklarim](https://blackowltr.github.io/varliklarim/)

---

## Ekran Görüntüleri

| Dashboard | Portföy | Borçlar | İstatistikler |
|-----------|---------|---------|---------------|
| Ana sayfa, Net Değer, Hızlı İşlemler | Altın envanteri, Anlık Değer | Borç kartları, Taksit takibi | Grafikler, K/Z Analizi |

---

## Özellikler

### Altın Portföy Takibi
- 24 Ayar (Saf), 22 Ayar (Bilezik), Cumhuriyet, Yarım, Çeyrek, Ata, BES, Gram Altın
- Anlık canlı kur fiyatlarıyla otomatik değer hesaplama
- Kâr/Zarar analizi (maliyet girilen kalemlerde)
- Kategori bazlı renk kodlu kartlar

### Borç Yönetimi
- Kredi Kartı, Kredi, Taksitli, Nakit Avans, Şahıs, Kurum, Diğer
- Taksit takibi ve ilerleme çubukları
- Ödeme yapma ve borç silme
- Borç / Varlık oranı

### Gider Takibi
- Kategorize gider kaydı (Faturalar, Market, Ulaşım vb.)
- Aylık gider trendi grafikleri
- Gider Kategorileri dağılımı (pasta grafik)
- Gider vs Varlık Artışı karşılaştırması

### İstatistikler & Grafikler
- **8+ İstatistik Kartı**: Tasarruf Oranı, Büyüme Hızı, Risk Oranı, Borç Özeti, En Değerli 3 Varlık
- **6 Grafik Türü**: Varlık Dağılımı (pie), Aylık Büyüme (line), Gider Trendi (bar), Gider Kategorileri (doughnut), K/Z Trendi (bar), Gider vs Varlık (bar)
- Net Değer trendi
- Kâr/Zarar detayı (ortalama alış, birim fark, toplam getiri)

### Diğer
- **Zekat Hesaplama**: Nisap kontrolü, otomatik %2.5 hesaplama
- **Hedef Belirleme**: Altın hedefi koyun, ilerlemeyi takip edin
- **Dark Mode**: Aydınlık/Koyu tema desteği
- **Mobil Uyumlu**: Tam responsive, PWA desteği
- **Yedekleme**: JSON dışa aktarma ve içe aktarma
- **PDF/CSV Çıktı**: Rapor yazdırma ve dışa aktarma
- **%100 Özel**: Bulut yok, sunucu yok. Veriler tarayıcınızda kalır

---

## Kullanım

```bash
# Klonla
git clone https://github.com/blackowltr/varliklarim.git
cd varliklarim

# Tarayıcıda aç (sunucu gerekmez)
open index.html
```

Veya **GitHub Pages** üzerinden canlı kullanın:
👉 [blackowltr.github.io/varliklarim](https://blackowltr.github.io/varliklarim/)

---

## Teknoloji

| Teknoloji | Kullanım |
|-----------|----------|
| HTML5 | Yapı |
| CSS3 | Tasarım, Animasyonlar, Dark Mode |
| JavaScript (Vanilla) | İş Mantığı, Veri Yönetimi |
| Chart.js | Grafikler (CDN) |
| localStorage | Veri Saklama |

Framework veya build tool gerekmez. Saf HTML + CSS + JavaScript.

---

## Dosya Yapısı

```
varliklarim/
├── index.html          # Ana uygulama (giderler dahil)
├── varlıklarım.html    # Sade varyant (giderler olmadan)
├── landing.html        # Tanıtım sayfası
├── style.css           # Tüm stiller (~3000 satır)
├── app.js              # Tüm iş mantığı (~2500 satır)
└── README.md
```

---

## PWA Olarak Yükleme

1. Uygulamayı **Safari** veya **Chrome**'da açın
2. **Paylaş** butonuna tıklayın
3. **"Ana Ekrana Ekle"** seçin
4. Artık ana ekranınızdan uygulama gibi açabilirsiniz

---

## Lisans

MIT
