// Emergency detection (PRD 10.6). Checked on every message BEFORE intent
// classification. Pure. Never tell a user they are "safe"; never estimate
// rescue times.

import { normalise, joined } from './normalise.js';

// Phrases are matched on word boundaries against normalised text.
const PHRASES = {
  flood: [
    'flood in my house', 'water in my house', 'water entering', 'house is flooding', 'house flooded', 'water rising',
    'ghar mein paani', 'paani aa gaya', 'paani bhar gaya', 'ghar mein pani', 'pani aa gaya', 'pani bhar gaya',
    'घर में पानी', 'पानी आ गया', 'पानी भर गया', 'बाढ़ आ गई',
  ],
  heat: ['heat stroke', 'heatstroke', 'sun stroke', 'sunstroke', 'loo lag gayi', 'loo lagi', 'लू लग गई', 'लू लगी'],
  lightning: ['lightning struck', 'struck by lightning', 'hit by lightning', 'bijli giri', 'bijli gir gayi', 'बिजली गिरी', 'बिजली गिर गई'],
  fainted: ['someone fainted', 'has fainted', 'fainted', 'unconscious', 'not breathing', 'behosh', 'बेहोश', 'सांस नहीं', 'साँस नहीं'],
  boat: ['boat missing', 'boat is missing', 'boat not returned', 'naav gayab', 'नाव लापता', 'नाव नहीं लौटी'],
  trapped: ['trapped', 'stuck in water', 'stuck in flood', 'phas gaye', 'fas gaye', 'phans gaye', 'फँस गए', 'फंस गए', 'फँसे हैं'],
  general: ['please help', 'help us', 'emergency', 'sos', 'bachao', 'बचाओ', 'मदद करो', 'madad karo', 'save me', 'in danger'],
};

/**
 * @returns {null | { kind: 'flood'|'heat'|'lightning'|'fainted'|'boat'|'trapped'|'general' }}
 */
export function detectEmergency(text) {
  const j = joined(normalise(text));
  for (const [kind, list] of Object.entries(PHRASES)) {
    for (const p of list) {
      const needle = joined(normalise(p));
      if (j.includes(needle)) return { kind };
    }
  }
  // A lone "help" is an emergency only when it is most of the message
  // ("help!", "help me", "help me please"), not "help me add my farm".
  const tokens = normalise(text);
  if (tokens.length <= 3 && tokens.includes('help')) return { kind: 'general' };
  return null;
}

/** First-aid key for an emergency kind (mitra.emergency.aid.<key>). */
export function aidKey(kind) {
  if (kind === 'heat' || kind === 'fainted') return 'heat';
  if (kind === 'lightning') return 'lightning';
  if (kind === 'flood' || kind === 'trapped') return 'flood';
  if (kind === 'boat') return 'boat';
  return null;
}
