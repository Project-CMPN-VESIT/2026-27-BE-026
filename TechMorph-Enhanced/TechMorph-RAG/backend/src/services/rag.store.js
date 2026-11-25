import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.resolve("data");
const STORE_FILE = path.join(DATA_DIR, "rag-store.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify({
      documents: [],
      chunks: []
    }, null, 2), "utf8");
  }
}

export async function readStore() {
  await ensureStore();
  return JSON.parse(await fs.readFile(STORE_FILE, "utf8"));
}

export async function writeStore(store) {
  await ensureStore();
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function addDocument(document, chunks) {
  const store = await readStore();
  store.documents.push(document);
  store.chunks.push(...chunks);
  await writeStore(store);
  return store;
}

export async function deleteDocument(documentId) {
  const store = await readStore();
  store.documents = store.documents.filter((doc) => doc.id !== documentId);
  store.chunks = store.chunks.filter((chunk) => chunk.documentId !== documentId);
  await writeStore(store);
  return store;
}

export async function clearStore() {
  await writeStore({ documents: [], chunks: [] });
}
