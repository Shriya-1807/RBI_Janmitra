# Farmers RAG Service

Python API wrapping the `Farmers_RAG_v2` notebook pipeline (BM25 + Chroma + reranker + Gemini).

## Prerequisites

1. Run the Colab notebook once and download **`rbi_chroma_db_v3`** from Google Drive (must include `bm25_index.pkl`).
2. Copy that folder into `rag-service/data/rbi_chroma_db_v3/`.
3. Set `GEMINI_API_KEY` in `.env` or your environment.

## Setup

```bash
cd rag-service
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env   # add GEMINI_API_KEY
```

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Health check: `GET http://localhost:8000/health`

Query: `POST http://localhost:8000/api/rag_query`

```json
{ "query": "What is Kisan Credit Card?", "user_type": "farmer" }
```

## Environment

| Variable | Default |
|----------|---------|
| `GEMINI_API_KEY` | (required) |
| `RAG_DATA_DIR` | `./data/rbi_chroma_db_v3` |
| `RAG_PORT` | `8000` |
| `RAG_DEVICE` | `auto` (cuda if available) |

First startup downloads HuggingFace models (~2GB) and may take several minutes.
