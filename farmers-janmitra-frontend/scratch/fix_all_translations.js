const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../artifacts/janmitra/src/lib/translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Normalise line endings to \n
let isCRLF = content.includes('\r\n');
let normalizedContent = content.replace(/\r\n/g, '\n');

// 1. Fix Punjabi hero.desc
const pbiHeroDescRegex = /"desc":\s*"ਜਨਮਿਤਰਾ ਜਟਿਲ ਰਿਜ਼ਰਵ ਬੈਂਕ ਆਫ਼ ਇੰਡੀਆ ਦੇ ਸਰਕੂਲਰ ਅਤੇ ਬੈਂਕਿੰਗ ਨਿਯਮਾਂ ਨੂੰ ਸਰਲ ਭਾਸ਼ਾ ਵਿੱਚ ਸਰਲ ਬਣਾਉਂਦਾ ਹੈ - ਕਿਸਾਨਾਂ, ਵਿਦਿਆਰਥੀਆਂ, ਐਮ\.ਐਸ\.ਐਮ\.ਈ\.ਜੀ[\s\S]*?",/;
const correctPunjabiDesc = `"desc": "ਜਨਮਿੱਤਰ ਗੁੰਝਲਦਾਰ ਭਾਰਤੀ ਰਿਜ਼ਰਵ ਬੈਂਕ ਦੇ ਸਰਕੂਲਰਾਂ ਅਤੇ ਬੈਂਕਿੰਗ ਨਿਯਮਾਂ ਨੂੰ ਸਰਲ ਭਾਸ਼ਾ ਵਿੱਚ ਉਪਲਬਧ ਕਰਵਾਉਂਦਾ ਹੈ — ਕਿਸਾਨਾਂ, ਵਿਦਿਆਰਥੀਆਂ, MSMEs ਅਤੇ ਹਰ ਭਾਰਤੀ ਨਾਗਰੀਕ ਲਈ।",`;

if (pbiHeroDescRegex.test(normalizedContent)) {
  normalizedContent = normalizedContent.replace(pbiHeroDescRegex, correctPunjabiDesc);
  console.log("Successfully fixed Punjabi hero.desc in memory.");
} else {
  console.error("Could not match Punjabi hero.desc regex. Let's try direct replacement.");
  // Let's find index of Punjabi block and replace the desc key inside hero
  const punjabiStart = normalizedContent.indexOf('"punjabi": {');
  if (punjabiStart !== -1) {
    const heroStart = normalizedContent.indexOf('"hero": {', punjabiStart);
    if (heroStart !== -1) {
      const descStart = normalizedContent.indexOf('"desc":', heroStart);
      const descEnd = normalizedContent.indexOf('",\n', descStart);
      if (descStart !== -1 && descEnd !== -1 && descStart < descEnd) {
        normalizedContent = normalizedContent.substring(0, descStart) + `"desc": "ਜਨਮਿੱਤਰ ਗੁੰਝਲਦਾਰ ਭਾਰਤੀ ਰਿਜ਼ਰਵ ਬੈਂਕ ਦੇ ਸਰਕੂਲਰਾਂ ਅਤੇ ਬੈਂਕਿੰਗ ਨਿਯਮਾਂ ਨੂੰ ਸਰਲ ਭਾਸ਼ਾ ਵਿੱਚ ਉਪਲਬਧ ਕਰਵਾਉਂਦਾ ਹੈ — ਕਿਸਾਨਾਂ, ਵਿਦਿਆਰਥੀਆਂ, MSMEs ਅਤੇ ਹਰ ਭਾਰਤੀ ਨਾਗਰੀਕ ਲਈ।"` + normalizedContent.substring(descEnd + 1);
        console.log("Successfully replaced Punjabi hero.desc by index.");
      }
    }
  }
}

// 2. Add frauds key to nav block of each language
const langNavFrauds = {
  english: "Frauds",
  hindi: "धोखाधड़ी",
  tamil: "மோசடிகள்",
  telugu: "మోసాలు",
  kannada: "ವಂಚನೆಗಳು",
  malayalam: "തട്ടിപ്പുകൾ",
  bengali: "জালিয়াতি",
  marathi: "فसवणूक",
  gujarati: "છેતરપિંડી",
  punjabi: "ਧੋਖਾਧੜੀ",
  odia: "ଠକେଇ",
  urdu: "دھوکہ دہی",
  assamese: "প্ৰবঞ্চনা"
};

for (const [lang, translation] of Object.entries(langNavFrauds)) {
  // Find "lang": {
  const langKey = `"${lang}": {`;
  const langStart = normalizedContent.indexOf(langKey);
  if (langStart === -1) {
    console.error(`Could not find language block for ${lang}`);
    continue;
  }
  
  // Find "nav": {
  const navStart = normalizedContent.indexOf('"nav": {', langStart);
  if (navStart === -1) {
    console.error(`Could not find nav block for ${lang}`);
    continue;
  }
  
  // Find the closing brace of the nav block
  const navEnd = normalizedContent.indexOf('}', navStart);
  if (navEnd === -1) {
    console.error(`Could not find closing brace of nav block for ${lang}`);
    continue;
  }
  
  // Check if "frauds" is already inside this nav block
  const navBlockContent = normalizedContent.substring(navStart, navEnd);
  if (navBlockContent.includes('"frauds"')) {
    console.log(`Language ${lang} already has frauds key in nav.`);
    continue;
  }
  
  // We want to insert the frauds key right before the closing brace.
  // We need to see if the last item before the closing brace has a trailing comma.
  // Let's grab the last line before the brace.
  const navBlockLines = navBlockContent.split('\n');
  let lastItemIndex = -1;
  for (let i = navBlockLines.length - 1; i >= 0; i--) {
    if (navBlockLines[i].trim() && !navBlockLines[i].includes('{') && !navBlockLines[i].includes('}')) {
      lastItemIndex = i;
      break;
    }
  }
  
  if (lastItemIndex !== -1) {
    let lastLine = navBlockLines[lastItemIndex];
    if (!lastLine.endsWith(',')) {
      navBlockLines[lastItemIndex] = lastLine + ',';
    }
    // Add frauds key
    const indent = lastLine.match(/^\s*/)[0] || '      ';
    navBlockLines.splice(lastItemIndex + 1, 0, `${indent}"frauds": "${translation}"`);
    
    const newNavBlockContent = navBlockLines.join('\n');
    normalizedContent = normalizedContent.substring(0, navStart) + newNavBlockContent + normalizedContent.substring(navEnd);
    console.log(`Added frauds key to ${lang} nav.`);
  } else {
    console.error(`Could not parse nav lines for ${lang}`);
  }
}

// Save back
const finalContent = isCRLF ? normalizedContent.replace(/\n/g, '\r\n') : normalizedContent;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log("Completed fix_all_translations.js execution!");
