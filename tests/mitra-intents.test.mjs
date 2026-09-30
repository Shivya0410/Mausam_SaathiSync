// Mausam Mitra understanding (PRD 10.4 to 10.6): 5+ utterances per intent
// in English, Hindi and Hinglish (these double as documentation), every
// emergency phrase, language detection and slots.

import test from 'node:test';
import assert from 'node:assert/strict';

import { classify, INTENT_IDS, switchTarget } from '../src/lib/mitra/intents.js';
import { detectEmergency } from '../src/lib/mitra/safety.js';
import { normalise, detectLang } from '../src/lib/mitra/normalise.js';
import { extractWhen, extractActivity, extractPlace } from '../src/lib/mitra/slots.js';

const UTTERANCES = {
  'weather.now': ['Weather now', 'अभी मौसम कैसा है', 'abhi mausam kaisa hai', "what's the weather right now", 'how is the weather outside now'],
  'weather.today': ["How's the weather today?", 'आज का मौसम', 'aaj ka mausam', "today's forecast", 'weather please'],
  'weather.tomorrow': ['Tomorrow in Pune weather', 'कल पुणे में मौसम', 'kal pune mein mausam kaisa rahega', 'weather tomorrow', 'parson ka mausam'],
  'rain.when': ['Will it rain today?', 'बारिश कब होगी', 'baarish kab hogi', 'when will the rain start', 'is it going to rain in Mumbai'],
  'rain.umbrella': ['Do I need an umbrella?', 'छाता ले जाऊं?', 'chhata le jaun?', 'should I carry a raincoat', 'umbrella today?'],
  'heat.today': ['How hot will it get?', 'आज कितनी गर्मी है', 'garmi kitni hogi', 'temperature today', 'is there a heatwave'],
  'aqi.now': ['Air quality', 'AQI kya hai', 'हवा कैसी है', 'how bad is the pollution', 'is there smog today'],
  'uv.today': ['UV today', 'धूप कितनी तेज़ है', 'UV kitna hai', 'do I need sunscreen', 'sunburn risk today'],
  'run.best': ['Best time to run tomorrow', 'दौड़ने का सही समय', 'walk kab karu', 'when should I go jogging', 'good time for cycling this evening'],
  'sea.safe': ['Is it safe to swim at Juhu?', 'समुद्र में जाना सुरक्षित है', 'beach safe hai kya', 'can we go to the beach today', 'are the waves too big to surf'],
  'tide.times': ['High tide at Calangute', 'ज्वार कब है', 'tide times today', 'when is low tide', 'jwar bhata kab hai'],
  'fisher.go': ['Can we go fishing tomorrow?', 'कल मछली पकड़ने जा सकते हैं?', 'machhli pakadne ja sakte hain', 'is it ok to take the boat out', 'fishermen warning today'],
  'travel.dest': ['Weather in Shimla next week', 'शिमला में अगले हफ्ते मौसम', 'trip to Manali weather', 'going on a holiday to Ooty', 'yatra ke liye mausam'],
  'travel.flight': ['Fog at Delhi airport tomorrow?', 'दिल्ली एयरपोर्ट पर कोहरा', 'will my flight be delayed by weather', 'airport weather Mumbai', 'udaan ke liye mausam'],
  'travel.pack': ['What should I pack for Goa?', 'गोवा के लिए क्या पैक करूं', 'packing list for Shimla', 'what to carry for my trip', 'kya samaan le jaun'],
  'family.school': ['School time weather', 'स्कूल के समय मौसम', 'weather for the kids at pickup', 'school drop off rain', 'bachon ke school ke liye mausam'],
  'farm.spray': ['Can I spray today?', 'आज छिड़काव कर सकते हैं?', 'dawai chhidak sakte hain', 'good time to spray pesticide', 'spray window tomorrow'],
  'farm.rain5': ['Rain this week for my farm', 'इस हफ्ते बारिश कितनी', 'khet ke liye is hafte barish', 'should I irrigate my crops', 'sinchai karun kya'],
  'farm.frost': ['Frost tonight?', 'आज रात पाला पड़ेगा?', 'pala padega kya', 'ground frost risk', 'frost risk for my crops tomorrow night'],
  'commute.leave': ['Should I leave now?', 'अभी निकलूं या रुकूं', 'nikalna chahiye abhi', 'office commute weather', 'is traffic going to be bad with rain on my route'],
  'fog.today': ['Fog tomorrow morning?', 'कल सुबह कोहरा', 'kohra kitna hai', 'visibility on the highway', 'is it foggy right now'],
  'alerts.list': ['Any warnings?', 'कोई चेतावनी है?', 'alert hai kya', 'is there a red alert', 'cyclone warning for Chennai'],
  'lightning.safety': ['What to do in lightning?', 'बिजली गिरे तो क्या करें', 'bijli gire to kya karein', 'thunder safety tips', 'garaj aur toofan mein kya karein'],
  'app.help': ['How do I add my farm?', 'Sky Snap kya hai', 'how does this app decide', 'how to change the text size', 'app kaise use kare'],
  greeting: ['namaste', 'Hello', 'hi', 'नमस्ते', 'good morning'],
  thanks: ['thanks', 'thank you', 'धन्यवाद', 'shukriya', 'dhanyavad'],
  'language.switch': ['Hindi mein batao', 'please answer in Hindi', 'हिंदी में बताओ', 'reply in English', 'english mein batao'],
};

for (const [intent, list] of Object.entries(UTTERANCES)) {
  test(`intent ${intent}`, () => {
    for (const u of list) assert.equal(classify(u).id, intent, `"${u}" -> ${classify(u).id}`);
  });
}

test('the catalogue covers all 24 intents plus greeting, thanks and language switch', () => {
  assert.equal(INTENT_IDS.length, 27);
  for (const id of INTENT_IDS) assert.ok(UTTERANCES[id]?.length >= 5, id);
  assert.ok(Object.values(UTTERANCES).flat().length >= 120);
});

test('unknown questions fall back instead of guessing', () => {
  for (const u of ['what is the capital of France', 'tell me a joke', 'asdf qwer', '', 'this is great']) {
    assert.equal(classify(u).id, 'fallback', u);
  }
});

test('word boundaries: "hi" inside "this" or "while" is not a greeting', () => {
  assert.notEqual(classify('this while think').id, 'greeting');
});

test('language switch target', () => {
  assert.equal(switchTarget('Hindi mein batao'), 'hi');
  assert.equal(switchTarget('reply in English'), 'en');
});

const EMERGENCIES = [
  ['help', 'general'], ['HELP!', 'general'], ['bachao', 'general'], ['बचाओ', 'general'], ['please help', 'general'],
  ['we are trapped', 'trapped'], ['फँस गए हैं', 'trapped'], ['hum phas gaye', 'trapped'],
  ['flood in my house', 'flood'], ['ghar mein paani aa gaya, bachao', 'flood'], ['घर में पानी आ गया', 'flood'], ['water rising fast', 'flood'],
  ['someone fainted', 'fainted'], ['papa behosh ho gaye', 'fainted'], ['he is not breathing', 'fainted'],
  ['lightning struck my neighbour', 'lightning'], ['बिजली गिरी', 'lightning'], ['bijli giri khet mein', 'lightning'],
  ['heat stroke', 'heat'], ['loo lag gayi', 'heat'], ['लू लग गई है', 'heat'],
  ['our boat missing since morning', 'boat'], ['नाव लापता है', 'boat'],
];

test('every emergency phrase is caught (PRD 10.6)', () => {
  for (const [u, kind] of EMERGENCIES) {
    const e = detectEmergency(u);
    assert.ok(e, `missed: ${u}`);
    assert.equal(e.kind, kind, u);
  }
});

test('ordinary questions are not treated as emergencies', () => {
  for (const u of ['how do I add my farm, help me understand', 'will it rain', 'what to do in lightning', 'heat today', 'help me pick a run time tomorrow']) {
    assert.equal(detectEmergency(u), null, u);
  }
});

test('normalise: punctuation, repeats, Hinglish spellings, nukta', () => {
  assert.deepEqual(normalise('Baarrrish kab hogi??'), ['baarrish', 'kab', 'hogi']);
  assert.deepEqual(normalise('baarish'), ['barish']);
  assert.deepEqual(normalise('छिड़काव'), normalise('छिडकाव'));
  assert.deepEqual(normalise('हफ़्ते'), normalise('हफ्ते'));
});

test('reply language follows the question', () => {
  assert.equal(detectLang('Will it rain today?'), 'en');
  assert.equal(detectLang('बारिश कब होगी'), 'hi');
  assert.equal(detectLang('kal subah lucknow mein baarish hogi?'), 'hi');
  assert.equal(detectLang('is it hot in kochi'), 'en');
  assert.equal(detectLang('', 'hi'), 'hi');
});

test('when: today, tomorrow, day after, weekday, part of day, hour, week', () => {
  const w = (s, dow = 2) => extractWhen(normalise(s), dow);
  assert.equal(w('rain today').day, 0);
  assert.equal(w('kal barish hogi').day, 1);
  assert.equal(w('kal barish hogi').assumed, false);
  assert.equal(w('kal barish').assumed, true);
  assert.equal(w('परसों').day, 2);
  assert.equal(w('rain on friday', 2).day, 3);
  assert.equal(w('rain on tuesday', 2).day, 7, 'same weekday means next week');
  assert.equal(w('kal subah').part, 'morning');
  assert.equal(w('shaam 7 baje').hour, 19);
  assert.equal(w('at 6 am').hour, 6);
  assert.equal(w('weather next week').range, 7);
});

test('activity and place slots', () => {
  assert.equal(extractActivity(normalise('best time for cycling')), 'cycle');
  assert.equal(extractActivity(normalise('दौड़ने का समय')), 'run');
  const places = [{ id: 'h', type: 'home', name: 'Gomti Nagar', lat: 26.85, lon: 81 }];
  assert.equal(extractPlace(normalise('rain at home'), { places }).place.id, 'h');
  assert.equal(extractPlace(normalise('ghar pe barish'), { places }).place.id, 'h');
  assert.equal(extractPlace(normalise('kal pune mein mausam')).place.name, 'Pune');
  assert.equal(extractPlace(normalise('लखनऊ में बारिश')).place.name, 'Lucknow');
  assert.equal(extractPlace(normalise('weather in bangalore')).place.name, 'Bengaluru');
  assert.equal(extractPlace(normalise('safe to swim at juhu')).kind, 'beach');
  assert.deepEqual(extractPlace(normalise('weather in shimla next week')), { kind: 'query', query: 'shimla' });
  assert.deepEqual(extractPlace(normalise('manali ka mausam')), { kind: 'query', query: 'manali' });
  assert.equal(extractPlace(normalise('will it rain today')).kind, null);
});
