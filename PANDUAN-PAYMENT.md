# 💳 Panduan Pembayaran Otomatis — PusatPerizinan.com

Panduan ini membuat situsmu **menerima pembayaran sendiri**: pelanggan pilih layanan di
`/checkout` → bayar via QRIS / Virtual Account / e-wallet / gerai retail → status pesanan
terkonfirmasi **otomatis** → kamu langsung dapat notifikasi WhatsApp/Telegram.

Tidak perlu jadi programmer. Ikuti salah satu **Jalur** di bawah (A = tercepat, B = paling mudah
diterima untuk usaha perorangan, C = paling tepercaya di mata pelanggan).

---

## Cara Kerja Sistem (singkat saja)

```
Pelanggan buka /checkout?paket=nib
        │  isi nama + WA
        ▼
Server buat Order di database (harga dari server — ANTI manipulasi)
        │
        ▼
Pelanggan bayar (QRIS / VA / e-wallet / retail)
        │
        ├──► Gateway kirim webhook → https://pusatperizinan.com/api/payment/webhook/<gateway>
        │        (tanda tangan kriptografi diverifikasi — webhook palsu DITOLAK)
        ▼
Status order jadi PAID → kamu dapat notifikasi 💰 → halaman status pelanggan
berubah jadi "Pembayaran Berhasil" + langkah selanjutnya + tombol WA ke kamu.
```

Prioritas jalur **otomatis** (diatur dari environment variables):

| Prioritas | Kondisi | Jalur |
|---|---|---|
| 1 | `MIDTRANS_SERVER_KEY` + `MIDTRANS_CLIENT_KEY` terisi | **Midtrans Snap** (QRIS, VA, e-wallet, kartu) |
| 2 | `TRIPAY_API_KEY` + `TRIPAY_PRIVATE_KEY` + `TRIPAY_MERCHANT_CODE` | **Tripay** (QRIS, VA, e-wallet, Alfamart/Indomaret) |
| 3 | `PAYMENT_DEMO_MODE=true` | **Mode Uji Coba** (simulasi, tanpa uang nyata) |
| 4 | tidak ada yang terisi | **Transfer manual** + konfirmasi WhatsApp |

> 🔒 Keamanan bawaan: begitu kunci gateway terisi, mode uji coba **tidak mungkin** dipakai.
> Status `PAID` terlindungi dari replay webhook. Harga selalu dibaca dari
> `src/lib/pricing.ts` di server.

---

## JALUR A — Mode Uji Coba (aktif sekarang, 0 rupiah, 0 menit)

Untuk mencoba seluruh alur SEBELUM punya akun gateway:

1. Di `.env` server (Hostinger File Manager) set: `PAYMENT_DEMO_MODE=true`
2. Buka situs → tombol **Pesan & Bayar** → pilih layanan → isi form → lanjut.
3. Di halaman status ada tombol **"Simulasikan Pembayaran Berhasil"** — klik untuk melihat
   alur lunas + notifikasi ke WA/Telegram adminmu (jika kanal notifikasi sudah diatur di `/admin`).
4. **Sebelum menerima pelanggan asli**, ikuti Jalur B atau C lalu hapus/`false`-kan flag ini.

---

## JALUR B — Tripay (REKOMENDASI: paling mudah, cocok perorangan)

Tripay menerima pendaftaran **tanpa PT** (cukup KTP + rekening). Biaya per transaksi rendah,
mendukung QRIS, VA BCA/BRI/BNI/Mandiri/Permata, ShopeePay, OVO, DANA, Alfamart, Indomaret.

1. **Daftar** di https://tripay.co.id → lengkapi data merchant (KTP, rekening, deskripsi usaha)
   → tunggu persetujuan (biasanya 1–3 hari kerja).
2. Di dashboard Tripay ambil: **API Key**, **Private Key**, **Merchant Code**.
3. Set **URL Callback** di dashboard Tripay:
   ```
   https://pusatperizinan.com/api/payment/webhook/tripay
   ```
4. Di **hPanel Hostinger → File Manager** buka `.env` di folder aplikasi, tambah:
   ```env
   TRIPAY_API_KEY=xxxx
   TRIPAY_PRIVATE_KEY=xxxx
   TRIPAY_MERCHANT_CODE=Txxxxx
   TRIPAY_IS_PRODUCTION=true
   PAYMENT_DEMO_MODE=false
   # metode yang tampil di checkout (sesuaikan kanal yang kamu aktifkan):
   TRIPAY_METHODS=QRIS,BRIVA,BCAVA,BNIVA,MANDIRIVA,SHOPEEPAY,ALFAMART,INDOMARET
   ```
5. hPanel → Terminal: `touch tmp/restart.txt` (atau restart aplikasi Node.js).
6. Uji: buat 1 pesanan asli nominal kecil (Rp 99.000 konsultasi) → bayar via QRIS →
   pastikan status berubah **Lunas** dan notifikasi masuk.

> 💡 Mode Sandbox Tripay (untuk uji tanpa uang): `TRIPAY_IS_PRODUCTION=false`
> dengan kunci sandbox dari dashboard mereka.

---

## JALUR C — Midtrans Snap (paling tepercaya, produk GoTo/GoPay)

Midtrans punya reputasi tertinggi di mata pelanggan Indonesia (logo GoPay + semua VA bank
utama + kartu kredit). Pendaftaran memerlukan: KTP, NPWP, rekening (perorangan bisa,
sebutkan jenis usaha "jasa konsultan perizinan").

1. **Daftar** di https://midtrans.com → verifikasi identitas → aktifkan mode produksi.
2. Ambil **Server Key** & **Client Key** (Dashboard Midtrans → Settings → API Keys).
3. Set **Payment Notification URL** (Dashboard → Settings → Configuration):
   ```
   https://pusatperizinan.com/api/payment/webhook/midtrans
   ```
4. Tambah di `.env` (File Manager hPanel):
   ```env
   MIDTRANS_SERVER_KEY=Mid-server-xxxxx
   MIDTRANS_CLIENT_KEY=Mid-client-xxxxx
   MIDTRANS_IS_PRODUCTION=true
   PAYMENT_DEMO_MODE=false
   ```
5. `touch tmp/restart.txt` lalu uji pesanan nominal kecil.

> Kunci yang diawali `SB-Mid-` = sandbox (uji). Untuk produksi gunakan kunci tanpa `SB-`.

---

## Mengubah Harga / Menambah Paket

Semua harga ada di **satu file**: `src/lib/pricing.ts` (objek `PACKAGES`).
Edit harga/fitur → commit & push → GitHub Actions otomatis deploy ke Hostinger
(pipeline yang sudah terpasang). Harga **tidak** bisa diubah dari browser —
itu memang fitur keamanan anti-manipulasi.

---

## Melihat Pesanan

1. Buka `https://pusatperizinan.com/admin` → login.
2. Tab baru **"Pesanan 💳"** (urutan kedua di sidebar):
   - Total pendapatan lunas + jumlah per status
   - Semua pesanan: nomor, layanan, nilai, klien, jalur bayar, status
   - Ubah status manual (untuk transfer manual atau penyesuaian)
   - Tombol WhatsApp langsung ke klien dengan template pesan siap kirim

---

## Masalah Umum

| Gejala | Sebab & Solusi |
|---|---|
| "MODE UJI COBA" muncul padahal kunci sudah diisi | `.env` belum terbaca → cek nama variabel persis, lalu `touch tmp/restart.txt` |
| Status stuck "Menunggu" padahal sudah bayar | Webhook URL belum di-set di dashboard gateway (lihat langkah 3 masing-masing jalur). Sistem tetap mengecek ulang tiap polling — akan lunas sendiri dalam hitungan menit setelah URL callback aktif |
| Checkout error 502 saat klik bayar | Kunci gateway salah/kadaluarsa → cek kembali Server/API Key di dashboard gateway |
| Ingin nonaktifkan checkout sementara | Di `.env` hapus semua kunci gateway + set `PAYMENT_DEMO_MODE=false` → checkout otomatis jadi transfer manual + WhatsApp |
| Notifikasi WA/Telegram tidak datang | Atur kanal notifikasi dulu di `/admin` → tab Notifikasi (uji dengan tombol kirim tes) |

---

## Ringkasan File Sistem Pembayaran

| File | Fungsi |
|---|---|
| `src/lib/pricing.ts` | Katalog paket & harga (sumber kebenaran) |
| `src/lib/payment/config.ts` | Resolver jalur pembayaran aktif |
| `src/lib/payment/midtrans.ts` | Provider Midtrans Snap + verifikasi webhook |
| `src/lib/payment/tripay.ts` | Provider Tripay + verifikasi webhook |
| `src/lib/payment/orders.ts` | Transisi status idempoten (anti replay) |
| `src/app/checkout/` | Halaman pesan & bayar |
| `src/app/payment/[orderNo]/` | Halaman status (auto-poll 4 detik) |
| `src/app/api/payment/*` | create, config, status, 2 webhook, demo-pay |
| `src/app/api/admin/orders/` | Data tab Pesanan di Mission Control |
