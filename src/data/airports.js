/**
 * Major Indian airports (PRD 8.4) for flight weather (METAR/TAF from
 * aviationweather.gov). Coordinates approximate. VERIFY codes and
 * coordinates against the AAI list before release.
 */
export const AIRPORTS = [
  { icao: 'VIDP', iata: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', lat: 28.566, lon: 77.103 },
  { icao: 'VABB', iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', lat: 19.089, lon: 72.868 },
  { icao: 'VOBL', iata: 'BLR', name: 'Kempegowda International', city: 'Bengaluru', lat: 13.199, lon: 77.706 },
  { icao: 'VOMM', iata: 'MAA', name: 'Chennai International', city: 'Chennai', lat: 12.99, lon: 80.169 },
  { icao: 'VECC', iata: 'CCU', name: 'Netaji Subhas Chandra Bose International', city: 'Kolkata', lat: 22.654, lon: 88.447 },
  { icao: 'VOHS', iata: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', lat: 17.231, lon: 78.43 },
  { icao: 'VAAH', iata: 'AMD', name: 'Sardar Vallabhbhai Patel International', city: 'Ahmedabad', lat: 23.077, lon: 72.635 },
  { icao: 'VAPO', iata: 'PNQ', name: 'Pune', city: 'Pune', lat: 18.582, lon: 73.92 },
  { icao: 'VOGO', iata: 'GOI', name: 'Dabolim', city: 'Goa', lat: 15.381, lon: 73.831 },
  { icao: 'VOGA', iata: 'GOX', name: 'Manohar International (Mopa)', city: 'Goa', lat: 15.744, lon: 73.861 },
  { icao: 'VOCI', iata: 'COK', name: 'Cochin International', city: 'Kochi', lat: 10.152, lon: 76.402 },
  { icao: 'VOTV', iata: 'TRV', name: 'Thiruvananthapuram International', city: 'Thiruvananthapuram', lat: 8.482, lon: 76.92 },
  { icao: 'VOCL', iata: 'CCJ', name: 'Calicut International', city: 'Kozhikode', lat: 11.137, lon: 75.955 },
  { icao: 'VILK', iata: 'LKO', name: 'Chaudhary Charan Singh International', city: 'Lucknow', lat: 26.761, lon: 80.889 },
  { icao: 'VIJP', iata: 'JAI', name: 'Jaipur International', city: 'Jaipur', lat: 26.824, lon: 75.812 },
  { icao: 'VEPT', iata: 'PAT', name: 'Jay Prakash Narayan', city: 'Patna', lat: 25.591, lon: 85.088 },
  { icao: 'VEGT', iata: 'GAU', name: 'Lokpriya Gopinath Bordoloi International', city: 'Guwahati', lat: 26.106, lon: 91.586 },
  { icao: 'VIBN', iata: 'VNS', name: 'Lal Bahadur Shastri International', city: 'Varanasi', lat: 25.452, lon: 82.859 },
  { icao: 'VISR', iata: 'SXR', name: 'Srinagar International', city: 'Srinagar', lat: 33.987, lon: 74.774 },
  { icao: 'VILH', iata: 'IXL', name: 'Kushok Bakula Rimpochee', city: 'Leh', lat: 34.136, lon: 77.546 },
  { icao: 'VOBZ', iata: 'VGA', name: 'Vijayawada International', city: 'Vijayawada', lat: 16.53, lon: 80.797 },
  { icao: 'VOVZ', iata: 'VTZ', name: 'Visakhapatnam International', city: 'Visakhapatnam', lat: 17.721, lon: 83.225 },
  { icao: 'VEBS', iata: 'BBI', name: 'Biju Patnaik International', city: 'Bhubaneswar', lat: 20.244, lon: 85.818 },
  { icao: 'VERC', iata: 'IXR', name: 'Birsa Munda', city: 'Ranchi', lat: 23.314, lon: 85.321 },
  { icao: 'VANP', iata: 'NAG', name: 'Dr. Babasaheb Ambedkar International', city: 'Nagpur', lat: 21.092, lon: 79.047 },
  { icao: 'VABP', iata: 'BHO', name: 'Raja Bhoj', city: 'Bhopal', lat: 23.288, lon: 77.337 },
  { icao: 'VAID', iata: 'IDR', name: 'Devi Ahilya Bai Holkar', city: 'Indore', lat: 22.722, lon: 75.801 },
  { icao: 'VICG', iata: 'IXC', name: 'Chandigarh International', city: 'Chandigarh', lat: 30.673, lon: 76.788 },
  { icao: 'VIAR', iata: 'ATQ', name: 'Sri Guru Ram Dass Jee International', city: 'Amritsar', lat: 31.71, lon: 74.797 },
  { icao: 'VOMD', iata: 'IXM', name: 'Madurai', city: 'Madurai', lat: 9.834, lon: 78.093 },
  { icao: 'VOTR', iata: 'TRZ', name: 'Tiruchirappalli International', city: 'Tiruchirappalli', lat: 10.765, lon: 78.71 },
];

export const AIRPORT_BY_ICAO = Object.fromEntries(AIRPORTS.map((a) => [a.icao, a]));
