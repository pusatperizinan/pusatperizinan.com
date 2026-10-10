// ============================================================
// PUSATPERIZINAN.COM — Migrasi Data SQLite → Supabase (PostgreSQL)
// ------------------------------------------------------------
// Script OPSIONAL ini membaca data dari db/custom.db (SQLite lama)
// dan menyalinnya ke DATABASE_URL PostgreSQL (Supabase baru).
//
// PRASYARAT:
//   1. Sudah jalankan: npm run db:switch-supabase
//   2. File db/custom.db masih ada (SQLite lama)
//   3. better-sqlite3 terinstall: npm install better-sqlite3
//
// JALANKAN:  npm run db:migrate-data
//
// JIKA TIDAK PUNYA DATA PENTING DI SQLITE:
//   Skip script ini. Setelah deploy, buka /admin → klik "Seed Demo Data".
// ============================================================

let Database;
try {
  Database = (await import("better-sqlite3")).default;
} catch {
  console.error("[migrate] ❌ Package 'better-sqlite3' belum terinstall.");
  console.error("[migrate]    Jalankan:  npm install better-sqlite3");
  console.error("[migrate]    Lalu ulangi:  npm run db:migrate-data");
  console.error("\n[migrate] 💡 Atau skip migrasi — buka /admin setelah deploy,");
  console.error("           klik 'Seed Demo Data' untuk mengisi data contoh.");
  process.exit(1);
}

import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SQLITE_PATH = path.join(ROOT, "db", "custom.db");

function log(m) { console.log(`[migrate] ${m}`); }
function ok(m)  { console.log(`[migrate] ✅ ${m}`); }
function warn(m){ console.log(`[migrate] ⚠️  ${m}`); }
function fail(m){ console.error(`[migrate] ❌ ${m}`); process.exit(1); }

// 1. Cek SQLite lama ada
if (!existsSync(SQLITE_PATH)) {
  fail(`File SQLite lama tidak ditemukan: ${SQLITE_PATH}`);
}
log(`Ditemukan SQLite: ${SQLITE_PATH}`);

// 2. Buka koneksi SQLite (read-only mode aman)
let sqlite;
try {
  sqlite = new Database(SQLITE_PATH, { readonly: true });
} catch (e) {
  fail(`Tidak bisa buka SQLite: ${e.message}`);
}

// 3. Buka koneksi PostgreSQL (Supabase) via Prisma
const pg = new PrismaClient({ log: ["warn", "error"] });

// Helper: baca semua baris dari tabel SQLite
function readTable(table) {
  try {
    const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
    return rows;
  } catch (e) {
    warn(`Tabel '${table}' tidak ada atau kosong di SQLite — skip`);
    return [];
  }
}

// Helper: konversi tipe SQLite (0/1) → boolean untuk PostgreSQL
function toBool(v) { return v === 1 || v === true || v === "1"; }

async function migrate() {
  log("Memulai migrasi data SQLite → PostgreSQL (Supabase)...\n");

  // --- Testimonial ---
  const testimonials = readTable("Testimonial");
  if (testimonials.length) {
    log(`Testimonial: ${testimonials.length} baris...`);
    await pg.testimonial.deleteMany({});
    for (const t of testimonials) {
      await pg.testimonial.create({
        data: {
          id: t.id, name: t.name,
          company: t.company || null,
          role: t.role || null,
          content: t.content,
          rating: t.rating ?? 5,
          avatarSeed: t.avatarSeed || null,
          published: toBool(t.published ?? 1),
          createdAt: new Date(t.createdAt),
        },
      });
    }
    ok(`Testimonial: ${testimonials.length} baris dimigrasi`);
  }

  // --- Lead ---
  const leads = readTable("Lead");
  if (leads.length) {
    log(`Lead: ${leads.length} baris...`);
    await pg.lead.deleteMany({});
    for (const l of leads) {
      await pg.lead.create({
        data: {
          id: l.id, name: l.name, whatsapp: l.whatsapp,
          email: l.email || null,
          businessType: l.businessType,
          businessDesc: l.businessDesc || null,
          package: l.package || null,
          source: l.source || "landing",
          status: l.status || "NEW",
          estimatedValue: l.estimatedValue ?? 0,
          notes: l.notes || null,
          createdAt: new Date(l.createdAt),
          updatedAt: new Date(l.updatedAt || l.createdAt),
        },
      });
    }
    ok(`Lead: ${leads.length} baris dimigrasi`);
  }

  // --- Consultation ---
  const consults = readTable("Consultation");
  if (consults.length) {
    log(`Consultation: ${consults.length} baris...`);
    await pg.consultation.deleteMany({});
    for (const c of consults) {
      await pg.consultation.create({
        data: {
          id: c.id, leadId: c.leadId || null,
          name: c.name, whatsapp: c.whatsapp, topic: c.topic,
          preferredDate: c.preferredDate || null,
          preferredTime: c.preferredTime || null,
          method: c.method || "WA",
          status: c.status || "PENDING",
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt || c.createdAt),
        },
      });
    }
    ok(`Consultation: ${consults.length} baris dimigrasi`);
  }

  // --- Subscriber ---
  const subs = readTable("Subscriber");
  if (subs.length) {
    log(`Subscriber: ${subs.length} baris...`);
    await pg.subscriber.deleteMany({});
    for (const s of subs) {
      await pg.subscriber.create({
        data: {
          id: s.id, name: s.name, email: s.email,
          whatsapp: s.whatsapp || null,
          source: s.source || "email-course",
          createdAt: new Date(s.createdAt),
        },
      });
    }
    ok(`Subscriber: ${subs.length} baris dimigrasi`);
  }

  // --- ChatMessage ---
  const chats = readTable("ChatMessage");
  if (chats.length) {
    log(`ChatMessage: ${chats.length} baris...`);
    await pg.chatMessage.deleteMany({});
    for (const c of chats) {
      await pg.chatMessage.create({
        data: {
          id: c.id, sessionId: c.sessionId,
          role: c.role, content: c.content,
          leadCaptured: toBool(c.leadCaptured ?? 0),
          createdAt: new Date(c.createdAt),
        },
      });
    }
    ok(`ChatMessage: ${chats.length} baris dimigrasi`);
  }

  // --- LicenseCheck ---
  const checks = readTable("LicenseCheck");
  if (checks.length) {
    log(`LicenseCheck: ${checks.length} baris...`);
    await pg.licenseCheck.deleteMany({});
    for (const c of checks) {
      await pg.licenseCheck.create({
        data: {
          id: c.id, businessInput: c.businessInput,
          sector: c.sector || null,
          location: c.location || null,
          scale: c.scale || null,
          result: c.result || null,
          whatsapp: c.whatsapp || null,
          createdAt: new Date(c.createdAt),
        },
      });
    }
    ok(`LicenseCheck: ${checks.length} baris dimigrasi`);
  }

  // --- DocumentCheck ---
  const docs = readTable("DocumentCheck");
  if (docs.length) {
    log(`DocumentCheck: ${docs.length} baris...`);
    await pg.documentCheck.deleteMany({});
    for (const d of docs) {
      await pg.documentCheck.create({
        data: {
          id: d.id, fileName: d.fileName, docCategory: d.docCategory,
          fileType: d.fileType, fileSize: d.fileSize ?? 0,
          result: d.result || null,
          whatsapp: d.whatsapp || null,
          status: d.status || "NEW",
          createdAt: new Date(d.createdAt),
        },
      });
    }
    ok(`DocumentCheck: ${docs.length} baris dimigrasi`);
  }

  // --- RoadmapRequest ---
  const roadmaps = readTable("RoadmapRequest");
  if (roadmaps.length) {
    log(`RoadmapRequest: ${roadmaps.length} baris...`);
    await pg.roadmapRequest.deleteMany({});
    for (const r of roadmaps) {
      await pg.roadmapRequest.create({
        data: {
          id: r.id, name: r.name, whatsapp: r.whatsapp,
          businessField: r.businessField, province: r.province,
          scale: r.scale, capital: r.capital,
          plan: r.plan || null,
          result: r.result || null,
          status: r.status || "NEW",
          createdAt: new Date(r.createdAt),
        },
      });
    }
    ok(`RoadmapRequest: ${roadmaps.length} baris dimigrasi`);
  }

  // --- NotificationSetting ---
  const notifs = readTable("NotificationSetting");
  if (notifs.length) {
    log(`NotificationSetting: ${notifs.length} baris...`);
    await pg.notificationSetting.deleteMany({});
    for (const n of notifs) {
      await pg.notificationSetting.create({
        data: {
          id: n.id,
          telegramEnabled: toBool(n.telegramEnabled ?? 0),
          telegramBotToken: n.telegramBotToken || null,
          telegramChatId: n.telegramChatId || null,
          whatsappEnabled: toBool(n.whatsappEnabled ?? 0),
          whatsappProvider: n.whatsappProvider || "fonnte",
          whatsappApiToken: n.whatsappApiToken || null,
          whatsappTarget: n.whatsappTarget || null,
          templateNewLead: n.templateNewLead || null,
          updatedAt: new Date(n.updatedAt || Date.now()),
        },
      });
    }
    ok(`NotificationSetting: ${notifs.length} baris dimigrasi`);
  }

  // --- NotificationLog ---
  const logs = readTable("NotificationLog");
  if (logs.length) {
    log(`NotificationLog: ${logs.length} baris...`);
    await pg.notificationLog.deleteMany({});
    for (const l of logs) {
      await pg.notificationLog.create({
        data: {
          id: l.id, leadId: l.leadId || null,
          leadName: l.leadName, leadWa: l.leadWa,
          source: l.source || "landing",
          channel: l.channel || "telegram",
          status: l.status || "sent",
          message: l.message || null,
          error: l.error || null,
          createdAt: new Date(l.createdAt),
        },
      });
    }
    ok(`NotificationLog: ${logs.length} baris dimigrasi`);
  }

  console.log("\n" + "=".repeat(60));
  ok("Migrasi data SQLite → Supabase SELESAI!");
  console.log("=".repeat(60) + "\n");
}

migrate()
  .catch((e) => { fail(e.message); })
  .finally(async () => {
    sqlite?.close();
    await pg.$disconnect();
  });
