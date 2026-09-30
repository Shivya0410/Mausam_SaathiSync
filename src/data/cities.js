/**
 * Quick-pick cities for onboarding and the search fallback (PRD 26.1).
 * Approximate city-centre coordinates: fine for forecasts. VERIFY before
 * using them for anything more precise.
 */
export const CITIES = [
  { id: 'delhi', name: 'Delhi', nameHi: 'दिल्ली', lat: 28.61, lon: 77.21, state: 'Delhi' },
  { id: 'mumbai', name: 'Mumbai', nameHi: 'मुंबई', lat: 19.08, lon: 72.88, state: 'Maharashtra', coastal: true },
  { id: 'kolkata', name: 'Kolkata', nameHi: 'कोलकाता', lat: 22.57, lon: 88.36, state: 'West Bengal' },
  { id: 'chennai', name: 'Chennai', nameHi: 'चेन्नई', lat: 13.08, lon: 80.27, state: 'Tamil Nadu', coastal: true },
  { id: 'bengaluru', name: 'Bengaluru', nameHi: 'बेंगलुरु', lat: 12.97, lon: 77.59, state: 'Karnataka' },
  { id: 'hyderabad', name: 'Hyderabad', nameHi: 'हैदराबाद', lat: 17.39, lon: 78.49, state: 'Telangana' },
  { id: 'ahmedabad', name: 'Ahmedabad', nameHi: 'अहमदाबाद', lat: 23.02, lon: 72.57, state: 'Gujarat' },
  { id: 'pune', name: 'Pune', nameHi: 'पुणे', lat: 18.52, lon: 73.86, state: 'Maharashtra' },
  { id: 'jaipur', name: 'Jaipur', nameHi: 'जयपुर', lat: 26.91, lon: 75.79, state: 'Rajasthan' },
  { id: 'lucknow', name: 'Lucknow', nameHi: 'लखनऊ', lat: 26.85, lon: 80.95, state: 'Uttar Pradesh' },
  { id: 'patna', name: 'Patna', nameHi: 'पटना', lat: 25.59, lon: 85.14, state: 'Bihar' },
  { id: 'guwahati', name: 'Guwahati', nameHi: 'गुवाहाटी', lat: 26.14, lon: 91.74, state: 'Assam' },
];
