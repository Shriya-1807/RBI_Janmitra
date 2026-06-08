import { Router, type IRouter } from "express";
import { db, chatMessagesTable, conversations } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  SendChatMessageBody,
  SendChatMessageResponse,
  GetChatHistoryQueryParams,
  GetChatHistoryResponse,
} from "@workspace/api-zod";
import { translateToEnglish, translateFromEnglish } from "../translate";

const router: IRouter = Router();

const RAG_SERVICE_URL = (process.env.RAG_SERVICE_URL || "http://localhost:8000").replace(/\/$/, "");

function firstWords(text: string, n = 5): string {
  return text.split(/\s+/).slice(0, n).join(" ");
}

/* ── POST /chat/message ── */
router.post("/chat/message", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { message, language = "english", userType = "general", sessionId } = parsed.data;
  const sid = sessionId || `session-${Date.now()}`;

  /* Auto-create a session record if it doesn't exist */
  const existingSession = await db.select().from(conversations).where(eq(conversations.sessionId, sid)).limit(1);
  if (existingSession.length === 0) {
    const autoTitle = `Chat — ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}`;
    await db.insert(conversations).values({ sessionId: sid, title: autoTitle });
  }

  /* Save user message */
  await db.insert(chatMessagesTable).values({ sessionId: sid, role: "user", content: message, language });

  /* Translate user message to English for RAG (if not already English) */
  const englishMessage = await translateToEnglish(message, language);

  /* Call Farmers RAG Python service (notebook pipeline) */
  let englishResponse: string = "I could not process your request. Please try again.";
  try {
    const pythonRes = await fetch(`${RAG_SERVICE_URL}/api/rag_query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: englishMessage, user_type: userType }),
      signal: AbortSignal.timeout(120000),
    });

    if (!pythonRes.ok) {
      const errBody = await pythonRes.text().catch(() => "");
      throw new Error(`RAG service ${pythonRes.status}: ${errBody.slice(0, 200)}`);
    }

    const pyData = (await pythonRes.json()) as { answer?: string; sources?: { source: string }[] };
    englishResponse = pyData.answer ?? englishResponse;

    console.log("RAG Sources:", pyData.sources?.map((s) => s.source));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Farmers RAG service call failed:", msg);
    englishResponse =
      `I apologize, but my knowledge engine is offline. Start the Farmers RAG service (${RAG_SERVICE_URL}) ` +
      `and ensure rag-service/data/rbi_chroma_db_v3 is populated from Colab. Error: ${msg}`;
  }

  /* Translate response back to user's language using NLLB-200 */
  const finalResponse = await translateFromEnglish(englishResponse, language);

  /* Update session title from first message if it's a new session */
  if (existingSession.length === 0 && englishMessage.trim()) {
    const autoTitle = firstWords(message, 6);
    await db.update(conversations).set({ title: autoTitle }).where(eq(conversations.sessionId, sid));
  }

  /* Save assistant message */
  const [savedMsg] = await db.insert(chatMessagesTable).values({
    sessionId: sid, role: "assistant", content: finalResponse, language,
  }).returning();

  /* Chat uses Farmers RAG corpus — skip scraped monetary-policy DB links */
  res.json(SendChatMessageResponse.parse({
    id: savedMsg.id,
    sessionId: sid,
    response: finalResponse,
    language,
    relatedPolicies: [],
    timestamp: savedMsg.timestamp.toISOString(),
  }));
});

/* ── GET /chat/history ── */
router.get("/chat/history", async (req, res): Promise<void> => {
  const params = GetChatHistoryQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  let query = db.select().from(chatMessagesTable).$dynamic();
  if (params.data.sessionId) {
    query = query.where(eq(chatMessagesTable.sessionId, params.data.sessionId));
  }

  const msgs = await query.orderBy(desc(chatMessagesTable.timestamp)).limit(50);
  res.json(GetChatHistoryResponse.parse(msgs.reverse().map(m => ({ ...m, timestamp: m.timestamp.toISOString() }))));
});

/* ── GET /chat/sessions ── */
router.get("/chat/sessions", async (_req, res): Promise<void> => {
  const sessions = await db.select().from(conversations).orderBy(desc(conversations.createdAt)).limit(50);
  res.json(sessions.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })));
});

/* ── POST /chat/sessions ── */
router.post("/chat/sessions", async (req, res): Promise<void> => {
  const title = req.body?.title || `New Chat — ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const [created] = await db.insert(conversations).values({ sessionId, title }).returning();
  res.status(201).json({ ...created, createdAt: created.createdAt.toISOString() });
});

/* ── DELETE /chat/sessions/:sessionId ── */
router.delete("/chat/sessions/:sessionId", async (req, res): Promise<void> => {
  const { sessionId } = req.params;
  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.sessionId, sessionId));
  await db.delete(conversations).where(eq(conversations.sessionId, sessionId));
  res.json({ ok: true });
});

/* ── PATCH /chat/sessions/:sessionId ── */
router.patch("/chat/sessions/:sessionId", async (req, res): Promise<void> => {
  const { sessionId } = req.params;
  const { title } = req.body;
  if (!title) { res.status(400).json({ error: "title required" }); return; }
  const [updated] = await db.update(conversations).set({ title }).where(eq(conversations.sessionId, sessionId)).returning();
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

/* ── POST /chat/tts ── */
router.post("/chat/tts", async (req, res): Promise<void> => {
  const { text, language } = req.body;
  if (!text || !language) {
    res.status(400).json({ error: "text and language required" });
    return;
  }

  // ── AI4Bharat Indic Parler-TTS for Odia & Assamese ────────────────────────
  // Google Translate TTS and Sarvam don't support these languages properly,
  // so we proxy through the free AI4Bharat Gradio Space on Hugging Face.
  if (language === "or-IN" || language === "as-IN") {
    const GRADIO_BASE = "https://ai4bharat-indic-parler-tts.hf.space/gradio_api";
    const description =
      "A female speaker delivers the text clearly and naturally in a calm, moderate-pitched voice. The recording is very high quality with no background noise.";

    try {
      // 1. Kick off inference via Gradio's queue API
      const startRes = await fetch(`${GRADIO_BASE}/call/generate_finetuned`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [text, description] }),
        signal: AbortSignal.timeout(30000),
      });

      if (!startRes.ok) {
        const errText = await startRes.text().catch(() => "");
        throw new Error(`Gradio start failed ${startRes.status}: ${errText.slice(0, 200)}`);
      }

      const { event_id } = (await startRes.json()) as { event_id: string };

      // 2. Read SSE stream until "complete" event arrives
      const pollRes = await fetch(`${GRADIO_BASE}/call/generate_finetuned/${event_id}`, {
        signal: AbortSignal.timeout(90000),
      });

      if (!pollRes.ok) {
        throw new Error(`Gradio poll failed ${pollRes.status}`);
      }

      const reader = (pollRes.body as any).getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) accumulated += decoder.decode(value, { stream: !done });
      }

      // 3. Parse audio file path from "complete" SSE event data
      let audioUrl: string | null = null;
      const lines = accumulated.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === "event: complete") {
          const dataLine = lines[i + 1] || "";
          if (dataLine.startsWith("data: ")) {
            try {
              const payload = JSON.parse(dataLine.slice(6)) as Array<{ path?: string }>;
              if (payload?.[0]?.path) {
                // Build file download URL (use /gradio_api/file= path, not the doubled URL)
                audioUrl = `${GRADIO_BASE}/file=${payload[0].path}`;
              }
            } catch { /* ignore parse errors */ }
          }
          break;
        }
      }

      if (!audioUrl) {
        throw new Error("No audio path found in Gradio SSE response");
      }

      // 4. Fetch the audio bytes and stream back to the client
      const audioRes = await fetch(audioUrl, { signal: AbortSignal.timeout(30000) });
      if (!audioRes.ok) {
        throw new Error(`Audio fetch failed ${audioRes.status} from Gradio file endpoint`);
      }

      const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
      const contentType = audioRes.headers.get("content-type") || "audio/wav";
      res.setHeader("Content-Type", contentType);
      res.send(audioBuffer);
      return;
    } catch (error: any) {
      console.error("Indic Parler-TTS (AI4Bharat) failed:", error.message);
      res.status(500).json({ error: error.message });
      return;
    }
  }

  // ── Sarvam TTS for all other supported Indic languages ────────────────────
  const apiKey = process.env.SARVAM_API_KEY || "sk_yh1cdbkz_wjfRt5JQspmTKGjWmt182P77";
  try {
    const bodyPayload: Record<string, any> = {
      inputs: [text],
      target_language_code: language,
      speaker: "anushka",
      pace: 1.0,
      speech_sample_rate: 8000,
      enable_preprocessing: true,
      model: "bulbul:v2",
      pitch: 0,
      loudness: 1.5,
    };

    const sarvamRes = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!sarvamRes.ok) {
      const errBody = await sarvamRes.text();
      throw new Error(`Sarvam TTS API returned ${sarvamRes.status}: ${errBody}`);
    }

    const data = (await sarvamRes.json()) as { audios?: string[] };
    if (!data.audios || data.audios.length === 0) {
      throw new Error("No audio returned from Sarvam TTS");
    }

    const buffer = Buffer.from(data.audios[0], "base64");
    res.setHeader("Content-Type", "audio/wav");
    res.send(buffer);
  } catch (error: any) {
    console.error("Sarvam TTS failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
