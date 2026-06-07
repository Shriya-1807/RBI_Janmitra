"""
FastAPI RAG service for Farmers RAG — consumed by JanMitra api-server at POST /api/rag_query.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import CHROMA_PATH, BM25_PATH, GEMINI_API_KEY
from engine import get_engine, is_ready

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RagQueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    user_type: str = "general"


class RagSource(BaseModel):
    source: str
    category: str = "unknown"
    score: float = 0.0
    text: str | None = None


class RagQueryResponse(BaseModel):
    answer: str
    sources: list[RagSource] = []


class HealthResponse(BaseModel):
    status: str
    ready: bool
    chroma_path: str
    bm25_present: bool
    gemini_configured: bool


@asynccontextmanager
async def lifespan(app: FastAPI):
    if is_ready():
        try:
            get_engine()
            logger.info("RAG engine warmed up successfully.")
        except Exception as e:
            logger.warning("RAG engine warmup failed (will retry on first query): %s", e)
    else:
        logger.warning(
            "RAG not fully configured. Place DB at %s and set GEMINI_API_KEY.",
            CHROMA_PATH,
        )
    yield


app = FastAPI(title="Farmers RAG Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        ready=is_ready(),
        chroma_path=str(CHROMA_PATH),
        bm25_present=BM25_PATH.is_file(),
        gemini_configured=bool(GEMINI_API_KEY),
    )


@app.post("/api/rag_query", response_model=RagQueryResponse)
def rag_query(body: RagQueryRequest) -> RagQueryResponse:
    if not is_ready():
        raise HTTPException(
            status_code=503,
            detail={
                "error": "RAG service not configured",
                "chroma_path": str(CHROMA_PATH),
                "bm25_path": str(BM25_PATH),
                "hint": "Copy rbi_chroma_db_v3 from Colab into rag-service/data/ and set GEMINI_API_KEY",
            },
        )
    try:
        engine = get_engine()
        answer, results = engine.ask(body.query.strip(), user_type=body.user_type)
        sources = [
            RagSource(
                source=r["source"],
                category=r.get("category", "unknown"),
                score=r.get("score", 0.0),
            )
            for r in results
        ]
        return RagQueryResponse(answer=answer, sources=sources)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except EnvironmentError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        logger.exception("RAG query failed")
        raise HTTPException(status_code=500, detail=str(e)) from e


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("RAG_PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
