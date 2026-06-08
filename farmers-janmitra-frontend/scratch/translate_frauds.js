const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../artifacts/janmitra/src/pages/FraudPage.tsx');
if (!fs.existsSync(filePath)) {
  console.error("Could not find FraudPage.tsx at:", filePath);
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

const ENGLISH_SOURCE = {
  title: "Common Banking Frauds & Safety Rules",
  subtitle: "Protect Your Savings",
  intro: "Digital banking helps farmers and MSME owners manage money quickly, but scammers are active. Learn how they try to trick you and how to keep your hard-earned savings safe.",
  whatItIsLabel: "What it is",
  targetLabel: "How they target",
  scams: [
    {
      title: "Fake Bank Calls & KYC Updates",
      whatItIs: "Fraudsters call or SMS pretending to be bank officers, loan agents, or insurance providers saying your account, Kisan Credit Card (KCC), or Mudra loan is blocked.",
      target: "They will ask for your card number, PIN, or Aadhaar to 'verify' your details or release your KCC subsidy/Mudra loan.",
      tip: "Never share your OTP, PIN, or banking passwords. Banks or RBI will NEVER call you to ask for these details."
    },
    {
      title: "UPI Scams (Collect Requests & QR Codes)",
      whatItIs: "Scammers send money requests on UPI apps, or send fake QR codes claiming you are receiving a payment.",
      target: "A buyer sends a QR code to an MSME owner saying 'Scan this to receive payment for your products', or tells a farmer they must enter their UPI PIN to receive a government crop subsidy.",
      tip: "Entering your UPI PIN always DEBITS money from your account. You NEVER need to enter your PIN to receive money."
    },
    {
      title: "Fake Loan Applications",
      whatItIs: "Unauthorized mobile apps offering instant crop loans or business credit with no documentation.",
      target: "They demand access to your phone contacts and photos, charge extremely high interest rates, and blackmail you by calling your family if payments are delayed.",
      tip: "Only borrow from banks and RBI-registered lenders. Check their names on the official RBI website before installing any app."
    },
    {
      title: "Remote Phone Access Apps",
      whatItIs: "Scammers ask you to install apps like AnyDesk, TeamViewer, or QuickSupport to 'solve mobile banking problems' or help with loan approval.",
      target: "Once installed, they can see your phone screen, access your mobile banking apps, and steal your money.",
      tip: "Never install remote control apps on instructions from a phone call. Banks never request this."
    },
    {
      title: "Fake Government Schemes & RBI Officers",
      whatItIs: "Fraudsters send letters or messages pretending to be RBI or government officials offering subsidies, lottery prizes, or business grants.",
      target: "They demand an advance 'processing fee' or 'security deposit' to release your crop insurance or MUDRA loan subsidy.",
      tip: "RBI never contacts the public directly, never offers subsidies, and never charges fees to release funds."
    }
  ],
  reportingTitle: "How to Report a Fraud",
  reportingText: "If you lose money to a scam, act immediately! Early reporting significantly increases the chances of fund recovery.",
  reportingSteps: [
    "Contact your bank immediately to block your accounts and cards.",
    "Call the National Cyber Crime Helpline at 1930 right away.",
    "File a complaint on the official portal: www.cybercrime.gov.in."
  ]
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

// Icons mapping for the scams list
const ICONS = ["PhoneCall", "AlertTriangle", "ShieldAlert", "Smartphone", "Landmark"];
const COLORS = ["text-red-500", "text-amber-500", "text-rose-500", "text-blue-500", "text-emerald-500"];
const BG_COLORS = ["bg-red-500/10", "bg-amber-500/10", "bg-rose-500/10", "bg-blue-500/10", "bg-emerald-500/10"];
const BORDER_COLORS = ["border-red-500/20", "border-amber-500/20", "border-rose-500/20", "border-blue-500/20", "border-emerald-500/20"];

async function run() {
  const translations = {};

  for (const [lang, code] of Object.entries(SARVAM_CODES)) {
    console.log(`Translating into ${lang} (${code})...`);
    try {
      const title = await translateText(ENGLISH_SOURCE.title, code);
      const subtitle = await translateText(ENGLISH_SOURCE.subtitle, code);
      const intro = await translateText(ENGLISH_SOURCE.intro, code);
      const whatItIsLabel = await translateText(ENGLISH_SOURCE.whatItIsLabel, code);
      const targetLabel = await translateText(ENGLISH_SOURCE.targetLabel, code);

      const scams = [];
      for (let i = 0; i < ENGLISH_SOURCE.scams.length; i++) {
        const s = ENGLISH_SOURCE.scams[i];
        const sTitle = await translateText(s.title, code);
        const sWhatItIs = await translateText(s.whatItIs, code);
        const sTarget = await translateText(s.target, code);
        const sTip = await translateText(s.tip, code);

        scams.push({
          title: sTitle,
          whatItIs: sWhatItIs,
          target: sTarget,
          tip: sTip,
          icon: ICONS[i],
          color: COLORS[i],
          bgColor: BG_COLORS[i],
          borderColor: BORDER_COLORS[i],
        });
      }

      const reportingTitle = await translateText(ENGLISH_SOURCE.reportingTitle, code);
      const reportingText = await translateText(ENGLISH_SOURCE.reportingText, code);
      const reportingSteps = [];
      for (const step of ENGLISH_SOURCE.reportingSteps) {
        reportingSteps.push(await translateText(step, code));
      }

      translations[lang] = {
        title,
        subtitle,
        intro,
        whatItIsLabel,
        targetLabel,
        scams,
        reportingTitle,
        reportingText,
        reportingSteps,
      };
      console.log(`  Successfully translated ${lang}`);
    } catch (e) {
      console.error(`  Failed to translate ${lang}:`, e);
    }
  }

  // Format the generated translations into JS string
  let output = "";
  for (const [lang, data] of Object.entries(translations)) {
    output += `  ,${lang}: {\n`;
    output += `    title: "${data.title.replace(/"/g, '\\"')}",\n`;
    output += `    subtitle: "${data.subtitle.replace(/"/g, '\\"')}",\n`;
    output += `    intro: "${data.intro.replace(/"/g, '\\"')}",\n`;
    output += `    whatItIsLabel: "${data.whatItIsLabel.replace(/"/g, '\\"')}",\n`;
    output += `    targetLabel: "${data.targetLabel.replace(/"/g, '\\"')}",\n`;
    output += `    scams: [\n`;
    for (const s of data.scams) {
      output += `      {\n`;
      output += `        title: "${s.title.replace(/"/g, '\\"')}",\n`;
      output += `        whatItIs: "${s.whatItIs.replace(/"/g, '\\"')}",\n`;
      output += `        target: "${s.target.replace(/"/g, '\\"')}",\n`;
      output += `        tip: "${s.tip.replace(/"/g, '\\"')}",\n`;
      output += `        icon: ${s.icon},\n`;
      output += `        color: "${s.color}",\n`;
      output += `        bgColor: "${s.bgColor}",\n`;
      output += `        borderColor: "${s.borderColor}"\n`;
      output += `      },\n`;
    }
    // Remove trailing comma from scams array
    output = output.slice(0, -2) + "\n    ],\n";
    output += `    reportingTitle: "${data.reportingTitle.replace(/"/g, '\\"')}",\n`;
    output += `    reportingText: "${data.reportingText.replace(/"/g, '\\"')}",\n`;
    output += `    reportingSteps: [\n`;
    for (const step of data.reportingSteps) {
      output += `      "${step.replace(/"/g, '\\"')}",\n`;
    }
    output = output.slice(0, -2) + "\n    ]\n";
    output += `  }\n`;
  }

  // Read FraudPage.tsx
  let content = fs.readFileSync(filePath, 'utf8');

  // Search for the tamil block end and replace it
  const targetStr = `    reportingSteps: [
      "உங்கள் கணக்குகள் மற்றும் அட்டைகளை முடக்க உடனடியாக உங்கள் வங்கியைத் தொடர்பு கொள்ளுங்கள்.",
      "உடனடியாக 1930 என்ற தேசிய சைபர் கிரைம் உதவி எண்ணை அழைக்கவும்.",
      "அதிகாரப்பூர்வ இணையதளத்தில் புகார் அளிக்கவும்: www.cybercrime.gov.in."
    ]
  }
};`;

  if (!content.includes(targetStr)) {
    console.error("Could not find the target string in FraudPage.tsx for replacement!");
    process.exit(1);
  }

  const replacementStr = `    reportingSteps: [
      "உங்கள் கணக்குகள் மற்றும் அட்டைகளை முடக்க உடனடியாக உங்கள் வங்கியைத் தொடர்பு கொள்ளுங்கள்.",
      "உடனடியாக 1930 என்ற தேசிய சைபர் கிரைம் உதவி எண்ணை அழைக்கவும்.",
      "அதிகாரப்பூர்வ இணையதளத்தில் புகார் அளிக்கவும்: www.cybercrime.gov.in."
    ]
  }
${output}};`;

  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Successfully updated FraudPage.tsx with translated content!");
}

run();
