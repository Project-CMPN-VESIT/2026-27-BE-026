# TechMorph

TechMorph is an academic technical translation workspace for English to Hindi, Marathi, and Telugu. It combines document-grounded retrieval, a configurable terminology glossary, protected-span handling, basic output quality checks, document translation, local translation memory, and optional Gemini-to-Grok failover.

## Implemented capabilities

- Text translation with retrieved knowledge-base context.
- Hybrid retrieval using semantic embeddings and BM25 lexical scoring, combined through Reciprocal Rank Fusion (RRF).
- Protected spans for common code blocks, inline code, URLs, identifiers, abbreviations, numbers with units, and common mathematical expressions.
- Language-specific glossary entries managed in the UI.
- Heuristic QA checks for missing protected content, numeric values, code spans, and approved terminology.
- Optional Grok fallback for selected Gemini rate-limit, quota, timeout, and temporary service failures. Grok is not called when `XAI_API_KEY` is absent.
- PDF, DOCX, TXT, and Markdown document translation, split into manageable segments.
- Persistent local translation memory keyed by source segment, target language, and glossary signature. Only segments with no flagged QA issues are reused.
- Quality report download for document translation.
- Translation history stored in browser local storage.
- Privacy policy and terms pages, plus an SVG favicon.

## Important limitations

- The QA checks are heuristic and do not prove semantic correctness. A passed result is not a guarantee of a correct translation.
- PDF text extraction does not preserve the original PDF layout, and DOCX extraction currently returns raw text. Document translation output is plain text, not a layout-faithful document reconstruction.
- Translation memory is a local JSON-file implementation for a single-instance demonstration, not a distributed production store.
- The JSON vector store is intended for a small local demo. A real deployment should use a suitable database and persistent storage strategy.
- There is no authentication or multi-tenant access control in this academic version. Do not expose it publicly with sensitive documents.
- Privacy and terms pages are templates and explicitly require the operator to review them and add the responsible organisation's identity and contact details.
- A custom domain cannot be connected by a code archive alone. Configure a domain, DNS, HTTPS, hosting, CORS, and environment variables with the chosen hosting provider before public launch.

## Requirements

- Node.js 20 or later
- A Gemini API key for embeddings and primary translation
- Optional xAI API key for fallback translations

## Setup

From the project root:

```bash
npm install
npm run install:all
```

Copy `backend/.env.example` to `backend/.env` and add your Gemini key. Add `XAI_API_KEY` only if you want the optional Grok fallback. Keep API keys out of frontend environment variables and source control.

Run the included backend unit tests:

```bash
npm run test:backend
```

Start the development servers:

```bash
npm run dev
```

Open `http://localhost:5173`. The backend defaults to `http://localhost:5000`.

## Main workflow

1. Open **Knowledge base** and upload technical reference documents.
2. Add approved language-specific source-to-target terms under **Terminology**.
3. Translate text or upload a PDF, DOCX, TXT, or Markdown document.
4. Review the provider, retrieved source chunks, protected-span count, and QA flags.
5. Download the translation and, for document jobs, the QA report.

## API routes

- `GET /api/health`
- `POST /api/translate`
- `POST /api/documents/translate` (multipart fields: `file`, `targetLanguage`)
- `GET /api/rag/documents`
- `POST /api/rag/documents`
- `DELETE /api/rag/documents/:id`
- `DELETE /api/rag/documents`
- `GET /api/glossary`
- `POST /api/glossary`
- `DELETE /api/glossary/:id`

## Before production launch

Do not deploy this demonstration publicly until you have configured a custom domain and HTTPS, reviewed the privacy and terms pages, added authentication and access control, configured data retention/deletion, reviewed third-party provider terms, and tested the app against a representative translation evaluation set.
