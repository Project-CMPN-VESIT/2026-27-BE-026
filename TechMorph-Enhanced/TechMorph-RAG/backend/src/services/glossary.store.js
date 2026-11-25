import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
const FILE = path.resolve("data", "glossary.json");
async function ensure() {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  try { await fs.access(FILE); } catch { await fs.writeFile(FILE, "[]", "utf8"); }
}
export async function listGlossary() { await ensure(); return JSON.parse(await fs.readFile(FILE, "utf8")); }
async function write(items) { await ensure(); await fs.writeFile(FILE, JSON.stringify(items, null, 2), "utf8"); }
export async function addGlossaryEntry(entry) {
  const items = await listGlossary();
  const sourceTerm = String(entry.sourceTerm || "").trim();
  const targetTerm = String(entry.targetTerm || "").trim();
  const language = String(entry.language || "Marathi").trim();
  if (!sourceTerm || !targetTerm || sourceTerm.length > 160 || targetTerm.length > 160) throw new Error("Source and target terms are required (maximum 160 characters each).");
  const duplicate = items.find((item) => item.sourceTerm.toLowerCase() === sourceTerm.toLowerCase() && item.language === language);
  if (duplicate) throw new Error("A glossary entry already exists for this source term and language.");
  const next = { id: crypto.randomUUID(), sourceTerm, targetTerm, language, notes: String(entry.notes || "").slice(0, 300), createdAt: new Date().toISOString() };
  items.push(next); await write(items); return next;
}
export async function deleteGlossaryEntry(id) { const items = (await listGlossary()).filter((item) => item.id !== id); await write(items); return items; }

export function relevantGlossaryEntries(source, entries) {
  const normalized = String(source || "").toLocaleLowerCase();
  return entries.filter((entry) => {
    const term = String(entry.sourceTerm || "").trim().toLocaleLowerCase();
    if (!term) return false;
    if (/^[\p{L}\p{N}_]+$/u.test(term)) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^\\p{L}\\p{N}_])${escaped}($|[^\\p{L}\\p{N}_])`, "iu").test(source);
    }
    return normalized.includes(term);
  });
}
