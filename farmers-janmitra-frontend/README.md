# Farmers JanMitra Frontend

Copy of the Epoch Edge hackathon UI wired to the **Farmers RAG** notebook (`Farmers_RAG_v2`) instead of scraped monetary-policy JSON.

- **Chat** → Python `rag-service` on port **8000** (hybrid BM25 + Chroma + Gemini)
- **Dashboard / repo tools** → unchanged (still use PostgreSQL policy seed if present)
- **Multilingual + voice** → unchanged (Sarvam / NLLB via api-server)

## Prerequisites

1. PostgreSQL with schema from `@workspace/db` (`pnpm --filter @workspace/db run push`)
2. Farmers RAG index in `../rag-service/data/rbi_chroma_db_v3/` (from Colab)
3. `GEMINI_API_KEY` for rag-service
4. Translation keys: `SARVAM_API_KEY` and/or `HF_TOKEN` in api-server `.env`

## Run (3 terminals)

### 1. RAG service

```bash
cd ../rag-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
set GEMINI_API_KEY=your_key
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. API server

```bash
cd farmers-janmitra-frontend
pnpm install
cd artifacts/api-server
copy .env.example .env   # edit DATABASE_URL, keys
pnpm run dev
```

### 3. React UI

```bash
cd farmers-janmitra-frontend/artifacts/janmitra
pnpm install
pnpm run dev
```

Open the Vite URL (default port **3000**). API proxy targets **8080**.

## Environment

| Service | Variable | Default |
|---------|----------|---------|
| api-server | `RAG_SERVICE_URL` | `http://localhost:8000` |
| api-server | `PORT` | `8080` |
| janmitra (Vite) | `PORT` | `3000` |

## Health checks

- RAG: `GET http://localhost:8000/health`
- API: chat via UI or `POST http://localhost:8080/api/chat/message`
