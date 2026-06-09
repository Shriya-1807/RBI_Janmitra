import os
import re
import pickle
import json
import shutil
from pathlib import Path
from tqdm import tqdm

import pdfplumber
import chromadb
from chromadb.config import Settings
from langchain_core.documents import Document
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from rank_bm25 import BM25Okapi

# Constants matching Farmers RAG notebook
PDF_CHUNK_SIZE    = 1600
PDF_CHUNK_OVERLAP = 350
FAQ_CHUNK_TARGET  = 1400
EMBED_MODEL        = "BAAI/bge-large-en-v1.5"
COLLECTION_NAME    = "rbi_msme_collection"

BASE_DIR = Path(__file__).parent / "data" / "rbi_msme_data"
DB_DIR = Path(__file__).parent / "data" / "rbi_chroma_db_msme_fixed"

def clean_text(text: str) -> str:
    if not text: return ""
    text = re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)
    text = re.sub(r'\r\n|\r|\f', '\n', text)
    text = re.sub(r'Page\s+\d+\s+of\s+\d+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'www\.rbi\.org\.in', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Reserve Bank of India\s*[-–]\s*[A-Za-z ]+', '', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    lines = [line for line in text.split('\n') if not re.match(r'^\d{1,4}$', line.strip())]
    text = '\n'.join(lines)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return re.sub(r'[^\x09\x0A\x0D\x20-\x7E\u0900-\u097F\u20B9]', ' ', text).strip()

def add_chunk_header(text: str, source: str, category: str) -> str:
    cat_display = re.sub(r'^\d+\s+', '', category.replace('_', ' ')).title()
    return f"[Document: {source} | Category: {cat_display}]\n{text}"

SECTION_RE = re.compile(
    r'\n(?=\d+\.\d*(?:\.\d+)?\s+[A-Z]|\b(?:PART|CHAPTER|ANNEX|SCHEDULE|PARAGRAPH|SECTION|APPENDIX)\s+[A-Z0-9I]|\b[A-Z][A-Z ]{4,}:\s)',
    re.MULTILINE
)
FALLBACK_SPLITTER = RecursiveCharacterTextSplitter(chunk_size=PDF_CHUNK_SIZE, chunk_overlap=PDF_CHUNK_OVERLAP, separators=["\n\n", "\n", ". ", " "])

def load_pdf(file_path: str) -> str:
    try:
        loader = PyPDFLoader(file_path)
        return "\n\n".join(p.page_content for p in loader.load() if len(p.page_content.strip()) > 300)
    except Exception as e:
        print(f"  PyPDFLoader failed for {file_path}: {e}")
    try:
        with pdfplumber.open(file_path) as pdf:
            return "\n\n".join(page.extract_text(x_tolerance=2, y_tolerance=2) or "" for page in pdf.pages)
    except Exception as e:
        print(f"  pdfplumber failed for {file_path}: {e}")
        return ""

def chunk_pdf(text: str, filename: str, category: str) -> list[Document]:
    sections = SECTION_RE.split(text)
    docs, prev_tail = [], ""
    for section in sections:
        section = section.strip()
        if not section: continue
        combined = f"{prev_tail}\n\n{section}".strip() if prev_tail else section
        if len(combined) <= PDF_CHUNK_SIZE:
            docs.append(Document(page_content=add_chunk_header(combined, filename, category), metadata={"source": filename, "category": category, "strategy": "section_aware"}))
        else:
            sub = FALLBACK_SPLITTER.create_documents([combined])
            for d in sub:
                d.page_content = add_chunk_header(d.page_content, filename, category)
                d.metadata = {"source": filename, "category": category, "strategy": "section_fallback"}
            docs.extend(sub)
        prev_tail = section[-PDF_CHUNK_OVERLAP:] if len(section) > PDF_CHUNK_OVERLAP else section
    return docs

def chunk_faq(text: str, filename: str, category: str) -> list[Document]:
    blocks = re.split(r'\n(?=\d+\.|\bQ\d*[:.\s]|\bAns\b[:.\s])', text)
    docs, buffer = [], ""
    for block in blocks:
        block = block.strip()
        if not block: continue
        if len(buffer) + len(block) < FAQ_CHUNK_TARGET:
            buffer = f"{buffer}\n\n{block}".strip()
        else:
            if buffer: docs.append(Document(page_content=add_chunk_header(buffer, filename, category), metadata={"source": filename, "category": category, "strategy": "faq"}))
            buffer = block
    if buffer: docs.append(Document(page_content=add_chunk_header(buffer, filename, category), metadata={"source": filename, "category": category, "strategy": "faq"}))
    return docs

def build_chunks(data_dir: Path) -> list[Document]:
    all_files = [f for f in data_dir.glob("**/*") if f.is_file() and f.name not in ("download_log.json", "download_log_fixed.json")]
    all_chunks = []
    print(f"✂️ Analyzing structure tracks inside structural folders: {data_dir}...")
    for fp in tqdm(all_files, desc="Parsing Workspace Elements"):
        category, suffix = fp.parent.name, fp.suffix.lower()
        if category == "rbi_msme_data":
            # Skip base folder files
            continue
        if suffix == '.txt':
            text = clean_text(fp.read_text(encoding='utf-8', errors='ignore'))
            if len(text) >= 80: all_chunks.extend(chunk_faq(text, fp.name, category))
        elif suffix == '.pdf':
            text = clean_text(load_pdf(str(fp)))
            if text.strip(): all_chunks.extend(chunk_pdf(text, fp.name, category))
    print(f"\n🎉 Structured extraction complete. Generated {len(all_chunks)} target context chunks.")
    return all_chunks

def tokenise(text: str) -> list[str]:
    return re.findall(r'[a-z0-9][a-z0-9.%-]*', text.lower())

def main():
    # Build chunks
    chunks = build_chunks(BASE_DIR)
    if not chunks:
        print("❌ No chunks generated. Exiting.")
        return

    # Build and save BM25 sparse index
    print("🔍 Building BM25 sparse index...")
    corpus_texts = [doc.page_content for doc in chunks]
    corpus_meta  = [doc.metadata for doc in chunks]
    bm25_index   = BM25Okapi([tokenise(t) for t in corpus_texts])

    DB_DIR.mkdir(parents=True, exist_ok=True)
    bm25_save_path = DB_DIR / "bm25_index.pkl"
    with open(bm25_save_path, "wb") as f:
        pickle.dump((bm25_index, corpus_texts, corpus_meta), f)
    print(f"✅ BM25 index saved → {bm25_save_path}")

    # Build Chroma Vector DB
    print("🧬 Initializing Embeddings...")
    embedder = HuggingFaceEmbeddings(
        model_name=EMBED_MODEL,
        model_kwargs={"device": "cpu"}, # Default to CPU for building locally
        encode_kwargs={"normalize_embeddings": True}
    )

    print(f"💾 Creating Fresh Chroma Vector Store with {len(chunks)} chunks...")
    chromadb.api.ClientAPI.clear_system_cache()
    client = chromadb.PersistentClient(
        path=str(DB_DIR),
        settings=Settings(anonymized_telemetry=False, allow_reset=True)
    )

    try:
        client.delete_collection(name=COLLECTION_NAME)
    except Exception:
        pass

    client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )
    print(f"✅ Created collection: {COLLECTION_NAME}")

    vector_db = Chroma(
        client=client,
        collection_name=COLLECTION_NAME,
        embedding_function=embedder,
    )

    BATCH_SIZE = 500
    total = len(chunks)
    print("📥 Adding documents in batches...")
    for i in range(0, total, BATCH_SIZE):
        batch = chunks[i : i + BATCH_SIZE]
        vector_db.add_documents(documents=batch)
        print(f"  ✅ Batch {i//BATCH_SIZE + 1}: chunks {i+1}–{min(i+BATCH_SIZE, total)} of {total}")

    print(f"\n✅ Successfully added {vector_db._collection.count()} documents to Chroma!")

if __name__ == "__main__":
    main()
