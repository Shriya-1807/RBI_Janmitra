async function testLanguage(langName, text) {
  const description = "A female speaker with a clear voice, moderate pace, and high-quality recording.";
  const baseUrl = "https://ai4bharat-indic-parler-tts.hf.space/gradio_api";
  
  console.log(`\nTesting ${langName}...`);
  try {
    const startRes = await fetch(`${baseUrl}/call/generate_finetuned`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [text, description] })
    });

    if (!startRes.ok) {
      console.error(`Start failed for ${langName}:`, await startRes.text());
      return;
    }

    const { event_id } = await startRes.json();
    console.log(`Got event ID for ${langName}:`, event_id);

    const pollRes = await fetch(`${baseUrl}/call/generate_finetuned/${event_id}`);
    if (!pollRes.ok) {
      console.error(`Poll failed for ${langName}:`, await pollRes.text());
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
        accumulated += decoder.decode(value, { stream: !done });
      }
    }

    // Parse the completed URL
    const lines = accumulated.split("\n");
    let audioUrl = null;
    for (const line of lines) {
      if (line.startsWith("event: complete")) {
        // Find next data line
        const dataLine = lines[lines.indexOf(line) + 1];
        if (dataLine && dataLine.startsWith("data: ")) {
          const jsonStr = dataLine.slice(6);
          const data = JSON.parse(jsonStr);
          if (data && data[0] && data[0].url) {
            audioUrl = data[0].url;
          }
        }
      }
    }

    if (audioUrl) {
      console.log(`Success for ${langName}! Audio URL:`, audioUrl);
      // Let's check if we can fetch the audio bytes
      const audioRes = await fetch(audioUrl);
      console.log(`Audio fetch status: ${audioRes.status}, Content-Type: ${audioRes.headers.get("content-type")}, Size: ${audioRes.headers.get("content-length")} bytes`);
    } else {
      console.error(`Failed to find audio URL in output for ${langName}. Full response length:`, accumulated.length);
    }
  } catch (e) {
    console.error(`Error during inference for ${langName}:`, e);
  }
}

async function run() {
  await testLanguage("Odia", "ନମସ୍କାର, ଆପଣ କେମିତି ଅଛନ୍ତି? ଆଜିର ଖବର କଣ?");
  await testLanguage("Assamese", "নমস্কাৰ, আপুনি কেনে আছে? আজিৰ বতৰ কেনেকুৱা?");
}

run();
