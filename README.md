# 📄 Multi-Document AI Chat Assistant

A production-structured RAG application that lets you upload multiple PDF documents and ask natural-language questions about them. Built with **FastAPI**, **React 19**, **FAISS**, **SentenceTransformers**, and **Groq LLM**.

---

## 🏗️ Architecture

```
User uploads PDFs
      ↓
FastAPI /upload endpoint
      ↓
PyPDF2 extracts text per page
      ↓
LangChain RecursiveCharacterTextSplitter chunks text (1000 chars / 150 overlap)
      ↓
SentenceTransformers (all-MiniLM-L6-v2) generates embeddings
      ↓
FAISS IndexFlatIP stores vectors
      ↓
User asks a question
      ↓
Query embedded → top-4 chunks retrieved via cosine similarity
      ↓
Context + question sent to Groq LLM (llama3-8b-8192)
      ↓
Answer + source attribution returned to React UI
```

---

## 📁 Project Structure

```
multi-doc-chat-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py          # POST /upload, POST /chat, GET /documents
│   │   ├── core/
│   │   │   └── config.py          # Settings from .env
│   │   ├── llm/
│   │   │   └── groq_client.py     # Groq API wrapper
│   │   ├── models/
│   │   │   └── schemas.py         # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── document_service.py  # PDF extraction + chunking
│   │   │   └── vector_service.py    # FAISS index management
│   │   └── main.py                # FastAPI app + CORS
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInput.tsx      # Message input with auto-resize
│   │   │   ├── ChatWindow.tsx     # Scrollable message list
│   │   │   ├── FileUploader.tsx   # Drag-and-drop PDF uploader
│   │   │   ├── MessageBubble.tsx  # Per-message bubble + source toggle
│   │   │   └── Sidebar.tsx        # Document list + upload panel
│   │   ├── hooks/
│   │   │   └── useChat.ts         # All chat + upload state
│   │   ├── services/
│   │   │   └── api.ts             # Axios API layer
│   │   ├── types/
│   │   │   └── index.ts           # Shared TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── data/
│   ├── raw_docs/                  # Place PDFs here for batch indexing
│   └── vector_index/              # Auto-generated FAISS index files
│
├── scripts/
│   └── build_vector_index.py      # Batch index PDFs without starting server
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- A free [Groq API key](https://console.groq.com)

---

### 1 — Clone & configure

```bash
git clone <repo-url>
cd multi-doc-chat-ai

# Copy environment template
cp .env.example .env
# Open .env and set your GROQ_API_KEY
```

---

### 2 — Backend setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Ensure data directories exist
mkdir -p ../data/raw_docs ../data/vector_index

# Start the API server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

### 3 — Frontend setup

```bash
# In a new terminal, from the project root:
cd frontend

npm install
npm run dev
```

The app will open at `http://localhost:5173`.

---

### 4 — Optional: batch index PDFs

If you have PDFs ready before starting the server, drop them into `data/raw_docs/` and run:

```bash
python scripts/build_vector_index.py --docs data/raw_docs
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload one or more PDF files |
| `POST` | `/api/chat` | Ask a question (RAG pipeline) |
| `GET`  | `/api/documents` | List uploaded documents |
| `GET`  | `/` | Health check |

### POST /api/upload

```bash
curl -X POST http://localhost:8000/api/upload \
  -F "files=@document1.pdf" \
  -F "files=@document2.pdf"
```

### POST /api/chat

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the key conclusions?", "history": []}'
```

---

## ⚙️ Configuration

All settings live in `.env` (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | — | **Required.** Your Groq API key |
| `GROQ_MODEL` | `llama3-8b-8192` | Groq model to use |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | SentenceTransformers model |
| `CHUNK_SIZE` | `1000` | Characters per text chunk |
| `CHUNK_OVERLAP` | `150` | Overlap between consecutive chunks |
| `TOP_K_RESULTS` | `4` | Chunks retrieved per query |

---

## 🧠 How the RAG Pipeline Works

1. **Ingestion** — PyPDF2 reads each PDF page, prefixing text with `[filename | Page N]` for traceability.
2. **Chunking** — LangChain's `RecursiveCharacterTextSplitter` splits text at natural boundaries (paragraphs → sentences → words), with overlap to preserve cross-boundary context.
3. **Embedding** — SentenceTransformers encodes each chunk into a 384-dim vector, then L2-normalises it.
4. **Indexing** — FAISS `IndexFlatIP` stores vectors; inner product on normalised vectors equals cosine similarity.
5. **Retrieval** — The user query is embedded the same way; FAISS returns the top-k nearest chunks.
6. **Generation** — Retrieved chunks are formatted as context and sent to Groq's Llama 3 8B model along with the question and conversation history.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Backend | Python, FastAPI, Uvicorn |
| Embeddings | SentenceTransformers (`all-MiniLM-L6-v2`) |
| Vector DB | FAISS (CPU) |
| LLM | Groq API — Llama 3 8B |
| PDF parsing | PyPDF2 |
| Chunking | LangChain `RecursiveCharacterTextSplitter` |
| HTTP client | Axios (frontend), httpx (backend) |

---

## 📝 License

MIT
