# RBI Farmers RAG + JanMitra UI

This workspace connects the **Farmers_RAG_v2** Colab notebook to the **JanMitra** multilingual frontend.

## Layout

| Path | Purpose |
|------|---------|
| `Farmers_RAG_v2 (4).ipynb` | Source RAG pipeline (build index in Colab) |
| `rag-service/` | FastAPI service exposing `ask()` / `retrieve()` |
| `farmers-janmitra-frontend/` | UI copy (chat → RAG; dashboard unchanged) |
| `Epoch_Edge_BBHackathon/` | Original hackathon project (unchanged) |

## One-time: export index from Colab

After the notebook builds the DB, download **`rbi_chroma_db_v3`** from Google Drive (must include `bm25_index.pkl`) into:

```
rag-service/data/rbi_chroma_db_v3/
```

## Quick start

See [rag-service/README.md](rag-service/README.md) and [farmers-janmitra-frontend/README.md](farmers-janmitra-frontend/README.md).

**Order:** RAG (8000) → API (8080) → Vite UI (3000).

## Chat data flow

```
User (React) → POST /api/chat/message → translate to English
  → POST /api/rag_query (Python) → Gemini + farmer RBI docs
  → translate back → save chat history → UI + TTS
```
