import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(Path(__file__).parent / ".env")

# Directory containing Chroma DB + bm25_index.pkl (from Colab: rbi_chroma_db_v3)
DATA_DIR = Path(os.getenv("RAG_DATA_DIR", Path(__file__).parent / "data" / "rbi_chroma_db_v3"))

CHROMA_PATH = Path(os.getenv("CHROMA_DB_PATH", DATA_DIR))
BM25_PATH = Path(os.getenv("BM25_INDEX_PATH", DATA_DIR / "bm25_index.pkl"))

COLLECTION_NAME = os.getenv("CHROMA_COLLECTION", "rbi_farmers_collection_v3")

# Directory containing MSME Chroma DB + bm25_index.pkl
DATA_MSME_DIR = Path(os.getenv("RAG_DATA_MSME_DIR", Path(__file__).parent / "data" / "rbi_chroma_db_msme_fixed"))

CHROMA_MSME_PATH = Path(os.getenv("CHROMA_MSME_DB_PATH", DATA_MSME_DIR))
BM25_MSME_PATH = Path(os.getenv("BM25_MSME_INDEX_PATH", DATA_MSME_DIR / "bm25_index.pkl"))

COLLECTION_MSME_NAME = os.getenv("CHROMA_MSME_COLLECTION", "rbi_msme_collection")

EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-small-en-v1.5")
RERANK_MODEL = os.getenv("RERANK_MODEL", "cross-encoder/ms-marco-MiniLM-L-12-v2")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

BM25_TOP_K = int(os.getenv("BM25_TOP_K", "20"))
DENSE_TOP_K = int(os.getenv("DENSE_TOP_K", "20"))
FINAL_TOP_K = int(os.getenv("FINAL_TOP_K", "6"))

# cuda | cpu | auto
DEVICE = os.getenv("RAG_DEVICE", "auto")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

GROK_API_KEY = os.getenv("GROK_API_KEY", os.getenv("XAI_API_KEY", ""))
GROK_MODEL = os.getenv("GROK_MODEL", "grok-beta")
GROK_BASE_URL = os.getenv("GROK_BASE_URL", "https://api.x.ai/v1")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")

HF_TOKEN = os.getenv("HF_TOKEN", "")

USER_TYPE_CONTEXT: dict[str, str] = {
    "farmer": "The user is a farmer. Focus on Kisan Credit Card, crop loans, agri insurance, rural banking, and priority sector lending.",
    "student": "The user is a student. Focus on education loans, student banking, and financial literacy relevant to rural youth.",
    "msme": "The user is an MSME owner. Focus on MUDRA, rural enterprise credit, and small business lending.",
    "salaried": "The user is a salaried employee in a rural/semi-urban context. Focus on personal loans, savings, and banking access.",
    "general": "The user is a general member of the public. Provide clear, practical explanations.",
}
