# 🚀 Panduan Deploy Otomatis — pusatperizinan.com di Hostinger Business (Node.js)

> **Tujuan:** pengalaman persis seperti Vercel — `git push` → situs otomatis ter-build dan live.
> **Perbedaan kunci dengan percobaan Anda sebelumnya:** build **TIDAK dijalankan di Hostinger**
> (itu penyebab gagal terus — situs 9.470 halaman butuh RAM 2-4 GB, hosting shared cuma izinkan
> ±512 MB-1 GB per app). Build dijalankan **GitHub Actions (RAM 7 GB, gratis)**, Hostinger cukup
> menjalankan hasilnya yang ringan.

---

## 🧭 Cara kerja otomatisasi (sekali paham, tenang selamanya)

```
 git push (atau merge ke main)
        │
        ▼
 GitHub Actions ──► bun install ──► next build (standalone)   ← di server GitHub, RAM 7 GB
        │
        ▼
 Upload bundle via FTPS ──► folder Application root Hostinger
        │
        ▼
 tmp/restart.txt ter-upload ──► Passenger restart aplikasi Node
        │
        ▼
 🌍 Situs LIVE di domain Anda (Node.js versi pilihan Anda)
```

Yang **tidak akan berubah** antar-deploy: database SQLite (`db/custom.db`), `.env.production`,
password admin — semua dilindungi `dangerous-clean-skip` di workflow.

---

## BAGIAN A — Persiapan di Hostinger (±10 menit, sekali saja)

### A1. Buat aplikasi Node.js

1. Login **hPanel** → pilih domain/website → menu **Advanced → Node.js**.
2. Klik **Create application** / **Add Node.js App**, isi:
   - **Node.js version**: pilih **20.x atau 22.x** (Next.js 16 butuh ≥20)
   - **Application root**: `nodeapp` di bawah folder domain
     (nanti path lengkapnya seperti `/home/u123456789/domains/pusatperizinan.com/nodeapp`)
   - **Application URL**: domain Anda (`pusatperizinan.com`)
   - **Application startup file**: **`start-passenger.cjs`** ← penting! (file ini ikut ter-upload otomatis)
3. Klik **Create**. Abaikan dulu status "running" — foldernya masih kosong.

### A2. Buat file `.env.production`

1. hPanel → **Files → File Manager** → masuk folder Application root (`nodeapp`).
2. Buat file baru bernama **`.env.production`**, isi mengikuti `.env.example`:

```
DATABASE_URL=file:/home/u123456789/domains/pusatperizinan.com/nodeapp/db/custom.db
ADMIN_PASSWORD=KataSandiKuatAnda2026!
ADMIN_SECRET=stringAcakPanjangMinimal32KarakterBebas
```

> ⚠️ Ganti `/home/u123456789/...` dengan **path asli** Anda (terlihat di File Manager / halaman Node.js).
> ⚠️ `ADMIN_PASSWORD` dan `ADMIN_SECRET` **wajib diganti** — melindungi dashboard `/admin`.

### A3. Catat kredensial FTP

hPanel → **Files → FTP Accounts** — catat: **host** (mis. `srv123.hstgr.io`), **username**,
**password** (reset jika lupa), dan pastikan directory aksesnya mencakup folder aplikasi.

---

## BAGIAN B — Sambungkan GitHub → Hostinger (±5 menit)

Repo ini sudah berisi workflow `.github/workflows/deploy-hostinger.yml`.

### B1. Buat SSH key untuk deploy (opsional tapi disarankan)

Di komputer Anda: `ssh-keygen -t ed25519 -C "deploy"` → tambahkan **public key** ke
hPanel → **Advanced → SSH Keys**. Simpan **private key** untuk langkah B2.
*(Lewati jika hanya ingin FTP — deploy tetap jalan, tapi schema DB & restart via SSH tidak otomatis.)*

### B2. Isi secrets di GitHub

Repo GitHub Anda → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret          | Isi                                                        | Wajib? |
| --------------- | ---------------------------------------------------------- | ------ |
| `FTP_SERVER`    | host FTP dari A3 (mis. `srv123.hstgr.io`)                  | ✅     |
| `FTP_USERNAME`  | username FTP                                               | ✅     |
| `FTP_PASSWORD`  | password FTP                                               | ✅     |
| `FTP_SERVER_DIR`| path Application root **diakhiri garis miring**, mis. `/home/u123456789/domains/pusatperizinan.com/nodeapp/` | ✅ |
| `FTP_PORT`      | `21` (default; boleh dikosongkan)                          | ⭕     |
| `SSH_HOST`      | host SSH (mis. IP atau `srv123.hstgr.io`)                  | ⭕     |
| `SSH_USERNAME`  | username SSH (= username FTP utama)                        | ⭕     |
| `SSH_KEY`       | isi private key dari B1 (atau kosong jika pakai password)  | ⭕     |
| `SSH_PASSWORD`  | password SSH (jika tidak pakai key)                        | ⭕     |

### B3. Push workflow ini ke GitHub

Pastikan folder `.github/` ikut ter-commit:

```bash
git add .github deploy scripts/remote-setup.sh scripts/postbuild.mjs .env.example package.json
git commit -m "ci: deploy otomatis ke Hostinger Node.js"
git push origin main
```

GitHub Actions langsung jalan **deploy pertama** (upload ±150-300 MB via FTP, butuh 10-30
menit sekali ini saja — deploy berikutnya hanya file yang berubah, ±2-5 menit).

---

## BAGIAN C — Aktivasi pertama (±3 menit, sekali saja)

1. Tunggu workflow **Actions → "Deploy ke Hostinger"** hijau ✅.
2. hPanel → **Advanced → Node.js** → aplikasi Anda → tombol **Restart** (atau biarkan
   `tmp/restart.txt` yang bekerja).
3. Buka **hPanel → Terminal** (atau SSH), jalankan sekali untuk menulis schema database:

   ```bash
   cd ~/domains/pusatperizinan.com/nodeapp
   bash .deploy/remote-setup.sh
   ```

   Script ini membuat semua tabel SQLite (idempoten — aman diulang) lalu me-restart aplikasi.
   *(Jika Anda mengisi secrets SSH, langkah ini sudah otomatis oleh workflow.)*
4. Buka `https://pusatperizinan.com` → **LIVE** 🎉
5. Cek `https://pusatperizinan.com/admin` → login dengan `ADMIN_PASSWORD` Anda.
6. SSL: hPanel → **Security → SSL** → pastikan status aktif untuk domain (umumnya auto).
   Aktifkan **Force HTTPS** bila tersedia.

---

## ✅ Kehidupan setelahnya (jalur Vercel-like)

| Kegiatan                                  | Yang Anda lakukan                              |
| ----------------------------------------- | ---------------------------------------------- |
| Update konten/kode                        | `git push` → tunggu Actions hijau → selesai    |
| Ganti harga/promo di data katalog         | `git push` (sama seperti di atas)              |
| Cek lead baru                             | buka `https://domain/admin` → Pipeline         |
| Notifikasi lead ke Telegram/WhatsApp      | login `/admin` → Notifications → isi token     |

---

## 🔧 Troubleshooting

| Gejala | Penyebab | Solusi |
| --- | --- | --- |
| Build gagal **di Hostinger** (lagi) | Ada yang mencoba `npm run build` di server | **Jangan pernah build di Hostinger.** Build hanya lewat GitHub Actions |
| Actions gagal di step install/build | Lain-lain | Baca log di tab Actions; 90% karena secret salah ketik |
| Upload FTP lambat sekali | Deploy pertama memang besar | Normal (10-30 mnt sekali; berikutnya delta saja) |
| Situs **502 / Internal error** | App crash saat start | File Manager → buka `crash.log` di folder app; 90% karena `.env.production` salah path `DATABASE_URL` |
| Situs 502 setelah deploy | Passenger belum restart | File Manager: pastikan ada `tmp/restart.txt`; atau klik **Restart** di hPanel Node.js |
| Halaman admin tidak bisa login | Password salah | Edit `.env.production` → ubah `ADMIN_PASSWORD` → restart |
| Lead tidak tersimpan | `DATABASE_URL` salah / schema belum dibuat | Jalankan ulang `bash .deploy/remote-setup.sh` dari hPanel Terminal |
| RAM app kepakai habis (app sering restart) | Limit per app Node.js di shared hosting | hPanel Node.js → naikkan limit jika tersedia; tutup fitur tak terpakai; atau pindah jalur VPS |
| Fitur AI (chat/roadmap) menjawab versi sederhana | SDK Z.ai butuh kredensial di luar sandbox | Situs tetap hidup — fallback otomatis mengarahkan ke WhatsApp; tidak menghalangi lead |

## 🔒 Catatan keamanan

- `.env.production`, `db/`, dan `crash.log` **tidak akan terhapus/tertimpa** oleh deploy
  (dilindungi `dangerous-clean-skip`) — tapi jangan pernah commit keduanya ke GitHub publik.
- Kredensial hanya hidup di **GitHub Secrets** (terenkripsi) dan di server Anda.
- Sertifikat SSL dikelola Hostinger otomatis.

## 🧪 Uji cepat pasca-deploy

1. `https://domain-anda.com` — hero + form konsultasi tampil?
2. Isi form → sukses? → cek **`/admin`** → lead masuk? (berarti DB jalan ✅)
3. Buka `/katalog` dan `/kbli` — halaman katalog tampil?
4. `https://domain-anda.com/sitemap.xml` — daftar URL muncul? (SEO ✅)

Jika keempatnya ✅, pipeline Anda sudah setara Vercel — di atas paket Hostinger Anda sendiri.
