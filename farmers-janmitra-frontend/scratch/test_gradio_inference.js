async function testInference() {
  const text = "ନମସ୍କାର, ଆପଣ କେମିତି ଅଛନ୍ତି?";
  const description = "Sunita speaks slowly in a calm, moderate-pitched voice, delivering the news with a neutral tone. The recording is very high quality with no background noise.";

  const baseUrl = "https://ai4bharat-indic-parler-tts.hf.space/gradio_api";
  
  console.log("1. Starting call to generate_finetuned...");
  try {
    const startRes = await fetch(`${baseUrl}/call/generate_finetuned`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [text, description] })
    });

    console.log("Start status:", startRes.status);
    if (!startRes.ok) {
      console.error("Start failed:", await startRes.text());
      return;
    }

    const { event_id } = await startRes.json();
    console.log("Got event ID:", event_id);

    // 2. Poll the status using Server-Sent Events (SSE) or simple GET request
    // In Gradio, we can fetch from /call/generate_finetuned/event_id
    console.log("2. Polling status for event_id...");
    
    // We can do a fetch for the SSE stream and read the chunks
    const pollRes = await fetch(`${baseUrl}/call/generate_finetuned/${event_id}`);
    console.log("Poll status:", pollRes.status);
    if (!pollRes.ok) {
      console.error("Poll failed:", await pollRes.text());
      return;
    }

    const reader = pollRes.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let accumulated = "";

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: !done });
        accumulated += chunk;
        console.log("Chunk received:", chunk);
        
        // Check if we got the complete event in the SSE stream
        // SSE events look like:
        // event: complete
        // data: [{"path": "...", "url": "..."}]
        if (accumulated.includes("event: complete") || accumulated.includes('"event": "complete"')) {
          console.log("Found complete event!");
        }
      }
    }

    console.log("\nFinished SSE stream. Final accumulated string:\n", accumulated);
  } catch (e) {
    console.error("Error during inference:", e);
  }
}

testInference();
