async function testTTSEndpoint(language, text, langName) {
  console.log(`\nTesting /api/chat/tts for ${langName} (${language})...`);
  try {
    const res = await fetch("http://localhost:8080/api/chat/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language })
    });

    console.log(`Status: ${res.status}`);
    console.log(`Content-Type: ${res.headers.get("content-type")}`);

    if (res.ok) {
      const buffer = await res.arrayBuffer();
      console.log(`SUCCESS! Audio buffer size: ${buffer.byteLength} bytes`);
    } else {
      const err = await res.text();
      console.log(`ERROR: ${err}`);
    }
  } catch (e) {
    console.error(`Fetch failed:`, e.message);
  }
}

async function run() {
  await testTTSEndpoint("or-IN", "ନମସ୍କାର, ଆପଣ କେମିତି ଅଛନ୍ତି?", "Odia");
  await testTTSEndpoint("as-IN", "নমস্কাৰ, আপুনি কেনে আছে?", "Assamese");
}

run();
