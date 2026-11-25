import { useEffect, useState } from "react";
import { Database, LockKeyhole, ShieldCheck } from "lucide-react";
import Header from "./components/Header.jsx";
import Translator from "./components/Translator.jsx";
import KnowledgeBase from "./components/KnowledgeBase.jsx";
import GlossaryPanel from "./components/GlossaryPanel.jsx";

const policyContent = {
  privacy: {
    eyebrow: "LEGAL / PRIVACY",
    title: "Privacy policy",
    updated: "Last updated: 30 October 2026",
    sections: [
      ["Scope", "TechMorph is an academic software project. This page describes the default behaviour of the local demonstration application. A production deployment must update this policy to match its actual hosting, logging, analytics, retention, and provider configuration."],
      ["Content processing", "Text submitted for translation is sent from the backend to the configured AI provider. When enabled, uploaded knowledge-base documents are extracted, embedded, and stored in the backend data directory. Translation history is stored in your browser's local storage. Do not submit confidential, personal, regulated, or proprietary information unless the deployment owner has approved the processing arrangements."],
      ["Storage and retention", "In the supplied local version, knowledge-base metadata, embeddings, glossary entries, and translation memory are stored in local JSON files on the backend machine. Browser history remains in the browser until cleared. The application does not provide enterprise access controls or a retention scheduler by default."],
      ["Third-party providers", "Translation and embedding requests may be sent to Google Gemini. If an xAI API key is configured and an eligible Gemini failure occurs, translation requests may be sent to xAI. Those providers process requests under their own terms and privacy practices. Review their current documentation before production use."],
      ["Security and contact", "Keep API keys in backend environment variables and never expose them in frontend code. Configure HTTPS, authentication, access controls, backups, and data deletion procedures before deploying this application for other users. Replace this section with the responsible organisation's legal identity and contact details before public launch."]
    ]
  },
  terms: {
    eyebrow: "LEGAL / TERMS",
    title: "Terms and conditions",
    updated: "Last updated: 30 October 2026",
    sections: [
      ["Nature of service", "TechMorph is provided as an academic demonstration for technical translation workflows. Availability, accuracy, and continued operation are not guaranteed."],
      ["Human review required", "Machine-generated translations and automated quality checks can contain errors. A passed check is not certification of correctness. Users must independently review translations before relying on them for engineering, safety, legal, medical, regulatory, or other consequential decisions."],
      ["Permitted content", "You are responsible for ensuring that you have the rights and authority to submit source documents to the application and configured AI providers. Do not upload content that you are not authorised to process."],
      ["Third-party services and costs", "The application may use third-party AI APIs. Their availability, rate limits, pricing, model behaviour, and terms may change. The deployment owner is responsible for managing API credentials, quotas, and charges."],
      ["Production deployment", "Before public or commercial use, the operator must add a valid domain, HTTPS, identity and access management, operational monitoring, an incident process, and organisation-specific legal details. These local-demo terms do not replace legal advice or a reviewed commercial agreement."],
      ["Changes and contact", "The deployment owner may update these terms as the service changes. Replace this section with the responsible organisation's legal name, address, and contact method before public launch."]
    ]
  }
};

function PolicyPage({ type, onBack }) {
  const content = policyContent[type];
  return <main className="policy-page page-enter"><button className="text-button policy-back" onClick={onBack}>← Back to workspace</button><div className="eyebrow"><span className="eyebrow-line" /> {content.eyebrow}</div><h1>{content.title}</h1><p className="policy-updated">{content.updated}</p><div className="policy-notice"><ShieldCheck size={19} /><p>This policy is a project template. The deployment owner must review and update it before public launch.</p></div><div className="policy-sections">{content.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}</div></main>;
}

function pageFromHash() {
  const value = window.location.hash.replace(/^#\/?/, "");
  return value === "privacy-policy" ? "privacy" : value === "terms-and-conditions" ? "terms" : "app";
}

export default function App() {
  const [knowledgeBaseOpen, setKnowledgeBaseOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [page, setPage] = useState(() => pageFromHash());
  useEffect(() => { const sync = () => setPage(pageFromHash()); window.addEventListener("hashchange", sync); window.addEventListener("popstate", sync); return () => { window.removeEventListener("hashchange", sync); window.removeEventListener("popstate", sync); }; }, []);
  function navigatePage(next) { setPage(next); const hash = next === "privacy" ? "#privacy-policy" : next === "terms" ? "#terms-and-conditions" : ""; const nextUrl = `${window.location.pathname}${window.location.search}${hash}`; if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) window.history.pushState(null, "", nextUrl); }
  return <div className="app-shell">
    <Header onKnowledgeBase={() => setKnowledgeBaseOpen(true)} onGlossary={() => setGlossaryOpen(true)} page={page} onPage={navigatePage} />
    {page === "app" ? <Translator /> : <PolicyPage type={page} onBack={() => navigatePage("app")} />}
    <footer className="site-footer"><div className="footer-main"><div className="footer-brand"><span className="footer-mark">TM</span><div><strong>TechMorph</strong><p>Technical translation with traceable quality checks.</p></div></div><div className="footer-links"><button onClick={() => navigatePage("privacy")}><LockKeyhole size={14} /> Privacy policy</button><button onClick={() => navigatePage("terms")}><ShieldCheck size={14} /> Terms and conditions</button><button onClick={() => setKnowledgeBaseOpen(true)}><Database size={14} /> Knowledge base</button></div><div className="footer-note">Academic project · Review all generated translations</div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} TechMorph</span><span>English → Hindi · Marathi · Telugu</span><span className="footer-domain-note">Custom domain and production security must be configured before public launch.</span></div></footer>
    <KnowledgeBase open={knowledgeBaseOpen} onClose={() => setKnowledgeBaseOpen(false)} />
    <GlossaryPanel open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
  </div>;
}
