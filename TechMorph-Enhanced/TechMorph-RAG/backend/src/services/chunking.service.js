export function cleanText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function chunkText(text, maxChars = 1800, overlap = 250) {
  const cleaned = cleanText(text);
  if (!cleaned) return [];

  const chunks = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + maxChars, cleaned.length);

    if (end < cleaned.length) {
      const paragraphBreak = cleaned.lastIndexOf("\n\n", end);
      const sentenceBreak = cleaned.lastIndexOf(". ", end);
      const candidate = Math.max(paragraphBreak, sentenceBreak);

      if (candidate > start + Math.floor(maxChars * 0.55)) {
        end = candidate + (candidate === paragraphBreak ? 2 : 1);
      }
    }

    const value = cleaned.slice(start, end).trim();
    if (value) chunks.push(value);

    if (end >= cleaned.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}
