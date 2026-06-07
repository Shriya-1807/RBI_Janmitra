import fs from "node:fs";
import path from "node:path";

type RagChunk = {
  id: string;
  source: string;
  text: string;
  tokens: Map<string, number>;
};

export type RagResult = {
  id: string;
  source: string;
  text: string;
  score: number;
};

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have",
  "he", "in", "is", "it", "its", "of", "on", "or", "that", "the", "their", "this",
  "to", "was", "were", "what", "when", "where", "which", "who", "will", "with",
  "you", "your", "about", "into", "can", "how", "does", "do", "i", "we", "they",
  "rbi", "reserve", "bank", "india",
]);

let cachedChunks: RagChunk[] | null = null;
let cachedDocFreq: Map<string, number> | null = null;

function resolveExistingDir(candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }
  return null;
}

function projectRootCandidates() {
  return [
    path.resolve(process.cwd(), "../../.."),
    path.resolve(import.meta.dirname, "../../../.."),
    path.resolve(import.meta.dirname, "../../../../.."),
  ];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function tokenCounts(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokenize(text)) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

function chunkText(text: string, source: string, size = 260, overlap = 40): RagChunk[] {
  const cleaned = text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const chunks: RagChunk[] = [];

  for (let start = 0, index = 0; start < words.length; index += 1) {
    const end = Math.min(start + size, words.length);
    const chunk = words.slice(start, end).join(" ");
    if (chunk.length > 180) {
      chunks.push({
        id: `${source}#${index + 1}`,
        source,
        text: chunk,
        tokens: tokenCounts(chunk),
      });
    }
    if (end === words.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

function readFaqChunks(): RagChunk[] {
  const roots = projectRootCandidates();
  const faqDir = resolveExistingDir(roots.map((root) => path.join(root, "rbi-assistant", "data", "faqs")));
  if (!faqDir) return [];

  return fs
    .readdirSync(faqDir)
    .filter((file) => file.endsWith(".txt"))
    .flatMap((file) => {
      const fullPath = path.join(faqDir, file);
      const text = fs.readFileSync(fullPath, "utf-8");
      return chunkText(text, file.replace(/\.txt$/i, ""));
    });
}

function readPolicyChunks(): RagChunk[] {
  const roots = projectRootCandidates();
  const policyPath = roots
    .map((root) => path.join(root, "frontend", "scraped_policies.json"))
    .find((candidate) => fs.existsSync(candidate));
  if (!policyPath) return [];

  try {
    const policies = JSON.parse(fs.readFileSync(policyPath, "utf-8"));
    if (!Array.isArray(policies)) return [];

    return policies.map((policy, index) => {
      const title = String(policy.title || `Policy ${index + 1}`);
      const body = [
        `Title: ${title}`,
        `Date: ${policy.date || "Unknown"}`,
        `Category: ${policy.category || "Unknown"}`,
        `Affected group: ${policy.affectedGroup || "general"}`,
        `Summary: ${policy.summary || ""}`,
        `Content: ${policy.content || ""}`,
      ].join("\n");

      return {
        id: `policy-${index + 1}`,
        source: `scraped_policy:${title}`,
        text: body,
        tokens: tokenCounts(body),
      };
    });
  } catch {
    return [];
  }
}

function buildIndex() {
  const chunks = [...readPolicyChunks(), ...readFaqChunks()];
  const docFreq = new Map<string, number>();

  for (const chunk of chunks) {
    for (const token of chunk.tokens.keys()) {
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
    }
  }

  cachedChunks = chunks;
  cachedDocFreq = docFreq;
}

function scoreChunk(queryTokens: Map<string, number>, chunk: RagChunk, docFreq: Map<string, number>, totalDocs: number): number {
  let score = 0;
  for (const [token, qCount] of queryTokens) {
    const cCount = chunk.tokens.get(token);
    if (!cCount) continue;
    const idf = Math.log((1 + totalDocs) / (1 + (docFreq.get(token) || 0))) + 1;
    score += qCount * cCount * idf;
  }
  return score;
}

export function getRagStats() {
  if (!cachedChunks || !cachedDocFreq) buildIndex();
  const chunks = cachedChunks || [];
  const sources = new Set(chunks.map((chunk) => chunk.source));
  return {
    chunks: chunks.length,
    sources: sources.size,
  };
}

export function retrieveRagContext(query: string, topK = 6): RagResult[] {
  if (!cachedChunks || !cachedDocFreq) buildIndex();

  const chunks = cachedChunks || [];
  const docFreq = cachedDocFreq || new Map<string, number>();
  const queryTokens = tokenCounts(query);
  if (chunks.length === 0 || queryTokens.size === 0) return [];

  return chunks
    .map((chunk) => ({
      id: chunk.id,
      source: chunk.source,
      text: chunk.text,
      score: scoreChunk(queryTokens, chunk, docFreq, chunks.length),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function formatRagContext(results: RagResult[]): string {
  if (results.length === 0) {
    return "No matching RAG document chunks were found.";
  }

  return results
    .map((result, index) => `[Source ${index + 1}: ${result.source}]\n${result.text}`)
    .join("\n\n");
}
