import crypto from "node:crypto";
import { PDFParse } from "pdf-parse";
import { chunkText } from "./chunking.service.js";
import { embedDocument } from "./embedding.service.js";
import { addDocument } from "./rag.store.js";
import mammoth from "mammoth";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function extractText(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File is too large. Maximum size is 10 MB.");
  }

  const name = file.originalname.toLowerCase();

  if (name.endsWith(".docx") || file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value || "";
  }

  if (file.mimetype === "application/pdf" || name.endsWith(".pdf")) {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const result = await parser.getText();
      return result.text || "";
    } finally {
      await parser.destroy();
    }
  }

  if (
    file.mimetype === "text/plain" ||
    file.mimetype === "text/markdown" ||
    name.endsWith(".txt") ||
    name.endsWith(".md")
  ) {
    return file.buffer.toString("utf8");
  }

  throw new Error("Unsupported file type. Upload PDF, DOCX, TXT, or MD.");
}

export async function ingestFile(file) {
  const text = await extractText(file);
  const chunks = chunkText(text);

  if (!chunks.length) {
    throw new Error("No readable text was found in this file.");
  }

  const documentId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const storedChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedDocument(chunks[i]);

    storedChunks.push({
      id: crypto.randomUUID(),
      documentId,
      chunkIndex: i,
      text: chunks[i],
      embedding
    });
  }

  const document = {
    id: documentId,
    name: file.originalname,
    type: file.mimetype,
    chunks: storedChunks.length,
    characters: text.length,
    createdAt
  };

  await addDocument(document, storedChunks);
  return document;
}
