import { BookOpenText, Database, Languages, ShieldCheck } from "lucide-react";

export default function Header({ onKnowledgeBase, onGlossary, page, onPage }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand-lockup" onClick={() => onPage("app")} aria-label="TechMorph home">
          <span className="brand-mark"><Languages size={21} strokeWidth={2.1} /></span>
          <span className="brand-copy"><strong>TechMorph</strong><small>Technical language systems</small></span>
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={page === "app" ? "nav-link active" : "nav-link"} onClick={() => onPage("app")}>Workspace</button>
          <button className="nav-link" onClick={onKnowledgeBase}><Database size={15} /> Knowledge base</button>
          <button className="nav-link" onClick={onGlossary}><BookOpenText size={15} /> Terminology</button>
        </nav>
        <div className="header-status"><span>English → Hindi · Marathi · Telugu</span></div>
      </div>
    </header>
  );
}
