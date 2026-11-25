const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function parseResponse(response) {
  let data;
  try { data = await response.json(); } catch { throw new Error("The server returned an invalid response."); }
  if (!response.ok || !data.success) throw new Error(data.error || "Request failed.");
  return data;
}

export async function translateText(text, targetLanguage) {
  const response = await fetch(`${API_BASE_URL}/api/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, targetLanguage }) });
  return parseResponse(response);
}
export async function translateDocument(file, targetLanguage) {
  const form = new FormData(); form.append("file", file); form.append("targetLanguage", targetLanguage);
  const response = await fetch(`${API_BASE_URL}/api/documents/translate`, { method: "POST", body: form });
  return parseResponse(response);
}
export async function getDocuments() { return parseResponse(await fetch(`${API_BASE_URL}/api/rag/documents`)); }
export async function uploadDocument(file) {
  const form = new FormData(); form.append("file", file);
  return parseResponse(await fetch(`${API_BASE_URL}/api/rag/documents`, { method: "POST", body: form }));
}
export async function deleteDocument(id) { return parseResponse(await fetch(`${API_BASE_URL}/api/rag/documents/${id}`, { method: "DELETE" })); }
export async function clearDocuments() { return parseResponse(await fetch(`${API_BASE_URL}/api/rag/documents`, { method: "DELETE" })); }
export async function getGlossary() { return parseResponse(await fetch(`${API_BASE_URL}/api/glossary`)); }
export async function createGlossaryEntry(entry) {
  return parseResponse(await fetch(`${API_BASE_URL}/api/glossary`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) }));
}
export async function deleteGlossaryEntry(id) { return parseResponse(await fetch(`${API_BASE_URL}/api/glossary/${id}`, { method: "DELETE" })); }
