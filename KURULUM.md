# Stok Yönetim Sistemi — macOS Kurulum Kılavuzu

Bu kılavuz, Stok Yönetim Sistemi'ni macOS bilgisayarınıza sıfırdan kurmanızı ve çalıştırmanızı adım adım anlatmaktadır. Herhangi bir teknik bilgiye gerek yoktur.

---

## Gereksinimler

Uygulamayı çalıştırmak için yalnızca **Docker Desktop** gereklidir. Node.js, PostgreSQL veya başka bir yazılım kurmanıza gerek yoktur.

---

## Adım 1 — Docker Desktop Kurulumu

Docker Desktop, uygulamanın çalışması için gereken tüm altyapıyı otomatik olarak kurar.

1. Aşağıdaki bağlantıyı Safari veya Chrome ile açın:

   **https://www.docker.com/products/docker-desktop/**

2. **"Download for Mac"** butonuna tıklayın.
   - Apple Silicon (M1/M2/M3) işlemcili Mac için **"Mac with Apple Silicon"** seçeneğini,
   - Intel işlemcili Mac için **"Mac with Intel Chip"** seçeneğini seçin.

   > İşlemci türünüzü öğrenmek için: Sol üst köşedeki  → **Bu Mac Hakkında** → işlemci satırına bakın. "Apple M..." yazıyorsa Apple Silicon, "Intel Core" yazıyorsa Intel'dir.

3. İndirilen `.dmg` dosyasını çift tıklayarak açın.

4. Açılan pencerede **Docker** simgesini **Applications** klasörüne sürükleyin.

5. Launchpad veya Finder'dan **Docker**'ı açın.

6. Güvenlik uyarısı çıkarsa **"Aç"** butonuna tıklayın ve macOS şifrenizi girin.

7. Docker Desktop başladığında menü çubuğunda (ekranın sağ üst köşesi) bir **balina** simgesi görünür. Simge durduğunda Docker hazır demektir.

   > İlk açılışta birkaç dakika sürebilir. Balina simgesi hareket ediyorsa Docker hâlâ başlatılıyor demektir.

---

## Adım 2 — Uygulama Dosyalarını Bilgisayarınıza Alma

Uygulama dosyaları size ayrıca bir **ZIP dosyası** veya **USB bellek** ile teslim edilecektir.

1. ZIP dosyasını **İndirilenler** klasörüne kopyalayın.
2. ZIP dosyasına çift tıklayarak açın. `stok-yonetim` (veya benzeri) adında bir klasör oluşur.
3. Bu klasörü, kolayca bulabileceğiniz bir yere taşıyın. Örneğin **Belgeler** klasörünüze:

   ```
   /Users/[kullanıcı-adınız]/Documents/stok-yonetim
   ```

---

## Adım 3 — Terminal'i Açma

Terminal, bilgisayarınıza metin komutları girmenizi sağlayan bir araçtır.

1. **Spotlight Arama**'yı açın: klavyede `⌘ Command + Boşluk` tuşlarına birlikte basın.
2. Arama kutusuna **Terminal** yazın ve Enter'a basın.
3. Siyah veya beyaz arka planlı bir pencere açılır — bu Terminal'dir.

---

## Adım 4 — Uygulama Klasörüne Gitme

Terminal'e şu komutu yazın ve Enter'a basın:

```bash
cd ~/Documents/stok-yonetim
```

> **Not:** Klasörü farklı bir yere taşıdıysanız, komutu buna göre değiştirin. Örneğin Masaüstü'ne koyduysanız: `cd ~/Desktop/stok-yonetim`

Doğru klasörde olduğunuzu doğrulamak için şunu yazın:

```bash
ls
```

Çıktıda `docker-compose.yml`, `backend` ve `frontend` klasörlerini görmelisiniz.

---

## Adım 5 — Uygulamayı Başlatma

Aşağıdaki komutu Terminal'e yazın ve Enter'a basın:

```bash
docker compose up --build
```

> **İlk kurulumda bu işlem 5–15 dakika sürebilir.** İnternet bağlantınıza ve bilgisayarınızın hızına göre değişir. Docker, gerekli tüm bileşenleri otomatik olarak indirir ve kurar.

Terminalde uzun bir çıktı görünecektir. Bu normaldir. İşlem tamamlandığında şuna benzer bir mesaj görürsünüz:

```
inventory_backend   | ✓ Server running on port 3000
inventory_frontend  | VITE ready in ... ms
```

---

## Adım 6 — Uygulamaya Erişim

Uygulama hazır olduğunda tarayıcınızı açın ve adres çubuğuna şunu yazın:

```
http://localhost:5173
```

Giriş ekranı karşınıza gelecektir.

### Giriş Bilgileri

| Alan     | Değer                    |
|----------|--------------------------|
| E-posta  | admin@inventory.com      |
| Şifre    | admin123                 |

> İlk girişten sonra **Kullanıcılar** menüsünden yeni kullanıcılar oluşturabilir ve şifreleri değiştirebilirsiniz.

---

## Uygulamayı Kapatma

Uygulamayı durdurmak için Terminal'de **`Ctrl + C`** tuşlarına basın.

Yeniden başlatmak için aynı klasörde şu komutu çalıştırın:

```bash
docker compose up
```

> İlk kurulumda `--build` gereklidir. Sonraki başlatmalarda bu eki yazmana gerek yoktur.

---

## Sık Sorulan Sorular

### "Docker Desktop is not running" hatası

Docker Desktop'ın çalışmadığı anlamına gelir. Launchpad'den Docker'ı açın ve menü çubuğundaki balinayı bekleyin.

---

### "port is already allocated" hatası

5173 veya 3000 portu başka bir uygulama tarafından kullanılıyor. Terminale şunu yazın:

```bash
docker compose down
docker compose up
```

---

### Uygulama tarayıcıda açılmıyor

1. Docker Desktop'ın çalıştığını kontrol edin (menü çubuğu balina simgesi).
2. Terminalde `docker compose up` komutunun hâlâ çalıştığından emin olun.
3. Tarayıcıda `http://localhost:5173` adresini deneyin (`https` değil, `http` olmalıdır).

---

### Verilerim silindi

Uygulama verileri Docker volume'larında saklanır. `docker compose down -v` komutunu çalıştırırsanız veriler silinir. Normal kullanımda (`docker compose down` veya sadece kapatma) veriler korunur.

---

### Uygulama güncellendi, ne yapmalıyım?

Yeni dosyaları indirip eski klasörün üzerine kopyalayın, ardından:

```bash
docker compose down
docker compose up --build
```

---

## Kullanıcı Rolleri

| Rol       | Yetkiler                                                              |
|-----------|-----------------------------------------------------------------------|
| Admin     | Tüm işlemler + kullanıcı yönetimi                                     |
| Yönetici  | Ürün, kategori, tedarikçi, stok ve sipariş ekleme/düzenleme           |
| Personel  | Görüntüleme ve stok hareketi kaydetme                                 |

---

## Destek

Herhangi bir sorun yaşarsanız lütfen uygulama sağlayıcınızla iletişime geçin.
