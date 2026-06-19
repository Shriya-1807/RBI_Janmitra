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
from pathlib import Path
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
    CHROMA_MSME_PATH,
    BM25_MSME_PATH,
    COLLECTION_MSME_NAME,
    GROK_API_KEY,
    GROK_MODEL,
    GROK_BASE_URL,
    GROQ_API_KEY,
    GROQ_MODEL,
    GROQ_BASE_URL,
    HF_TOKEN,
)
import requests
import urllib.request
import urllib.error
import json

class HFInferenceEmbeddings:
    def __init__(self, model_name: str, api_key: str = None):
        self.model_name = model_name
        self.api_key = api_key
        self._cached_ip = None

    def _resolve_ip(self) -> str | None:
        if self._cached_ip:
            return self._cached_ip
            
        hostname = "api-inference.huggingface.co"
        # Try Cloudflare DoH by raw IP
        try:
            url = f"https://1.1.1.1/dns-query?name={hostname}&type=A"
            req = urllib.request.Request(url, headers={"Accept": "application/dns-json"})
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode("utf-8"))
                for answer in data.get("Answer", []):
                    if answer.get("type") == 1: # A record
                        self._cached_ip = answer.get("data")
                        logger.info("DNS-over-HTTPS resolved %s to %s", hostname, self._cached_ip)
                        return self._cached_ip
        except Exception as e:
            logger.warning("Cloudflare DoH lookup failed: %s", e)

        # Try Google DoH by raw IP
        try:
            url = f"https://8.8.8.8/resolve?name={hostname}&type=A"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode("utf-8"))
                for answer in data.get("Answer", []):
                    if answer.get("type") == 1: # A record
                        self._cached_ip = answer.get("data")
                        logger.info("Google DoH resolved %s to %s", hostname, self._cached_ip)
                        return self._cached_ip
        except Exception as e:
            logger.warning("Google DoH lookup failed: %s", e)

        return None

    def _call_api(self, payload: dict) -> Any:
        hostname = "api-inference.huggingface.co"
        ip = self._resolve_ip()
        
        # If we got the IP, use it in the URL to bypass container DNS.
        # Otherwise, fall back to the hostname and hope local DNS works.
        target_host = ip if ip else hostname
        url = f"https://{target_host}/models/{self.model_name}"
        
        headers = {
            "Content-Type": "application/json",
            "Host": hostname  # Crucial: pass Host header so Cloudflare routes correctly
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        import ssl
        # Create unverified context in case we connect to raw IP and SSL hostname check fails
        ctx = ssl._create_unverified_context()
        
        req = urllib.request.Request(
            url, 
            data=json.dumps(payload).encode("utf-8"), 
            headers=headers,
            method="POST"
        )
        
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=15, context=ctx) as response:
                    return json.loads(response.read().decode("utf-8"))
            except Exception as e:
                if attempt == 2:
                    raise e
                time.sleep(1.5)

    def embed_query(self, text: str) -> list[float]:
        res = self._call_api({"inputs": text})
        if isinstance(res, list) and len(res) > 0 and isinstance(res[0], list):
            # Sometimes HF returns a 2D list for a single string input
            return res[0]
        return res

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._call_api({"inputs": texts})

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert regulatory assistant for Indian banking, agricultural credit schemes, and RBI directions.
CRITICAL OPERATIONAL RULES:
1. Ground your extraction ONLY on the Context Blocks structured below. Avoid tracking outside general knowledge base structures.
2. Provide explicit reference citations using inline markers stating [Source: <filename>].
3. If the context does not hold explicit answers, state clearly: "I couldn't find this in the available documents. Please check directly with your bank or the RBI website."
4. Be accurate with data: preserve explicit percentages, timelines, and multi-tier transaction cap limits.
5. Format your output cleanly. Start each list item on a new line, ensuring they are separated by actual newlines. For list items, do NOT use asterisks (*) or raw markdown formatting. Begin each list item line with a clean dash (-) or a unicode bullet (•), and do not use bold markdown tags on text headers if it clutters the output. Ensure every point is on a separate line. """

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
    def __init__(
        self,
        chroma_path: Path = CHROMA_PATH,
        bm25_path: Path = BM25_PATH,
        collection_name: str = COLLECTION_NAME,
    ) -> None:
        if not chroma_path.is_dir():
            raise FileNotFoundError(
                f"Chroma database not found at {chroma_path}. "
                "Ensure the Chroma DB folder has been copied to the data/ directory."
            )
        if not bm25_path.is_file():
            raise FileNotFoundError(
                f"BM25 index not found at {bm25_path}. "
                "Ensure bm25_index.pkl is inside the database folder."
            )
        if not GEMINI_API_KEY and not GROQ_API_KEY and not GROK_API_KEY:
            raise EnvironmentError("At least one LLM API key (GEMINI_API_KEY, GROQ_API_KEY, or GROK_API_KEY) must be configured.")

        self._device = _resolve_device()
        logger.info("RAG device for %s: %s", collection_name, self._device)

        chromadb.api.ClientAPI.clear_system_cache()

        self._embedder = HFInferenceEmbeddings(
            model_name=EMBED_MODEL,
            api_key=HF_TOKEN,
        )

        client = chromadb.PersistentClient(
            path=str(chroma_path),
            settings=Settings(anonymized_telemetry=False, allow_reset=True),
        )
        self._vector_db = Chroma(
            client=client,
            collection_name=collection_name,
            embedding_function=self._embedder,
        )

        with open(bm25_path, "rb") as f:
            self._bm25_index, self._corpus_texts, self._corpus_meta = pickle.load(f)

        logger.info("Loaded %d corpus chunks for %s", len(self._corpus_texts), collection_name)

        self._reranker = CrossEncoder(
            RERANK_MODEL, max_length=512, device=self._device
        )
        if GEMINI_API_KEY:
            self._gemini = genai.Client(
                api_key=GEMINI_API_KEY,
                http_options={"api_version": "v1beta"},
            )
        else:
            self._gemini = None

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

        # If GROQ_API_KEY is configured, route via Groq API
        if GROQ_API_KEY:
            try:
                import requests
                headers = {
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": f"USER PROFILE: {profile}\n\n=== CONTEXT BLOCKS ===\n{context}\n=== END OF CONTEXT ===\n\nQUESTION: {query}"}
                    ],
                    "temperature": 0.0
                }
                res = requests.post(f"{GROQ_BASE_URL}/chat/completions", headers=headers, json=payload, timeout=90)
                res.raise_for_status()
                response = res.json()["choices"][0]["message"]["content"].strip()
                return response, results
            except Exception as e:
                resp_text = res.text if 'res' in locals() else ''
                logger.error("Groq API call failed: %s - Response: %s", e, resp_text)
                raise RuntimeError(f"Groq API call failed: {e}. Detail: {resp_text}") from e

        # If GROK_API_KEY is configured and this is an MSME request, route via x.ai API
        if user_type == "msme" and GROK_API_KEY:
            try:
                import requests
                headers = {
                    "Authorization": f"Bearer {GROK_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": GROK_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": f"USER PROFILE: {profile}\n\n=== CONTEXT BLOCKS ===\n{context}\n=== END OF CONTEXT ===\n\nQUESTION: {query}"}
                    ],
                    "temperature": 0.0
                }
                res = requests.post(f"{GROK_BASE_URL}/chat/completions", headers=headers, json=payload, timeout=90)
                res.raise_for_status()
                response = res.json()["choices"][0]["message"]["content"].strip()
                return response, results
            except Exception as e:
                logger.error("Grok API call failed: %s", e)
                raise RuntimeError(f"Grok API call failed: {e}") from e

        if not self._gemini:
            raise EnvironmentError("No active LLM API provider responded. Ensure your API keys (e.g. GROQ_API_KEY) are valid and that the provider services are online.")

        response = (
            self._gemini.models.generate_content(model=GEMINI_MODEL, contents=prompt)
            .text.strip()
        )
        return response, results

_farmers_engine: RagEngine | None = None
_msme_engine: RagEngine | None = None


def get_engine(user_type: str = "general") -> RagEngine:
    global _farmers_engine, _msme_engine
    if user_type == "msme":
        if _msme_engine is None:
            _msme_engine = RagEngine(
                chroma_path=CHROMA_MSME_PATH,
                bm25_path=BM25_MSME_PATH,
                collection_name=COLLECTION_MSME_NAME,
            )
        return _msme_engine
    else:
        if _farmers_engine is None:
            _farmers_engine = RagEngine(
                chroma_path=CHROMA_PATH,
                bm25_path=BM25_PATH,
                collection_name=COLLECTION_NAME,
            )
        return _farmers_engine


def is_ready(user_type: str = "general") -> bool:
    has_api_key = bool(GEMINI_API_KEY) or bool(GROK_API_KEY) or bool(GROQ_API_KEY)
    if user_type == "msme":
        return CHROMA_MSME_PATH.is_dir() and BM25_MSME_PATH.is_file() and has_api_key
    return CHROMA_PATH.is_dir() and BM25_PATH.is_file() and (bool(GEMINI_API_KEY) or bool(GROQ_API_KEY))
