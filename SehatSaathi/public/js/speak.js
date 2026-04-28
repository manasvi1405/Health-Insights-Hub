// Text-to-speech for AI insights, in the user's chosen language.

function getSpeechLangCode(lang) {
  switch (lang) {
    case "Hindi":   return "hi-IN";
    case "Marathi": return "mr-IN";
    case "Tamil":   return "ta-IN";
    case "Bengali": return "bn-IN";
    default:        return "en-IN";
  }
}

function speak(text, onEnd) {
  if (!("speechSynthesis" in window)) return;
  stopSpeaking();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = getSpeechLangCode(getAppLanguage());
  utt.rate = 0.9; utt.pitch = 1; utt.volume = 1;
  // pick a matching voice if installed
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find(v => v.lang === utt.lang) ||
                voices.find(v => v.lang.startsWith(utt.lang.split("-")[0]));
  if (match) utt.voice = match;
  utt.onend = () => onEnd && onEnd();
  utt.onerror = () => onEnd && onEnd();
  window.speechSynthesis.speak(utt);
}

function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
