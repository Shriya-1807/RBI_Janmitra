"""
Hybrid RAG engine extracted from Farmers_RAG_v2 notebook.
Loads Chroma + BM25 + cross-encoder reranker, answers via Gemini.
"""

from __future__ import annotations

import logging
import os
import pickle
import re
import time
from typing import Any

import chromadb
from chromadb.config import Settings
from google import genai
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from sentence_transformers import CrossEncoder

from config import (
    BM25_PATH,
    BM25_TOP_K,
    CHROMA_PATH,
    COLLECTION_NAME,
    DENSE_TOP_K,
    DEVICE,
    EMBED_MODEL,
    FINAL_TOP_K,
    GEMINI_API_KEY,
    GEMINI_MODEL,
    RERANK_MODEL,
    USER_TYPE_CONTEXT,
)

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert regulatory assistant for Indian banking, agricultural credit schemes, and RBI directions.
CRITICAL OPERATIONAL RULES:
1. Ground your extraction ONLY on the Context Blocks structured below. Avoid tracking outside general knowledge base structures.
2. Provide explicit reference citations using inline markers stating [Source: <filename>].
3. If the context does not hold explicit answers, state clearly: "I couldn't find this in the available documents. Please check directly with your bank or the RBI website."
4. Be accurate with data: preserve explicit percentages, timelines, and multi-tier transaction cap limits.
5. Format your output cleanly in broken down, actionable bullet-points. Do not assume or guess."""

_engine: "RagEngine | None" = None


def _resolve_device() -> str:
    if DEVICE in ("cuda", "cpu"):
        return DEVICE
    try:
        import torch

        return "cuda" if torch.cuda.is_available() else "cpu"
    except ImportError:
        return "cpu"


def tokenise(text: str) -> list[str]:
    return re.findall(r"[a-z0-9][a-z0-9.%-]*", text.lower())


def rrf(rankings: list[list[int]], k: int = 60) -> list[int]:
    scores: dict[int, float] = {}
    for r_list in rankings:
        for rank, idx in enumerate(r_list):
            scores[idx] = scores.get(idx, 0.0) + 1.0 / (k + rank + 1)
    return sorted(scores, key=lambda x: -scores[x])


class RagEngine:
    def __init__(self) -> None:
        if not CHROMA_PATH.is_dir():
            raise FileNotFoundError(
                f"Chroma database not found at {CHROMA_PATH}. "
                "Copy rbi_chroma_db_v3 from Google Drive (Colab notebook output) into rag-service/data/rbi_chroma_db_v3/"
            )
        if not BM25_PATH.is_file():
            raise FileNotFoundError(
                f"BM25 index not found at {BM25_PATH}. "
                "Ensure bm25_index.pkl is inside the same folder as the Chroma DB."
            )
        if not GEMINI_API_KEY:
            raise EnvironmentError("GEMINI_API_KEY environment variable is required.")

        self._device = _resolve_device()
        logger.info("RAG device: %s", self._device)

        chromadb.api.ClientAPI.clear_system_cache()

        self._embedder = HuggingFaceEmbeddings(
            model_name=EMBED_MODEL,
            model_kwargs={"device": self._device},
            encode_kwargs={"normalize_embeddings": True},
        )

        client = chromadb.PersistentClient(
            path=str(CHROMA_PATH),
            settings=Settings(anonymized_telemetry=False, allow_reset=True),
        )
        self._vector_db = Chroma(
            client=client,
            collection_name=COLLECTION_NAME,
            embedding_function=self._embedder,
        )

        with open(BM25_PATH, "rb") as f:
            self._bm25_index, self._corpus_texts, self._corpus_meta = pickle.load(f)

        logger.info("Loaded %d corpus chunks", len(self._corpus_texts))

        self._reranker = CrossEncoder(
            RERANK_MODEL, max_length=512, device=self._device
        )
        self._gemini = genai.Client(
            api_key=GEMINI_API_KEY,
            http_options={"api_version": "v1beta"},
        )

    def retrieve(self, query: str, verbose: bool = False) -> list[dict[str, Any]]:
        t0 = time.time()

        bm25_scores = self._bm25_index.get_scores(tokenise(query))
        bm25_ranked = sorted(
            range(len(self._corpus_texts)), key=lambda i: -bm25_scores[i]
        )[:BM25_TOP_K]

        if verbose:
            logger.info("BM25 search: %.2fs", time.time() - t0)

        dense_ranked: list[int] = []
        for dr in self._vector_db.similarity_search(query, k=DENSE_TOP_K):
            try:
                dense_ranked.append(self._corpus_texts.index(dr.page_content))
            except ValueError:
                pass

        candidates = rrf([bm25_ranked, dense_ranked])[:30]
        rerank_scores = self._reranker.predict(
            [(query, self._corpus_texts[i]) for i in candidates]
        )
        top = sorted(zip(candidates, rerank_scores), key=lambda x: -x[1])[:FINAL_TOP_K]

        return [
            {
                "text": self._corpus_texts[idx],
                "source": self._corpus_meta[idx].get("source", "unknown"),
                "category": self._corpus_meta[idx].get("category", "unknown"),
                "score": round(float(scr), 4),
            }
            for idx, scr in top
        ]

    def ask(self, query: str, user_type: str = "general", verbose: bool = False) -> tuple[str, list[dict[str, Any]]]:
        profile = USER_TYPE_CONTEXT.get(user_type, USER_TYPE_CONTEXT["general"])
        results = self.retrieve(query, verbose=verbose)

        if not results:
            msg = (
                "I couldn't find this in the available documents. "
                "Please check directly with your bank or the RBI website."
            )
            return msg, []

        context = "\n\n".join(
            [
                f"--- Context Block {i + 1} [Source: {r['source']}] ---\n{r['text']}"
                for i, r in enumerate(results)
            ]
        )
        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"USER PROFILE: {profile}\n\n"
            f"=== CONTEXT BLOCKS ===\n{context}\n=== END OF CONTEXT ===\n\n"
            f"QUESTION: {query}\nANSWER:"
        )

        response = (
            self._gemini.models.generate_content(model=GEMINI_MODEL, contents=prompt)
            .text.strip()
        )
        return response, results


def get_engine() -> RagEngine:
    global _engine
    if _engine is None:
        _engine = RagEngine()
    return _engine


def is_ready() -> bool:
    return CHROMA_PATH.is_dir() and BM25_PATH.is_file() and bool(GEMINI_API_KEY)
