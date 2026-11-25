import { translateWithGemini } from "./gemini.service.js";

async function translateWithGrok(text, targetLanguage, contextChunks, glossary) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("Grok fallback is not configured. Add XAI_API_KEY to backend/.env to enable it.");
  const context = contextChunks.map((item) => `[${item.documentName}, chunk ${item.chunkIndex + 1}]\n${item.text}`).join("\n\n") || "No external context retrieved.";
  const terms = glossary.map((item) => `- ${item.sourceTerm} → ${item.targetTerm}`).join("\n") || "No approved terminology rules.";
  const prompt = `Translate the following technical English into ${targetLanguage}. Preserve meaning, formatting, formulas, code, numbers, units, and every placeholder beginning with ⟦tmhold and ending with ⟧ exactly. Follow the glossary. Use the reference context only when relevant. Return only the translation.\n\nGlossary:\n${terms}\n\nReference context:\n${context}\n\nSource:\n${text}`;
  const response = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: process.env.GROK_MODEL || "grok-4.7", input: `You are a careful technical translator.\n\n${prompt}`, temperature: 0.1 }),
    signal: AbortSignal.timeout(60000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Grok request failed with status ${response.status}.`);
  const result = (data?.output_text || data?.output?.flatMap((item) => item.content || []).filter((item) => item.type === "output_text").map((item) => item.text).join("\n"))?.trim();
  if (!result) throw new Error("Grok returned an empty response.");
  return { text: result, provider: "Grok", model: process.env.GROK_MODEL || "grok-4.7" };
}

function eligibleForFallback(error) {
  const message = `${error?.message || ""} ${error?.status || ""} ${error?.statusCode || ""} ${error?.code || ""}`.toLowerCase();
  return /429|rate.?limit|quota|503|502|temporar|overloaded|timeout|timed out|fetch failed|unavailable|internal server error/.test(message);
}

export async function routeTranslation(text, targetLanguage, contextChunks, glossary) {
  try {
    const result = await translateWithGemini(text, targetLanguage, contextChunks, glossary);
    return { ...result, fallbackUsed: false };
  } catch (error) {
    if (!eligibleForFallback(error) || !process.env.XAI_API_KEY) throw error;
    const result = await translateWithGrok(text, targetLanguage, contextChunks, glossary);
    return { ...result, fallbackUsed: true, fallbackReason: "Primary provider unavailable or rate-limited" };
  }
}
