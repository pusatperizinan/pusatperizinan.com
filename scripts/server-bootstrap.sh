#!/usr/bin/env bash
# ============================================================
# PUSATPERIZINAN.COM — Bootstrap VPS Hostinger (SEKALI JALAN)
# ------------------------------------------------------------
# Fungsi: menyiapkan VPS kosong menjadi server produksi siap
# auto-deploy — persis pengalaman Vercel, tapi di VPS Anda.
#
# Yang dipasang:
#   1. Node.js 22 LTS (runtime aplikasi)
#   2. PM2 (penjaga proses — auto-restart & boot persisten)
#   3. Nginx (reverse proxy 80/443 → aplikasi port 3000)
#   4. Certbot (SSL Let's Encrypt otomatis, perpanjang sendiri)
#   5. Swap 2GB (tameng anti-OOM)
#   6. Folder deploy + database SQLite + template .env
#
# Pemakaian (sebagai root di VPS):
#   bash server-bootstrap.sh pusatperizinan.com www.pusatperizinan.com
# ============================================================
set -euo pipefail

DOMAIN="${1:-}"
WWW="${2:-}"
APP_DIR="/var/www/pusatperizinan"
NODE_MAJOR=22

if [[ -z "$DOMAIN" ]]; then
  echo "Pemakaian: bash server-bootstrap.sh <domain> [www.domain]"
  echo "Contoh   : bash server-bootstrap.sh pusatperizinan.com www.pusatperizinan.com"
  exit 1
fi

echo "╔════════════════════════════════════════════════╗"
echo "║  BOOTSTRAP VPS — $DOMAIN"
echo "╚════════════════════════════════════════════════╝"

# ── 0. Dasar sistem ─────────────────────────────────────────
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git ufw ca-certificates gnupg sqlite3

# ── 1. Swap 2GB (tameng anti-OOM) ───────────────────────────
if ! swapon --show | grep -q "/swapfile"; then
  echo "→ Membuat swap 2GB..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl vm.swappiness=10 >/dev/null
  echo "vm.swappiness=10" > /etc/sysctl.d/99-swap.conf
else
  echo "→ Swap sudah ada, lewati."
fi

# ── 2. Node.js 22 LTS ───────────────────────────────────────
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt $NODE_MAJOR ]]; then
  echo "→ Memasang Node.js ${NODE_MAJOR} LTS..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi
node -v

# ── 3. PM2 ──────────────────────────────────────────────────
if ! command -v pm2 >/dev/null 2>&1; then
  echo "→ Memasang PM2..."
  npm i -g pm2@latest
fi
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

# ── 4. Struktur folder aplikasi ─────────────────────────────
echo "→ Menyiapkan $APP_DIR..."
mkdir -p "$APP_DIR/db" "$APP_DIR/public"
# Database SQLite produksi (dibuat sekali, TIDAK akan ditimpa deploy)
if [[ ! -f "$APP_DIR/db/custom.db" ]]; then
  sqlite3 "$APP_DIR/db/custom.db" "PRAGMA user_version=0;" 2>/dev/null || touch "$APP_DIR/db/custom.db"
fi

# Template .env produksi (diisi manual setelah ini)
if [[ ! -f "$APP_DIR/.env.production" ]]; then
  cat > "$APP_DIR/.env.production" <<EOF
# ============ ENV PRODUKSI — pusatperizinan.com ============
NODE_ENV=production
PORT=3000
# Database SQLite (file persisten di VPS — lead TERSIMPAN & AMAN)
DATABASE_URL=file:${APP_DIR}/db/custom.db
# WAJIB GANTI! Password admin Mission Control (/admin)
ADMIN_PASSWORD=GANTI_PASSWORD_KUAT_ANDA
# WAJIB GANTI! Kunci HMAC cookie sesi admin (string acak 32+ karakter)
ADMIN_SECRET=GANTI_DENGAN_STRING_ACAK_PANJANG
# Opsional — notifikasi lead (diisi dari dashboard admin juga bisa)
# TELEGRAM_BOT_TOKEN=
# TELEGRAM_CHAT_ID=
# FONNTE_TOKEN=
# WHATSAPP_TARGET=
EOF
  chmod 600 "$APP_DIR/.env.production"
  echo "  ✓ Template .env.production dibuat — EDIT & ganti nilai GANTI_*"
fi

# ── 5. Nginx ────────────────────────────────────────────────
echo "→ Memasang & mengonfigurasi Nginx..."
apt-get install -y nginx
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN ${WWW};

    client_max_body_size 20M;

    # Aset statis ber-hash Next.js — cache permanen
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        proxy_buffering on;
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    }
}
EOF
ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$DOMAIN"
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 6. Firewall ─────────────────────────────────────────────
echo "→ Mengonfigurasi firewall (ufw)..."
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow "Nginx Full" >/dev/null 2>&1 || true
yes | ufw enable >/dev/null 2>&1 || true

# ── 7. SSL Let's Encrypt ────────────────────────────────────
echo "→ Memasang Certbot (SSL gratis, auto-renew)..."
apt-get install -y certbot python3-certbot-nginx
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  BOOTSTRAP SELESAI ✅                                     ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Langkah Anda selanjutnya:                                ║"
echo "║  1. Arahkan DNS domain → IP VPS ini (A record @ dan www)  ║"
echo "║  2. Edit env:  nano $APP_DIR/.env.production"
echo "║     (ganti ADMIN_PASSWORD & ADMIN_SECRET)                 ║"
echo "║  3. Setelah DNS aktif, jalankan:                          ║"
echo "║     certbot --nginx -d $DOMAIN ${WWW:+-d $WWW}"
echo "║  4. Deploy pertama dari GitHub Actions akan mengisi       ║"
echo "║     aplikasi otomatis (lihat PANDUAN-DEPLOY-HOSTINGER.md) ║"
echo "╚══════════════════════════════════════════════════════════╝"
