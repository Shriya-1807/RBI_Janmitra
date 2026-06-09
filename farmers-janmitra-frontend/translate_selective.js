const fs = require('fs');
const path = require('path');

const translationsPath = path.join(__dirname, 'artifacts/janmitra/src/lib/translations.ts');
if (!fs.existsSync(translationsPath)) {
  console.error("Could not find translations.ts at:", translationsPath);
  process.exit(1);
}

const SARVAM_API_KEY = "sk_se8o8sxe_gl83yTsDbjQLw66ZSuOYvVml";
const SARVAM_TRANS_URL = "https://api.sarvam.ai/translate";

const SARVAM_CODES = {
  telugu: "te-IN",
  kannada: "kn-IN",
  malayalam: "ml-IN",
  bengali: "bn-IN",
  marathi: "mr-IN",
  gujarati: "gu-IN",
  punjabi: "pa-IN",
  odia: "od-IN",
  urdu: "ur-IN",
  assamese: "as-IN",
};

async function translateText(text, targetLang) {
  const needsSarvamTranslateV1 = targetLang === "ur-IN" || targetLang === "as-IN";
  const payload = {
    input: text,
    source_language_code: "en-IN",
    target_language_code: targetLang,
    speaker_gender: "Female",
    mode: "formal",
    model: needsSarvamTranslateV1 ? "sarvam-translate:v1" : "mayura:v1",
    enable_preprocessing: true,
  };

  const res = await fetch(SARVAM_TRANS_URL, {
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

async function run() {
  let content = fs.readFileSync(translationsPath, 'utf8');
  const lines = content.split('\n');

  for (const [lang, code] of Object.entries(SARVAM_CODES)) {
    console.log(`Processing translations for ${lang} (${code})...`);
    try {
      const fraudsNav = await translateText("Common Frauds", code);
      const impactTitle = await translateText("Personalized Impact", code);
      const impactDesc = await translateText("Set your profile as Farmer or MSME Owner to receive explanations tailored to your specific background.", code);
      const fraudTitle = await translateText("Fraud Alerts & Safety", code);
      const fraudDesc = await translateText("We have a dedicated page describing common banking frauds and RBI customer awareness guidelines to read and stay safe.", code);

      console.log(`  Translated:`);
      console.log(`    nav.frauds: ${fraudsNav}`);
      console.log(`    impact: ${impactTitle} - ${impactDesc}`);
      console.log(`    fraud: ${fraudTitle} - ${fraudDesc}`);

      // Locate the lang section
      const langHeaderIdx = lines.findIndex(l => l.includes(`"${lang}": {`));
      if (langHeaderIdx === -1) {
        console.warn(`  Could not find language section for ${lang}`);
        continue;
      }

      // 1. Update the nav block
      let navIdx = -1;
      for (let i = langHeaderIdx; i < lines.length; i++) {
        if (lines[i].includes('"nav": {')) {
          navIdx = i;
          break;
        }
      }

      if (navIdx !== -1) {
        // Find end of nav block
        let navEndIdx = -1;
        for (let i = navIdx; i < lines.length; i++) {
          if (lines[i].trim() === '},' || lines[i].trim() === '}') {
            navEndIdx = i;
            break;
          }
        }

        if (navEndIdx !== -1) {
          // Check if frauds key already exists in nav
          let hasFrauds = false;
          for (let i = navIdx; i < navEndIdx; i++) {
            if (lines[i].includes('"frauds":')) {
              hasFrauds = true;
              lines[i] = `      "frauds": "${fraudsNav.replace(/"/g, '\\"')}",`;
              break;
            }
          }

          if (!hasFrauds) {
            // Insert frauds key
            lines.splice(navIdx + 4, 0, `      "frauds": "${fraudsNav.replace(/"/g, '\\"')}",`);
          }
        }
      }

      // 2. Update the features block
      // Re-find indices because splicing might change line indices
      const updatedLangHeaderIdx = lines.findIndex(l => l.includes(`"${lang}": {`));
      let featuresIdx = -1;
      for (let i = updatedLangHeaderIdx; i < lines.length; i++) {
        if (lines[i].includes('"features": {')) {
          featuresIdx = i;
          break;
        }
      }

      if (featuresIdx !== -1) {
        // Find end of features block (where we have a closing brace at features indentation level)
        let featuresEndIdx = -1;
        for (let i = featuresIdx + 1; i < lines.length; i++) {
          if (lines[i].includes('},') && lines[i].startsWith('    }')) {
            featuresEndIdx = i;
            break;
          }
        }

        if (featuresEndIdx !== -1) {
          // Replace the inner features keys (chat, langs, voice, impact, fraud)
          // Let's extract features title and subtitle first to preserve them
          let titleLine = `      "title": "Everything You Need",`;
          let subtitleLine = `      "subtitle": "Powerful Features",`;
          let chatLines = [];
          let langsLines = [];
          let voiceLines = [];

          let collectingChat = false;
          let collectingLangs = false;
          let collectingVoice = false;

          for (let i = featuresIdx + 1; i < featuresEndIdx; i++) {
            const line = lines[i];
            if (line.includes('"title":') && !line.includes('"chat"') && !line.includes('"langs"') && !line.includes('"voice"')) {
              titleLine = line;
            } else if (line.includes('"subtitle":')) {
              subtitleLine = line;
            } else if (line.includes('"chat": {')) {
              collectingChat = true;
            } else if (line.includes('"langs": {')) {
              collectingLangs = true;
              collectingChat = false;
            } else if (line.includes('"voice": {')) {
              collectingVoice = true;
              collectingLangs = false;
            } else if (line.includes('"dash": {') || line.includes('"farmers": {') || line.includes('"impact": {')) {
              collectingVoice = false;
            }

            if (collectingChat) chatLines.push(line);
            if (collectingLangs) langsLines.push(line);
            if (collectingVoice) voiceLines.push(line);
          }

          const newFeaturesBlock = [
            titleLine,
            subtitleLine,
            ...chatLines,
            ...langsLines,
            ...voiceLines,
            `      "impact": {`,
            `        "title": "${impactTitle.replace(/"/g, '\\"')}",`,
            `        "desc": "${impactDesc.replace(/"/g, '\\"')}"`,
            `      },`,
            `      "fraud": {`,
            `        "title": "${fraudTitle.replace(/"/g, '\\"')}",`,
            `        "desc": "${fraudDesc.replace(/"/g, '\\"')}"`,
            `      }`
          ];

          // Replace in lines
          lines.splice(featuresIdx + 1, featuresEndIdx - featuresIdx - 1, ...newFeaturesBlock);
        }
      }
      console.log(`  Successfully processed ${lang}`);
    } catch (err) {
      console.error(`  Error processing ${lang}:`, err);
    }
  }

  // Write back to file
  fs.writeFileSync(translationsPath, lines.join('\n'), 'utf8');
  console.log("Completed selective translations update!");
}

run();
