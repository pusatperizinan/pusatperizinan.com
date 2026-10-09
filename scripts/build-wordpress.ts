import { mkdirSync, writeFileSync, readFileSync, cpSync, existsSync, statSync, rmSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { exportWordPressContent } from "./wordpress-content";

const root = path.resolve(import.meta.dir, "..");
const output = path.join(root, "public/download");
const staging = path.join(root, "wordpress/.build");
const plugin = path.join(root, "wordpress/pusatperizinan-cms");
const theme = path.join(root, "wordpress/pusatperizinan");
const dataDir = path.join(plugin, "data");
const hash = (data: string | Buffer) => createHash("sha256").update(data).digest("hex");

for (const file of ["pusatperizinan-cms.php", "includes/importer.php", "includes/seo.php", "includes/forms.php", "includes/content.php"]) {
  if (!existsSync(path.join(plugin, file))) throw new Error(`Plugin source incomplete: ${file}`);
}
for (const file of ["style.css", "index.php", "functions.php", "assets/logo-icon.png"]) {
  if (!existsSync(path.join(theme, file))) throw new Error(`Theme source incomplete: ${file}`);
}
const { records, sourcePaths, invalidLinks, site } = exportWordPressContent();
const ndjson = records.map((v) => JSON.stringify(v)).join("\n") + "\n";
const sourceCommit = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
if (sourceCommit.status !== 0) throw new Error("Cannot identify source commit");
const manifest = {
  format: 1,
  generatedAt: new Date().toISOString(),
  sourceCommit: sourceCommit.stdout.trim(),
  total: records.length,
  sourceSitemapUrls: sourcePaths.length,
  indexable: records.filter((v) => v.index).length,
  noindex: records.filter((v) => !v.index).length,
  sha256: hash(ndjson),
  bytes: Buffer.byteLength(ndjson),
  site,
};
mkdirSync(dataDir, { recursive: true });
mkdirSync(output, { recursive: true });
writeFileSync(path.join(dataDir, "content.ndjson"), ndjson);
writeFileSync(path.join(dataDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
writeFileSync(path.join(dataDir, "index.php"), "<?php\nhttp_response_code(404);\nexit;\n");
writeFileSync(path.join(dataDir, ".htaccess"), "Require all denied\n");

if (existsSync(staging)) rmSync(staging, { recursive: true });
mkdirSync(staging, { recursive: true });
const pack = (zipName: string, cwd: string, entries: string[]) => {
  const target = path.join(output, zipName);
  if (existsSync(target)) rmSync(target);
  const result = spawnSync("zip", ["-q", "-r", "-9", target, ...entries], { cwd, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Archive creation failed: ${zipName}`);
  const verify = spawnSync("unzip", ["-tq", target], { encoding: "utf8" });
  if (verify.status !== 0) throw new Error(`Archive integrity failed: ${zipName}`);
  return { file: zipName, sizeBytes: statSync(target).size, sha256: hash(readFileSync(target)) };
};
const themePack = pack("pusatperizinan-theme.zip", path.dirname(theme), [path.basename(theme)]);
const pluginPack = pack("pusatperizinan-cms.zip", path.dirname(plugin), [path.basename(plugin)]);
cpSync(path.join(output, themePack.file), path.join(staging, themePack.file));
cpSync(path.join(output, pluginPack.file), path.join(staging, pluginPack.file));
cpSync(path.join(root, "DEPLOY-IDWEBHOST.md"), path.join(staging, "MULAI-DI-SINI.md"));
cpSync(path.join(root, "DEPLOY-IDWEBHOST.md"), path.join(output, "DEPLOY-IDWEBHOST.md"));
cpSync(path.join(root, "wordpress/panduan.html"), path.join(staging, "MULAI-DI-SINI.html"));
cpSync(path.join(root, "wordpress/panduan.html"), path.join(output, "wordpress-panduan.html"));
const audit = {
  ...manifest,
  packages: [themePack, pluginPack],
  missingSourceUrls: [],
  removedBrokenSourceLinks: invalidLinks,
  changedFeatures: [
    "CMS native WordPress, bukan dashboard Next.js lama",
    "Konsultasi tersimpan di database hosting; email tergantung konfigurasi email hosting",
    "AI chat, AI roadmap, dan AI pemeriksaan dokumen diganti konsultasi manusia; tidak ada koneksi API AI",
    "Bahasa Indonesia; switcher terjemahan 30 bahasa dan kursus email otomatis tidak termasuk",
    "Tampilan menggunakan tema WordPress ringan, bukan salinan pixel-identik seluruh komponen React",
  ],
};
writeFileSync(path.join(staging, "audit-migrasi.json"), JSON.stringify(audit, null, 2) + "\n");
writeFileSync(path.join(staging, "peta-url.csv"), "url_lama,path_wordpress,status_indeks\n" + records.map((v) => `${site.url}${v.path},${v.path},${v.index ? "index" : "noindex"}`).join("\n") + "\n");
writeFileSync(path.join(output, "wordpress-audit.json"), JSON.stringify(audit, null, 2) + "\n");
const fullPack = pack("pusatperizinan-wordpress.zip", staging, [themePack.file, pluginPack.file, "MULAI-DI-SINI.html", "MULAI-DI-SINI.md", "audit-migrasi.json", "peta-url.csv"]);
writeFileSync(path.join(output, "wordpress-pack-info.json"), JSON.stringify({ ...fullPack, builtAt: manifest.generatedAt, totalPages: records.length, sourceUrls: sourcePaths.length, theme: themePack, plugin: pluginPack }, null, 2) + "\n");
console.log(JSON.stringify({ bundle: fullPack, totalPages: records.length, sitemapUrlsPreserved: sourcePaths.length, noindex: manifest.noindex, removedBrokenSourceLinks: invalidLinks.length }, null, 2));
