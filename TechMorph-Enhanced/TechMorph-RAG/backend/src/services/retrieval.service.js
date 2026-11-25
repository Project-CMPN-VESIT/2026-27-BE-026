import { embedQuery, cosineSimilarity } from "./embedding.service.js";
import { readStore } from "./rag.store.js";

function tokenize(text) { return (String(text).toLowerCase().match(/[\p{L}\p{N}_+-]+/gu) || []).filter((token) => token.length > 1); }

function bm25Scores(query, chunks) {
  const qTerms = [...new Set(tokenize(query))];
  const docs = chunks.map((chunk) => tokenize(chunk.text));
  const avgLength = docs.reduce((sum, doc) => sum + doc.length, 0) / Math.max(docs.length, 1);
  const df = new Map();
  for (const term of qTerms) df.set(term, docs.reduce((count, doc) => count + (doc.includes(term) ? 1 : 0), 0));
  return docs.map((tokens) => {
    const counts = new Map();
    tokens.forEach((token) => counts.set(token, (counts.get(token) || 0) + 1));
    let score = 0;
    for (const term of qTerms) {
      const tf = counts.get(term) || 0;
      if (!tf) continue;
      const idf = Math.log(1 + (chunks.length - (df.get(term) || 0) + 0.5) / ((df.get(term) || 0) + 0.5));
      score += idf * (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * tokens.length / Math.max(avgLength, 1)));
    }
    return score;
  });
}

export async function retrieveRelevantChunks(query, topK = 4) {
  const store = await readStore();
  if (!store.chunks.length) return [];
  const bm25 = bm25Scores(query, store.chunks);
  let vectorScores = store.chunks.map(() => 0);
  try {
    const queryEmbedding = await embedQuery(query);
    vectorScores = store.chunks.map((chunk) => cosineSimilarity(queryEmbedding, chunk.embedding || []));
  } catch (error) {
    if (!store.chunks.every((chunk) => Array.isArray(chunk.embedding))) throw error;
    // Existing stored vectors can still be used only when query embedding succeeds; lexical search remains a safe fallback.
    console.warn("Semantic retrieval unavailable; using lexical retrieval:", error.message);
  }
  const rank = (values) => [...values.keys()].sort((a, b) => values[b] - values[a]);
  const denseRank = rank(vectorScores);
  const lexicalRank = rank(bm25);
  const densePosition = new Map(denseRank.map((index, pos) => [index, pos + 1]));
  const lexicalPosition = new Map(lexicalRank.map((index, pos) => [index, pos + 1]));
  return store.chunks.map((chunk, index) => ({
    ...chunk,
    score: 1 / (60 + (densePosition.get(index) || store.chunks.length + 1)) + 1 / (60 + (lexicalPosition.get(index) || store.chunks.length + 1)),
    semanticScore: Number((vectorScores[index] || 0).toFixed(4)),
    lexicalScore: Number((bm25[index] || 0).toFixed(4))
  })).filter((item) => item.semanticScore > 0 || item.lexicalScore > 0).sort((a, b) => b.score - a.score).slice(0, topK).map(({ id, documentId, chunkIndex, text, score, semanticScore, lexicalScore }) => {
    const document = store.documents.find((doc) => doc.id === documentId);
    return { id, documentId, documentName: document?.name || "Unknown document", chunkIndex, text, score: Number(score.toFixed(5)), semanticScore, lexicalScore };
  });
}
