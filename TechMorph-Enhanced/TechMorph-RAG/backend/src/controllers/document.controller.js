import { extractText } from "../services/ingestion.service.js";
import { retrieveRelevantChunks } from "../services/retrieval.service.js";
import { listGlossary, relevantGlossaryEntries } from "../services/glossary.store.js";
import { protectSpans, restoreSpans } from "../services/protected-spans.service.js";
import { validateTranslation } from "../services/quality.service.js";
import { routeTranslation } from "../services/provider-router.service.js";
import { findTranslation, saveTranslation } from "../services/translation-memory.store.js";

const LANGUAGES = new Set(["Hindi", "Marathi", "Telugu"]);
function segmentText(text, maxChars = 2400) {
  const paragraphs = text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const segments = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      if (current) { segments.push(current); current = ""; }
      let rest = paragraph;
      while (rest.length > maxChars) {
        let cut = rest.lastIndexOf(". ", maxChars);
        if (cut < Math.floor(maxChars * 0.55)) cut = maxChars;
        else cut += 1;
        segments.push(rest.slice(0, cut).trim()); rest = rest.slice(cut).trim();
      }
      if (rest) current = rest;
      continue;
    }
    if (current && current.length + paragraph.length + 2 > maxChars) { segments.push(current); current = paragraph; }
    else current = current ? `${current}\n\n${paragraph}` : paragraph;
  }
  if (current) segments.push(current);
  return segments;
}

export async function translateDocument(req, res) {
  const language = req.body?.targetLanguage;
  if (!LANGUAGES.has(language)) return res.status(400).json({ success: false, error: "Choose Hindi, Marathi, or Telugu." });
  if (!req.file) return res.status(400).json({ success: false, error: "Choose a PDF, DOCX, TXT, or Markdown document." });
  try {
    const source = await extractText(req.file);
    if (!source.trim()) return res.status(400).json({ success: false, error: "No readable text was found in this document." });
    if (source.length > 120000) return res.status(413).json({ success: false, error: "Document exceeds the 120,000 character translation limit. Split it into smaller files." });
    const segments = segmentText(source);
    const allGlossary = (await listGlossary()).filter((entry) => entry.language === language);
    const translatedSegments = [];
    const qaIssues = [];
    let reusedSegments = 0;
    const providersUsed = new Set();
    let fallbackCount = 0;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const glossary = relevantGlossaryEntries(segment, allGlossary);
      const cached = await findTranslation(segment, language, glossary);
      if (cached && cached.qaStatus === "checks_passed") {
        translatedSegments.push(cached.translation); reusedSegments++; continue;
      }
      const protectedContent = protectSpans(segment);
      const context = await retrieveRelevantChunks(segment, 4);
      const result = await routeTranslation(protectedContent.text, language, context, glossary);
      const translated = restoreSpans(result.text, protectedContent.spans);
      const qa = validateTranslation(segment, translated, glossary, protectedContent.spans);
      if (qa.issues.length) qaIssues.push({ segment: i + 1, issues: qa.issues });
      await saveTranslation(segment, language, translated, qa, glossary);
      translatedSegments.push(translated);
      providersUsed.add(result.provider);
      if (result.fallbackUsed) fallbackCount++;
    }
    const output = translatedSegments.join("\n\n");
    const report = {
      sourceFile: req.file.originalname,
      targetLanguage: language,
      sourceCharacters: source.length,
      segmentCount: segments.length,
      reusedSegments,
      translatedSegments: segments.length - reusedSegments,
      providerUsed: [...providersUsed].join(", ") || (reusedSegments ? "Translation memory" : "Gemini"),
      fallbackCount,
      qaStatus: qaIssues.length ? "review_required" : "checks_passed",
      issueCount: qaIssues.reduce((sum, item) => sum + item.issues.length, 0),
      issues: qaIssues
    };
    return res.json({ success: true, translation: output, report });
  } catch (error) {
    console.error("Document translation error:", error);
    return res.status(502).json({ success: false, error: error.message || "Unable to translate document." });
  }
}
