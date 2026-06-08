export interface GuideIcon {
  icon: string;
  label: string;
}

export const iconGuides: Record<string, Record<string, GuideIcon[]>> = {
  english: {
    home: [
      { icon: "💬", label: "AI Chatbot" },
      { icon: "🌐", label: "Choose Language" },
      { icon: "👤", label: "Select Profile" },
      { icon: "⚠️", label: "Fraud Warnings" },
    ],
    chatbot: [
      { icon: "⌨️", label: "Type Question" },
      { icon: "🎙️", label: "Speak Question" },
      { icon: "🔊", label: "Listen Answer" },
      { icon: "❌", label: "Stop Audio" },
    ],
    frauds: [
      { icon: "🛡️", label: "Banking Scams" },
      { icon: "🔊", label: "Read Page Aloud" },
      { icon: "📞", label: "Report Scam (1930)" },
      { icon: "⬅️", label: "Go Back" },
    ],
    settings: [
      { icon: "🌐", label: "Set Language" },
      { icon: "👤", label: "Set Profile" },
    ],
  },
  hindi: {
    home: [
      { icon: "💬", label: "एआई चैटबॉट" },
      { icon: "🌐", label: "भाषा चुनें" },
      { icon: "👤", label: "प्रॉफ़ाइल चुनें" },
      { icon: "⚠️", label: "धोखाधड़ी चेतावनी" },
    ],
    chatbot: [
      { icon: "⌨️", label: "प्रश्न लिखें" },
      { icon: "🎙️", label: "बोलकर पूछें" },
      { icon: "🔊", label: "उत्तर सुनें" },
      { icon: "❌", label: "आवाज बंद करें" },
    ],
    frauds: [
      { icon: "🛡️", label: "बैंकिंग घोटाले" },
      { icon: "🔊", label: "पेज बोलकर सुनें" },
      { icon: "📞", label: "शिकायत करें (1930)" },
      { icon: "⬅️", label: "पीछे जाएं" },
    ],
    settings: [
      { icon: "🌐", label: "भाषा सेट करें" },
      { icon: "👤", label: "प्रॉफ़ाइल सेट करें" },
    ],
  },
  tamil: {
    home: [
      { icon: "💬", label: "AI சாட்பாட்" },
      { icon: "🌐", label: "மொழியைத் தேர்ந்தெடுக்கவும்" },
      { icon: "👤", label: "சுயவிவரத்தைத் தேர்ந்தெடுக்கவும்" },
      { icon: "⚠️", label: "மோசடி எச்சரிக்கைகள்" },
    ],
    chatbot: [
      { icon: "⌨️", label: "கேள்வியைத் தட்டச்சு செய்க" },
      { icon: "🎙️", label: "பேசி கேளுங்கள்" },
      { icon: "🔊", label: "பதிலைக் கேளுங்கள்" },
      { icon: "❌", label: "ஒலியை நிறுத்து" },
    ],
    frauds: [
      { icon: "🛡️", label: "வங்கி மோசடிகள்" },
      { icon: "🔊", label: "பக்கத்தை வாசி" },
      { icon: "📞", label: "புகார் செய் (1930)" },
      { icon: "⬅️", label: "பின்னால் போ" },
    ],
    settings: [
      { icon: "🌐", label: "மொழியை அமை" },
      { icon: "👤", label: "சுயவிவரத்தை அமை" },
    ],
  },
  telugu: {
    home: [
      { icon: "💬", label: "AI చాట్‌బాట్" },
      { icon: "🌐", label: "భాషను ఎంచుకోండి" },
      { icon: "👤", label: "ప్రొఫైల్ ఎంచుకోండి" },
      { icon: "⚠️", label: "మోసం హెచ్చరికలు" },
    ],
    chatbot: [
      { icon: "⌨️", label: "ప్రశ్న రాయండి" },
      { icon: "🎙️", label: "మాట్లాడి అడగండి" },
      { icon: "🔊", label: "సమాధానం వినండి" },
      { icon: "❌", label: "ఆడియోను ఆపండి" },
    ],
    frauds: [
      { icon: "🛡️", label: "బ్యాంకింగ్ మోసాలు" },
      { icon: "🔊", label: "పేజీని చదివించండి" },
      { icon: "📞", label: "ఫిర్యాదు చేయండి (1930)" },
      { icon: "⬅️", label: "వెనుకకు వెళ్ళండి" },
    ],
    settings: [
      { icon: "🌐", label: "భాషను సెట్ చేయండి" },
      { icon: "👤", label: "ప్రొఫైల్ సెట్ చేయండి" },
    ],
  },
  kannada: {
    home: [
      { icon: "💬", label: "AI ಚಾಟ್‌ಬಾಟ್" },
      { icon: "🌐", label: "ಭಾಷೆಯನ್ನು ಆರಿಸಿ" },
      { icon: "👤", label: "ಪ್ರೊಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ" },
      { icon: "⚠️", label: "ವಂಚನೆ ಎಚ್ಚರಿಕೆಗಳು" },
    ],
    chatbot: [
      { icon: "⌨️", label: "ಪ್ರಶ್ನೆಯನ್ನು ಬರೆಯಿರಿ" },
      { icon: "🎙️", label: "ಮಾತನಾಡಿ ಕೇಳಿ" },
      { icon: "🔊", label: "ಉತ್ತರವನ್ನು ಕೇಳಿ" },
      { icon: "❌", label: "ಆಡಿಯೋ ನಿಲ್ಲಿಸಿ" },
    ],
    frauds: [
      { icon: "🛡️", label: "ಬ್ಯಾಂಕಿಂಗ್ ಹಗರಣಗಳು" },
      { icon: "🔊", label: "ಪುಟ ಓದಿಸಿ" },
      { icon: "📞", label: "ವರದಿ ಮಾಡಿ (1930)" },
      { icon: "⬅️", label: "ಹಿಂದೆ ಹೋಗಿ" },
    ],
    settings: [
      { icon: "🌐", label: "ಭಾಷೆಯನ್ನು ಹೊಂದಿಸಿ" },
      { icon: "👤", label: "ಪ್ರೊಫೈಲ್ ಹೊಂದಿಸಿ" },
    ],
  },
  malayalam: {
    home: [
      { icon: "💬", label: "AI ചാറ്റ്ബോട്ട്" },
      { icon: "🌐", label: "ഭാഷ തിരഞ്ഞെടുക്കുക" },
      { icon: "👤", label: "പ്രൊഫൈൽ തിരഞ്ഞെടുക്കുക" },
      { icon: "⚠️", label: "തട്ടിപ്പ് മുന്നറിയിപ്പുകൾ" },
    ],
    chatbot: [
      { icon: "⌨️", label: "ചോദ്യം ടൈപ്പ് ചെയ്യുക" },
      { icon: "🎙️", label: "സംസാരിച്ചു ചോദിക്കുക" },
      { icon: "🔊", label: "മറുപടി കേൾക്കുക" },
      { icon: "❌", label: "ശബ്ദം നിർത്തുക" },
    ],
    frauds: [
      { icon: "🛡️", label: "ബാങ്കിംഗ് തട്ടിപ്പുകൾ" },
      { icon: "🔊", label: "പേജ് വായിപ്പിച്ചു കേൾക്കുക" },
      { icon: "📞", label: "റിപ്പോർട്ട് ചെയ്യുക (1930)" },
      { icon: "⬅️", label: "തിരിച്ചു പോവുക" },
    ],
    settings: [
      { icon: "🌐", label: "ഭാഷ ക്രമീകരിക്കുക" },
      { icon: "👤", label: "പ്രൊഫൈൽ ക്രമീകരിക്കുക" },
    ],
  },
  bengali: {
    home: [
      { icon: "💬", label: "AI চ্যাটবট" },
      { icon: "🌐", label: "ভাষা নির্বাচন করুন" },
      { icon: "👤", label: "প্রোফাইল নির্বাচন করুন" },
      { icon: "⚠️", label: "জালিয়াতি সতর্কতা" },
    ],
    chatbot: [
      { icon: "⌨️", label: "প্রশ্ন টাইপ করুন" },
      { icon: "🎙️", label: "বলুন এবং জিজ্ঞাসা করুন" },
      { icon: "🔊", label: "উত্তর শুনুন" },
      { icon: "❌", label: "শব্দ বন্ধ করুন" },
    ],
    frauds: [
      { icon: "🛡️", label: "ব্যাংকিং কেলেঙ্কারি" },
      { icon: "🔊", label: "পৃষ্ঠা পড়ুন" },
      { icon: "📞", label: "অভিযোগ জানান (1930)" },
      { icon: "⬅️", label: "পিছনে যান" },
    ],
    settings: [
      { icon: "🌐", label: "ভাষা সেট করুন" },
      { icon: "👤", label: "প্রোফাইল সেট করুন" },
    ],
  },
  marathi: {
    home: [
      { icon: "💬", label: "AI चॅटबॉट" },
      { icon: "🌐", label: "भाषा निवडा" },
      { icon: "👤", label: "प्रोफाइल निवडा" },
      { icon: "⚠️", label: "फसवणूक इशारे" },
    ],
    chatbot: [
      { icon: "⌨️", label: "प्रश्न टाईप करा" },
      { icon: "🎙️", label: "बोलून विचारा" },
      { icon: "🔊", label: "उत्तर ऐका" },
      { icon: "❌", label: "आवाज बंद करा" },
    ],
    frauds: [
      { icon: "🛡️", label: "बँकिंग घोटाळे" },
      { icon: "🔊", label: "पेज ऐका" },
      { icon: "📞", label: "तक्रार नोंदवा (1930)" },
      { icon: "⬅️", label: "मागे जा" },
    ],
    settings: [
      { icon: "🌐", label: "भाषा सेट करा" },
      { icon: "👤", label: "प्रोफाइल सेट करा" },
    ],
  },
  gujarati: {
    home: [
      { icon: "💬", label: "AI ચેટબોટ" },
      { icon: "🌐", label: "ભાષા પસંદ કરો" },
      { icon: "👤", label: "પ્રોફાઇલ પસંદ કરો" },
      { icon: "⚠️", label: "છેતરપિંડી ચેતવણીઓ" },
    ],
    chatbot: [
      { icon: "⌨️", label: "પ્રશ્ન લખો" },
      { icon: "🎙️", label: "બોલીને પૂછો" },
      { icon: "🔊", label: "જવાબ સાંભળો" },
      { icon: "❌", label: "અવાજ બંધ કરો" },
    ],
    frauds: [
      { icon: "🛡️", label: "બેંકિંગ કૌભાંડો" },
      { icon: "🔊", label: "પૃષ્ઠ સાંભળો" },
      { icon: "📞", label: "ફરિયાદ કરો (1930)" },
      { icon: "⬅️", label: "પાછા જાઓ" },
    ],
    settings: [
      { icon: "🌐", label: "ભાષા સેટ કરો" },
      { icon: "👤", label: "પ્રોફાઇલ સેટ કરો" },
    ],
  },
  punjabi: {
    home: [
      { icon: "💬", label: "AI ਚੈਟਬੋਟ" },
      { icon: "🌐", label: "ਭਾਸ਼ਾ ਚੁਣੋ" },
      { icon: "👤", label: "ਪ੍ਰੋਫਾਈਲ ਚੁਣੋ" },
      { icon: "⚠️", label: "ਧੋਖਾਧੜੀ ਦੀਆਂ ਚੇਤਾਵਨੀਆਂ" },
    ],
    chatbot: [
      { icon: "⌨️", label: "ਪ੍ਰਸ਼ਨ ਲਿਖੋ" },
      { icon: "🎙️", label: "ਬੋਲ ਕੇ ਪੁੱਛੋ" },
      { icon: "🔊", label: "ਉੱਤਰ ਸੁਣੋ" },
      { icon: "❌", label: "ਆਵਾਜ਼ ਬੰਦ ਕਰੋ" },
    ],
    frauds: [
      { icon: "🛡️", label: "ਬੈਂਕਿੰਗ ਘੁਟਾਲੇ" },
      { icon: "🔊", label: "ਪੇਜ ਸੁਣੋ" },
      { icon: "📞", label: "ਸ਼ਿਕਾਇਤ ਕਰੋ (1930)" },
      { icon: "⬅️", label: "ਪਿੱਛੇ ਜਾਓ" },
    ],
    settings: [
      { icon: "🌐", label: "ਭਾਸ਼ਾ ਸੈੱਟ ਕਰੋ" },
      { icon: "👤", label: "ਪ੍ਰੋਫਾਈਲ ਸੈੱਟ ਕਰੋ" },
    ],
  },
  odia: {
    home: [
      { icon: "💬", label: "AI ଚାଟବୋଟ" },
      { icon: "🌐", label: "ଭାଷା ବାଛନ୍ତୁ" },
      { icon: "👤", label: "ପ୍ରୋଫାଇଲ୍ ଚୟନ କରନ୍ତୁ" },
      { icon: "⚠️", label: "ଠକେଇ ଚେତାବନୀ" },
    ],
    chatbot: [
      { icon: "⌨️", label: "ପ୍ରଶ୍ନ ଲେଖନ୍ତୁ" },
      { icon: "🎙️", label: "କହି ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ" },
      { icon: "🔊", label: "ଉତ୍ତର ଶୁଣନ୍ତୁ" },
      { icon: "❌", label: "ଶବ୍ଦ ବନ୍ଦ କରନ୍ତୁ" },
    ],
    frauds: [
      { icon: "🛡️", label: "ବ୍ୟାଙ୍କିଙ୍ଗ ଠକେଇ" },
      { icon: "🔊", label: "ପୃଷ୍ଠା ଶୁଣନ୍ତୁ" },
      { icon: "📞", label: "ଅଭିଯୋଗ କରନ୍ତୁ (1930)" },
      { icon: "⬅️", label: "ପଛକୁ ଯାଆନ୍ତୁ" },
    ],
    settings: [
      { icon: "🌐", label: "ଭାଷା ସେଟ୍ କରନ୍ତୁ" },
      { icon: "👤", label: "ପ୍ରୋଫାଇଲ୍ ସେଟ୍ କରନ୍ତୁ" },
    ],
  },
  urdu: {
    home: [
      { icon: "💬", label: "اے آئی چیٹ باٹ" },
      { icon: "🌐", label: "زبان منتخب کریں" },
      { icon: "👤", label: "پروفائل منتخب کریں" },
      { icon: "⚠️", label: "دھوکہ دہی کے انتباہات" },
    ],
    chatbot: [
      { icon: "⌨️", label: "سوال لکھیں" },
      { icon: "🎙️", label: "بول کر پوچھیں" },
      { icon: "🔊", label: "جواب سنیں" },
      { icon: "❌", label: "آواز بند کریں" },
    ],
    frauds: [
      { icon: "🛡️", label: "بینکنگ گھپلے" },
      { icon: "🔊", label: "صفحہ بلند آواز سے پڑھیں" },
      { icon: "📞", label: "شکایت درج کریں (1930)" },
      { icon: "⬅️", label: "پیچھے جائیں" },
    ],
    settings: [
      { icon: "🌐", label: "زبان سیٹ کریں" },
      { icon: "👤", label: "پروفائل سیٹ کریں" },
    ],
  },
  assamese: {
    home: [
      { icon: "💬", label: "AI চেটবট" },
      { icon: "🌐", label: "ভাষা বাছক" },
      { icon: "👤", label: "প্ৰ'ফাইল বাছক" },
      { icon: "⚠️", label: "প্ৰবঞ্চনাৰ সতৰ্কবাণী" },
    ],
    chatbot: [
      { icon: "⌨️", label: "প্ৰশ্ন লিখক" },
      { icon: "🎙️", label: "কৈ সোধক" },
      { icon: "🔊", label: "উত্তৰ শুনক" },
      { icon: "❌", label: "শব্দ বন্ধ কৰক" },
    ],
    frauds: [
      { icon: "🛡️", label: "বেংকিং প্ৰবঞ্চনা" },
      { icon: "🔊", label: "পৃষ্ঠা শুনক" },
      { icon: "📞", label: "অভিযোগ কৰক (1930)" },
      { icon: "⬅️", label: "পিছলৈ যাওক" },
    ],
    settings: [
      { icon: "🌐", label: "ভাষা চেট কৰক" },
      { icon: "👤", label: "প্ৰ'ফাইল চেট কৰক" },
    ],
  },
};

export function getIconGuides(lang: string, page: string): GuideIcon[] {
  const normalizedLang = lang.toLowerCase();
  const langBlock = iconGuides[normalizedLang] || iconGuides.english;
  return langBlock[page] || [];
}
