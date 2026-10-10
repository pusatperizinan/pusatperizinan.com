// ============================================================
// PUSATPERIZINAN.COM — Switch Database ke Supabase (PostgreSQL)
// ------------------------------------------------------------
// Script ini:
//   1. Memverifikasi DATABASE_URL sudah format postgresql://
//   2. Menyalin prisma/schema.supabase.prisma → prisma/schema.prisma
//   3. Menjalankan prisma generate
//   4. Menjalankan prisma db push (membuat semua tabel di Supabase)
//
// JALANKAN:  npm run db:switch-supabase
// ============================================================
import { existsSync, copyFileSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const SQLITE_SCHEMA = "prisma/schema.prisma";
const SUPABASE_SCHEMA = "prisma/schema.supabase.prisma";
const SQLITE_BACKUP = "prisma/schema.sqlite.prisma.bak";

function log(msg) { console.log(`[db:switch-supabase] ${msg}`); }
function err(msg) { console.error(`[db:switch-supabase] ❌ ${msg}`); }

// 1. Cek DATABASE_URL
const dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl) {
  err("DATABASE_URL belum diset! Set dulu di .env:");
  console.log('\n    DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres');
  console.log('    DIRECT_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].supabase.com:5432/postgres\n');
  process.exit(1);
}
if (!dbUrl.startsWith("postgresql://") && !dbUrl.startsWith("postgres://")) {
  err(`DATABASE_URL saat ini bukan PostgreSQL:\n    ${dbUrl}`);
  console.log('\n    Set DATABASE_URL ke format Supabase (lihat panduan).');
  process.exit(1);
}
log(`DATABASE_URL OK: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);

// 2. Cek file schema Supabase ada
if (!existsSync(SUPABASE_SCHEMA)) {
  err(`File ${SUPABASE_SCHEMA} tidak ditemukan!`);
  process.exit(1);
}

// 3. Backup schema SQLite lama
if (existsSync(SQLITE_SCHEMA)) {
  const current = readFileSync(SQLITE_SCHEMA, "utf8");
  if (current.includes('provider = "sqlite"')) {
    copyFileSync(SQLITE_SCHEMA, SQLITE_BACKUP);
    log(`Schema SQLite dibackup ke ${SQLITE_BACKUP}`);
  } else {
    log("Schema saat ini sudah PostgreSQL, skip backup.");
  }
}

// 4. Salin schema Supabase
copyFileSync(SUPABASE_SCHEMA, SQLITE_SCHEMA);
log("Schema diganti ke PostgreSQL (Supabase)");

// 5. prisma generate
log("Menjalankan prisma generate...");
let res = spawnSync("npx", ["prisma", "generate"], { stdio: "inherit", shell: true });
if (res.status !== 0) { err("prisma generate gagal"); process.exit(1); }

// 6. prisma db push (buat semua tabel di Supabase)
log("Menjalankan prisma db push (membuat tabel di Supabase)...");
res = spawnSync("npx", ["prisma", "db", "push", "--accept-data-loss"], { stdio: "inherit", shell: true });
if (res.status !== 0) { err("prisma db push gagal — periksa koneksi/DATABASE_URL"); process.exit(1); }

console.log("\n" + "=".repeat(60));
console.log("✅ Database berhasil di-switch ke Supabase (PostgreSQL)!");
console.log("=".repeat(60));
console.log("\n📌 Langkah selanjutnya:");
console.log("   1. (Opsional) Migrasi data dari SQLite lama:");
console.log("        npm run db:migrate-data");
console.log("   2. Jalankan aplikasi: npm run dev  (atau deploy ke Hostinger)");
console.log("   3. Buka /admin → klik 'Seed Demo Data' untuk data contoh");
console.log("\n🔄 Kembali ke SQLite (jika perlu):");
console.log("   cp prisma/schema.sqlite.prisma.bak prisma/schema.prisma");
console.log("   DATABASE_URL=file:./db/custom.db  npx prisma generate\n");
