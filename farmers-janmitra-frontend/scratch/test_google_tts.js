const fs = require('fs');

async function testTTS(client, langCode, text) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=${client}&q=${encodeURIComponent(text)}`;
  console.log(`Testing client=${client}, lang=${langCode} -> Fetching: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });
    console.log('Response status:', res.status);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      console.log('Success! Buffer length:', buffer.byteLength);
      return true;
    } else {
      const text = await res.text();
      console.log('Error text:', text.slice(0, 100));
      return false;
    }
  } catch (e) {
    console.error('Fetch failed:', e);
    return false;
  }
}

async function runAll() {
  const clients = ['tw-ob', 'gtx', 't', 'gtrans', 'webapp', 'p', 'chrome-extension'];
  for (const client of clients) {
    await testTTS(client, 'or', 'ନମସ୍କାର');
    await testTTS(client, 'as', 'নমস্কাৰ');
  }
}

runAll();
