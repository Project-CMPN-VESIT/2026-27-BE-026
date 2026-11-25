import { useEffect, useState } from "react";
import { BookOpenText, Plus, Trash2, X } from "lucide-react";
import { createGlossaryEntry, deleteGlossaryEntry, getGlossary } from "../services/api.js";

export default function GlossaryPanel({ open, onClose }) {
  const [entries, setEntries] = useState([]);
  const [sourceTerm, setSourceTerm] = useState("");
  const [targetTerm, setTargetTerm] = useState("");
  const [language, setLanguage] = useState("Marathi");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() { const data = await getGlossary(); setEntries(data.entries || []); }
  useEffect(() => { if (open) refresh().catch((err) => setError(err.message)); }, [open]);
  if (!open) return null;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try { await createGlossaryEntry({ sourceTerm, targetTerm, language, notes }); setSourceTerm(""); setTargetTerm(""); setNotes(""); await refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function remove(id) { try { await deleteGlossaryEntry(id); await refresh(); } catch (err) { setError(err.message); } }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="glossary-title">
      <div className="modal-head"><div><div className="eyebrow"><BookOpenText size={14} /> Terminology controls</div><h2 id="glossary-title">Approved glossary</h2><p>Rules are applied during translation and checked in the output.</p></div><button className="icon-button" onClick={onClose} aria-label="Close glossary"><X size={18} /></button></div>
      <form className="glossary-form" onSubmit={submit}>
        <label>Source term<input value={sourceTerm} onChange={(e) => setSourceTerm(e.target.value)} maxLength={160} required placeholder="e.g. congestion control" /></label>
        <label>Approved translation<input value={targetTerm} onChange={(e) => setTargetTerm(e.target.value)} maxLength={160} required placeholder="Preferred target term" /></label>
        <div className="form-row"><label>Language<select value={language} onChange={(e) => setLanguage(e.target.value)}><option>Hindi</option><option>Marathi</option><option>Telugu</option></select></label><label>Notes<input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} placeholder="Optional domain note" /></label></div>
        {error && <p className="inline-error">{error}</p>}
        <button className="button button-primary" disabled={busy}><Plus size={16} /> {busy ? "Saving..." : "Add terminology rule"}</button>
      </form>
      <div className="entry-list-head"><strong>Saved rules</strong><span>{entries.length} entries</span></div>
      <div className="glossary-list">{entries.length ? entries.map((entry) => <div className="glossary-entry" key={entry.id}><div><div className="term-pair"><strong>{entry.sourceTerm}</strong><span>→</span><strong>{entry.targetTerm}</strong></div><div className="term-meta">{entry.language}{entry.notes ? ` · ${entry.notes}` : ""}</div></div><button className="icon-button danger-icon" onClick={() => remove(entry.id)} aria-label={`Delete ${entry.sourceTerm}`}><Trash2 size={16} /></button></div>) : <div className="empty-inline">No glossary rules yet. Add terms that must remain consistent.</div>}</div>
    </section>
  </div>;
}
