# Varlıklarım - Altın Portföyü & Zekat Hesaplayıcı

Kişisel altın varlıklarınızı takip etmek, zekat yükümlülüklerinizi hesaplamak ve giderlerinizi yönetmek için kullanılan bir PWA uygulaması.

## Özellikler

- **Altın Envanteri**: 14K, 18K, 22K, 24K, Cumhuriyet, Yarım, Çeyrek altınlarınızı kaydedin
- **Zekat Hesaplama**: Nisap sınırını aşan varlıklar için %2.5 zekat hesaplama
- **Borç Takibi**: Borçlarınızı ve ödeme planlarınızı yönetin
- **Gider Yönetimi**: Kategorize edilmiş gider takibi (kira, elektrik, market vb.)
- **Kur Güncelleme**: Otomatik canlı kur çekme desteği
- **Kar/Zarar Analizi**: Altın alış maliyetinize göre anlık kar/zarar görüntüleme
- **Grafikler**: Portföy dağılımı ve büyüme grafikleri
- **Tema Desteği**: Açık/Koyu tema ve özelleştirilebilir renk şeması
- **Yedekleme**: Tüm verilerinizi JSON formatında yedekleyip geri yükleyin
- **PWA Desteği**: Mobil cihazınıza ana ekrana ekleyip uygulama gibi kullanın
- **PDF/CSV Çıktı**: Raporlarınızı PDF yazdırma veya CSV dışa aktarma ile paylaşın

## Kullanım

1. `index.html` dosyasını herhangi bir statik sunucuda açın veya GitHub Pages ile yayınlayın
2. Tüm veriler `localStorage` üzerinde cihazınızda saklanır
3. İlk kullanımda varsayılan kur fiyatlarıyla başlar, canlı kur çekme özelliği ile güncelleyebilirsiniz

## GitHub Pages

Bu repo GitHub Pages ile kullanıma hazırdır:

1. Repo ayarlarından **Settings > Pages** bölümüne gidin
2. **Deploy from a branch** seçeneğini seçin
3. `main` branch ve `/ (root)` dizinini seçin
4. Kaydedin, birkaç dakika içinde siteniz yayında olacaktır

## Lisans

MIT
