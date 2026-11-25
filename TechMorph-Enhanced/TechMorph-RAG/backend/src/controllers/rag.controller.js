import { ingestFile } from "../services/ingestion.service.js";
import { deleteDocument, clearStore, readStore } from "../services/rag.store.js";

export async function listDocuments(_req, res) {
  const store = await readStore();
  res.json({
    success: true,
    documents: store.documents.map(({ id, name, type, chunks, characters, createdAt }) => ({
      id, name, type, chunks, characters, createdAt
    }))
  });
}

export async function uploadDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "Choose a PDF, DOCX, TXT, or MD file."
    });
  }

  try {
    const document = await ingestFile(req.file);
    return res.status(201).json({ success: true, document });
  } catch (error) {
    console.error("RAG ingestion error:", error);
    return res.status(400).json({
      success: false,
      error: error.message || "Unable to process document."
    });
  }
}

export async function removeDocument(req, res) {
  await deleteDocument(req.params.id);
  res.json({ success: true });
}

export async function removeAllDocuments(_req, res) {
  await clearStore();
  res.json({ success: true });
}
