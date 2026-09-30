/**
 * Seasonal planting guide (PRD sections 3.3.7 and 21.5). The 15 Planning
 * Commission agro-climatic zones, with common crops per season.
 *
 * GENERAL GUIDE ONLY. Crop lists must be reviewed against ICAR or state
 * agriculture department crop calendars before release (VERIFY). The UI
 * must say "Follow your KVK and the IMD agromet advisory for your district."
 * Names are bilingual here because they are data, not interface text.
 */

const c = (en, hi) => ({ en, hi });
const C = {
  paddy: c('Paddy', 'धान'), maize: c('Maize', 'मक्का'), arhar: c('Arhar (pigeon pea)', 'अरहर'), moong: c('Moong', 'मूंग'),
  urad: c('Urad', 'उड़द'), wheat: c('Wheat', 'गेहूँ'), mustard: c('Mustard', 'सरसों'), masoor: c('Lentil (masoor)', 'मसूर'),
  gram: c('Gram (chana)', 'चना'), potato: c('Potato', 'आलू'), watermelon: c('Watermelon', 'तरबूज'), cucumber: c('Cucumber', 'खीरा'),
  fodderMaize: c('Fodder maize', 'चारा मक्का'), cotton: c('Cotton', 'कपास'), soybean: c('Soybean', 'सोयाबीन'), jowar: c('Jowar', 'ज्वार'),
  bajra: c('Bajra', 'बाजरा'), groundnut: c('Groundnut', 'मूंगफली'), sugarcane: c('Sugarcane', 'गन्ना'), barley: c('Barley', 'जौ'),
  peas: c('Peas', 'मटर'), ragi: c('Ragi', 'रागी'), sunflower: c('Sunflower', 'सूरजमुखी'), sesame: c('Sesame (til)', 'तिल'),
  jute: c('Jute', 'पटसन'), vegetables: c('Vegetables', 'सब्ज़ियाँ'), apple: c('Apple (orchards)', 'सेब (बाग़)'),
  coconut: c('Coconut', 'नारियल'), banana: c('Banana', 'केला'), tapioca: c('Tapioca', 'टैपिओका'), pepper: c('Black pepper', 'काली मिर्च'),
  cumin: c('Cumin (jeera)', 'जीरा'), guar: c('Guar', 'ग्वार'), moth: c('Moth bean', 'मोठ'), rajma: c('Rajma', 'राजमा'),
  ginger: c('Ginger', 'अदरक'), tomato: c('Tomato', 'टमाटर'), chilli: c('Chilli', 'मिर्च'), onion: c('Onion', 'प्याज़'),
  garlic: c('Garlic', 'लहसुन'), cabbage: c('Cabbage', 'पत्तागोभी'), linseed: c('Linseed', 'अलसी'), cowpea: c('Cowpea', 'लोबिया'),
  castor: c('Castor', 'अरंडी'), turmeric: c('Turmeric', 'हल्दी'), okra: c('Okra (bhindi)', 'भिंडी'),
};

export const AGRO_ZONES = [
  { id: 'western-himalayan', name: c('Western Himalayan Region', 'पश्चिमी हिमालयी क्षेत्र'), states: ['Jammu and Kashmir', 'Ladakh', 'Himachal Pradesh', 'Uttarakhand'],
    crops: { kharif: [C.maize, C.paddy, C.rajma, C.ginger, C.vegetables], rabi: [C.wheat, C.barley, C.peas, C.mustard, C.garlic], zaid: [C.vegetables, C.cucumber, C.moong] } },
  { id: 'eastern-himalayan', name: c('Eastern Himalayan Region', 'पूर्वी हिमालयी क्षेत्र'), states: ['Sikkim', 'Arunachal Pradesh', 'Meghalaya', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura'],
    crops: { kharif: [C.paddy, C.maize, C.ginger, C.turmeric, C.vegetables], rabi: [C.mustard, C.potato, C.peas, C.cabbage, C.wheat], zaid: [C.vegetables, C.moong, C.cucumber] } },
  { id: 'lower-gangetic', name: c('Lower Gangetic Plains', 'निचला गंगा मैदान'), states: ['West Bengal'],
    crops: { kharif: [C.paddy, C.jute, C.arhar, C.vegetables], rabi: [C.potato, C.mustard, C.wheat, C.masoor, C.vegetables], zaid: [C.paddy, C.moong, C.sesame, C.vegetables] } },
  { id: 'middle-gangetic', name: c('Middle Gangetic Plains', 'मध्य गंगा मैदान'), states: ['Bihar'],
    crops: { kharif: [C.paddy, C.maize, C.arhar, C.moong], rabi: [C.wheat, C.mustard, C.masoor, C.gram, C.potato], zaid: [C.moong, C.watermelon, C.cucumber, C.fodderMaize] } },
  { id: 'upper-gangetic', name: c('Upper Gangetic Plains', 'ऊपरी गंगा मैदान'), states: ['Uttar Pradesh'],
    crops: { kharif: [C.paddy, C.maize, C.arhar, C.urad, C.sugarcane], rabi: [C.wheat, C.mustard, C.gram, C.peas, C.potato], zaid: [C.moong, C.urad, C.watermelon, C.cucumber] } },
  { id: 'trans-gangetic', name: c('Trans-Gangetic Plains', 'पार-गंगा मैदान'), states: ['Punjab', 'Haryana', 'Delhi', 'Chandigarh'],
    crops: { kharif: [C.paddy, C.cotton, C.maize, C.bajra], rabi: [C.wheat, C.mustard, C.barley, C.gram, C.potato], zaid: [C.moong, C.fodderMaize, C.vegetables] } },
  { id: 'eastern-plateau', name: c('Eastern Plateau and Hills', 'पूर्वी पठार और पहाड़ियाँ'), states: ['Jharkhand', 'Chhattisgarh'],
    crops: { kharif: [C.paddy, C.maize, C.arhar, C.ragi, C.urad], rabi: [C.wheat, C.gram, C.mustard, C.linseed, C.vegetables], zaid: [C.moong, C.vegetables] } },
  { id: 'central-plateau', name: c('Central Plateau and Hills', 'मध्य पठार और पहाड़ियाँ'), states: ['Madhya Pradesh'],
    crops: { kharif: [C.soybean, C.maize, C.jowar, C.arhar, C.urad], rabi: [C.wheat, C.gram, C.mustard, C.masoor], zaid: [C.moong, C.vegetables] } },
  { id: 'western-plateau', name: c('Western Plateau and Hills', 'पश्चिमी पठार और पहाड़ियाँ'), states: ['Maharashtra'],
    crops: { kharif: [C.cotton, C.soybean, C.jowar, C.arhar, C.bajra], rabi: [C.jowar, C.wheat, C.gram, C.onion], zaid: [C.groundnut, C.vegetables] } },
  { id: 'southern-plateau', name: c('Southern Plateau and Hills', 'दक्षिणी पठार और पहाड़ियाँ'), states: ['Karnataka', 'Telangana'],
    crops: { kharif: [C.ragi, C.maize, C.groundnut, C.arhar, C.cotton], rabi: [C.jowar, C.gram, C.sunflower, C.vegetables], zaid: [C.groundnut, C.vegetables, C.cowpea] } },
  { id: 'east-coast', name: c('East Coast Plains and Hills', 'पूर्वी तटीय मैदान और पहाड़ियाँ'), states: ['Odisha', 'Andhra Pradesh', 'Tamil Nadu', 'Puducherry'],
    crops: { kharif: [C.paddy, C.groundnut, C.arhar, C.cotton], rabi: [C.paddy, C.urad, C.moong, C.groundnut, C.vegetables], zaid: [C.sesame, C.moong, C.watermelon] } },
  { id: 'west-coast', name: c('West Coast Plains and Ghats', 'पश्चिमी तटीय मैदान और घाट'), states: ['Kerala', 'Goa'],
    crops: { kharif: [C.paddy, C.tapioca, C.ginger, C.turmeric, C.banana], rabi: [C.paddy, C.vegetables, C.cowpea, C.pepper], zaid: [C.vegetables, C.cucumber, C.coconut] } },
  { id: 'gujarat', name: c('Gujarat Plains and Hills', 'गुजरात के मैदान और पहाड़ियाँ'), states: ['Gujarat', 'Dadra and Nagar Haveli and Daman and Diu'],
    crops: { kharif: [C.cotton, C.groundnut, C.bajra, C.castor, C.arhar], rabi: [C.wheat, C.cumin, C.mustard, C.gram, C.garlic], zaid: [C.bajra, C.moong, C.sesame] } },
  { id: 'western-dry', name: c('Western Dry Region', 'पश्चिमी शुष्क क्षेत्र'), states: ['Rajasthan'],
    crops: { kharif: [C.bajra, C.moth, C.guar, C.moong, C.sesame], rabi: [C.mustard, C.gram, C.cumin, C.wheat, C.barley], zaid: [C.watermelon, C.vegetables] } },
  { id: 'islands', name: c('Island Region', 'द्वीप क्षेत्र'), states: ['Andaman and Nicobar Islands', 'Lakshadweep'],
    crops: { kharif: [C.paddy, C.vegetables, C.ginger], rabi: [C.vegetables, C.cowpea, C.okra], zaid: [C.vegetables, C.coconut, C.banana] } },
];

/** Assam and a few coastal states split across zones; pick the likelier one. */
const EXTRA = { Assam: 'eastern-himalayan', Karnataka: 'southern-plateau', Maharashtra: 'western-plateau' };

export function zoneForState(state) {
  if (!state) return null;
  const s = String(state).trim().toLowerCase();
  const direct = AGRO_ZONES.find((z) => z.states.some((x) => x.toLowerCase() === s));
  if (direct) return direct;
  const extra = Object.entries(EXTRA).find(([k]) => k.toLowerCase() === s);
  return extra ? AGRO_ZONES.find((z) => z.id === extra[1]) : null;
}

/**
 * The sowing season for a month: Kharif sowing June and July (plan in May),
 * Rabi sowing October to December (plan from August), Zaid March to May.
 */
export function sowingSeason(month) {
  if (month >= 5 && month <= 7) return 'kharif';
  if (month >= 8 && month <= 12) return 'rabi';
  return 'zaid';
}

const CONTAINER = {
  cool: [C.peas, C.tomato, c('Spinach (palak)', 'पालक'), c('Methi', 'मेथी'), c('Coriander', 'धनिया'), c('Radish', 'मूली'), c('Carrot', 'गाजर'), c('Marigold', 'गेंदा')],
  hot: [C.okra, C.chilli, c('Bottle gourd', 'लौकी'), C.cucumber, c('Amaranth (chaulai)', 'चौलाई'), c('Basil (tulsi)', 'तुलसी')],
  monsoon: [C.okra, c('Brinjal', 'बैंगन'), C.chilli, c('Ridge gourd', 'तोरई'), C.turmeric, C.ginger],
};

/** "What to grow this month" in containers (gardeners, PRD 3.3.7). */
export function containerPlants(month) {
  if (month >= 10 || month <= 2) return CONTAINER.cool;
  if (month <= 5) return CONTAINER.hot;
  return CONTAINER.monsoon;
}
