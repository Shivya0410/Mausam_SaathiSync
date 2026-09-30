// Text normalisation for Mausam Mitra (PRD 10.3, 21.4). Pure.
// Word-boundary tokens only: the old chatbot matched "hi" inside "this".

// Common Hinglish spelling variants to one canonical form.
const VARIANTS = {
  baarish: 'barish', baarishh: 'barish', barsh: 'barish', barisj: 'barish', bārish: 'barish',
  kl: 'kal', kall: 'kal',
  garmee: 'garmi', garami: 'garmi',
  kohraa: 'kohra', kohara: 'kohra', kuhra: 'kohra',
  chhata: 'chata', chaata: 'chata', chhaata: 'chata',
  chhidkav: 'chidkav', chhidkaav: 'chidkav', chidkaav: 'chidkav', chhidak: 'chidkav', chidak: 'chidkav',
  samandar: 'samundar', samudra: 'samundar',
  machli: 'machhli', machchli: 'machhli',
  chetawani: 'chetavani',
  pradooshan: 'pradushan', pardushan: 'pradushan',
  mausm: 'mausam', mosam: 'mausam', mousam: 'mausam',
  kya: 'kya', kyaa: 'kya',
  hai: 'hai', haii: 'hai',
  mein: 'mein', mei: 'mein', mai: 'mein',
  hogi: 'hogi', hogee: 'hogi', hoga: 'hoga',
  subha: 'subah', subeh: 'subah',
  sham: 'shaam', shyam: 'shaam',
  dopeher: 'dopahar', dophar: 'dopahar',
  parso: 'parson', parsoon: 'parson',
  bijlee: 'bijli',
  toofaan: 'toofan', tufan: 'toofan', tufaan: 'toofan',
  aandhee: 'aandhi', andhi: 'aandhi',
  nikalu: 'nikalun', nikloon: 'nikalun', niklun: 'nikalun',
  bachaao: 'bachao', bachaaoo: 'bachao',
};

/** Lowercase, strip punctuation, collapse repeats, split to tokens. */
export function normalise(text) {
  const s = String(text || '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/[\u0964\u0965]/g, ' ') // Devanagari danda
    .replace(/\u093C/g, '') // nukta: ड़ = ड, फ़ = फ
    .replace(/\u0901/g, '\u0902') // chandrabindu -> anusvara
    .replace(/[^\p{L}\p{M}\p{N}\s:]/gu, ' ')
    .replace(/(\p{L})\1{2,}/gu, '$1$1'); // "baarrrish" -> "baarrish"
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => VARIANTS[w] || w);
}

/** Space-joined, padded, for phrase matching on word boundaries. */
export function joined(tokens) {
  return ` ${tokens.join(' ')} `;
}

export function hasDevanagari(text) {
  return /[\u0900-\u097F]/.test(String(text || ''));
}

// Roman-script words that mark a message as Hinglish.
const HINGLISH = new Set([
  'kya', 'hai', 'hain', 'kal', 'aaj', 'abhi', 'mein', 'hogi', 'hoga', 'kaisa', 'kaisi', 'kitni', 'kitna', 'kab', 'barish',
  'garmi', 'mausam', 'kohra', 'chata', 'hawa', 'batao', 'bataiye', 'karu', 'karun', 'jaun', 'sakte', 'sakta', 'chahiye',
  'subah', 'shaam', 'raat', 'dopahar', 'parson', 'bijli', 'khet', 'fasal', 'samundar', 'machhli', 'nikalun', 'nikalna',
  'bachao', 'paani', 'ghar', 'mujhe', 'mera', 'meri', 'aur', 'nahi', 'haan', 'toh', 'ko', 'ke', 'ki', 'ka', 'se', 'pe',
  'daftar', 'dhoop', 'pala', 'chetavani', 'pradushan', 'namaste', 'dhanyavad', 'shukriya',
]);

/**
 * Reply language (PRD 10.7): Devanagari or Hinglish -> 'hi', else 'en'.
 * Hinglish needs two marker words, so "is it hot in kochi" stays English.
 */
export function detectLang(text, fallback = 'en') {
  if (hasDevanagari(text)) return 'hi';
  const tokens = normalise(text);
  if (!tokens.length) return fallback;
  const hits = tokens.filter((w) => HINGLISH.has(w)).length;
  return hits >= 2 || (hits === 1 && tokens.length <= 2) ? 'hi' : 'en';
}
