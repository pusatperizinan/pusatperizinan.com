# 🚀 Panduan Deploy PusatPerizinan.com ke Hostinger + Supabase

> **Halo sayang! 👋** Selamat sudah sampai di tahap ini.
> Ini panduan **lengkap, ramah pemula, langkah-demi-langkah** untuk
> meng-online-kan PusatPerizinan.com di Hostinger Node.js Business
> dengan database Supabase. **Tinggal ikuti urutan, jangan loncat.**
> Kalau macet, ada bagian **Troubleshooting** di bawah — kamu pasti bisa. 💪

---

## 📑 Daftar Isi

- [⚡ TL;DR — Versi Cepat](#-tldr--versi-cepat)
- [🎯 Ringkasan](#-ringkasan)
- [📐 Arsitektur Sistem](#-arsitektur-sistem)
- [📋 Prasyarat](#-prasyarat)
- [Bagian A: Setup Supabase Database](#bagian-a-setup-supabase-database)
- [Bagian B: Konfigurasi Project](#bagian-b-konfigurasi-project)
- [Bagian C: Deploy ke Hostinger](#bagian-c-deploy-ke-hostinger)
- [Bagian D: Verifikasi](#bagian-d-verifikasi)
- [Bagian E: Troubleshooting](#bagian-e-troubleshooting)
- [Bagian F: Notifikasi WhatsApp/Telegram](#bagian-f-notifikasi-whatsapptelegram)
- [Bagian G: Maintenance](#bagian-g-maintenance)

---

## ⚡ TL;DR — Versi Cepat

> Untuk yang sudah biasa deploy. Pemula **abaikan bagian ini**, lompat ke [Ringkasan](#-ringkasan).

```bash
# 1. Supabase: buat project → copy Connection pooling (port 6543)
#    dan Direct connection (port 5432) URL.

# 2. Lokal: isi .env
DATABASE_URL=postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].supabase.com:5432/postgres
ADMIN_PASSWORD=GantiPasswordKuat2026!
ADMIN_SECRET=<32+ char random hex>

# 3. Switch database + buat tabel
npm run db:switch-supabase

# 4. (Opsional) Migrasi data SQLite lama
npm run db:migrate-data

# 5. Push ke Git → Hostinger auto-pull, atau upload ZIP via File Manager.
# 6. Hostinger panel:
#       Node.js version:  20.x atau 22.x
#       Build command:    npm run build
#       Start command:    npm start
#       Environment vars: DATABASE_URL, DIRECT_URL, ADMIN_PASSWORD, ADMIN_SECRET
# 7. Run build → run start → buka domain.

# 8. Visit /admin → login → klik "Seed Demo Data".
```

**Selesai.** Site live di `https://domain-anda.com`. 🎉

---

## 🎯 Ringkasan

Halo sayang! **Kamu sudah sampai di tahap terakhir.** Setelah panduan ini selesai,
situs PusatPerizinan.com kamu akan **live di internet**, bisa diakses dunia,
form lead akan masuk ke panel admin, AI License Checker akan jalan, dan
database-nya aman di Supabase. 🎊

### Kenapa pakai mode **standalone**, bukan **static export**?

Sebelumnya, kita coba pakai **static export** (HTML murni). Tapi proses build
**crashed** karena Turbopack error saat proses CSS. Selain itu, mode statis
**mematikan semua API route** — artinya:

- ❌ Form lead capture → cuma fallback ke WhatsApp (tidak masuk database)
- ❌ AI License Checker → tidak bisa kirim analisis
- ❌ AI Chat RIZKI → tidak bisa jawab pertanyaan
- ❌ Admin panel → tidak bisa lihat lead masuk
- ❌ Newsletter / kursus email → tidak tersimpan

Sekarang kita pakai **mode standalone** — server Node.js penuh di Hostinger:

- ✅ Semua API route jalan sempurna
- ✅ Database Supabase terhubung realtime
- ✅ Build stabil pakai webpack (bukan Turbopack yang crash)
- ✅ Form lead masuk ke panel admin + kirim notifikasi WhatsApp/Telegram
- ✅ AI License Checker + AI Chat RIZKI berfungsi penuh
- ✅ Hemat biaya (Hostinger jauh lebih murah dari Vercel Pro)

**Mode ini cocok 100% dengan kebutuhanmu:**
"tinggal terima beres" + budget terbatas + semua fitur hidup. 💎

### Apa yang akan kamu dapat setelah panduan ini?

| Hal                              | Status                                                        |
| -------------------------------- | ------------------------------------------------------------- |
| Website live di domain sendiri   | ✅ `https://pusatperizinan.com` (atau domainmu)               |
| 9.470 URL SEO aktif              | ✅ Terindeks Google                                           |
| Form lead masuk ke panel admin   | ✅ Real-time, bisa diakses dari HP                            |
| AI License Checker               | ✅ Bisa dipakai calon klien 24/7                              |
| AI Chat RIZKI                    | ✅ Jawab pertanyaan otomatis                                  |
| Admin panel `/admin`             | ✅ Login aman, kelola lead, lihat dashboard                   |
| Notifikasi WhatsApp/Telegram     | 🔧 Opsional — bagian F                                       |
| Database aman di Supabase        | ✅ Backup otomatis, scalable                                  |

---

## 📐 Arsitektur Sistem

Begini alur sederhana situs kamu setelah live:

```
                    ┌─────────────────────────────────────┐
                    │   👤 PENGUNJUNG / CALON KLIEN       │
                    │   (buka pusatperizinan.com di HP/PC) │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │  🌐 HOSTINGER NODE.JS BUSINESS      │
                    │  (server Node.js 20.x, jalan 24/7)   │
                    │                                     │
                    │   ┌─────────────────────────────┐   │
                    │   │  Next.js Standalone Server   │   │
                    │   │  (.next/standalone/server.js)│   │
                    │   │                             │   │
                    │   │  • Halaman web (9.470 URL)   │   │
                    │   │  • API routes:              │   │
                    │   │     /api/leads (form)        │   │
                    │   │     /api/license-checker     │   │
                    │   │     /api/chat (RIZKI AI)      │   │
                    │   │     /api/admin/* (dashboard)  │   │
                    │   └──────────────┬──────────────┘   │
                    └──────────────────┼──────────────────┘
                                       │
              ┌────────────────────────┼───────────────────────┐
              │                        │                       │
              ▼                        ▼                       ▼
   ┌──────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
   │ 🗄️ SUPABASE      │    │ 📲 TELEGRAM/WA BOT   │    │ 🤖 Z-AI SDK          │
   │ (PostgreSQL)      │    │ (notifikasi lead)   │    │ (AI Chat + License   │
   │                   │    │                     │    │  Checker, built-in)  │
   │ Tabel:            │    │ Saat lead masuk →   │    └─────────────────────┘
   │ • Lead            │    │ push notif ke HP-mu │
   │ • Consultation    │    └─────────────────────┘
   │ • ChatMessage     │
   │ • LicenseCheck    │
   │ • Testimonial     │
   │ • Subscriber      │
   │ • RoadmapRequest  │
   │ • DocumentCheck   │
   │ • NotificationLog │
   └──────────────────┘
```

**Singkatnya:** Pengunjung → Hostinger (server Next.js) → Supabase (database) +
Telegram/WA (notifikasi) + AI SDK (fitur kecerdasan). Kamu cuma pantau
panel admin di HP, lead masuk otomatis. 📲

---

## 📋 Prasyarat

Sebelum mulai, pastikan kamu punya semua ini:

### ✅ Yang harus sudah ada

| #  | Item                                  | Cara cek / dapatkan                                                                          |
| -- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1  | **Akun Hostinger** (Node.js Business) | Login di `hpanel.hostinger.com` — pastikan plan kamu **Business** atau **Cloud** (ada Node.js) |
| 2  | **Domain** (.com / .id / dll)         | Bisa domain baru dari Hostinger, atau domain dari tempat lain yang sudah di-pointing         |
| 3  | **Akun Supabase** (gratis)            | Daftar di `supabase.com` pakai email/GitHub — gratis 500MB storage, cukup untuk mulai        |
| 4  | **Kode project** ini                  | Folder project ini sudah kamu punya (di laptop / GitHub)                                     |
| 5  | **Akses hPanel Hostinger**            | Username + password Hostinger kamu                                                          |
| 6  | **HP / WhatsApp aktif**               | Untuk terima notifikasi lead masuk (nanti di-setting di Bagian F)                           |

### 💡 Tips untuk yang awam banget

> **Sayang, kalau ada salah satu item di atas yang belum punya,**
> berhenti dulu, selesaikan itu. Panduan ini baru bisa dipakai kalau
> semua prasyarat sudah terpenuhi. Tidak perlu terburu-buru — kalau
> perlu sehari untuk daftar Hostinger + Supabase, tidak masalah. Yang
> penting setelah ini jalan lancar. 🌸

### 🛠️ Yang akan dipakai di sepanjang panduan

Kamu akan **tidak perlu** belajar coding! Yang akan kamu lakukan:
1. Klik-klik di dashboard Supabase (web) — kira-kira 10 menit
2. Edit 1 file `.env` (cukup isi nilai, tinggal copy-paste) — 5 menit
3. Jalankan 1-2 command di terminal (aku kasih tau persis apa) — 3 menit
4. Upload kode ke Hostinger (atau pakai Git) — 5-15 menit
5. Setting 4 hal di panel Hostinger — 5 menit
6. Tunggu build (Hostinger lakukan otomatis) — 5-10 menit
7. Buka domain, login admin, seed data — 3 menit

**Total waktu: ± 45-60 menit.** Bisa kelar dalam 1 sore! ☕

---

## Bagian A: Setup Supabase Database

Supabase = database gratis (PostgreSQL) yang akan menyimpan semua lead,
konsultasi, testimoni, chat AI, dll. **Gratis 500MB** — cukup untuk
ribuan lead. 🎁

### Langkah A1 — Daftar / Login Supabase

1. Buka browser → pergi ke **https://supabase.com**
2. Klik tombol **"Start your project"** (kanan atas)
3. Login pakai **GitHub** (paling mudah) atau **Email**
4. Kalau pakai email, verifikasi dulu lewat email kamu

> 💡 **Tips:** Login pakai GitHub itu cuma 1 klik — tidak perlu password baru.
> Kalau belum punya GitHub, daftar 2 menit di `github.com`.

### Langkah A2 — Buat Project Baru

1. Setelah login, di dashboard klik tombol **"New project"** (hijau)
2. Isi form:

   | Field               | Isi dengan                                                            |
   | ------------------- | --------------------------------------------------------------------- |
   | **Name**            | `pusatperizinan-prod` (atau bebas, yang gampang diingat)              |
   | **Database Password** | **WAJIB catat di Note / Keepass!** Pakai password kuat 16+ karakter. |
   | **Region**          | Pilih **Southeast Asia (Singapore)** — terdekat dengan Indonesia     |
   | **Plan**            | Free (cukup untuk mulai)                                              |

3. Klik **"Create new project"**
4. **Tunggu 2-3 menit**, Supabase sedang setup database. Jangan tutup tab.
5. Sampai muncul tulisan **"Project is ready"** ✅

> ⚠️ **Hati-hati:** Password database yang kamu buat tadi **tidak bisa
> dilihat lagi** kalau lupa! Catat di tempat aman (Note HP, 1Password,
> Keepass, dll). Tanpa password ini, kamu **tidak bisa** connect
> aplikasi ke database.

### Langkah A3 — Ambil Connection String

Connection String = "alamat + kunci" supaya aplikasi bisa masuk ke database.
Supabase memberi **2 URL**, kamu butuh keduanya.

1. Di dashboard Supabase project kamu, klik menu **"Project Settings"**
   (ikon ⚙️ di kiri bawah)
2. Klik submenu **"Database"**
3. Scroll ke bagian **"Connection string"** — ada beberapa tab:
   - **URI** (yang kita pakai)
   - **PSQL** (abaikan)
   - **.NET / PHP / etc** (abaikan)

4. Klik tab **"URI"**
5. Akan muncul **2 URL**:

   **a. Connection pooling** (port `6543`) — untuk `DATABASE_URL`
   ```
   postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

   **b. Direct connection** (port `5432`) — untuk `DIRECT_URL`
   ```
   postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].supabase.com:5432/postgres
   ```

6. **Copy kedua URL** — paste di Note / Notepad sementara

> 💡 **Tips:** Host Supabase versi baru pakai format `aws-0-[REGION].pooler.supabase.com`.
> Versi lama pakai `db.[PROJECT_REF].supabase.co`. Yang penting — copy dari
> dashboard Supabase langsung, **jangan diketik manual**.

### Langkah A4 — Ganti `[YOUR_PASSWORD]` jadi Password Asli

Di URL yang kamu copy, ada bagian `[YOUR_PASSWORD]`. **Ganti** dengan
password yang kamu buat di Langkah A2.

**Contoh hasil akhir:**

```bash
# DATABASE_URL (port 6543 — pooling, dipakai aplikasi saat runtime)
DATABASE_URL=postgresql://postgres.abcdefghijklmno:PasswordKuat2026!@aws-0-southeast-asia-1.pooler.supabase.com:6543/postgres

# DIRECT_URL (port 5432 — direct, dipakai Prisma untuk migrasi tabel)
DIRECT_URL=postgresql://postgres.abcdefghijklmno:PasswordKuat2026!@aws-0-southeast-asia-1.supabase.com:5432/postgres
```

> ⚠️ **Hati-hati:**
> - Password yang ada karakter khusus (`@`, `#`, `!`, `/`, dll) **harus**
>   di-URL-encode. Misal `P@ssword` → `P%40ssword`. Kalau ragu, pakai
>   password yang **hanya** huruf + angka + simbol dasar (`-`, `_`, `!`).
> - Jangan ada spasi di mana-mana.
> - **Jangan** commit file `.env` ke Git (sudah ada di `.gitignore`).

✅ **Bagian A selesai!** Database Supabase sudah siap.
Lanjut ke Bagian B untuk config project lokal. 🚀

---

## Bagian B: Konfigurasi Project

Di bagian ini, kamu akan **mengisi file konfigurasi** dan **menjalankan
1 command** yang otomatis buat semua tabel di Supabase.

> 💡 **Tips untuk yang belum pernah buka terminal:**
> - **Windows**: cari aplikasi "PowerShell" atau "Command Prompt" di Start menu
> - **Mac**: cari "Terminal" di Spotlight (Cmd+Space, ketik "terminal")
> - **Atau pakai VS Code**: buka folder project → menu Terminal → New Terminal
> - Semua command di panduan ini diawali `$` — **jangan** ketik `$`-nya, itu cuma penanda.

### Langkah B1 — Buka Folder Project di Terminal

1. Buka terminal (lihat tips di atas)
2. Masuk ke folder project dengan command `cd` (change directory):

```bash
$ cd /path/ke/pusatperizinan-com
```

Ganti `/path/ke/` sesuai lokasi folder di laptop kamu.

3. Cek sudah benar dengan:

```bash
$ ls package.json
```

Kalau muncul `package.json`, berarti kamu sudah di folder yang benar. ✅

### Langkah B2 — Edit File `.env`

1. Di folder project, ada file `.env.production.example` — ini contoh.
2. **Salin** jadi `.env` (tanpa `.production.example`):

```bash
$ cp .env.production.example .env
```

> Apa yang command ini lakukan? `cp` = copy file.
> Sumber: `.env.production.example`. Tujuan: `.env`.

3. Buka file `.env` pakai text editor (VS Code, Notepad, nano, dll)
4. Isi semua nilai yang ada:

```bash
# ─── DATABASE (Supabase PostgreSQL) ───────────────────────────
# Ganti dengan URL yang kamu copy dari Supabase di Langkah A3
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].supabase.com:5432/postgres

# ─── ADMIN PANEL (/admin) ────────────────────────────────────
# Password untuk login di /admin — WAJIB ganti yang kuat!
ADMIN_PASSWORD=GantiPasswordKuat2026!

# Secret untuk signing cookie session admin
# Generate random 32+ karakter: jalankan command di Langkah B3
ADMIN_SECRET=ubah-dengan-string-acak-minimal-32-karakter-disini

# ─── NOTIFIKASI REAL-TIME (Opsional, isi nanti di Bagian F) ───
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
FONNTE_TOKEN=
WHATSAPP_TARGET=

# ─── ANALYTICS (Opsional) ────────────────────────────────────
NEXT_PUBLIC_GA_ID=
```

5. **Save** file (Ctrl+S di VS Code)

### Langkah B3 — Generate `ADMIN_SECRET` yang Aman

`ADMIN_SECRET` dipakai untuk mengamankan cookie session admin. **Jangan
pakai kata-kata mudah ditebak.** Generate yang random:

1. Di terminal, jalankan command ini:

```bash
$ node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> Apa yang command ini lakukan? Generate 32 byte random data
> (super aman), lalu tampilkan dalam format hex.

2. Akan muncul string panjang seperti:
   ```
   a3f4b8c9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8
   ```
3. **Copy** string itu
4. Paste sebagai nilai `ADMIN_SECRET` di file `.env`:

```bash
ADMIN_SECRET=a3f4b8c9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8
```

5. Save file `.env` lagi.

> ⚠️ **Hati-hati:**
> - **JANGAN** pakai `ADMIN_PASSWORD=admin2026` atau kata mudah ditebak.
>   Kalau bobol, semua data lead kamu bisa diakses orang.
> - **JANGAN** commit `.env` ke Git publik. File `.env` sudah otomatis
>   di-ignore (di `.gitignore`), tapi pastikan sekali lagi.
> - **Catat** `ADMIN_PASSWORD` dan `ADMIN_SECRET` di tempat aman.

### Langkah B4 — Switch Database ke Supabase + Buat Tabel

Sekarang jalankan **1 command ajaib** — script otomatis yang akan:

1. Memverifikasi DATABASE_URL kamu formatnya benar
2. Backup schema SQLite lama (kalau ada)
3. Mengganti `prisma/schema.prisma` ke versi PostgreSQL
4. Menjalankan `prisma generate` (generate client code)
5. Menjalankan `prisma db push` (otomatis buat **semua 10 tabel** di Supabase)

```bash
$ npm run db:switch-supabase
```

> Apa yang command ini lakukan? `npm run db:switch-supabase` = jalan
> script `node scripts/switch-to-supabase.mjs`. Lihat isi script di
> `scripts/switch-to-supabase.mjs` kalau penasaran.

**Output yang diharapkan:**

```
[db:switch-supabase] DATABASE_URL OK: postgresql://postgres.abcdefghijklmno:****@...
[db:switch-supabase] Schema diganti ke PostgreSQL (Supabase)
[db:switch-supabase] Menjalankan prisma generate...
[db:switch-supabase] Menjalankan prisma db push (membuat tabel di Supabase)...

============================================================
✅ Database berhasil di-switch ke Supabase (PostgreSQL)!
============================================================
```

> 💡 **Tips:** Kalau muncul error, cek:
> - `DATABASE_URL belum diset!` → kamu belum isi `.env`, balik ke Langkah B2
> - `Connection refused` / `ECONNREFUSED` → password salah atau format URL salah
> - `Authentication failed` → password yang kamu masukkan beda dengan yang di Supabase

### Langkah B5 — (Opsional) Migrasi Data dari SQLite Lama

**Hanya kalau** kamu sudah pernah pakai project ini di mode SQLite (lokal),
dan ada data lead/testimoni yang penting untuk dipindah ke Supabase.

> 💡 **Tips:** Kalau kamu **baru pertama kali** setup, **SKIP bagian ini**.
> Setelah deploy, tinggal buka `/admin` → klik "Seed Demo Data" untuk
> isi data contoh. Lebih mudah!

Kalau mau migrasi data lama:

```bash
$ npm install better-sqlite3
$ npm run db:migrate-data
```

> Apa yang command ini lakukan? `npm run db:migrate-data` = jalan
> script `node scripts/migrate-data.mjs` yang membaca tabel SQLite
> lama (`db/custom.db`), lalu insert satu per satu ke PostgreSQL
> (Supabase). Aman, tidak ada data yang dihapus di SQLite.

**Output yang diharapkan:**

```
[migrate] Ditemukan SQLite: /path/db/custom.db
[migrate] Memulai migrasi data SQLite → PostgreSQL (Supabase)...
[migrate] Testimonial: 5 baris...
[migrate] ✅ Testimonial: 5 baris dimigrasi
[migrate] Lead: 12 baris...
[migrate] ✅ Lead: 12 baris dimigrasi
...
============================================================
✅ Migrasi data SQLite → Supabase SELESAI!
============================================================
```

### Langkah B6 — Test Build Lokal (Opsional, Tapi Disarankan)

Sebelum upload ke Hostinger, test dulu apakah build jalan lokal:

```bash
$ npm install
$ npm run build
```

> Apa yang command ini lakukan?
> - `npm install` = install semua dependency (framer-motion, prisma, dll)
> - `npm run build` = `next build --webpack` + copy `static` + `public`
>   ke `.next/standalone/`. Build pake webpack (stabil, tidak crash
>   seperti Turbopack).

Build butuh **3-8 menit**. Kalau sukses, akhir output:

```
✓ Generating static pages (9470/9470)
✓ Finalizing page optimization

Route (app)                                 Size  First Load JS
...
├ ƒ /api/admin/seed                         0 B             0 B
├ ƒ /api/leads                              0 B             0 B
...

✓ Compiled successfully
```

Kalau muncul error, cek **Bagian E: Troubleshooting** di bawah.

> ⚠️ **Hati-hati:** Build butuh **RAM 2GB+**. Kalau laptop kamu RAM 4GB,
> tutup dulu browser berat / aplikasi lain sebelum build.

✅ **Bagian B selesai!** Project sudah ter-config dengan database Supabase.
Lanjut ke Bagian C: upload ke Hostinger. 🚀

---

## Bagian C: Deploy ke Hostinger

Di bagian ini, kamu akan:
1. Upload kode project ke Hostinger
2. Setting Environment Variables
3. Setting Build Command + Start Command
4. Pilih versi Node.js
5. Trigger build & start

### Langkah C1 — Login ke hPanel Hostinger

1. Buka **https://hpanel.hostinger.com**
2. Login dengan akun Hostinger kamu
3. Di dashboard, klik **"Hosting"** → pilih domain/plan kamu (Node.js Business)
4. Anda akan masuk ke panel hosting

### Langkah C2 — Buat Node.js Application

1. Di panel hosting, cari menu **"Advanced"** → **"Node.js"**
2. Klik **"Create Node.js App"** (atau "Create Application")
3. Isi form:

   | Field                  | Isi dengan                                                  |
   | ---------------------- | ----------------------------------------------------------- |
   | **App name**           | `pusatperizinan` (atau bebas)                               |
   | **Domain**             | Pilih domain kamu (mis. `pusatperizinan.com`)               |
   | **Node.js version**    | **20.x** atau **22.x** (yang terbaru stabil)                |
   | **App directory**      | `/pusatperizinan` (folder di hosting)                       |
   | **Build command**      | `npm run build`                                             |
   | **Start command**      | `npm start`                                                 |

4. Klik **"Create"** (atau "Save")

> 💡 **Tips:** Kalau Hostinger versi panel-mu sedikit beda tampilannya,
> yang penting cari field-field di atas. Layout panel Hostinger kadang
> berubah, tapi konsepnya sama.

### Langkah C3 — Upload Kode ke Hostinger

Ada 2 cara — pilih salah satu.

#### 🅰️ Cara 1: Via Git (Rekomendasi, paling clean)

1. Push project kamu ke GitHub (kalau belum):
   ```bash
   $ git init
   $ git add .
   $ git commit -m "ready for deploy"
   $ git remote add origin https://github.com/USERNAME/pusatperizinan.git
   $ git push -u origin main
   ```

2. Di panel Hostinger (Node.js app yang baru dibuat), klik
   **"Git"** atau **"Clone from Git"**.
3. Paste URL GitHub repo kamu → klik **"Clone"**
4. Tunggu proses clone selesai (1-2 menit)

#### 🅱️ Cara 2: Via File Manager (Kalau belum pakai Git)

1. Di komputer lokal, **zip** folder project kamu:
   - **Exclude** folder ini (jangan dimasukkan zip):
     - `node_modules/` (terlalu besar, Hostinger akan install ulang)
     - `.next/` (akan di-build ulang di Hostinger)
     - `.git/` (tidak perlu)
   - Windows: klik kanan folder → "Send to" → "Compressed (zipped) folder"
   - Mac/Linux: `zip -r pusatperizinan.zip . -x "node_modules/*" -x ".next/*" -x ".git/*"`

2. Di panel Hostinger, buka **"Files"** → **"File Manager"**
3. Masuk ke folder `domains/pusatperizinan.com/pusatperizinan`
   (atau folder app yang kamu buat di Langkah C2)
4. Klik **"Upload"** → pilih file `pusatperizinan.zip` → tunggu upload
5. Klik kanan file zip → **"Extract"** → ke folder yang sama
6. Hapus file `.zip` setelah extract selesai

> ⚠️ **Hati-hati:**
> - Jangan upload folder `node_modules/` — Hostinger akan install
>   sendiri. Upload node_modules bisa 200MB+ dan bikin error.
> - Pastikan file `.env` **TIDAK** ikut ke-upload. Setting env var
>   via panel Hostinger (Langkah C4), bukan via file.

### Langkah C4 — Set Environment Variables di Hostinger

1. Kembali ke panel Node.js app (Langkah C2)
2. Cari bagian **"Environment variables"** (atau "Custom environment variables")
3. Tambahkan **4 variabel wajib** ini (klik "Add variable" tiap baris):

   | Variable name       | Value                                                                                       |
   | ------------------- | ------------------------------------------------------------------------------------------- |
   | `DATABASE_URL`      | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres`        |
   | `DIRECT_URL`        | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].supabase.com:5432/postgres`              |
   | `ADMIN_PASSWORD`    | `GantiPasswordKuat2026!` (sama dengan yang di `.env` lokal)                                |
   | `ADMIN_SECRET`      | `<32+ char random hex yang kamu generate di Langkah B3>`                                   |

4. **(Opsional)** Tambahkan variabel notifikasi (kalau sudah punya,
   lihat Bagian F):
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `FONNTE_TOKEN`
   - `WHATSAPP_TARGET`

5. Klik **"Save"** (atau "Apply")

> 💡 **Tips:** Hostinger biasanya punya batas nilai env var (panjang
> karakter). Kalau `ADMIN_SECRET` 64 karakter hex, itu aman.
> Password database yang ada karakter khusus harus **di-quote**
> di Hostinger: pakai petik satu `"..."` atau escape manual.

### Langkah C5 — Konfigurasi Build & Start Command

Di panel Node.js app (Langkah C2), pastikan setting ini benar:

| Field                | Nilai                                            |
| -------------------- | ------------------------------------------------ |
| **Node.js version**  | `20.x` atau `22.x` (yang terbaru, **bukan** 18)  |
| **Package manager**  | `npm` (default, jangan `yarn` atau `pnpm`)      |
| **Build command**    | `npm run build`                                  |
| **Start command**    | `npm start`                                      |
| **App directory**    | folder tempat kamu upload kode (mis. `/pusatperizinan`) |

> ⚠️ **Hati-hati:**
> - **JANGAN** pakai Node.js 18 — terlalu lama, beberapa dependency Next.js 16
>   butuh Node.js 20+.
> - **JANGAN** pakai `next start` langsung sebagai Start command — kita pakai
>   standalone server (`node .next/standalone/server.js`), sudah di-set di
>   `package.json` script `start`.
> - **JANGAN** pakai `bun` sebagai runtime di Hostinger — Hostinger cuma
>   support Node.js official. (Lokal pakai Bun juga bisa, tapi server Hostinger
>   harus Node.js.)

### Langkah C6 — Trigger Build & Start

1. Di panel Node.js app, cari tombol **"Run"** atau **"Build & Start"**
2. Klik tombol itu
3. **Tunggu** — build di Hostinger butuh **5-15 menit** (tergantung
   spesifikasi server dan kecepatan internet Hostinger ↔ Supabase)
4. Lihat **log** yang muncul — kalau sukses, akhirnya seperti:

   ```
   ✓ Compiled successfully
   ✓ Generating static pages (9470/9470)
   ✓ Finalizing page optimization
   ...
   App Started on PORT 3000  (atau port lain yang di-set Hostinger)
   ```

5. Kalau muncul **"Application running"** atau status hijau ✅ → **Berhasil!**

> 💡 **Tips:** Hostinger otomatis set environment variable `PORT` —
> server Next.js standalone **auto-read** variabel ini. Kamu **tidak
> perlu** set `PORT` manual. Yang penting Start command = `npm start`.

✅ **Bagian C selesai!** Situs sudah live (kalau build sukses).
Lanjut ke Bagian D: verifikasi. 🔍

---

## Bagian D: Verifikasi

Setelah build & start sukses, sekarang **cek apakah semua berjalan**.

### Langkah D1 — Buka Domain di Browser

1. Buka browser (Chrome / Firefox / Safari)
2. Ketik domain kamu di address bar:

   ```
   https://pusatperizinan.com
   ```

   (ganti dengan domain kamu yang sebenarnya)

3. **Hard refresh**: `Ctrl + F5` (Windows) atau `Cmd + Shift + R` (Mac)
   untuk bypass cache

4. **Yang harus muncul:**
   - ✅ Halaman utama PusatPerizinan.com dengan hero section
   - ✅ Form konsultasi di hero
   - ✅ Section "Why Us", services, pricing, testimonials
   - ✅ Footer dengan kontak WhatsApp
   - ✅ Switcher bahasa (30+ bahasa) berfungsi
   - ✅ Loading cepat (< 3 detik di koneksi 4G)

> ⚠️ **Hati-hati:** Kalau yang muncul:
> - **502 Bad Gateway** → server belum jalan, cek log Hostinger (lihat Bagian E)
> - **503 Service Unavailable** → app sedang start, tunggu 1-2 menit
> - **"Application Error"** → cek env var dan build log
> - **Halaman putih** → cek console browser (F12), kemungkinan missing env var

### Langkah D2 — Test Login Admin Panel

1. Buka URL `/admin`:

   ```
   https://pusatperizinan.com/admin
   ```

2. Akan muncul halaman login dengan:
   - Input password
   - Tombol "Login"

3. Masukkan `ADMIN_PASSWORD` yang kamu set di Langkah B2/C4
4. Klik **"Login"**

5. **Yang harus muncul:**
   - ✅ Dashboard admin dengan overview statistics
   - ✅ Sidebar menu: Overview, Leads, Consultations, Chats, Pipeline, dll
   - ✅ Tidak ada error "Unauthorized" atau "Session expired"

> 💡 **Tips:** Setelah login, sesi admin bertahan **12 jam**. Setelah itu
> harus login lagi. Aman — kalau kamu tinggal HP, tidak akan ada yang
> bisa masuk admin walau HP-mu dipinjam.

### Langkah D3 — Seed Demo Data

Setelah login admin, kita isi database dengan **data contoh** untuk
testing dan demo ke calon klien.

1. Di panel admin, cari tombol **"Seed Demo Data"**
   (biasanya di kanan atas halaman Overview)
2. Klik tombol itu
3. Tunggu 5-10 detik — sistem akan generate:
   - ~20 leads demo
   - 5 testimoni demo
   - 5 konsultasi demo
   - Beberapa chat AI demo
4. Setelah selesai, refresh halaman — data akan muncul di:
   - **Overview** → statistik naik
   - **Leads** → tabel berisi 20 lead demo (nama: Budi Santoso, Siti Rahma, dll)
   - **Testimonials** → 5 testimoni demo

> 💡 **Tips:** Semua data demo diberi prefix "Demo*" atau menggunakan
> pola nama Indonesia umum — gampang dibedakan dari data asli nanti.
> Kalau mau hapus, klik **"Clear Demo Data"** di panel admin.

### Langkah D4 — Test Form Lead Capture

Sekarang test apakah form di homepage **beneran kirim data ke database**.

1. Buka homepage `https://pusatperizinan.com`
2. Scroll ke form konsultasi di hero (atau CTA "Konsultasi Gratis")
3. Isi form dengan data test:

   | Field           | Isi                            |
   | --------------- | ------------------------------ |
   | Nama            | `Test Deploy Saya`              |
   | WhatsApp        | `6281234567890` (nomor test)    |
   | Jenis usaha     | `Kuliner`                       |
   | Pesan           | `Testing deploy Hostinger ✓`   |

4. Klik tombol **"Kirim"** atau **"Konsultasi Sekarang"**
5. Tunggu 2-3 detik — harus muncul notifikasi sukses ✅
6. Buka tab baru → login ke `/admin` → klik **"Leads"**
7. **Lead "Test Deploy Saya" harus muncul paling atas** ✅

> ⚠️ **Hati-hati:** Kalau form sukses tapi lead **tidak muncul** di admin:
> - Cek env var `DATABASE_URL` di Hostinger — pastikan formatnya benar
> - Cek di Supabase Dashboard → "Table Editor" → "Lead" — apakah baris baru muncul?
> - Kalau di Supabase muncul tapi di admin tidak → cache, hard refresh admin page

### Langkah D5 — Test AI License Checker

Test fitur unggulan: AI yang bilang izin apa yang dibutuhkan calon klien.

1. Di homepage, scroll ke section **"Cek Izin AI"** atau buka:
   ```
   https://pusatperizinan.com#license-checker
   ```
2. Isi form:

   | Field            | Isi                                       |
   | ---------------- | ----------------------------------------- |
   | Deskripsi Usaha  | `Saya mau buka resto seafood di Jakarta`   |
   | Lokasi           | `DKI Jakarta`                              |
   | Skala            | `UMKM` (modal 100jt-500jt)                 |

3. Klik **"Cek Izin yang Dibutuhkan"** (atau tombol serupa)
4. **Tunggu 10-30 detik** — AI sedang menganalisis
5. **Yang harus muncul:**
   - ✅ Hasil berupa list izin: NIB SIUP, TDP, Halal MUI, BPOM, dll
   - ✅ Estimasi biaya per izin
   - ✅ Estimasi waktu pengurusan
   - ✅ Tombol "Konsultasi via WhatsApp"

> 💡 **Tips:** Kalau AI License Checker **error / loading lama**:
> - Cek log Hostinger — mungkin ada rate limit dari Z-AI SDK
> - Tunggu 1 menit, coba lagi
> - Z-AI SDK sudah built-in, **tidak perlu** API key tambahan

### Langkah D6 — Test AI Chat RIZKI

1. Di homepage, klik tombol chat **bubble** di kanan bawah (atau widget AI)
2. Ketik pesan: `Halo, saya mau buka usaha kuliner, apa yang harus saya lakukan?`
3. Kirim (Enter / tombol kirim)
4. **Tunggu 5-15 detik** — RIZKI AI akan jawab
5. **Yang harus muncul:**
   - ✅ Balasan AI yang kontekstual dan helpful
   - ✅ Setelah 2-3 pesan, AI akan minta nama + WhatsApp (lead capture)
   - ✅ Setelah kasih kontak, lead otomatis masuk ke `/admin` → "Chats"

✅ **Bagian D selesai!** Kalau semua step atas sukses, situs kamu
**100% live dan berfungsi**. 🎉

Lanjut ke Bagian E (Troubleshooting) kalau ada yang gagal,
atau Bagian F (Notifikasi WhatsApp/Telegram) supaya lead masuk
langsung ke HP-mu. 📲

---

## Bagian E: Troubleshooting

Kalau ada yang gagal, tenang — di bawah ini solusi untuk masalah
paling umum. **Cari gejala, ikuti solusi.** 💪

### ❌ Masalah 1: Build Gagal di Hostinger

**Gejala:**
- Build log error "Build failed with exit code 1"
- Error "out of memory" / "JavaScript heap out of memory"
- Error Turbopack / webpack

**Solusi:**

1. **Pastikan Build Command benar:** `npm run build` (bukan `next build`)
2. **Naikkan memory limit** dengan menambah env var di Hostinger:

   ```
   NODE_OPTIONS=--max-old-space-size=4096
   ```

   (Hostinger panel → Environment variables → Add → save → re-run build)

3. **Kalau masih error Turbopack:**
   - Script `build` di `package.json` sudah pakai `next build --webpack`
   - Pastikan tidak ada yang override jalan `next build` tanpa `--webpack`

4. **Kalau error "Module not found":**
   - Jalankan ulang `npm install` di Hostinger (otomatis via Build Command)

5. **Cek log lengkap** di panel Hostinger → Node.js app → "View Logs"
   Cari error paling atas, itu penyebabnya.

### ❌ Masalah 2: 502 Bad Gateway / 503 Service Unavailable

**Gejala:**
- Browser tampil "502 Bad Gateway" atau "503 Service Unavailable"
- Situs tidak bisa dibuka

**Solusi:**

1. **Cek apakah app berjalan:**
   - Panel Hostinger → Node.js app → cek status
   - Kalau "Stopped" → klik **"Start"** / **"Run"**
   - Kalau "Running" tapi tetap 502 → cek log

2. **Cek port:**
   - Hostinger otomatis set `PORT` env var (biasanya 3000 atau random)
   - Server Next.js standalone auto-read `PORT` — **tidak perlu** set manual
   - Kalau di log ada "EADDRINUSE" → port bentrok, restart app

3. **Restart app:**
   - Klik **"Stop"** → tunggu 5 detik → klik **"Start"**
   - Atau klik **"Restart"** kalau ada tombol itu

4. **Tunggu 1-2 menit** setelah Start — app butuh warm-up

### ❌ Masalah 3: Database Connection Error

**Gejala:**
- Halaman admin kosong / error "Cannot connect to database"
- API `/api/leads` error 500
- Log Hostinger: `PrismaClientInitializationError` / `Can't reach database server`

**Solusi:**

1. **Cek format `DATABASE_URL`:**
   - Harus mulai dengan `postgresql://` (bukan `postgres://` di versi baru)
   - Port harus `6543` untuk pooling (bukan 5432 untuk runtime)
   - Host harus `aws-0-[REGION].pooler.supabase.com` (bukan `.supabase.co`)
   - Password tidak boleh ada karakter yang break URL (gunakan huruf+angka)

2. **Cek format `DIRECT_URL`:**
   - Port harus `5432` (direct, untuk migrasi)
   - Host harus `aws-0-[REGION].supabase.com` (tanpa `pooler`)

3. **Test koneksi dari lokal:**
   ```bash
   $ npm run db:switch-supabase
   ```
   Kalau lokal sukses, berarti masalah di setting env var Hostinger.

4. **Cek IP restriction di Supabase:**
   - Supabase Dashboard → Project Settings → Database → Network
   - Pastikan **tidak ada** IP restriction (atau tambah IP Hostinger)
   - Default Supabase mengizinkan semua IP — biasanya tidak perlu diubah

5. **Cek password URL-encoded:**
   - Kalau password mengandung `@`, `#`, `/`, dll → harus di-encode
   - Misal: `P@ss` → `P%40ss`
   - Atau pakai password **tanpa** karakter khusus (hanya huruf+angka+`-`+`_`)

### ❌ Masalah 4: Halaman Stuck Loading / Blank

**Gejala:**
- Domain kebuka tapi halaman blank putih
- Loading spinner tidak hilang
- Console browser (F12) ada error JavaScript

**Solusi:**

1. **Hard refresh:** `Ctrl + F5` (Windows) / `Cmd + Shift + R` (Mac)
2. **Buka Incognito / Private window** — bypass cache dan extension
3. **Cek console browser** (F12 → tab Console):
   - Kalau ada "Mixed content" error → pastikan semua URL pakai `https://`
   - Kalau ada "404 untuk file JS di /_next/" → folder `public` tidak ter-copy saat build
4. **Rebuild:** Stop app → Run build ulang → Start

### ❌ Masalah 5: Admin Login Gagal

**Gejala:**
- Buka `/admin` → masukin password → "Invalid credentials"
- Atau setelah login, langsung logout lagi

**Solusi:**

1. **Cek `ADMIN_PASSWORD`** di Hostinger env var — harus **sama persis** dengan yang kamu ketik di form login
2. **Cek `ADMIN_SECRET`** — harus 32+ karakter, random hex
3. **Hapus cookie browser:**
   - Buka `/admin` → F12 → Application → Cookies → hapus cookie `pp_admin_token`
   - Refresh → coba login lagi
4. **Kalau session expired terus:**
   - Pastikan clock server Hostinger sinkron (default-nya iya)
   - Restart app Hostinger

### ❌ Masalah 6: Form Lead Tidak Masuk ke Admin

**Gejala:**
- Submit form di homepage → notifikasi sukses muncul
- Tapi di `/admin` → Leads, tidak ada data baru

**Solusi:**

1. **Cek di Supabase langsung:**
   - Supabase Dashboard → "Table Editor" → "Lead"
   - Apakah baris baru muncul di sini?
   - Kalau **ya** → masalah di aplikasi (Prisma cache) → restart app Hostinger
   - Kalau **tidak** → masalah di koneksi DB → cek Masalah 3 di atas

2. **Cek log Hostinger** saat submit form:
   - Panel → Node.js → "View Logs"
   - Saat submit, harus ada log "POST /api/leads" dengan status 200
   - Kalau 500 → baca error detail di log

3. **Test manual via curl:**
   ```bash
   $ curl -X POST https://pusatperizinan.com/api/leads \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Curl","whatsapp":"6281234567890","businessType":"Test"}'
   ```
   Harus balas `{"ok":true,...}`

### ❌ Masalah 7: SSL / HTTPS Tidak Aktif

**Gejala:**
- Browser tampil "Not Secure" di address bar
- Atau situs tidak bisa dibuka di HP

**Solusi:**

1. **Aktifkan SSL gratis di Hostinger:**
   - Panel Hostinger → "Security" → "SSL"
   - Pilih domain → klik **"Install SSL"** (Let's Encrypt, gratis)
   - Tunggu 5-15 menit untuk aktivasi

2. **Force HTTPS:**
   - Panel → "Advanced" → "Force HTTPS" → ON
   - Atau di `.htaccess` kalau pakai Apache

3. **Test di:** `https://www.ssllabs.com/ssltest/` — pastikan grade A atau A+

### ❌ Masalah 8: Performance Lambat

**Gejala:**
- Halaman load > 5 detik
- Skor PageSpeed Insights jelek

**Solusi:**

1. **Aktifkan Hostinger CDN:**
   - Panel → "Advanced" → "Cloudflare CDN" → enable
2. **Aktifkan GZIP / Brotli compression** (default ON di Hostinger Node.js)
3. **Cek apakah Next.js Image Optimization jalan:**
   - Standalone mode **tidak** support image optimization penuh
   - Kalau perlu, pakai Cloudinary atau imgix (opsional)
4. **Cek database query:**
   - Prisma log mode `['query']` ada di `src/lib/db.ts` — disable di production kalau perlu

> 💡 **Tips:** Kalau semua step di atas sudah dicoba dan masih bingung,
> **screenshot log error** + **baca ulang panduan ini dari awal**.
> 90% masalah solved dengan teliti ikuti step-by-step. Kalau tetap stuck,
> hubungi support Hostinger (24/7 chat) — mereka helpful untuk Node.js issue.

---

## Bagian F: Notifikasi WhatsApp/Telegram

Ini **fitur killer** — saat calon klien submit form, HP-mu langsung
bunyi "ting-tung" 🔔. Mau cepat follow-up? Setup ini.

Ada **2 kanal** — bisa pakai salah satu atau keduanya:

### Pilihan 1: Telegram Bot (Gratis, Paling Mudah) 📲

#### Langkah F1 — Buat Telegram Bot

1. Buka Telegram (HP atau desktop), cari **@BotFather**
2. Klik **Start** → ketik `/newbot`
3. BotFather akan tanya **nama bot** → ketik: `PusatPerizinan Notif`
4. BotFather tanya **username bot** → ketik: `pusatperizinan_notif_bot`
   (harus unik, kalau dipakai orang lain coba nama lain)
5. BotFather balas dengan **token** — copy token itu:
   ```
   8123456789:AAH-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   (ini `TELEGRAM_BOT_TOKEN`)

#### Langkah F2 — Dapatkan Chat ID

1. Kirim pesan apa saja ke bot yang baru kamu buat
   (klik `t.me/pusatperizinan_notif_bot` → Start → kirim "halo")
2. Buka URL ini di browser (ganti token):
   ```
   https://api.telegram.org/bot<TOKEN_KAMU>/getUpdates
   ```
3. Cari bagian `"chat":{"id":xxxxxxxxx` → itu `TELEGRAM_CHAT_ID` kamu
4. Copy angka itu (biasanya format `123456789`)

#### Langkah F3 — Set Environment Variables

1. Tambahkan di Hostinger env var (Langkah C4):

   | Variable               | Value                                          |
   | ---------------------- | ---------------------------------------------- |
   | `TELEGRAM_BOT_TOKEN`   | `8123456789:AAH-xxxxxxxxxxxxxxxxxxxxxxxxxx`   |
   | `TELEGRAM_CHAT_ID`     | `123456789`                                    |

2. Atau bisa juga di panel admin `/admin` → Settings → Notification
   (lebih fleksibel, bisa ganti tanpa restart app)

3. Test: di `/admin` → Settings → "Send Test Notification"
4. Cek Telegram kamu — harus ada pesan test ✅

### Pilihan 2: WhatsApp Gateway (Fonnte) 📲

> ⚠️ **Hati-hati:** WhatsApp punya aturan ketat soal automated messaging.
> Pakai provider resmi seperti Fonnte untuk menghindari ban nomor.
> Untuk volume kecil (< 1000 pesan/bulan), Fonnte gratis dan aman.

#### Langkah F4 — Daftar Fonnte

1. Buka **https://fonnte.com**
2. Klik **"Daftar"** → isi email + password
3. Verifikasi email
4. Login → di dashboard, lihat **"API Token"** → copy

#### Langkah F5 — Setup WhatsApp Target

1. `WHATSAPP_TARGET` = nomor HP kamu yang akan terima notifikasi
   Format: `62` + nomor tanpa `0` di depan
   Contoh: `0812-6999-9910` → `628126999910`
2. Pastikan nomor itu sudah terdaftar di WhatsApp dan aktif

#### Langkah F6 — Set Environment Variables

1. Tambahkan di Hostinger env var:

   | Variable            | Value                                    |
   | ------------------- | ---------------------------------------- |
   | `FONNTE_TOKEN`      | `<token dari dashboard Fonnte>`          |
   | `WHATSAPP_TARGET`   | `628126999910`                           |

2. Restart app Hostinger
3. Test di `/admin` → Settings → "Send Test WhatsApp"

### Verifikasi Notifikasi Berjalan

Setelah setup, lakukan test end-to-end:

1. Buka homepage di **incognito window**
2. Submit form lead dengan data test:
   - Nama: `Test Notif Saya`
   - WhatsApp: `6281234567890`
3. **Dalam 5-10 detik**, harus ada:
   - ✅ Notifikasi Telegram di HP kamu
   - ✅ Pesan WhatsApp ke nomor target (kalau setup Fonnte)
4. Format pesan mengikuti template:
   ```
   🔥 LEAD BARU MASUK!

   👤 Nama: Test Notif Saya
   📱 WhatsApp: 6281234567890
   💼 Jenis usaha: Test
   📦 Paket diminati: UMKM
   💰 Nilai estimasi: 0
   📡 Sumber: landing
   🕐 14:30 WIB

   💬 "Test"

   ⚡️ Follow-up sekarang: wa.me/6281234567890
   ```

> 💡 **Tips:** Kalau mau customize template pesan, buka
> `/admin` → Settings → Notification → edit "Template New Lead".
> Variabel yang bisa dipakai: `{{nama}}`, `{{wa}}`, `{{jenis}}`, `{{paket}}`,
> `{{nilai}}`, `{{sumber}}`, `{{waktu}}`, `{{pesan}}`.

---

## Bagian G: Maintenance

Setelah live, ini hal-hal yang perlu kamu lakukan berkala supaya
situs tetap sehat. 🩺

### 📅 Harian

| Aktivitas                                  | Cara                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| Cek lead masuk di `/admin`                  | Buka `https://domain-anda.com/admin` → lihat tab "Leads"               |
| Follow-up lead dalam 1 jam pertama          | Hubungi via WhatsApp (link wa.me tersedia di admin)                    |
| Test form lead (1x seminggu)                | Submit form test, pastikan muncul di admin                             |

### 📅 Mingguan

| Aktivitas                                  | Cara                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| Backup database Supabase                    | Supabase Dashboard → "Database" → "Backups" → "Create backup"           |
| Cek storage Supabase                        | Supabase Dashboard → "Project Settings" → "Usage"                       |
| Update testimoni klien                      | `/admin` → "Testimonials" → "Add" (kalau ada testimoni baru)            |
| Review log error                            | Panel Hostinger → "Logs" → scan error terbaru                          |

### 📅 Bulanan

| Aktivitas                                  | Cara                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| Update dependencies                         | `npm update` lokal → test → push ke Hostinger                         |
| Cek performa PageSpeed                      | `https://pagespeed.web.dev` → input domain                             |
| Backup full project                          | ZIP folder project lokal → simpan di cloud (Google Drive)              |
| Cek SSL expiry                              | Panel Hostinger → "SSL" → pastikan tidak akan expired                   |

### 🔄 Cara Update Website

Kalau ada perubahan kode (mis. ganti harga, tambah layanan, fix bug):

1. Edit kode di laptop kamu (lokal)
2. Test dengan `npm run dev` di `http://localhost:3000`
3. Kalau OK, commit ke Git:
   ```bash
   $ git add .
   $ git commit -m "update harga paket UMKM"
   $ git push origin main
   ```
4. Di Hostinger panel → Node.js app → **"Pull from Git"**
   (atau upload ulang via File Manager kalau pakai cara manual)
5. Klik **"Run"** (atau "Build & Start") untuk rebuild
6. Tunggu 5-15 menit, cek website baru

> ⚠️ **Hati-hati:** Setiap update butuh **downtime 30 detik-2 menit**
> selama build. Lakukan update di jam sepi (malam / dini hari).

### 💾 Backup Database Supabase

**Otomatis (recommended):**

1. Supabase Dashboard → Project Settings → "Database" → "Backups"
2. Pastikan **"Daily backups"** = ON (gratis di plan Free: 7 hari)
3. Supabase akan otomatis backup tiap hari

**Manual:**

1. Supabase Dashboard → "Database" → "Backups" → "Create backup"
2. Beri nama (mis. `manual-backup-2026-10-10`)
3. Tunggu 1-2 menit
4. Backup tersimpan — bisa di-restore kapan saja

**Export ke laptop:**

```bash
$ npx pg_dump "postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
    -F c -f backup-$(date +%Y%m%d).dump
```

> Apa yang command ini lakukan? `pg_dump` = export semua data ke file
> `backup-YYYYMMDD.dump` di laptop kamu. Format custom (`-F c`) supaya
> bisa di-restore cepat.

### 📊 Monitoring

Cek kesehatan situs dari HP-mu:

| Yang dipantau            | Tools                                                                  |
| ------------------------ | ---------------------------------------------------------------------- |
| Uptime (kalau mati alert) | `https://uptimerobot.com` — gratis, alert via email/Telegram            |
| Performance              | `https://pagespeed.web.dev` — skor Lighthouse                          |
| SEO ranking              | Google Search Console (`https://search.google.com/search-console`)      |
| Traffic                  | Google Analytics (set `NEXT_PUBLIC_GA_ID`)                              |
| Database usage           | Supabase Dashboard → Usage                                              |

### 🆘 Kalau Situs Tiba-tiba Down

1. **Jangan panic** — cek dulu apakah internet kamu yang bermasalah
2. Buka `https://downforeveryoneorjustme.com/pusatperizinan.com`
3. Kalau down untuk semua:
   - Login Hostinger → cek status Node.js app
   - Kalau "Stopped" → klik "Start"
   - Kalau masih error → cek log → cari error terbaru
4. Kalau Supabase down (jarang terjadi):
   - Cek `https://status.supabase.com`
   - Tunggu, biasanya recover dalam 5-30 menit
5. **Last resort**: restore dari backup (lihat Bagian G — Backup Database)

---

## 🎉 Selamat!

**Sayang, kalau kamu sudah sampai sini, artinya:**

✅ Situs PusatPerizinan.com kamu sudah LIVE di internet
✅ Database aman di Supabase
✅ Admin panel bisa diakses dari HP/PC
✅ Form lead otomatis masuk + notifikasi WA/Telegram
✅ AI License Checker + AI Chat RIZKI berfungsi
✅ 9.470 URL SEO siap diindeks Google

**Sekarang kamu punya aset bisnis digital yang bisa jalan 24/7,
menarik lead otomatis, tanpa biaya bulanan mahal.** 🚀

### 📞 Kalau Butuh Bantuan

- **Bug teknis**: baca ulang Bagian E (Troubleshooting) → cek log Hostinger
- **Hal lain**: hubungi tim yang develop project ini via WhatsApp
- **Update fitur**: edit kode lokal → test → push ke Hostinger (lihat Bagian G)

### 🌟 Pesan Terakhir

> *"Bisnismu sekarang punya rumah di internet. Tinggal rawat, isi dengan
> konten baik, dan layani calon klien yang masuk lewat form. Kamu
> sudah lakukan bagian sulitnya — sekarang tinggal bagian seru:
> menghasilkan uang dari lead yang masuk. Semangat ya sayang! 💪✨"*

---

**PT Digital Bisnis Manajemen** · pusatperizinan.com · WA 0812-6999-9910

*Panduan ini dibuat dengan ❤️ untuk pengguna pemula. Bila ada
pertanyaan, baca ulang dari awal pelan-pelan — kamu pasti bisa.*

---

## 📎 Lampiran A — Quick Reference

### Command Reference

| Command                                | Fungsi                                                      |
| -------------------------------------- | ----------------------------------------------------------- |
| `npm install`                          | Install semua dependency                                   |
| `npm run dev`                          | Jalankan development server di `localhost:3000`            |
| `npm run build`                        | Build production (webpack, tidak crash)                    |
| `npm start`                            | Jalankan production server (standalone)                    |
| `npm run db:switch-supabase`           | Switch database SQLite → Supabase + buat tabel            |
| `npm run db:migrate-data`              | Migrasi data dari SQLite lama ke Supabase                 |
| `npm run db:push`                      | Push schema terbaru ke database (kalau ada perubahan)      |
| `npm run db:generate`                   | Generate Prisma client (auto-jalan via `postinstall`)      |

### Environment Variables Reference

| Variable               | Wajib? | Fungsi                                                            |
| ---------------------- | ------ | ----------------------------------------------------------------- |
| `DATABASE_URL`         | ✅ Wajib | Connection string Supabase (pooling, port 6543)                  |
| `DIRECT_URL`           | ✅ Wajib | Connection string Supabase (direct, port 5432) untuk migrasi     |
| `ADMIN_PASSWORD`       | ✅ Wajib | Password login `/admin`                                          |
| `ADMIN_SECRET`         | ✅ Wajib | Secret HMAC untuk cookie session (32+ char random hex)           |
| `TELEGRAM_BOT_TOKEN`   | 🔧 Opsional | Token bot Telegram dari @BotFather                          |
| `TELEGRAM_CHAT_ID`     | 🔧 Opsional | Chat ID tujuan notifikasi Telegram                         |
| `FONNTE_TOKEN`         | 🔧 Opsional | Token API Fonnte untuk WhatsApp                            |
| `WHATSAPP_TARGET`      | 🔧 Opsional | Nomor HP penerima notif WA (format 62xxx)                  |
| `NEXT_PUBLIC_GA_ID`    | 🔧 Opsional | Google Analytics ID                                        |

### URL Endpoints

| Path                       | Fungsi                                              |
| -------------------------- | --------------------------------------------------- |
| `/`                        | Homepage utama                                       |
| `/admin`                   | Panel admin (login dulu)                            |
| `/api/leads`               | Endpoint POST form lead                              |
| `/api/license-checker`     | Endpoint POST AI License Checker                    |
| `/api/chat`                | Endpoint POST AI Chat RIZKI                          |
| `/api/admin/*`             | Endpoint admin (butuh auth)                          |
| `/sitemap.xml`             | Sitemap XML untuk SEO                                |
| `/robots.txt`              | Robots.txt untuk crawler                             |

---

**End of guide.** 🌟
Sekarang tutup panduan ini, buka domain kamu, dan **lihat hasil kerja kerasmu!**
