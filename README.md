# RBI JanMitra - Multilingual AI Policy & Financial Credit Assistant

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Link-brightgreen?style=for-the-badge)](ADD_YOUR_DEPLOYED_LINK_HERE)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Shriya-1807/RBI_Janmitra?style=for-the-badge)](https://github.com/Shriya-1807/RBI_Janmitra/stargazers)

RBI JanMitra is a professional-grade, multi-service AI-powered conversational assistant designed to help Indian farmers, MSME owners, and rural citizens navigate complex **Reserve Bank of India (RBI) regulatory guidelines**, priority sector lending schemes, and government financial policies (e.g., Kisan Credit Card, MUDRA loans). 

By combining a **high-precision Hybrid RAG pipeline** with **multilingual processing** and **interactive speech-to-text / text-to-speech**, JanMitra breaks down legal and bureaucratic jargon into clear, actionable advice in native Indian languages.

---

## 📸 Application Preview

<img src="assets/homepage.png" alt="JanMitra Landing Page" width="100%"/>

<br/>

<div align="center">
  <img src="assets/chatbot_english.png" alt="English RAG Chatbot" width="49%" />
  <img src="assets/chatbot_hindi.png" alt="Hindi RAG Chatbot" width="49%" />
</div>

---

## 🚀 Key Features

* **High-Precision Hybrid RAG Engine**: Combines sparse retrievers (BM25) with dense retrievers (ChromaDB vector store) and a Cross-Encoder Reranker (`ms-marco-MiniLM-L-12-v2`) to achieve extremely reliable policy extraction.
* **Role-Based Context Adaptation**: Dynamically adjusts prompts depending on user profiles (Farmers, MSMEs, Students, General Public) to tailor response complexity.
* **Ultra-Fast LLM Inference**: Fully integrated with Groq Cloud APIs using high-throughput models like `llama-3.3-70b-versatile` for sub-second, grounded policy answers.
* **Seamless Multilingual Translation**: Localizes queries and responses using a fallback cascade of Sarvam AI Mayura translation engines, NLLB-200 translation models, and Google Translate APIs.
* **Conversational Voice Support**: Features hands-free dictation and text-to-speech voice output utilizing AI4Bharat Indic-Parler TTS (for Odia, Assamese) and Sarvam Bulbul TTS for other major Indian languages.
* **Transactional Banking Dashboard**: Features repo-rate charts, automated interest-calculator tools, policy compliance sandboxes, and credit evaluation calculators.

---

## 🏗 System Architecture

The platform operates as a distributed system of three dedicated, decoupled services:

```mermaid
graph TD
    A[Vite React Client - Port 3000] -->|HTTP / JSON| B[Express API Orchestrator - Port 8080]
    B -->|Drizzle ORM| C[(PostgreSQL Database)]
    B -->|Indic Translation| D{Translation Cascade}
    D -->|Indic TTS / Translation| E[Sarvam AI / NLLB / AI4Bharat]
    B -->|Query Forwarding| F[FastAPI RAG Service - Port 8000]
    F -->|Hybrid Search| G[BM25 + Chroma DB + Cross-Encoder Reranker]
    F -->|LLM Inference| H[Groq Cloud API - Llama 3.3 70B]
```

---

## 📂 Directory Structure

```text
RBI_Janmitra/
├── Farmers_RAG_v2 (4).ipynb         # Jupyter Notebook used for initial RAG development
├── README.md                        # Project root documentation
├── farmers-janmitra-frontend/       # Main Monorepo for Frontend and Node Orchestrator
│   ├── artifacts/
│   │   ├── api-server/              # Node.js Express Backend & Translation Pipeline
│   │   │   ├── src/                 # TypeScript source files (Routes, Database, Seeding)
│   │   │   └── package.json
│   │   └── janmitra/                # React Vite Client (UI Dashboard and Chatbot)
│   │       ├── src/                 # React components, Page layouts, Custom Hooks
│   │       └── package.json
│   ├── lib/
│   │   ├── db/                      # Database Workspace (Drizzle schema, connections)
│   │   └── integrations/            # Connectors (OpenAI, translation, local modules)
│   ├── package.json                 # PNPM Workspace Configuration
│   └── pnpm-workspace.yaml
└── rag-service/                     # Python-based FastAPI RAG Service
    ├── data/
    │   ├── rbi_chroma_db_v3/        # Vector Database for Farmers RAG
    │   └── rbi_chroma_db_msme_fixed/# Vector Database for MSME RAG
    ├── config.py                    # RAG Hyperparameters, Models, & Env resolution
    ├── engine.py                    # BM25 + Dense Retrieval + Reranking Core Pipeline
    ├── main.py                      # FastAPI Service Endpoints & Health Check
    └── requirements.txt             # Python ML & Server dependencies
```

---

## 🛠 Local Setup & Installation

### Prerequisites
* **Node.js** (v18+)
* **PNPM** (v8+)
* **Python** (3.9 - 3.11)
* **PostgreSQL** running locally or via Docker
* **Groq API Key** (Get one at [Groq Console](https://console.groq.com/))

---

### Step 1: Clone the Repository
```bash
git clone -b shambhavi-msme-work https://github.com/Shriya-1807/RBI_Janmitra.git
cd RBI_Janmitra
```

### Step 2: Set Up Database (Docker Postgres)
If you don't have Postgres running, launch a database container:
```bash
docker run --name rbi-janmitra-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=rbi_janamitra -p 5432:5432 -d postgres:latest
```

---

### Step 3: Configure and Run the Python RAG Service
1. Navigate to the `rag-service` directory and set up a virtual environment:
   ```bash
   cd rag-service
   python -m venv .venv
   .venv\Scripts\activate      # On Windows
   # source .venv/bin/activate # On Unix
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the `rag-service` folder:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   RAG_PORT=8000
   RAG_DEVICE=cpu
   ```
4. Run the service:
   ```bash
   python main.py
   ```
The RAG Service will start loading the vector models and listen on `http://localhost:8000`.

---

### Step 4: Configure and Run the API Server
1. Navigate back to the frontend workspace:
   ```bash
   cd ../farmers-janmitra-frontend
   pnpm install
   ```
2. Navigate to the `api-server` directory:
   ```bash
   cd artifacts/api-server
   ```
3. Create a `.env` file in the `api-server` folder:
   ```env
   PORT=8080
   DATABASE_URL=postgresql://postgres:password@localhost:5432/rbi_janamitra
   RAG_SERVICE_URL=http://localhost:8000
   GROQ_API_KEY=your_groq_api_key_here
   # (Optional) translation APIs:
   # SARVAM_API_KEY=your_key
   # HF_TOKEN=your_token
   ```
4. Push the database schema and start the dev server:
   ```bash
   pnpm --filter @workspace/db run push
   pnpm run dev
   ```

---

### Step 5: Start the React Frontend
1. Open a new terminal and navigate to the React UI directory:
   ```bash
   cd farmers-janmitra-frontend/artifacts/janmitra
   ```
2. Run the Vite developer server:
   ```bash
   pnpm run dev
   ```
Open [http://localhost:3000](http://localhost:3000) in your web browser to access the live dashboard and interactive chatbot!

---

## 🛡 License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- Trigger Vercel Build V2 -->
