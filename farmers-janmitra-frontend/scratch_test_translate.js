const SARVAM_API_KEY = process.env.SARVAM_API_KEY || "sk_se8o8sxe_gl83yTsDbjQLw66ZSuOYvVml";
const text = `**RBI Repo Rate Trends Analysis**

### Overall Trend Stance

* The RBI repo rate has remained constant at 6.5% since 2024-10-09, indicating a **neutral** stance from the RBI.
* This suggests that the RBI is not actively pursuing a monetary policy that would either stimulate or slow down economic growth.

### Impact on Rural and Agricultural Borrowers (KCC, Farm Loans)

* The constant repo rate of 6.5% implies that the interest rates for KCC and farm loans have not changed.
* This could be beneficial for rural and agricultural borrowers, as they would not face an increase in interest rates, which could have made their loan repayments more burdensome.
* However, the lack of change in repo rate also means that the benefits of lower interest rates, which could have been passed on to borrowers, are not being realized.

### What it Means for Normal Citizens (Housing/EMI Stability)

* The constant repo rate of 6.5% suggests that the interest rates for housing loans and other consumer loans have not changed.
* This could be beneficial for normal citizens, as they would not face an increase in interest rates, which could have made their loan repayments more burdensome.
* However, the lack of change in repo rate also means that the benefits of lower interest rates, which could have been passed on to borrowers, are not being realized.

### Key Takeaway Message

* The RBI's decision to maintain a constant repo rate of 6.5% suggests a cautious approach to monetary policy, prioritizing stability over stimulation or contraction.
* This decision may be beneficial for borrowers, but it also means that the benefits of lower interest rates are not being realized, which could have a positive impact on economic growth and consumer spending.`;

async function translateChunk(text, targetLang) {
  const payload = {
    input: text,
    source_language_code: "en-IN",
    target_language_code: targetLang,
    speaker_gender: "Female",
    mode: "formal",
    model: "mayura:v1",
    enable_preprocessing: true,
  };

  const res = await fetch("https://api.sarvam.ai/translate", {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Status ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.translated_text;
}

function chunkText(text, maxChar = 800) {
  const lines = text.split("\n");
  const chunks = [];
  let currentChunk = "";

  for (const line of lines) {
    if ((currentChunk + "\n" + line).length > maxChar) {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = line;
    } else {
      if (currentChunk) {
        currentChunk += "\n" + line;
      } else {
        currentChunk = line;
      }
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  return chunks;
}

async function run() {
  try {
    const chunks = chunkText(text, 800);
    console.log(`Split text into ${chunks.length} chunks`);
    const translatedChunks = [];
    for (const chunk of chunks) {
      const trans = await translateChunk(chunk, "od-IN");
      translatedChunks.push(trans);
    }
    console.log("Translated Text:\n", translatedChunks.join("\n"));
  } catch (err) {
    console.error("Error during run:", err);
  }
}

run();
