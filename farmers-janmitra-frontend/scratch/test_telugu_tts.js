const fs = require('fs');
const path = require('path');

async function testTeluguTTS() {
  const apiKey = process.env.SARVAM_API_KEY || "sk_se8o8sxe_gl83yTsDbjQLw66ZSuOYvVml";
  const text = "డిజిటల్ బ్యాంకింగ్ రైతులు మరియు MSME యజమానులకు సహాయపడుతుంది.";
  const language = "hi-IN";

  console.log("Fetching Telugu TTS from Sarvam API...");
  try {
    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: language,
        speaker: "anushka",
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: "bulbul:v2"
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Sarvam API Error:", res.status, err);
      return;
    }

    const data = await res.json();
    if (!data.audios || data.audios.length === 0) {
      console.error("No audios returned!");
      return;
    }

    const base64Audio = data.audios[0];
    const buffer = Buffer.from(base64Audio, "base64");
    const outputPath = path.join(__dirname, "telugu_tts_test.wav");
    fs.writeFileSync(outputPath, buffer);
    console.log(`Successfully saved Telugu TTS output to ${outputPath}`);
    console.log("Audio size:", buffer.length, "bytes");
  } catch (err) {
    console.error("Request failed:", err);
  }
}

testTeluguTTS();
