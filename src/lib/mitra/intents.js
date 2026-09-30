// Intent classification for Mausam Mitra (PRD 10.4, 21.4, 27.12). Pure.
// Score = sum of weights of matched words and phrases (word boundaries,
// after normalisation). Ties go to the intent listed first, so specific
// intents are listed before general ones.

import { normalise, joined } from './normalise.js';

export const THRESHOLD = 3;

// [id, { word: weight }, { 'multi word phrase': weight }]
const RAW = [
  ['language.switch', {}, { 'hindi mein': 5, 'in hindi': 5, 'हिंदी में': 5, 'हिन्दी में': 5, 'in english': 5, 'english mein': 5, 'अंग्रेजी में': 5 }],
  ['travel.flight', { flight: 4, flights: 4, airport: 4, fly: 2, flying: 2, udaan: 4, उडान: 4, एयरपोर्ट: 4, हवाई: 3 }, {}],
  ['travel.pack', { pack: 4, packing: 4, luggage: 3, samaan: 3, saman: 3, सामान: 3, पैक: 4, carry: 2 }, { 'what to carry': 3, 'le jaun': 2, 'ले जाऊं': 2 }],
  ['tide.times', { tide: 4, tides: 4, jwar: 4, ज्वार: 4, bhata: 3, भाटा: 3 }, { 'high tide': 2, 'low tide': 2 }],
  ['fisher.go', { fishing: 4, fish: 3, fishermen: 4, fisherman: 4, boat: 3, machhli: 4, मछली: 4, naav: 3, नाव: 3, मछुआरे: 4 }, {}],
  ['sea.safe', { beach: 3, swim: 3, swimming: 3, sea: 3, waves: 2, surf: 3, samundar: 3, समुद्र: 3, तट: 2, लहर: 2, लहरें: 2, tairna: 3, तैरना: 3, तैरने: 3, lehren: 2, safe: 1, सुरक्षित: 1 }, {}],
  ['farm.spray', { spray: 4, spraying: 4, pesticide: 4, chidkav: 4, छिडकाव: 4, dawai: 2, दवा: 2, dawa: 2, दवाई: 2 }, {}],
  ['farm.frost', { frost: 4, pala: 4, पाला: 4 }, { 'ground frost': 2 }],
  ['farm.rain5', { farm: 2, khet: 2, खेत: 2, crop: 2, crops: 2, fasal: 2, फसल: 2, irrigate: 3, irrigation: 3, sinchai: 3, सिंचाई: 3, week: 1, hafte: 2, हफ्ते: 2 }, { 'this week': 2, 'is hafte': 2, 'इस हफ्ते': 2, 'kitni barish': 1, 'बारिश कितनी': 1 }],
  ['family.school', { school: 4, kids: 2, children: 2, pickup: 2, स्कूल: 4, bachche: 2, बच्चे: 2, bachon: 2, बच्चों: 2 }, { 'drop off': 2 }],
  ['commute.leave', { leave: 2, office: 2, commute: 3, traffic: 2, route: 2, nikalun: 3, nikalna: 3, निकलूं: 3, निकलना: 3, दफ्तर: 2, ऑफिस: 2, daftar: 2, ruku: 1, रुकूं: 1 }, { 'should i leave': 2 }],
  ['travel.dest', { trip: 3, travel: 3, travelling: 3, visit: 2, holiday: 3, vacation: 3, yatra: 3, यात्रा: 3, safar: 3, सफर: 3 }, { 'next week': 3, 'agle hafte': 3, 'अगले हफ्ते': 3 }],
  ['fog.today', { fog: 4, foggy: 4, visibility: 3, mist: 2, haze: 2, kohra: 4, कोहरा: 4, dhund: 2, धुंध: 2 }, {}],
  ['lightning.safety', { lightning: 4, thunder: 3, thunderstorm: 2, storm: 2, bijli: 4, बिजली: 4, garaj: 2, गरज: 2, toofan: 2, तूफान: 2, aandhi: 2, आंधी: 2 }, { 'what to do': 1, 'kya karein': 1, 'क्या करें': 1 }],
  ['alerts.list', { alert: 3, alerts: 3, warning: 3, warnings: 3, chetavani: 3, चेतावनी: 3, अलर्ट: 3, cyclone: 2, चक्रवात: 2 }, {}],
  ['rain.umbrella', { umbrella: 4, chata: 4, छाता: 4, raincoat: 4, रेनकोट: 4 }, {}],
  ['run.best', { run: 3, running: 3, jog: 3, jogging: 3, walk: 3, cycle: 3, cycling: 3, workout: 2, exercise: 2, cricket: 2, football: 2, yoga: 2, daud: 3, दौड: 3, दौडने: 3, sair: 2, सैर: 2, टहलने: 2, टहल: 2, kasrat: 2, कसरत: 2 }, { 'best time': 1, 'सही समय': 1 }],
  ['uv.today', { uv: 3, sunburn: 3, sunscreen: 3, dhoop: 2, धूप: 2, sun: 1, यूवी: 3 }, { 'धूप कितनी': 2, 'तेज धूप': 2, 'dhoop kitni': 2 }],
  ['aqi.now', { air: 2, aqi: 3, pollution: 3, smog: 3, mask: 2, hawa: 2, हवा: 2, प्रदूषण: 3, pradushan: 3 }, { 'air quality': 2, 'हवा कैसी': 2, 'hawa kaisi': 2 }],
  ['heat.today', { hot: 3, heat: 3, temperature: 3, temp: 2, warm: 1, heatwave: 3, garmi: 3, गर्मी: 3, तापमान: 2, taapman: 2, tapman: 2, loo: 3, लू: 3 }, { 'how hot': 2 }],
  ['rain.when', { rain: 3, raining: 3, rains: 3, rainy: 2, shower: 2, showers: 2, drizzle: 2, barish: 3, बारिश: 3, वर्षा: 3, barsaat: 2, बरसात: 2, kab: 1, कब: 1, when: 1 }, {}],
  ['app.help', { app: 2, feature: 2, features: 2, settings: 2, ऐप: 2, kaise: 1, कैसे: 1 }, { 'how do i': 3, 'how to': 3, 'how does': 3, 'sky snap': 3, 'add my': 2, 'kya hai': 1, 'what is': 1, 'कैसे करें': 2, 'kaise kare': 2 }],
  ['weather.now', { weather: 2, mausam: 2, मौसम: 2, now: 2, abhi: 2, अभी: 2, currently: 2, outside: 1 }, { 'right now': 2 }],
  ['weather.tomorrow', { weather: 2, mausam: 2, मौसम: 2, tomorrow: 2, kal: 2, कल: 2, parson: 2, परसों: 2, forecast: 1 }, {}],
  ['weather.today', { weather: 3, mausam: 3, मौसम: 3, today: 1, aaj: 1, आज: 1, forecast: 2 }, {}],
  ['thanks', { thanks: 3, thankyou: 3, thx: 3, dhanyavad: 3, धन्यवाद: 3, shukriya: 3, शुक्रिया: 3 }, { 'thank you': 3 }],
  ['greeting', { hello: 3, hi: 3, hey: 3, namaste: 3, नमस्ते: 3, namaskar: 3, नमस्कार: 3, hlo: 3 }, { 'good morning': 3, 'good evening': 3 }],
];

export const INTENT_IDS = RAW.map((r) => r[0]);

/** Every lexicon word, normalised: these are never place names. */
export const LEXICON_WORDS = new Set(RAW.flatMap(([, words, phrases]) => [...Object.keys(words), ...Object.keys(phrases).flatMap((p) => p.split(' '))]).flatMap((w) => normalise(w)));

// Normalise the lexicon once so it matches normalised input.
const INTENTS = RAW.map(([id, words, phrases]) => ({
  id,
  words: Object.fromEntries(Object.entries(words).map(([w, n]) => [normalise(w)[0], n])),
  phrases: Object.entries(phrases).map(([p, n]) => [joined(normalise(p)), n]),
}));

/**
 * @returns {{ id: string, score: number, runnerUp: string|null }}
 */
export function classify(text) {
  const tokens = normalise(text);
  const set = new Set(tokens);
  const j = joined(tokens);
  let best = { id: 'fallback', score: 0 };
  let second = null;
  for (const intent of INTENTS) {
    let score = 0;
    for (const [w, n] of Object.entries(intent.words)) if (set.has(w)) score += n;
    for (const [p, n] of intent.phrases) if (j.includes(p)) score += n;
    if (score > best.score) {
      second = best.id === 'fallback' ? second : best.id;
      best = { id: intent.id, score };
    } else if (score >= THRESHOLD && !second) {
      second = intent.id;
    }
  }
  return best.score >= THRESHOLD ? { ...best, runnerUp: second } : { id: 'fallback', score: best.score, runnerUp: null };
}

/** Which language "language.switch" asks for. */
export function switchTarget(text) {
  const j = joined(normalise(text));
  return /\s(english|अंग्रेजी)\s/.test(j) ? 'en' : 'hi';
}
