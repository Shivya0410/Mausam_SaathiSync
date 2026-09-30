/**
 * Popular Indian beaches (PRD 8.3) for the Beach and sea page. Coordinates
 * are approximate beach centres. `ripProne` marks beaches with a documented
 * history of rip currents or drownings; `lifeguards` is null when unknown.
 * VERIFY both flags with the state tourism or coastal police lists.
 */
const b = (id, name, state, lat, lon, ripProne = false, extra = {}) => ({ id, name, state, lat, lon, ripProne, lifeguards: null, ...extra });

export const BEACHES = [
  b('juhu', 'Juhu', 'Maharashtra', 19.098, 72.826, true),
  b('girgaum', 'Girgaum Chowpatty', 'Maharashtra', 18.954, 72.814, true),
  b('alibaug', 'Alibaug', 'Maharashtra', 18.641, 72.872),
  b('kashid', 'Kashid', 'Maharashtra', 18.44, 72.9, true),
  b('ganpatipule', 'Ganpatipule', 'Maharashtra', 17.147, 73.264, true),
  b('calangute', 'Calangute', 'Goa', 15.544, 73.755, true),
  b('baga', 'Baga', 'Goa', 15.556, 73.751, true),
  b('anjuna', 'Anjuna', 'Goa', 15.575, 73.741),
  b('colva', 'Colva', 'Goa', 15.279, 73.911, true),
  b('palolem', 'Palolem', 'Goa', 15.01, 74.023),
  b('gokarna', 'Gokarna', 'Karnataka', 14.519, 74.315, true),
  b('murudeshwar', 'Murudeshwar', 'Karnataka', 14.094, 74.485),
  b('malpe', 'Malpe', 'Karnataka', 13.35, 74.703, true),
  b('mulki', 'Mulki (surf)', 'Karnataka', 13.09, 74.785, false, { surf: true }),
  b('kovalam', 'Kovalam', 'Kerala', 8.4, 76.978, true, { surf: true }),
  b('varkala', 'Varkala', 'Kerala', 8.733, 76.703, true, { surf: true }),
  b('cherai', 'Cherai', 'Kerala', 10.141, 76.178),
  b('marari', 'Marari', 'Kerala', 9.6, 76.298),
  b('kappad', 'Kappad', 'Kerala', 11.384, 75.719),
  b('marina', 'Marina', 'Tamil Nadu', 13.05, 80.282, true),
  b('elliots', "Elliot's (Besant Nagar)", 'Tamil Nadu', 12.999, 80.272, true),
  b('mahabalipuram', 'Mahabalipuram', 'Tamil Nadu', 12.617, 80.199, true, { surf: true }),
  b('rameswaram', 'Rameswaram', 'Tamil Nadu', 9.288, 79.313),
  b('kanyakumari', 'Kanyakumari', 'Tamil Nadu', 8.078, 77.551, true),
  b('paradise', 'Paradise Beach', 'Puducherry', 11.883, 79.831),
  b('auroville', 'Auroville', 'Puducherry', 12.009, 79.859),
  b('rk-beach', 'RK Beach', 'Andhra Pradesh', 17.714, 83.323, true),
  b('rushikonda', 'Rushikonda', 'Andhra Pradesh', 17.782, 83.385, true),
  b('puri', 'Puri', 'Odisha', 19.798, 85.825, true),
  b('chandipur', 'Chandipur', 'Odisha', 21.462, 87.016),
  b('gopalpur', 'Gopalpur', 'Odisha', 19.263, 84.915, true),
  b('digha', 'Digha', 'West Bengal', 21.627, 87.51, true),
  b('mandarmani', 'Mandarmani', 'West Bengal', 21.666, 87.699),
  b('radhanagar', 'Radhanagar (Havelock)', 'Andaman and Nicobar Islands', 11.984, 92.951),
  b('corbyns-cove', "Corbyn's Cove", 'Andaman and Nicobar Islands', 11.643, 92.749),
  b('somnath', 'Somnath', 'Gujarat', 20.888, 70.4, true),
  b('mandvi', 'Mandvi', 'Gujarat', 22.823, 69.355),
  b('diu-nagoa', 'Nagoa (Diu)', 'Dadra and Nagar Haveli and Daman and Diu', 20.709, 70.917),
  b('tithal', 'Tithal', 'Gujarat', 20.599, 72.9),
];
