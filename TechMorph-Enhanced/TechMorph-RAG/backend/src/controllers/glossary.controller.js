import { addGlossaryEntry, deleteGlossaryEntry, listGlossary } from "../services/glossary.store.js";
export async function getGlossary(_req, res) { res.json({ success: true, entries: await listGlossary() }); }
export async function createGlossaryEntry(req, res) {
  try { const entry = await addGlossaryEntry(req.body || {}); return res.status(201).json({ success: true, entry }); }
  catch (error) { return res.status(400).json({ success: false, error: error.message }); }
}
export async function removeGlossaryEntry(req, res) { res.json({ success: true, entries: await deleteGlossaryEntry(req.params.id) }); }
