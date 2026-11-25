const MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2-preview";
const DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS || 768);

async function embed(text, taskType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }]
        },
        taskType,
        outputDimensionality: DIMENSIONS
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || "Embedding request failed.";
    throw new Error(message);
  }

  const values = data?.embedding?.values;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Embedding response was empty.");
  }

  return values;
}

export function embedDocument(text) {
  return embed(text, "RETRIEVAL_DOCUMENT");
}

export function embedQuery(text) {
  return embed(text, "RETRIEVAL_QUERY");
}

export function cosineSimilarity(a, b) {
  if (!a.length || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
