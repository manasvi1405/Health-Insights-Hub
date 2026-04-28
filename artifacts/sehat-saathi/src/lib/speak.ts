import { getAppLanguage, getSpeechLangCode } from "@/hooks/use-t";

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speak(text: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) return;
  stopSpeaking();
  const lang = getAppLanguage();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = getSpeechLangCode(lang);
  utt.rate = 0.9;
  utt.pitch = 1;
  utt.volume = 1;
  // Pick a matching voice if available
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find(v => v.lang === utt.lang) || voices.find(v => v.lang.startsWith(utt.lang.split("-")[0]));
  if (match) utt.voice = match;
  utt.onend = () => { currentUtterance = null; onEnd?.(); };
  utt.onerror = () => { currentUtterance = null; onEnd?.(); };
  currentUtterance = utt;
  window.speechSynthesis.speak(utt);
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking() {
  return "speechSynthesis" in window && window.speechSynthesis.speaking;
}
