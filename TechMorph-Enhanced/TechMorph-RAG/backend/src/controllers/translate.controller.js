import { routeTranslation } from "../services/provider-router.service.js";
import { retrieveRelevantChunks } from "../services/retrieval.service.js";
import { protectSpans, restoreSpans } from "../services/protected-spans.service.js";
import { validateTranslation } from "../services/quality.service.js";
import { listGlossary, relevantGlossaryEntries } from "../services/glossary.store.js";

const SUPPORTED_LANGUAGES = new Set(["Hindi", "Marathi", "Telugu"]);
const MAX_CHARS = 12000;

export async function translate(req, res) {
  const { text, targetLanguage } = req.body ?? {};
  if (typeof text !== "string" || !text.trim()) return res.status(400).json({ success: false, error: "Please enter technical English content." });
  if (text.length > MAX_CHARS) return res.status(413).json({ success: false, error: `Input is too long. Maximum length is ${MAX_CHARS} characters.` });
  if (!SUPPORTED_LANGUAGES.has(targetLanguage)) return res.status(400).json({ success: false, error: "Unsupported target language." });

  try {
    const source = text.trim();
    const protectedContent = protectSpans(source);
    const [retrievedContext, allGlossary] = await Promise.all([retrieveRelevantChunks(source, 5), listGlossary()]);
    const glossary = relevantGlossaryEntries(source, allGlossary.filter((entry) => entry.language === targetLanguage));
    const routed = await routeTranslation(protectedContent.text, targetLanguage, retrievedContext, glossary);
    const translation = restoreSpans(routed.text, protectedContent.spans);
    const qa = validateTranslation(source, translation, glossary, protectedContent.spans);
    return res.json({
      success: true, translation, targetLanguage,
      provider: { name: routed.provider, model: routed.model, fallbackUsed: routed.fallbackUsed, fallbackReason: routed.fallbackReason || null },
      qa,
      pipeline: { protectedSpans: protectedContent.spans.length, retrievalMethod: "hybrid_dense_bm25_rrf", glossaryTermsApplied: glossary.length },
      rag: { enabled: true, sourcesRetrieved: retrievedContext.length, sources: retrievedContext.map((item) => ({ documentName: item.documentName, score: item.score, semanticScore: item.semanticScore, lexicalScore: item.lexicalScore, chunkIndex: item.chunkIndex })) }
    });
  } catch (error) {
    console.error("Translation pipeline error:", error);
    const message = String(error.message || "");
    const safeMessage = /API key|quota|rate|billing|model|permission|GEMINI|Grok|temporarily|timeout/i.test(message) ? message : "Unable to generate translation. Check the server configuration and try again.";
    return res.status(502).json({ success: false, error: safeMessage });
  }
}
