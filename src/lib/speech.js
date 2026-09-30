"use client";

// Text to speech with the browser's speechSynthesis (PRD 10.9). Hindi and
// English voices are reliable on Android Chrome; other languages vary by
// device (Bhashini TTS arrives in Part 3).

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function pickVoice(lang) {
  const want = lang === 'hi' ? 'hi-IN' : 'en-IN';
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === want) ||
    voices.find((v) => v.lang.startsWith(lang === 'hi' ? 'hi' : 'en-')) ||
    null
  );
}

/** Speak text; returns false when speech is unavailable. */
export function speak(text, { lang = 'en', rate = 1 } = {}) {
  if (!speechSupported() || !text) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  u.rate = rate;
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}
