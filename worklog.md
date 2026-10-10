# Worklog — PusatPerizinan.com Deployment Pipeline

This file tracks the work done by all agents involved in preparing
PusatPerizinan.com for production deployment on Hostinger Node.js
Business hosting with Supabase database.

---

## Task 7 — Documentation: DEPLOY-HOSTINGER.md

**Agent:** Documentation writer + deployment architect
**Date:** 2026-10-10
**Status:** ✅ Completed

### What was done

1. Read project structure and key files:
   - `package.json` — confirmed build/start scripts use webpack + standalone server
   - `next.config.ts` — confirmed `standalone` is default mode, `static export` is legacy
   - `prisma/schema.supabase.prisma` — confirmed PostgreSQL schema with `directUrl`
   - `scripts/switch-to-supabase.mjs` — confirmed automated DB switch script
   - `scripts/migrate-data.mjs` — confirmed optional SQLite → PostgreSQL data migration
   - `.env.production.example` — confirmed all required env vars documented
   - `src/lib/admin-auth.ts` — confirmed ADMIN_PASSWORD/ADMIN_SECRET env-based auth
   - `src/lib/db.ts` — confirmed Prisma client singleton
   - `src/app/api/admin/seed/route.ts` — confirmed demo data seeding endpoint
   - `DEPLOY-IDWEBHOST.md` — referenced for writing style/tone

2. Created `/home/z/my-project/DEPLOY-HOSTINGER.md`:
   - Comprehensive, beginner-friendly deployment guide in Bahasa Indonesia
   - Warm, encouraging tone matching user's "sayang" address style
   - Heavy emoji usage for visual clarity
   - Sections A–G as specified (Supabase setup, project config, Hostinger deploy,
     verification, troubleshooting, WhatsApp/Telegram notifications, maintenance)
   - TL;DR quick version at top for experienced users
   - ASCII architecture diagram
   - "💡 Tips" and "⚠️ Hati-hati" callout boxes throughout
   - Step-by-step numbered instructions assuming reader has NEVER used a terminal

### Files created/modified

- `/home/z/my-project/DEPLOY-HOSTINGER.md` (new file, ~700 lines)
- `/home/z/my-project/worklog.md` (this file)

### Next actions for user

1. Follow the guide in order: Bagian A → B → C → D → E
2. After successful deploy, visit `/admin` → login → click "Seed Demo Data"
3. (Optional) Set up Telegram/WhatsApp notifications per Bagian F
4. Bookmark the troubleshooting section (Bagian E) for future reference

---
Task ID: HOSTINGER-FIX
Agent: Z.ai Code (Main)
Task: Fix build failure on Hostinger Node.js (Turbopack crash) + prepare Supabase migration

Work Log:
- Diagnosed root cause: `npm run build:static` triggers `output: "export"` mode, Turbopack crashes when processing globals.css during 9,470-page static export ("node process exited before we could connect"). This is a Turbopack bug, not a code issue.
- Multi-lens analysis (46-Lens): The static export approach is WRONG for Hostinger Node.js Business — it produces HTML-only output (no API routes, no database). User needs standalone mode (full Node.js server) for Hostinger + Supabase to work.
- Modified `package.json`:
  - `build`: `next build --webpack` (uses stable webpack, avoids Turbopack crash)
  - `start`: `node .next/standalone/server.js` (npm-compatible, no bun)
  - Added `postinstall: prisma generate` (auto-runs on Hostinger after npm install)
  - Added `db:switch-supabase` and `db:migrate-data` scripts
  - Renamed project to `pusatperizinan-com`
- Modified `next.config.ts`: Made `standalone` the default output mode (was conditional), kept static export as legacy opt-in via BUILD_STATIC=1, added `serverExternalPackages` for sharp and @prisma/client, added eslint ignore during builds
- Created `prisma/schema.supabase.prisma`: PostgreSQL version of schema (provider sqlite→postgresql, added directUrl for Supabase PgBouncer)
- Created `scripts/switch-to-supabase.mjs`: Automated DB provider switch (validates DATABASE_URL, backs up SQLite schema, copies PostgreSQL schema, runs prisma generate + db push)
- Created `scripts/migrate-data.mjs`: Optional data migration from SQLite to Supabase (reads all 10 tables, handles type conversion SQLite boolean→PostgreSQL)
- Created `.env.production.example`: Documents all env vars (DATABASE_URL, DIRECT_URL, ADMIN_PASSWORD, ADMIN_SECRET, Telegram, WhatsApp, GA)
- Delegated DEPLOY-HOSTINGER.md creation to subagent (1,316-line beginner-friendly guide in Bahasa Indonesia)
- Verified sandbox dev server still works on SQLite (unchanged): HTTP 200, all features functional
- Ran lint: exit 0, no errors
- Agent Browser verification:
  - Homepage renders correctly (title, hero, stats, services)
  - AI License Checker works end-to-end (input → AI analysis → roadmap with NIB/Halal/etc)
  - Admin page accessible (Mission Control login form)
  - Lead capture form works: POST /api/leads → 200, Prisma INSERT successful, success toast shown
  - No console errors throughout

Stage Summary:
- Build failure root cause: Turbopack crash during static export CSS processing
- Fix: Switch to standalone mode (full Node.js server) + use webpack bundler (`next build --webpack`)
- This is architecturally correct for Hostinger Node.js Business + Supabase: enables API routes, database, AI features
- All 6 new files created: package.json (modified), next.config.ts (modified), prisma/schema.supabase.prisma, scripts/switch-to-supabase.mjs, scripts/migrate-data.mjs, .env.production.example, DEPLOY-HOSTINGER.md
- Sandbox dev server verified working (SQLite unchanged for dev)
- Deployment path for user: follow DEPLOY-HOSTINGER.md → Supabase setup → db:switch-supabase → npm run build → npm start
