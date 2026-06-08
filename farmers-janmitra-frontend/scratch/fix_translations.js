const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../artifacts/janmitra/src/lib/translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to \n
let normalizedContent = content.replace(/\r\n/g, '\n');

// The block we want to replace in translations.ts
const targetBlock = `    "works": {
      "subtitle": "સરળ પ્રક્રિયા",
      "title": "જનમિત્ર કેવી રીતે કાર્યરત થાય છે\\n\\nજનમિત્ર એક સામાજિક સંચાર પ્લેટફોર્મ છે જે લોકોને તેમના પરિવાર અને મિત્રો સાથે જોડવાની મંજૂરી આપે છે.\\n\\nજનમિત્રનો ઉદ્દેશ્ય લોકોને તેમના પરિવાર અને મિત્રો સાથે જોડવાની મંજૂરી આપવાનો છે અને તેમને તેમના જીવનમાં સંબંધો બનાવવા અને સંભાળવાની મંજૂરી આપવાનો છે.\\n\\nજનમિત્રની કેટલીક મુખ્ય વિશેષતાઓ નીચે મુજબ છે:\\n\\nસામાજિક સંચાર પ્લેટફોર્મ: જનમિત્ર એક સામાજિક સંચાર પ્લેટફોર્મ છે જે લોકોને તેમના પરિવાર અને મિત્રો સાથે જોડવાની મંજૂરી આપે છે.\\nસંબંધો બનાવવા અને સંભાળવાની મંજૂરી: જનમિત્ર લોકોને તેમના પરિવાર અને મિત્રો સાથે જોડવાની મંજૂરી આપે છે અને તેમને તેમના જીવનમાં સંબંધો બનાવવા અને સંભાળવાની મંજૂરી આપે છે.\\nસામાજિક સંચાર પ્લેટફોર્મ પર લોકોને જોડવાની મંજૂરી: જનમિત્ર લોકોને તેમના પરિવાર અને મિત્રો સાથે જોડવાની મંજૂરી આપે છે.\\nસંબંધો બનાવવા અને સંભાળવાની મંજૂરી: જનમિત્ર લોકોને તેમના પરિવાર અને મિત્રો સાથે જોડવાની મંજૂરી આપે છે અને તેમને તેમના જીવનમાં સંબંધો બનાવવા અને સંભાળવાની મંજૂરી આપે છે.\\n\\nજનમિત્રની કેટલીક મુખ્ય લાભો નીચે મુજબ છે:\\n\\nસામાજિક સંચાર પ્લેટફોર્મ પર લોકોને જોડવાની મંજૂરી: જનમિત્ર લોકોને તેમના પરિવાર અને મિત્રો સાથે જોડવાની મંજૂরি આપે છે.\\nસંબંધો બનાવવા અને સંભાળવાની મંજૂરી: જનમિત્ર લોકોને તેમના પરિવાર અને મિત્રો સાથે જોડવાની મંજૂરી આપે છે અને તેમને તેમના જીવનમાં સંબંધો બનાવવા અને સંભાળવા",
      "desc": "પ્રશ્નોથી લઈને સ્પષ્ટતા સુધી સેકન્ડોમાં - કોઈ બેંકિંગ નિષ્ણાત જરૂરી નથી.",
      "step1": {
        "title": "તમારું પ્રોફાઇલ સેટ કરો",
        "desc": "આપણે કેવી વ્યવस्थाમાં છીએ તે કહો તે કે ખેતીકાર, વિદ્યાર્થી, એસએમઇએ માલિક અથવા નોકરીમાં છીએ."
      },
      "step2": {
        "title": "આપણે પૂછીએ છીએ",
        "desc": "બેંકિંગ પ્રશ્ન કે તમારી રાજ્યભાષામાં લખો અથવા બોલો."
      },
      "step3": {
        "title": "એઆઈ નીતિનો વિશ્લેષણ કરે",
        "desc": "આપણા એઆઈ પૂછેલા પ્રશ્નને રિઝર્વ બેંકના સરક્યુલર્સ અને માર્ગદર્શિકાઓ સાથે સરખાવે છે."
      },
      "step4": {
        "title": "સંજોગથી સાચું જવાબ મળે",
        "desc": "મારી ભૂમિકา એવી છે કે મને અમેરિકી ભાષામાં આપેલી ટેક્સ્ટને ગુજરાતીમાં અનુवाद કરવો પડે છે. તેમાં મારી જરૂરિયાતો નીચે મુજબ છે:\\n\\n* ટેક્સ્ટને સરળ રીતે અનુवाद કરવો\\n* અનુવાદની સારવાર કરવી નહીં\\n* ટેક્સ્ટને ફોર્મેટ કરવો નહીં\\n* ટેક્સ્ટમાં કોઈ પણ નોંધ કરવી નહીં\\n* ટેક્સ્ટમાં કોઈ પણ ફરિયાદ કરવી નહીં"
      },
      "btn": "શરૂ માટે મુફત"
    },`;

const replacementBlock = `    "works": {
      "subtitle": "સરળ પ્રક્રિયા",
      "title": "જનમિત્ર કેવી રીતે કામ કરે છે",
      "desc": "પ્રશ્નોથી લઈને સ્પષ્ટતા સુધી સેકન્ડોમાં - કોઈ બેંકિંગ નિષ્ણાત જરૂરી નથી.",
      "step1": {
        "title": "તમારી પ્રોફાઇલ સેટ કરો",
        "desc": "તમે ખેડૂત, વિદ્યાર્થી, MSME માલિક અથવા નોકરીયાત છો તે અમને જણાવો."
      },
      "step2": {
        "title": "તમારો પ્રશ્ન પૂછો",
        "desc": "અંગ્રેજી અથવા તમારી પ્રાદેશિક ભાષામાં તમારો બેંકિંગ પ્રશ્ન લખો અથવા બોલો."
      },
      "step3": {
        "title": "AI નીતિનું વિશ્લેષણ કરે છે",
        "desc": "અમારું AI તમારા પ્રશ્નને વાસ્તવિક RBI પરિપત્રો અને માર્ગદર્શિકાઓ સાથે મેળવે છે."
      },
      "step4": {
        "title": "સ્પષ્ટ જવાબ મેળવો",
        "desc": "મુદ્દાઓ અને તમારા માટે તેનો શો અર્થ છે તે સાથે સરળ સમજૂતી મેળવો."
      },
      "btn": "મફતમાં શરૂ કરો"
    },`;

if (normalizedContent.includes(targetBlock)) {
  normalizedContent = normalizedContent.replace(targetBlock, replacementBlock);
  // Restore CRLF if file originally had them
  const finalContent = content.includes('\r\n') ? normalizedContent.replace(/\n/g, '\r\n') : normalizedContent;
  fs.writeFileSync(filePath, finalContent, 'utf8');
  console.log("Successfully replaced Gujarati works block in translations.ts!");
} else {
  console.error("Could not find targetBlock in normalized translations.ts!");
  
  // Let's write a flexible regex to find the works block
  const startIdx = normalizedContent.indexOf('"works": {\n      "subtitle": "સરળ પ્રક્રિયા",');
  if (startIdx !== -1) {
    const endIdx = normalizedContent.indexOf('"fraud": {', startIdx);
    if (endIdx !== -1) {
      console.log("Found works block start and fraud block start. Replacing dynamically...");
      const before = normalizedContent.substring(0, startIdx);
      const after = normalizedContent.substring(endIdx);
      normalizedContent = before + replacementBlock + '\n    ';
      const finalContent = content.includes('\r\n') ? normalizedContent.replace(/\n/g, '\r\n') : normalizedContent;
      // We also need to preserve the fraud block and subsequent text!
      const finalWithAfter = finalContent + (content.includes('\r\n') ? after.replace(/\n/g, '\r\n') : after);
      fs.writeFileSync(filePath, finalWithAfter, 'utf8');
      console.log("Successfully replaced Gujarati works block dynamically!");
    } else {
      console.log("Could not find fraud block after works block.");
    }
  } else {
    console.log("Could not find works block start.");
  }
}
