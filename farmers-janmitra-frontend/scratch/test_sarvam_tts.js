const apiKey = "sk_yh1cdbkz_wjfRt5JQspmTKGjWmt182P77";

async function testSarvamTTS(language, text, isV3 = false) {
  const bodyPayload = {
    inputs: [text],
    target_language_code: language,
    speaker: isV3 ? "neha" : "anushka",
    pace: 1.0,
    speech_sample_rate: 8000,
    enable_preprocessing: true,
    model: isV3 ? "bulbul:v3" : "bulbul:v2"
  };

  if (!isV3) {
    bodyPayload.pitch = 0;
    bodyPayload.loudness = 1.5;
  }

  console.log(`\nTesting Sarvam TTS: language=${language}, model=${bodyPayload.model}`);
  try {
    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey
      },
      body: JSON.stringify(bodyPayload)
    });

    console.log("Status:", res.status);
    if (res.ok) {
      const data = await res.json();
      if (data.audios && data.audios.length > 0) {
        console.log("Success! Audio string length:", data.audios[0].length);
      } else {
        console.log("No audio returned:", data);
      }
    } else {
      const err = await res.text();
      console.log("Error response:", err);
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

async function run() {
  await testSarvamTTS("hi-IN", "नमस्ते, आप कैसे हैं?", false);
  await testSarvamTTS("hi-IN", "नमस्ते, आप कैसे हैं?", true);
}

run();
