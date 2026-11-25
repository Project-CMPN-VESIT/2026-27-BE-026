import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
const FILE = path.resolve("data", "translation-memory.json");
async function ensure() { await fs.mkdir(path.dirname(FILE), { recursive: true }); try { await fs.access(FILE); } catch { await fs.writeFile(FILE, "[]", "utf8"); } }
function key(source, language, glossary = []) { const glossarySignature = glossary.map((item) => `${item.sourceTerm}=${item.targetTerm}`).sort().join("|"); return crypto.createHash("sha256").update(`${language}\0${glossarySignature}\0${source.trim()}`).digest("hex"); }
export async function findTranslation(source, language, glossary = []) { await ensure(); const rows = JSON.parse(await fs.readFile(FILE, "utf8")); const id = key(source, language, glossary); const row = rows.find((item) => item.key === id); return row ? { ...row, reused: true } : null; }
export async function saveTranslation(source, language, translation, qa, glossary = []) { await ensure(); const rows = JSON.parse(await fs.readFile(FILE, "utf8")); const id = key(source, language, glossary); const existing = rows.findIndex((item) => item.key === id); const row = { key: id, source, language, translation, qaStatus: qa.status, updatedAt: new Date().toISOString() }; if (existing >= 0) rows[existing] = row; else rows.push(row); await fs.writeFile(FILE, JSON.stringify(rows.slice(-5000), null, 2), "utf8"); }
