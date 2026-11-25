import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowDownToLine, ArrowLeftRight, Check, Clipboard, Clock3, FileText, FileUp, History, LoaderCircle, ShieldCheck, Sparkles, Trash2, Upload, X } from "lucide-react";
import { translateDocument, translateText } from "../services/api.js";
import { clearHistory, deleteHistory, getHistory, saveHistory } from "../utils/history.js";
import HistoryPanel from "./HistoryPanel.jsx";
import LanguageSelect from "./LanguageSelect.jsx";

const MAX_CHARS = 12000;

function downloadText(text, filename) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Translator() {
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Marathi");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState(() => getHistory());
  const [showHistory, setShowHistory] = useState(false);
  const [ragInfo, setRagInfo] = useState(null);
  const [provider, setProvider] = useState(null);
  const [qa, setQa] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [file, setFile] = useState(null);
  const [documentReport, setDocumentReport] = useState(null);
  const fileInput = useRef(null);
  const wordCount = useMemo(() => (text.trim() ? text.trim().split(/\s+/).length : 0), [text]);

  useEffect(() => { if (!copied) return; const timer = setTimeout(() => setCopied(false), 1500); return () => clearTimeout(timer); }, [copied]);

  function clearResult() { setTranslation(""); setQa(null); setProvider(null); setRagInfo(null); setPipeline(null); setDocumentReport(null); }

  async function handleTranslate() {
    setError(""); setCopied(false); clearResult();
    if (!text.trim()) { setError("Enter technical English content before translating."); return; }
    setLoading(true);
    try {
      const data = await translateText(text.trim(), targetLanguage);
      setTranslation(data.translation); setRagInfo(data.rag || null); setProvider(data.provider || null); setQa(data.qa || null); setPipeline(data.pipeline || null);
      setHistory(saveHistory({ id: crypto.randomUUID(), originalText: text.trim(), targetLanguage, translation: data.translation, timestamp: new Date().toISOString(), provider: data.provider?.name }));
    } catch (err) { setError(err.message || "Unable to generate translation. Please try again."); }
    finally { setLoading(false); }
  }

  async function handleDocumentTranslate() {
    setError(""); clearResult();
    if (!file) { setError("Choose a document first."); return; }
    setLoading(true);
    try {
      const data = await translateDocument(file, targetLanguage);
      setTranslation(data.translation); setDocumentReport(data.report);
      setProvider({ name: data.report.providerUsed, fallbackUsed: data.report.fallbackCount > 0 });
      setQa({ status: data.report.qaStatus, issueCount: data.report.issueCount, issues: data.report.issues.flatMap((group) => group.issues.map((issue) => ({ ...issue, segment: group.segment }))) });
      setHistory(saveHistory({ id: crypto.randomUUID(), originalText: `[Document] ${file.name}`, targetLanguage, translation: data.translation, timestamp: new Date().toISOString(), provider: data.report.providerUsed }));
    } catch (err) { setError(err.message || "Unable to translate this document."); }
    finally { setLoading(false); }
  }

  async function copyOutput() { if (!translation) return; try { await navigator.clipboard.writeText(translation); setCopied(true); } catch { setError("Clipboard access failed. Select and copy the translation manually."); } }
  function openHistory(item) { setText(item.originalText.startsWith("[Document] ") ? "" : item.originalText); setTargetLanguage(item.targetLanguage); setTranslation(item.translation); setProvider(item.provider ? { name: item.provider } : null); setShowHistory(false); setMode("text"); setQa(null); setRagInfo(null); }
  function removeHistory(id) { setHistory(deleteHistory(id)); }
  function removeAllHistory() { clearHistory(); setHistory([]); }

  return <main className="workspace page-enter">
    <section className="workspace-intro">
      <div className="intro-copy"><div className="eyebrow"><span className="eyebrow-line" /> TECHNICAL TRANSLATION WORKSPACE</div><h1>Translate technical English<br /><span>into Hindi, Marathi, Telugu.</span></h1><p>Translate technical English with document context, approved terminology, protected expressions, and output checks.</p></div>
      <div className="intro-note"><div className="note-icon"><ShieldCheck size={20} /></div><div><strong>Built for reviewable output</strong><p>Quality checks flag potential issues. They do not certify a translation as error-free.</p></div></div>
    </section>

    <div className="workspace-toolbar"><div className="mode-tabs" role="tablist" aria-label="Translation mode"><button role="tab" aria-selected={mode === "text"} className={mode === "text" ? "mode-tab active" : "mode-tab"} onClick={() => { setMode("text"); setError(""); }}>Text translation</button><button role="tab" aria-selected={mode === "document"} className={mode === "document" ? "mode-tab active" : "mode-tab"} onClick={() => { setMode("document"); setError(""); }}>Document translation</button></div><button className="quiet-button" onClick={() => setShowHistory(true)}><History size={16} /> History <span className="history-count">{history.length}</span></button></div>

    <div className="translation-grid">
      <section className="work-card source-card">
        <div className="card-heading"><div><span className="section-index">01</span><div><h2>{mode === "text" ? "Source text" : "Source document"}</h2><p>{mode === "text" ? "Paste technical English to translate" : "Upload a document for segmented translation"}</p></div></div><span className="language-tag">ENGLISH</span></div>
        {mode === "text" ? <><textarea className="source-editor" value={text} maxLength={MAX_CHARS} onChange={(event) => { setText(event.target.value); setError(""); }} placeholder="Paste a technical paragraph, procedure, specification, or documentation here..." spellCheck="false" /><div className="editor-meta"><span>{wordCount} words</span><span>{text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters</span></div></> : <div className="document-drop" onClick={() => fileInput.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const next = event.dataTransfer.files?.[0]; if (next) { setFile(next); setError(""); } }} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") fileInput.current?.click(); }}><input ref={fileInput} type="file" className="visually-hidden" accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown" onChange={(event) => setFile(event.target.files?.[0] || null)} /><span className="upload-icon"><FileUp size={23} /></span><strong>{file ? file.name : "Choose a technical document"}</strong><span>{file ? `${(file.size / 1024).toFixed(0)} KB · ready to process` : "Drop a file here or browse your computer"}</span><small>PDF, DOCX, TXT, or Markdown · maximum 10 MB</small>{file && <button className="file-remove" onClick={(event) => { event.stopPropagation(); setFile(null); }} aria-label="Remove file"><X size={15} /></button>}</div>}
        <div className="source-controls"><LanguageSelect value={targetLanguage} onChange={setTargetLanguage} /><div className="control-footnote"><span className="control-dot" /> {mode === "text" ? "Up to 12,000 characters per request" : "Text is extracted and translated in segments"}</div></div>
        {error && <div className="error-banner"><AlertTriangle size={17} /><span>{error}</span></div>}
        <button className="button button-primary translate-button" onClick={mode === "text" ? handleTranslate : handleDocumentTranslate} disabled={loading || (mode === "text" ? !text.trim() : !file)}>{loading ? <><LoaderCircle size={17} className="spin" /> Processing translation...</> : <><Sparkles size={17} /> {mode === "text" ? "Translate text" : "Translate document"}</>}</button>
        <p className="privacy-note">Your text is sent to the configured AI provider for processing. Do not submit confidential material unless your deployment is approved for it.</p>
      </section>

      <section className="work-card result-card">
        <div className="card-heading"><div><span className="section-index">02</span><div><h2>Translation output</h2><p>{targetLanguage} · generated result and quality checks</p></div></div><div className="output-actions"><button className="icon-button" onClick={copyOutput} disabled={!translation} title="Copy translation" aria-label="Copy translation">{copied ? <Check size={17} /> : <Clipboard size={17} />}</button><button className="icon-button" onClick={() => translation && downloadText(translation, `techmorph-${targetLanguage.toLowerCase()}.txt`)} disabled={!translation} title="Download text" aria-label="Download text"><ArrowDownToLine size={17} /></button></div></div>
        <div className={translation ? "result-editor has-result" : "result-editor"}>{translation ? <pre>{translation}</pre> : <div className="result-empty"><div className="empty-symbol"><ArrowLeftRight size={23} /></div><strong>Your translation appears here</strong><p>Enter source text or upload a document, then run the translation pipeline.</p></div>}</div>
        {translation && <div className="result-footer"><span><Check size={14} /> Translation generated</span><button className="text-button" onClick={() => clearResult()}><Trash2 size={14} /> Clear result</button></div>}
        {translation && <div className="quality-panel"><div className="quality-heading"><div><ShieldCheck size={17} /><strong>Quality and provenance</strong></div><span className={`qa-badge ${qa?.status === "checks_passed" ? "qa-pass" : "qa-review"}`}>{qa?.status === "checks_passed" ? "Checks passed" : qa?.status ? "Review suggested" : "Not assessed"}</span></div>
          <div className="quality-grid"><div><span>Provider</span><strong>{provider?.name || "Gemini"}{provider?.fallbackUsed ? " · fallback used" : ""}</strong></div><div><span>Protected spans</span><strong>{pipeline?.protectedSpans ?? "Document pipeline"}</strong></div><div><span>Retrieved chunks</span><strong>{ragInfo?.sourcesRetrieved ?? "Document context"}</strong></div><div><span>Flagged issues</span><strong>{qa?.issueCount ?? 0}</strong></div></div>
          {ragInfo?.sources?.length > 0 && <div className="source-evidence"><strong>Retrieved evidence</strong>{ragInfo.sources.map((source, index) => <div key={`${source.documentName}-${source.chunkIndex}-${index}`}><FileText size={14} /><span>{source.documentName} · chunk {source.chunkIndex + 1}</span><code>RRF {source.score}</code></div>)}</div>}
          {qa?.issues?.length > 0 && <div className="issue-list"><strong><AlertTriangle size={15} /> Items requiring review</strong>{qa.issues.slice(0, 8).map((issue, index) => <p key={`${issue.code}-${index}`}>{issue.segment ? `Segment ${issue.segment}: ` : ""}{issue.message}</p>)}{qa.issues.length > 8 && <small>And {qa.issues.length - 8} more issue(s).</small>}</div>}
          {documentReport && <div className="document-report"><div><span>Source file</span><strong>{documentReport.sourceFile}</strong></div><div><span>Segments processed</span><strong>{documentReport.segmentCount}</strong></div><div><span>Reused approved memory</span><strong>{documentReport.reusedSegments}</strong></div><div><span>Provider fallback count</span><strong>{documentReport.fallbackCount}</strong></div><button className="button button-secondary report-download" onClick={() => downloadText(JSON.stringify(documentReport, null, 2), "techmorph-quality-report.json")}><ArrowDownToLine size={15} /> Download QA report</button></div>}
          <p className="quality-disclaimer">Automated checks are heuristic. A “checks passed” status means configured checks found no issues, not that the translation is guaranteed correct.</p>
        </div>}
      </section>
    </div>

    <section className="workflow-strip"><div className="workflow-title"><span>PIPELINE</span><strong>What happens to your content</strong></div><div className="workflow-step"><span>01</span><div><strong>Analyse</strong><small>Protect code, numbers, and expressions</small></div></div><div className="workflow-step"><span>02</span><div><strong>Retrieve</strong><small>Search semantic and exact terms</small></div></div><div className="workflow-step"><span>03</span><div><strong>Translate</strong><small>Apply approved terminology</small></div></div><div className="workflow-step"><span>04</span><div><strong>Verify</strong><small>Flag potential content changes</small></div></div></section>
    {showHistory && <HistoryPanel items={history} onOpen={openHistory} onDelete={removeHistory} onClear={removeAllHistory} onClose={() => setShowHistory(false)} />}
  </main>;
}
