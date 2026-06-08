async function testGradioAPI() {
  const url = "https://ai4bharat-indic-parler-tts.hf.space/config";
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const ids = [6, 7, 11, 16, 17, 21];
      data.components.forEach(comp => {
        if (ids.includes(comp.id)) {
          console.log(`\nComponent ID ${comp.id}:`);
          console.log("type:", comp.type);
          console.log("label:", comp.props?.label);
          console.log("value:", comp.props?.value);
        }
      });
    }
  } catch (e) {
    console.error("Failed:", e);
  }
}

testGradioAPI();
