import { createHash } from "node:crypto";
import sitemap from "../src/app/sitemap";
import { ALL_SERVICE_PAGES, getAnyPage, getHubSlugs, CATEGORY_META } from "../src/lib/catalog";
import { KBLI_PAGES, KBLI_CATEGORY_PAGES } from "../src/lib/kbli-catalog";
import { BLOG_ARTICLES } from "../src/lib/blog-content";
import { PERMIT_GUIDES } from "../src/lib/seo-content";
import { ALL_SEO_PAGES, SEO_INDEX_PAGES } from "../src/lib/seo-pages";
import { CATEGORIES, BUNDLES, fmtRange, fmtIdr } from "../src/lib/katalog-lengkap";
import { JOBS } from "../src/lib/jobs-data";
import { COMPARISONS } from "../src/lib/comparisons";
import { TESTIMONIALS, TESTIMONIAL_CATEGORIES } from "../src/lib/testimonials-data";
import { SERVICES, FAQS, PRICING } from "../src/lib/landing-data";
import { FOUNDER, TEAM } from "../src/lib/team-data";
import { INSTITUTIONS } from "../src/lib/institutions";
import { CONTACT, LEGAL_ENTITY, SITE_NAME, SITE_URL } from "../src/lib/site";
import { classifyPage } from "../src/lib/seo-policy";

export interface WordPressRecord {
  path: string;
  title: string;
  seoTitle: string;
  description: string;
  content: string;
  index: boolean;
  section: string;
  kind: string;
  date?: string;
  modified?: string;
  hash: string;
}

type Draft = Omit<WordPressRecord, "hash" | "index" | "section" | "kind"> &
  Partial<Pick<WordPressRecord, "index" | "section" | "kind">>;

export const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const p = (text: string) => `<p>${escapeHtml(text)}</p>`;
const paras = (texts: string[]) => texts.map(p).join("\n");
const h = (text: string, level = 2, id?: string) => `<h${level}${id ? ` id="${escapeHtml(id)}"` : ""}>${escapeHtml(text)}</h${level}>`;
const list = (items: string[], ordered = false) => items.length ? `<${ordered ? "ol" : "ul"}>${items.map((v) => `<li>${escapeHtml(v)}</li>`).join("")}</${ordered ? "ol" : "ul"}>` : "";
const section = (heading: string, items: string[], ordered = false) => items.length ? h(heading) + list(items, ordered) : "";
const links = (items: { href: string; label: string }[]) => `<ul class="pp-link-list">${items.map((v) => `<li><a href="${escapeHtml(v.href)}">${escapeHtml(v.label)}</a></li>`).join("")}</ul>`;
const faq = (items: { q: string; a: string }[]) => items.length ? h("Pertanyaan yang sering diajukan") + items.map((v) => `<details class="pp-faq"><summary>${escapeHtml(v.q)}</summary>${p(v.a)}</details>`).join("\n") : "";
const facts = (items: [string, string | undefined][]) => `<dl class="pp-facts">${items.filter(([, value]) => value).map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>`;
const consult = h("Diskusikan kebutuhan Anda") + p("Konsultasi awal tanpa komitmen. Biaya jasa, biaya resmi, dan estimasi proses dikonfirmasi dalam penawaran tertulis.") + '[pp_whatsapp label="Konsultasi via WhatsApp"]';
const directory = (sectionName: string) => `[pp_directory section="${sectionName}"]`;
const card = (title: string, text: string, href: string, extra = "") => `<article class="pp-card">${h(title, 3)}${p(text)}${extra}<a class="pp-text-link" href="${escapeHtml(href)}">Lihat selengkapnya</a></article>`;

function staticContent(): Draft[] {
  const make = (path: string, title: string, description: string, content: string): Draft => ({ path, title, seoTitle: title, description, content, kind: "halaman" });
  const home = `<section class="pp-hero"><div><p class="pp-eyebrow">Konsultan perizinan · SCBD, Jakarta</p><h1>Urus legalitasnya.<br>Fokus <em>kembangkan bisnisnya.</em></h1>${p("Perizinan usaha, perpajakan, sertifikasi, dan virtual office. Satu tim untuk mendampingi setiap langkah bisnis Anda, dari persiapan dokumen hingga kewajiban pasca-terbit.")}<div class="pp-actions">[pp_whatsapp label="Mulai konsultasi gratis"]<a class="pp-button pp-button-outline" href="/layanan">Jelajahi layanan</a></div><p class="pp-small">Penawaran tertulis · Jalur resmi · Pendampingan personal</p></div><aside class="pp-hero-note"><p class="pp-eyebrow">Langkah pertama Anda</p><h2>Bisnis yang siap.<br>Legalitas yang tepat.</h2><ol><li>Ceritakan kondisi dan rencana usaha</li><li>Terima rincian biaya &amp; persyaratan</li><li>Kami dampingi proses pengajuan</li></ol><a href="/kontak">Kenali cara kami membantu</a></aside></section>` +
    `<section class="pp-home-section">${h("Dari mulai usaha hingga berkembang", 2, "layanan")}${p("Temukan pendampingan yang sesuai kebutuhan, tanpa harus mengurus semuanya sendiri.")}<div class="pp-grid">${SERVICES.filter((s) => ["nib", "pt", "cv", "halal", "ppi-umroh", "bpom"].includes(s.id)).map((s) => card(s.title, s.desc, `/layanan/${s.id}`, p(`Mulai ${s.price} · ${s.duration}`))).join("")}</div>${links([{ href: "/katalog", label: "Lihat seluruh divisi layanan" }, { href: "/layanan/kategori/pajak", label: "Layanan perpajakan" }, { href: "/virtual-office", label: "Virtual office & alamat bisnis" }, { href: "/layanan/kategori/sertifikasi", label: "Sertifikasi & ISO" }, { href: "/layanan/kategori/kerja-luar-negeri", label: "Kerja luar negeri" }])}</section>` +
    `<section class="pp-home-section pp-tinted">${h("Pengetahuan sebelum keputusan", 2, "panduan")}${p("Pahami biaya, syarat, dan pilihan legalitas sebelum memulai pengurusan.")}<div class="pp-grid">${card("Cari kode KBLI", "Telusuri bidang usaha, tingkat risiko, dan perizinan yang relevan.", "/kbli")}${card("Panduan perizinan", "Pelajari persyaratan dan tahapan pengajuan dari katalog panduan.", "/panduan")}${card("Bandingkan pilihan", "Pertimbangkan badan usaha dan layanan sesuai rencana bisnis Anda.", "/bandingkan")}</div></section>` +
    `<section class="pp-home-section">${h("Pilih pendampingan sesuai kebutuhan", 2, "harga")}<div class="pp-grid">${PRICING.map((b) => card(b.name, b.tagline, "/paket", p(`Mulai ${b.price}`) + list(b.features))).join("")}</div>${p("Harga adalah informasi jasa dalam katalog. Konfirmasi cakupan, biaya pihak ketiga, dan regulasi terbaru bersama konsultan.")}</section>` +
    `<section class="pp-home-section">${h("Wawasan untuk langkah berikutnya", 2, "blog")}<div class="pp-grid">${BLOG_ARTICLES.slice(0, 3).map((b) => card(b.title, b.excerpt, `/blog/${b.slug}`)).join("")}</div></section>` +
    `<section class="pp-home-section">${faq(FAQS)}</section><section class="pp-home-section pp-tinted" id="konsultasi">${h("Ceritakan rencana bisnis Anda")}${p("Isi formulir berikut. Tim kami akan menghubungi Anda melalui kontak yang Anda berikan.")}[pp_consultation]</section>`;
  const data: Draft[] = [make("/", SITE_NAME, "Pendampingan perizinan usaha, pajak, sertifikasi dan virtual office oleh PT Digital Bisnis Manajemen di SCBD Jakarta.", home)];
  const indexes: [string, string, string][] = [
    ["layanan", "Layanan Perizinan, Pajak & Legalitas", "Telusuri layanan, wilayah, dan persyaratan pengurusan sesuai kebutuhan Anda."],
    ["kbli", "Database KBLI & Perizinan Usaha", "Cari kode atau nama bidang usaha untuk mempelajari risiko, cakupan, dan izin terkait."],
    ["blog", "Artikel & Wawasan Bisnis", "Panduan mendalam mengenai perizinan, biaya, regulasi, dan pengembangan usaha."],
    ["panduan", "Panduan Pengurusan Izin", "Persyaratan, langkah pengurusan, dasar hukum, dan pertanyaan tentang perizinan."],
    ["bandingkan", "Bandingkan Badan Usaha & Layanan", "Perbandingan syarat, biaya, dan pertimbangan dalam menentukan pilihan legalitas."],
    ["testimoni", "Pengalaman Klien", "Kumpulan pengalaman klien menurut kategori layanan dalam konten website."],
    ["lowongan-kerja", "Lowongan Kerja & Karier", "Informasi posisi, persyaratan, dan cara menghubungi tim rekrutmen. Konfirmasi ketersediaan posisi sebelum melamar."],
    ["katalog", "Katalog Lengkap Layanan", "Daftar divisi dan layanan konsultasi. Harga jasa, biaya resmi, dan pihak ketiga disampaikan terpisah dalam penawaran."],
  ];
  for (const [slug, title, description] of indexes) data.push(make(`/${slug}`, title, description, p(description) + directory(slug)));
  for (const { path, page } of SEO_INDEX_PAGES) data.push({ path: `/${path}`, title: page.h1, seoTitle: page.title, description: page.metaDesc, content: paras(page.intro) + directory(path) + faq(page.faq), kind: "indeks" });
  data.push(make("/paket", "Paket Bundel Perizinan", "Pilihan paket gabungan legalitas dan pendampingan untuk usaha Anda.", p("Harga berikut adalah jasa konsultan. Biaya resmi pemerintah, notaris, dan pihak ketiga diperinci secara terpisah sebelum pekerjaan disetujui.") + BUNDLES.map((b) => h(`Paket ${b.name}`) + facts([["Harga jasa", fmtIdr(b.price)], ["Estimasi hemat", fmtIdr(b.save)], ["Untuk", b.audience]]) + list(b.includes)).join("") + consult));
  data.push(make("/virtual-office", "Virtual Office & Alamat Bisnis", "Pilihan alamat bisnis dan layanan kantor. Konfirmasi kesesuaian alamat, KBLI, zonasi, dan kebutuhan PKP sebelum pemesanan.", p("Pilih layanan virtual office sesuai kebutuhan badan usaha, kota, dan fasilitas yang diperlukan. Setiap alamat perlu dikonfirmasi kesesuaiannya dengan aktivitas usaha dan ketentuan instansi terkait.") + links(ALL_SERVICE_PAGES.filter((v) => v.category === "virtual-office" && v.kind === "base").map((v) => ({ href: `/layanan/${v.slug}`, label: v.h1 }))) + '[pp_directory section="layanan" category="virtual-office"]' + consult));
  data.push(make("/tentang-kami", `Tentang ${SITE_NAME}`, "Kenali jaringan konsultan PT Digital Bisnis Manajemen, tim, dan kantor di SCBD Jakarta.", p(`${SITE_NAME} adalah jaringan konsultan perizinan usaha, perpajakan, dan penempatan pekerja migran yang berbasis di Indonesia Stock Exchange Building, SCBD — Jakarta. Kami menangani analisis KBLI, pengajuan via OSS-RBA, koordinasi notaris dan instansi teknis, hingga kewajiban pasca-terbit.`) + facts([["Badan usaha", LEGAL_ENTITY], ["Kantor", `${CONTACT.address.street}, ${CONTACT.address.city} ${CONTACT.address.postalCode}`]]) + [FOUNDER, ...TEAM].map((m) => h(m.name) + p(`${m.title.id} · ${m.credentials}`) + p(m.bio.id) + list(m.focus.id)).join("") + h("Keterbukaan layanan") + p("Kami adalah penyedia jasa konsultasi, bukan instansi pemerintah. Informasi layanan dan klaim bisnis perlu dikonfirmasi melalui konsultasi dan bukti pekerjaan yang relevan. Keputusan akhir perizinan berada pada instansi penerbit.") + consult));
  data.push(make("/kontak", "Hubungi PusatPerizinan.com", "Kontak resmi, alamat kantor, jam layanan, dan formulir konsultasi.", '[pp_contact_details]' + h("Konsultasi dengan tim kami", 2, "konsultasi") + '[pp_consultation]'));
  data.push(make("/kanal-resmi", "Kanal Resmi & Instansi Perizinan", "Rujukan situs instansi yang terkait dengan pengurusan izin, perpajakan, dan layanan lainnya.", p("Tautan berikut menuju situs instansi. PusatPerizinan.com adalah konsultan independen dan bukan instansi pemerintah.") + INSTITUTIONS.map((i) => h(i.fullName) + p(i.role) + p(i.desc) + links([{ href: i.website, label: i.websiteLabel }, ...i.services.map((s, j) => ({ href: `/layanan/${s}`, label: i.serviceLabels[j] ?? s }))])).join("")));
  data.push(make("/roadmap", "Roadmap Perizinan Usaha", "Persiapkan rencana legalitas bersama konsultan: bidang usaha, bentuk badan usaha, izin sektoral, dan kewajiban pasca-terbit.", p("Layanan ini berupa panduan awal dan konsultasi manusia, bukan pembuat roadmap AI otomatis.") + section("Persiapan rencana legalitas", ["Identifikasi kegiatan riil usaha dan KBLI yang sesuai.", "Tentukan bentuk badan usaha, kepemilikan, modal, dan lokasi operasional.", "Periksa kebutuhan NIB, sertifikat standar, dan izin sektoral.", "Rencanakan sertifikasi produk, dokumen lingkungan, serta izin bangunan bila diperlukan.", "Susun jadwal kepatuhan pajak dan laporan pasca-terbit bersama konsultan."], true) + links([{ href: "/kbli", label: "Telusuri KBLI" }, { href: "/syarat", label: "Lihat persyaratan" }, { href: "/biaya", label: "Lihat estimasi biaya" }]) + consult));
  data.push(make("/cek-dokumen", "Konsultasi Kelengkapan Dokumen", "Persiapkan dokumen dasar usaha dan diskusikan kelengkapannya melalui kanal resmi konsultan.", p("Pemeriksaan dokumen dilakukan oleh tim konsultan, bukan AI otomatis. Jangan mengunggah dokumen identitas atau rahasia melalui formulir umum ini. Tim akan memberikan jalur pengiriman yang disepakati setelah konsultasi.") + section("Checklist awal", ["Jenis izin atau perubahan data yang diminta.", "Kegiatan usaha, lokasi, dan bentuk badan usaha.", "Daftar dokumen yang sudah dimiliki serta masa berlakunya.", "Informasi kendala dan tenggat pengurusan."]) + consult));
  data.push(make("/kalkulator-pajak", "Simulasi Pajak Usaha & Pribadi", "Simulasi dasar PPh tahunan, PPh final UMKM, PPN, dan pajak properti dengan asumsi yang dapat diperiksa.", p("Perhitungan adalah simulasi, bukan penetapan pajak atau pengganti nasihat profesional. Verifikasi kelayakan rezim, tarif, dan aturan terbaru dengan DJP atau konsultan.") + '[pp_tax_calculator]' + consult));
  data.push(make("/kebijakan-privasi", "Kebijakan Privasi", "Pengumpulan, penggunaan, dan perlindungan data pribadi pada website PusatPerizinan.com.", h("Data yang dikumpulkan") + p("Formulir konsultasi meminta nama, nomor WhatsApp, email opsional, jenis layanan, dan pesan. Pesan disimpan di database WordPress pada hosting kami, dan pemberitahuan dapat dikirim melalui email kepada pengelola. Jangan sertakan dokumen identitas atau informasi rahasia dalam pesan umum.") + p("Cookie digunakan untuk login pengelola dan fungsi teknis WordPress. Paket website ini tidak memasang pelacak iklan atau analitik pihak ketiga secara bawaan. Alamat jaringan diproses menjadi hash sementara untuk membatasi spam; log akses server dapat disimpan oleh penyedia hosting.") + h("Tujuan dan dasar pemrosesan") + p("Data digunakan untuk menanggapi konsultasi yang Anda minta dan menyiapkan penawaran jasa, berdasarkan persetujuan saat pengiriman formulir. Kami tidak menjual data pribadi Anda. Pelaksanaan layanan selanjutnya mengikuti perjanjian jasa dan ketentuan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.") + h("WhatsApp dan layanan pihak ketiga") + p("Tombol WhatsApp membuka layanan pihak ketiga. Pesan yang Anda kirim melalui WhatsApp mengikuti kebijakan privasi layanan tersebut. Dokumen untuk pengurusan izin hanya disampaikan kepada pihak yang relevan dengan pekerjaan yang Anda setujui.") + h("Penyimpanan dan hak Anda") + p("Data disimpan selama diperlukan untuk tindak lanjut dan kewajiban yang berlaku. Anda dapat meminta akses, koreksi, atau penghapusan melalui kontak resmi kami. Pengelola meninjau dan menghapus konsultasi yang tidak lagi diperlukan, termasuk kebijakan retensi salinan cadangan hosting.") + h("Kontak privasi") + '[pp_contact_details]'));
  data.push(make("/syarat-ketentuan", "Syarat & Ketentuan Layanan", "Ketentuan penggunaan website, estimasi layanan, dan batasan informasi konsultasi.", h("Status layanan") + p(`${SITE_NAME} adalah penyedia jasa konsultasi dan pengurusan perizinan, bukan instansi pemerintah dan tidak berafiliasi dengan instansi pemerintah mana pun. Semua pengajuan diproses melalui jalur resmi.`) + p("Estimasi biaya di situs adalah informasi jasa. Biaya resmi pemerintah, retribusi, PNBP, notaris, dan pihak ketiga disampaikan dalam penawaran tertulis sebelum Anda menyetujui pekerjaan.") + h("Estimasi waktu dan hasil") + p("Durasi merupakan estimasi; waktu final dan penerbitan izin ditentukan instansi. Verifikasi tambahan, antrean, dan perubahan regulasi dapat memengaruhi proses. Garansi hanya berlaku sesuai cakupan perjanjian jasa tertulis per klien.") + h("Informasi umum, bukan nasihat hukum atau pajak") + p("Panduan, artikel, dan kalkulator merupakan informasi umum. Kondisi setiap usaha berbeda; verifikasi keputusan yang mengikat terhadap publikasi resmi instansi dan konsultasi profesional. Informasi dalam katalog lama dapat memerlukan pembaruan regulasi.") + h("Penggunaan website") + p("Dilarang menyalahgunakan formulir, mengganggu ketersediaan layanan, atau mengakses data tanpa izin. Merek, konten, dan materi website tetap menjadi milik pemegang haknya. Pengutipan sebagian untuk tujuan nonkomersial memerlukan atribusi dan tautan sumber.") + links([{ href: "/kontak", label: "Hubungi pengelola" }])));
  return data;
}

export function exportWordPressContent() {
  const drafts = new Map<string, Draft>();
  const add = (record: Draft) => {
    if (!/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(record.path)) throw new Error(`Invalid path: ${record.path}`);
    if (drafts.has(record.path)) throw new Error(`Duplicate path: ${record.path}`);
    drafts.set(record.path, record);
  };
  staticContent().forEach(add);
  const serviceMap = new Map(ALL_SERVICE_PAGES.map((v) => [v.slug, v]));
  for (const slug of getHubSlugs()) if (!serviceMap.has(slug)) {
    const hub = getAnyPage(slug);
    if (!hub) throw new Error(`Missing hub: ${slug}`);
    serviceMap.set(slug, hub);
  }
  for (const page of serviceMap.values()) {
    const members = page.kind === "hub" ? ALL_SERVICE_PAGES.filter((v) => page.region ? v.region === page.region && v.kind !== "hub" : v.category === page.category && v.kind === "base") : [];
    add({ path: `/layanan/${page.slug}`, title: page.h1, seoTitle: page.title, description: page.metaDesc, index: classifyPage(page).index, kind: page.kind, section: "layanan",
      content: p(page.intro) + paras(page.longDesc) + facts([["Kategori", CATEGORY_META[page.category].label], ["Estimasi jasa", page.price], ["Estimasi proses", page.duration], ["Instansi", page.authority], ["Dasar hukum", page.legalBasis]]) + section("Untuk siapa layanan ini?", page.audience) + section("Cakupan pendampingan", page.features) + section("Persyaratan", page.requirements) + section("Tahapan pengurusan", page.steps, true) + (members.length ? h("Layanan dalam kategori atau wilayah ini") + links(members.map((m) => ({ href: `/layanan/${m.slug}`, label: m.h1 }))) : "") + faq(page.faq) + h("Layanan terkait") + links(page.related.map((s) => ({ href: `/layanan/${s}`, label: serviceMap.get(s)?.h1 ?? s }))) + consult,
    });
    // Directory filtering stays independent of titles and translated display labels.
    drafts.get(`/layanan/${page.slug}`)!.content += `\n<!-- pp-category:${page.category} -->`;
  }
  for (const page of KBLI_PAGES) add({ path: `/kbli/${page.slug}`, title: page.h1, seoTitle: page.title, description: page.metaDesc, kind: "kbli", content: p(page.desc) + facts([["Kode KBLI", page.code], ["Bidang", page.category.name], ["Tingkat risiko", page.riskLabel]]) + section("Cakupan kegiatan", page.includes) + section("Perizinan terkait", page.licenses.map((v) => `${v.name}: ${v.note}`)) + section("Catatan pajak", page.taxNotes) + section("Insentif dan program", page.incentives) + faq(page.faq) + links([...page.relatedServices.map((v) => ({ href: `/layanan/${v.slug}`, label: v.title })), ...page.relatedKbli.map((v) => ({ href: `/kbli/${v.slug}`, label: v.title }))]) + consult });
  for (const page of KBLI_CATEGORY_PAGES) add({ path: `/kbli/${page.slug}`, title: page.h1, seoTitle: page.title, description: page.metaDesc, kind: "indeks", content: paras([...page.intro, ...page.longDesc]) + links(page.members.map((v) => ({ href: `/kbli/${v.slug}`, label: `${v.title} — ${v.riskLabel}` }))) + faq(page.faq) + links(page.relatedServices.map((v) => ({ href: `/layanan/${v.slug}`, label: v.title }))) });
  for (const page of BLOG_ARTICLES) add({ path: `/blog/${page.slug}`, title: page.title, seoTitle: page.title, description: page.excerpt, kind: "artikel", date: page.publishedAt, modified: page.updatedAt, content: p(page.excerpt) + p(`Penulis: ${page.author} — ${page.authorRole}. Diperbarui: ${page.updatedAt}.`) + page.sections.map((v) => h(v.heading) + paras(v.paragraphs) + list(v.bullets ?? [])).join("") + faq(page.faq.map((v) => ({ q: v.question, a: v.answer }))) + h("Baca juga") + links([...page.relatedArticles.map((s) => ({ href: `/blog/${s}`, label: BLOG_ARTICLES.find((v) => v.slug === s)?.title ?? s })), ...page.relatedGuides.map((s) => ({ href: `/panduan/${s}`, label: PERMIT_GUIDES.find((v) => v.id === s)?.name ?? s }))]) + consult });
  for (const page of PERMIT_GUIDES) add({ path: `/panduan/${page.id}`, title: page.name, seoTitle: `Panduan ${page.name}`, description: page.short, kind: "panduan", content: p(page.short) + p(page.long) + facts([["Instansi", page.authority], ["Dasar hukum", page.legalBasis], ["Biaya", page.cost], ["Estimasi proses", page.timeline]]) + section("Persyaratan", page.requirements) + section("Langkah pengurusan", page.steps, true) + section("Tips persiapan", page.tips) + faq(page.faq) + consult });
  for (const page of ALL_SEO_PAGES) add({ path: `/${page.kind === "svc-industry" ? "industri" : page.kind}/${page.slug}`, title: page.h1, seoTitle: page.title, description: page.metaDesc, kind: page.kind, content: paras(page.intro) + page.sections.map((v) => h(v.heading) + paras(v.paras ?? []) + list(v.bullets ?? [])).join("") + faq(page.faq) + h("Informasi terkait") + links(page.relatedLinks.map((v) => ({ href: v.href, label: v.name }))) + consult });
  for (const page of CATEGORIES) add({ path: `/katalog/${page.slug}`, title: page.name, seoTitle: `${page.name} — Katalog Layanan`, description: page.tagline, kind: "divisi", content: p(page.tagline) + p(page.desc) + page.services.map((v) => h(`${v.code} — ${v.name}`) + p(v.desc) + facts([["Kisaran jasa", fmtRange(v.priceFrom, v.priceTo)], ["Estimasi proses", v.timeline]]) + list(v.includes ?? []) + (v.variants ?? []).map((option) => h(option.name, 3) + p(`Mulai ${fmtIdr(option.priceFrom)}. ${option.desc}`)).join("")).join("") + faq(page.faq) + links(page.related) + consult });
  for (const page of JOBS) add({ path: `/lowongan-kerja/${page.slug}`, title: page.title, seoTitle: page.title, description: page.description[0], kind: "lowongan", content: paras(page.description) + facts([["Organisasi", page.organization], ["Lokasi", `${page.address}, ${page.city}, ${page.province}`], ["Jenis kerja", `${page.employmentType} · ${page.workType}`], ["Kisaran gaji bulanan", `${fmtIdr(page.salaryMin)} – ${fmtIdr(page.salaryMax)}`], ["Catatan gaji", page.salaryNote], ["Pendidikan", page.education], ["Pengalaman", `${page.experienceMonths} bulan`]]) + section("Tanggung jawab", page.responsibilities) + section("Kualifikasi", page.qualifications) + section("Manfaat", page.benefits) + section("Keahlian", page.skills) + p("Konfirmasi status lowongan dan prosedur lamaran dengan tim terlebih dahulu. Jangan mengirim dokumen identitas melalui formulir umum.") + consult });
  for (const page of COMPARISONS) add({ path: `/bandingkan/${page.slug}`, title: page.title, seoTitle: page.metaTitle, description: page.metaDesc, kind: "perbandingan", content: paras(page.intro) + `<div class="pp-table-scroll"><table><caption>Perbandingan ${escapeHtml(page.aName)} dan ${escapeHtml(page.bName)}</caption><thead><tr><th scope="col">Aspek</th><th scope="col">${escapeHtml(page.aName)}</th><th scope="col">${escapeHtml(page.bName)}</th></tr></thead><tbody>${page.aspects.map((v) => `<tr><th scope="row">${escapeHtml(v.aspect)}</th><td>${escapeHtml(v.a)}</td><td>${escapeHtml(v.b)}</td></tr>`).join("")}</tbody></table></div>` + section(`Pertimbangkan ${page.aName} jika`, page.chooseA) + section(`Pertimbangkan ${page.bName} jika`, page.chooseB) + h("Kesimpulan") + p(page.verdict) + faq(page.faq) + consult });
  for (const page of TESTIMONIAL_CATEGORIES) add({ path: `/testimoni/${page.slug}`, title: page.name, seoTitle: page.seoTitle, description: page.metaDesc, kind: "testimoni", content: paras(page.intro) + TESTIMONIALS.filter((v) => v.category === page.slug).map((v) => `<blockquote>${p(v.content)}<cite>${escapeHtml(`${v.name} — ${v.role}, ${v.company}, ${v.city} · ${v.date}`)}</cite></blockquote>`).join("") + faq(page.faq) + consult });
  for (const path of [...drafts.keys()]) {
    const parts = path.slice(1).split("/");
    for (let i = 1; i < parts.length; i++) {
      const parent = `/${parts.slice(0, i).join("/")}`;
      if (!drafts.has(parent)) {
        const title = parts[i - 1].replaceAll("-", " ");
        add({ path: parent, title, seoTitle: title, description: `Indeks ${title}`, index: false, kind: "wadah", content: `[pp_directory parent="${parent}"]` });
      }
    }
  }
  const invalidLinks = new Set<string>();
  const records = [...drafts.values()].map((draft) => {
    const content = draft.content.replace(/<a\b([^>]*\bhref="([^"]+)"[^>]*)>([\s\S]*?)<\/a>/g, (full, _attrs, href, label) => {
      const pathname = href.split(/[?#]/)[0];
      if (href.startsWith("/") && pathname && !drafts.has(pathname)) {
        invalidLinks.add(pathname);
        return `<span>${label}</span>`;
      }
      return full;
    });
    const record = { ...draft, content, index: draft.index ?? true, section: draft.section ?? (draft.path.split("/")[1] || "beranda"), kind: draft.kind ?? "halaman" };
    return { ...record, hash: createHash("sha256").update(JSON.stringify(record)).digest("hex") };
  }).sort((a, b) => a.path.split("/").length - b.path.split("/").length || a.path.localeCompare(b.path, "en"));
  const sourcePaths = sitemap().map((item) => new URL(item.url).pathname.replace(/\/$/, "") || "/");
  const paths = new Set(records.map((v) => v.path));
  const missingPaths = sourcePaths.filter((path) => !paths.has(path));
  if (missingPaths.length) throw new Error(`Sitemap URLs missing from export: ${missingPaths.join(", ")}`);
  return { records, sourcePaths, invalidLinks: [...invalidLinks].sort(), site: { name: SITE_NAME, url: SITE_URL, legalEntity: LEGAL_ENTITY, contact: CONTACT } };
}
