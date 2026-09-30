// Fitness events for the Home map and the /events pages.
//
// ILLUSTRATIVE LISTINGS. Names, dates and prices are sample data for the
// demo, not scraped or confirmed with organisers, and the pages say so on
// screen. Where a real series is referenced (HYROX), the link goes to the
// organiser's own site so a visitor can check the real schedule there.
//
// Dates are plain local dates (YYYY-MM-DD). Whether an event is upcoming is
// worked out at render time against today's date, not stored.

export const EVENT_TYPES = {
  running: { label: 'Running', icon: 'fa-solid fa-person-running' },
  hyrox: { label: 'HYROX & Functional', icon: 'fa-solid fa-dumbbell' },
  cycling: { label: 'Cycling', icon: 'fa-solid fa-person-biking' },
  yoga: { label: 'Yoga', icon: 'fa-solid fa-spa' },
  trek: { label: 'Trek & Trail', icon: 'fa-solid fa-person-hiking' },
  swimming: { label: 'Swimming', icon: 'fa-solid fa-person-swimming' },
  dance: { label: 'Dance Fitness', icon: 'fa-solid fa-music' },
  walk: { label: 'Walkathon', icon: 'fa-solid fa-person-walking' },
  adaptive: { label: 'Para & Adaptive', icon: 'fa-solid fa-wheelchair' },
  triathlon: { label: 'Triathlon', icon: 'fa-solid fa-medal' },
};

export const AGE_GROUPS = {
  kids: 'Kids (under 13)',
  teens: 'Teens (13–17)',
  adults: 'Adults (18–39)',
  masters: 'Masters (40–59)',
  seniors: 'Seniors (60+)',
};

export const ACCESS_TAGS = {
  wheelchair: { label: 'Wheelchair accessible', icon: 'fa-solid fa-wheelchair' },
  women: { label: 'Women-only category', icon: 'fa-solid fa-venus' },
  seniors: { label: 'Senior-friendly', icon: 'fa-solid fa-person-cane' },
  beginners: { label: 'Beginner-friendly', icon: 'fa-solid fa-seedling' },
  isl: { label: 'ISL interpreter', icon: 'fa-solid fa-hands' },
  family: { label: 'Family & kids', icon: 'fa-solid fa-children' },
};

export const CITIES = [
  { slug: 'delhi', name: 'Delhi NCR', state: 'Delhi', coordinates: [28.6139, 77.209] },
  { slug: 'mumbai', name: 'Mumbai', state: 'Maharashtra', coordinates: [19.076, 72.8777] },
  { slug: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', coordinates: [12.9716, 77.5946] },
  { slug: 'chennai', name: 'Chennai', state: 'Tamil Nadu', coordinates: [13.0827, 80.2707] },
  { slug: 'kolkata', name: 'Kolkata', state: 'West Bengal', coordinates: [22.5726, 88.3639] },
  { slug: 'hyderabad', name: 'Hyderabad', state: 'Telangana', coordinates: [17.385, 78.4867] },
  { slug: 'pune', name: 'Pune', state: 'Maharashtra', coordinates: [18.5204, 73.8567] },
  { slug: 'jaipur', name: 'Jaipur', state: 'Rajasthan', coordinates: [26.9124, 75.7873] },
  { slug: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', coordinates: [23.0225, 72.5714] },
  { slug: 'goa', name: 'Goa', state: 'Goa', coordinates: [15.4909, 73.8278] },
  { slug: 'chandigarh', name: 'Chandigarh', state: 'Chandigarh', coordinates: [30.7333, 76.7794] },
  { slug: 'kochi', name: 'Kochi', state: 'Kerala', coordinates: [9.9312, 76.2673] },
  { slug: 'guwahati', name: 'Guwahati', state: 'Assam', coordinates: [26.1445, 91.7362] },
  { slug: 'leh', name: 'Leh', state: 'Ladakh', coordinates: [34.1526, 77.5771] },
  { slug: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', coordinates: [26.8467, 80.9462] },
  { slug: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha', coordinates: [20.2961, 85.8245] },
];

const free = { free: true, tiers: [{ label: 'Entry', amount: 0 }] };
const paid = (...tiers) => ({ free: false, tiers: tiers.map(([label, amount]) => ({ label, amount })) });

export const EVENTS = [
  // ── Delhi NCR ──────────────────────────────────────────────
  {
    id: 'hyrox-delhi-2026', city: 'delhi', type: 'hyrox', title: 'HYROX Delhi',
    organiser: 'HYROX India', date: '2026-10-24', endDate: '2026-10-25', time: '07:00',
    venue: 'Indira Gandhi Indoor Stadium', address: 'IP Estate, New Delhi 110002',
    price: paid(['Open (Singles)', 8499], ['Doubles (per team)', 14999], ['Relay of 4 (per team)', 21999], ['Spectator', 499]),
    ageGroups: ['adults', 'masters', 'seniors'], access: ['wheelchair', 'women'], level: 'Intermediate',
    formats: ['8 × 1 km run + 8 workout stations', 'Singles', 'Doubles', 'Relay'],
    capacity: 2400, registered: 2210, registrationCloses: '2026-10-10',
    description: 'The fitness race format that pairs eight 1 km runs with eight functional workout stations (SkiErg, sled push and pull, burpee broad jumps, rowing, farmers carry, sandbag lunges and wall balls). Doubles and relay categories make it approachable if you are new.',
    highlights: ['Age-group rankings from 16 to 70+', 'Adaptive division with modified stations', 'Free warm-up zone with coaches'],
    includes: ['Timing chip', 'Finisher medal', 'Event T-shirt', 'Post-race recovery zone'],
    bring: ['Training shoes with good grip', 'Government ID', 'Water bottle'],
    website: 'https://hyrox.com', photo: 'hyrox-1',
  },
  {
    id: 'delhi-half-marathon-2026', city: 'delhi', type: 'running', title: 'Delhi Autumn Half Marathon',
    organiser: 'Capital Runners Collective', date: '2026-10-18', time: '05:30',
    venue: 'Jawaharlal Nehru Stadium', address: 'Pragati Vihar, New Delhi 110003',
    price: paid(['Half Marathon 21.1 km', 2199], ['10 km', 1499], ['Great Delhi Run 5 km', 699]),
    ageGroups: ['teens', 'adults', 'masters', 'seniors'], access: ['wheelchair', 'seniors', 'beginners'], level: 'All levels',
    formats: ['21.1 km', '10 km', '5 km fun run', 'Wheelchair 5 km'],
    capacity: 18000, registered: 15230, registrationCloses: '2026-09-30',
    description: 'A flat, fast course through Lutyens’ Delhi before the city wakes up, with a separate senior citizens’ run and a wheelchair category.',
    highlights: ['Hydration every 2.5 km', 'Pacers for 1:45 to 2:45', 'Medical support on course'],
    includes: ['Timed bib', 'Finisher medal', 'Dry-fit T-shirt', 'Breakfast'],
    bring: ['Bib collected at expo', 'Light layer for the early start'], photo: 'running-1',
  },
  {
    id: 'lodhi-parkrun-sat', city: 'delhi', type: 'running', title: 'Saturday Community 5K, Lodhi Garden',
    organiser: 'Lodhi Morning Runners', date: '2026-09-19', time: '06:30',
    venue: 'Lodhi Garden, Gate 1', address: 'Lodhi Road, New Delhi 110003',
    price: free, ageGroups: ['kids', 'teens', 'adults', 'masters', 'seniors'], access: ['wheelchair', 'beginners', 'seniors', 'family'], level: 'Beginner',
    formats: ['5 km, walk, jog or run'], capacity: 300, registered: 146, registrationCloses: '2026-09-18',
    description: 'A free, weekly, untimed 5K where walkers are as welcome as runners. Prams, dogs on a leash and wheelchairs are all fine on the paved loop.',
    highlights: ['Volunteer tail walker so nobody finishes last', 'Chai meet-up afterwards'],
    includes: ['Friendly faces'], bring: ['Water'], photo: 'running-2',
  },
  {
    id: 'raahgiri-cp-ride', city: 'delhi', type: 'cycling', title: 'Car-free Sunday Ride, Connaught Place',
    organiser: 'Delhi Cycling Club', date: '2026-09-27', time: '06:00',
    venue: 'Central Park, Connaught Place', address: 'Connaught Place, New Delhi 110001',
    price: free, ageGroups: ['kids', 'teens', 'adults', 'masters', 'seniors'], access: ['beginners', 'family', 'women'], level: 'Beginner',
    formats: ['10 km social loop'], capacity: 500, registered: 212, registrationCloses: '2026-09-26',
    description: 'A relaxed group ride on closed roads. Bring any bicycle; a limited number of loaner cycles and helmets are available.',
    highlights: ['Ride marshals every 500 m', 'Bike safety check before start'], includes: ['Loaner helmet on request'],
    bring: ['Your cycle', 'Helmet', 'Water'], photo: 'cycling-3',
  },
  {
    id: 'delhi-para-sports-day', city: 'delhi', type: 'adaptive', title: 'Inclusive Para-Sports Festival',
    organiser: 'Ability Sports Foundation', date: '2026-11-08', time: '09:00',
    venue: 'Thyagaraj Sports Complex', address: 'INA Colony, New Delhi 110023',
    price: free, ageGroups: ['kids', 'teens', 'adults', 'masters', 'seniors'], access: ['wheelchair', 'isl', 'family', 'beginners'], level: 'All levels',
    formats: ['Wheelchair racing 400 m', 'Boccia', 'Blind football try-out', 'Sitting volleyball'],
    capacity: 800, registered: 318, registrationCloses: '2026-11-01',
    description: 'A day of try-out sessions and friendly races for athletes with disabilities, their families and anyone curious. Coaches, adaptive equipment and ISL interpreters are on site.',
    highlights: ['Accessible transport from Jor Bagh metro', 'Classification guidance desk', 'Quiet room'],
    includes: ['Equipment', 'Lunch', 'Participation certificate'], bring: ['Carer or companion (entry free)'], photo: 'para-1',
  },
  {
    id: 'gurugram-sunrise-yoga', city: 'delhi', type: 'yoga', title: 'Sunrise Yoga at Aravalli Biodiversity Park',
    organiser: 'Swasth Community', date: '2026-10-04', time: '06:15',
    venue: 'Aravalli Biodiversity Park', address: 'Sector 29, Gurugram, Haryana',
    price: paid(['Drop-in', 199]), ageGroups: ['teens', 'adults', 'masters', 'seniors'], access: ['seniors', 'beginners', 'women'], level: 'Beginner',
    formats: ['75 min Hatha flow', 'Chair yoga corner'], capacity: 120, registered: 104, registrationCloses: '2026-10-03',
    description: 'A gentle outdoor session with a separate chair-yoga corner for anyone who prefers not to get down on the mat.',
    highlights: ['Mats provided', 'Guided breathing close'], includes: ['Mat', 'Herbal drink'], bring: ['Comfortable clothes'], photo: 'yoga-3',
  },
  {
    id: 'noida-womens-10k', city: 'delhi', type: 'running', title: 'Women’s Power 10K',
    organiser: 'StrideHer', date: '2026-11-22', time: '06:00',
    venue: 'Noida Stadium', address: 'Sector 21A, Noida, Uttar Pradesh',
    price: paid(['10 km', 999], ['5 km', 599], ['3 km walk', 299]),
    ageGroups: ['teens', 'adults', 'masters', 'seniors'], access: ['women', 'beginners', 'seniors'], level: 'All levels',
    formats: ['10 km', '5 km', '3 km walk'], capacity: 5000, registered: 1920, registrationCloses: '2026-11-15',
    description: 'A women-only run with a walking category and a creche so parents can take part.',
    highlights: ['Creche on site', 'All-women marshal team'], includes: ['Bib', 'Medal', 'T-shirt'], bring: ['ID'], photo: 'running-3',
  },
  {
    id: 'delhi-zumba-marathon', city: 'delhi', type: 'dance', title: 'Zumbathon for Clean Air',
    organiser: 'Move Delhi', date: '2026-08-30', time: '17:30',
    venue: 'India Gate Lawns', address: 'Rajpath, New Delhi 110001',
    price: free, ageGroups: ['kids', 'teens', 'adults', 'masters', 'seniors'], access: ['family', 'beginners', 'seniors'], level: 'Beginner',
    formats: ['2-hour dance session'], capacity: 1500, registered: 1500, registrationCloses: '2026-08-29',
    description: 'A two-hour open-air dance session with low-impact options throughout.',
    highlights: ['Low-impact instructor on stage'], includes: ['Water'], bring: ['Water bottle'], photo: 'dancing-2',
  },

  // ── Mumbai ─────────────────────────────────────────────────
  {
    id: 'hyrox-mumbai-2027', city: 'mumbai', type: 'hyrox', title: 'HYROX Mumbai',
    organiser: 'HYROX India', date: '2027-02-06', endDate: '2027-02-07', time: '07:00',
    venue: 'NSCI Dome', address: 'Worli, Mumbai 400018',
    price: paid(['Open (Singles)', 8499], ['Doubles (per team)', 14999], ['Relay of 4 (per team)', 21999]),
    ageGroups: ['adults', 'masters', 'seniors'], access: ['wheelchair', 'women'], level: 'Intermediate',
    formats: ['8 × 1 km run + 8 workout stations'], capacity: 2600, registered: 1180, registrationCloses: '2027-01-20',
    description: 'The Mumbai stop of the HYROX fitness racing series, with Singles, Doubles and Relay categories.',
    highlights: ['Adaptive division', 'Age-group podiums'], includes: ['Timing chip', 'Medal'], bring: ['Training shoes'],
    website: 'https://hyrox.com', photo: 'strength-1',
  },
  {
    id: 'mumbai-marine-drive-run', city: 'mumbai', type: 'running', title: 'Marine Drive Monsoon-end 10K',
    organiser: 'Bombay Road Runners', date: '2026-10-11', time: '05:45',
    venue: 'Marine Drive', address: 'Netaji Subhash Chandra Bose Road, Mumbai',
    price: paid(['10 km', 1299], ['5 km', 699]), ageGroups: ['teens', 'adults', 'masters', 'seniors'], access: ['wheelchair', 'beginners'], level: 'All levels',
    formats: ['10 km', '5 km'], capacity: 6000, registered: 4100, registrationCloses: '2026-10-04',
    description: 'A seafront out-and-back on the Queen’s Necklace with sunrise over the bay.',
    highlights: ['Flat course', 'Wheelchair start wave'], includes: ['Bib', 'Medal'], bring: ['ID'], photo: 'running-1',
  },
  {
    id: 'mumbai-sea-swim', city: 'mumbai', type: 'swimming', title: 'Open Water Swim Clinic',
    organiser: 'Aqua Mumbai', date: '2026-11-15', time: '07:00',
    venue: 'Andheri Sports Complex Pool', address: 'Andheri West, Mumbai 400053',
    price: paid(['Clinic', 1800]), ageGroups: ['teens', 'adults', 'masters'], access: ['women', 'beginners'], level: 'Beginner',
    formats: ['3-hour pool-to-open-water clinic'], capacity: 40, registered: 33, registrationCloses: '2026-11-08',
    description: 'Learn sighting, drafting and calm breathing in the pool before a supervised short open-water session.',
    highlights: ['1 coach per 6 swimmers', 'Women-only lane'], includes: ['Swim cap', 'Tow float'], bring: ['Swimsuit', 'Goggles'], photo: 'swimming-1',
  },
  {
    id: 'mumbai-senior-walk', city: 'mumbai', type: 'walk', title: 'Silver Steps Walkathon',
    organiser: 'Juhu Senior Citizens Forum', date: '2026-10-01', time: '07:00',
    venue: 'Juhu Beach Promenade', address: 'Juhu, Mumbai 400049',
    price: free, ageGroups: ['masters', 'seniors'], access: ['seniors', 'wheelchair', 'isl'], level: 'Beginner',
    formats: ['2 km walk', '4 km walk'], capacity: 600, registered: 355, registrationCloses: '2026-09-29',
    description: 'A gentle walk on International Day of Older Persons with rest benches, a medical tent and volunteers every 200 m.',
    highlights: ['Blood pressure check desk', 'Wheelchair pushers on request'], includes: ['Cap', 'Breakfast'], bring: ['Walking shoes'], photo: 'walkathon-1',
  },

  // ── Bengaluru ──────────────────────────────────────────────
  {
    id: 'hyrox-bengaluru-2026', city: 'bengaluru', type: 'hyrox', title: 'HYROX Bengaluru',
    organiser: 'HYROX India', date: '2026-12-12', endDate: '2026-12-13', time: '07:00',
    venue: 'Bangalore International Exhibition Centre', address: 'Tumkur Road, Bengaluru 562123',
    price: paid(['Open (Singles)', 8499], ['Doubles (per team)', 14999], ['Relay of 4 (per team)', 21999]),
    ageGroups: ['adults', 'masters', 'seniors'], access: ['wheelchair', 'women'], level: 'Intermediate',
    formats: ['8 × 1 km run + 8 workout stations'], capacity: 3000, registered: 1640, registrationCloses: '2026-11-28',
    description: 'HYROX’s Bengaluru race weekend with training workshops on the Friday.',
    highlights: ['Friday training clinics', 'Adaptive division'], includes: ['Chip', 'Medal'], bring: ['Training shoes'],
    website: 'https://hyrox.com', photo: 'strength-2',
  },
  {
    id: 'blr-cubbon-yoga', city: 'bengaluru', type: 'yoga', title: 'Cubbon Park Community Yoga',
    organiser: 'Namma Yoga Circle', date: '2026-09-20', time: '06:30',
    venue: 'Cubbon Park Bandstand', address: 'Kasturba Road, Bengaluru 560001',
    price: free, ageGroups: ['kids', 'teens', 'adults', 'masters', 'seniors'], access: ['seniors', 'beginners', 'family', 'wheelchair'], level: 'Beginner',
    formats: ['60 min session'], capacity: 250, registered: 188, registrationCloses: '2026-09-19',
    description: 'A free Sunday session under the trees. Chair and wheelchair adaptations are taught alongside the mat version.',
    highlights: ['Adaptive yoga teacher present'], includes: ['Nothing, just turn up'], bring: ['Mat or towel'], photo: 'yoga-1',
  },
  {
    id: 'blr-trail-run', city: 'bengaluru', type: 'trek', title: 'Nandi Hills Sunrise Trail Run',
    organiser: 'Trail Karnataka', date: '2026-11-01', time: '05:00',
    venue: 'Nandi Hills base', address: 'Chikkaballapur, Karnataka',
    price: paid(['25 km trail', 2499], ['12 km trail', 1699]), ageGroups: ['adults', 'masters'], access: [], level: 'Advanced',
    formats: ['25 km', '12 km'], capacity: 700, registered: 690, registrationCloses: '2026-10-20',
    description: 'A hilly trail race with about 900 m of climbing on the long course. Cut-off times apply.',
    highlights: ['Mandatory kit check', 'Sweeper runners'], includes: ['Bib', 'Medal', 'Breakfast'], bring: ['Headlamp', '1 L water', 'Trail shoes'], photo: 'hiking-3',
  },
  {
    id: 'blr-cyclothon', city: 'bengaluru', type: 'cycling', title: 'Green Commute Cyclothon',
    organiser: 'Bike to Work Bengaluru', date: '2026-10-25', time: '06:00',
    venue: 'Kanteerava Stadium', address: 'Kasturba Road, Bengaluru 560001',
    price: paid(['50 km', 999], ['25 km', 599], ['Kids 5 km', 199]), ageGroups: ['kids', 'teens', 'adults', 'masters'], access: ['family', 'beginners'], level: 'All levels',
    formats: ['50 km', '25 km', '5 km kids'], capacity: 3000, registered: 1210, registrationCloses: '2026-10-18',
    description: 'A city ride promoting cycling as everyday transport, with a separate short loop for children.',
    highlights: ['Bike repair stations', 'Kids loop on closed road'], includes: ['Bib', 'Medal'], bring: ['Helmet (mandatory)'], photo: 'cycling-2',
  },

  // ── Chennai ────────────────────────────────────────────────
  {
    id: 'chennai-beach-run', city: 'chennai', type: 'running', title: 'Besant Nagar Beach Run',
    organiser: 'Chennai Runners', date: '2026-12-06', time: '05:30',
    venue: 'Elliot’s Beach', address: 'Besant Nagar, Chennai 600090',
    price: paid(['21.1 km', 1799], ['10 km', 1199], ['5 km', 599]), ageGroups: ['teens', 'adults', 'masters', 'seniors'], access: ['beginners', 'seniors'], level: 'All levels',
    formats: ['21.1 km', '10 km', '5 km'], capacity: 8000, registered: 3900, registrationCloses: '2026-11-29',
    description: 'A coastal run finishing on the sand with filter coffee at the end.',
    highlights: ['Senior citizen category'], includes: ['Bib', 'Medal', 'T-shirt'], bring: ['Cap'], photo: 'running-2',
  },
  {
    id: 'chennai-triathlon', city: 'chennai', type: 'triathlon', title: 'East Coast Sprint Triathlon',
    organiser: 'Tri Tamil Nadu', date: '2027-01-17', time: '06:00',
    venue: 'Muttukadu Boat House', address: 'East Coast Road, Chennai',
    price: paid(['Sprint (individual)', 3999], ['Relay team of 3', 6999]), ageGroups: ['teens', 'adults', 'masters'], access: ['women'], level: 'Intermediate',
    formats: ['750 m swim', '20 km cycle', '5 km run'], capacity: 400, registered: 212, registrationCloses: '2027-01-05',
    description: 'A beginner-to-intermediate sprint triathlon in calm backwater with relay teams for those who want to try just one leg.',
    highlights: ['Wetsuit optional', 'Relay category'], includes: ['Swim cap', 'Chip', 'Medal'], bring: ['Helmet', 'Bike'], photo: 'triathlon-1',
  },

  // ── Kolkata ────────────────────────────────────────────────
  {
    id: 'kolkata-maidan-walk', city: 'kolkata', type: 'walk', title: 'Maidan Heart Walk',
    organiser: 'Kolkata Walks Together', date: '2026-09-29', time: '06:30',
    venue: 'Maidan, near Victoria Memorial', address: 'Queen’s Way, Kolkata 700071',
    price: free, ageGroups: ['kids', 'teens', 'adults', 'masters', 'seniors'], access: ['seniors', 'wheelchair', 'family', 'beginners'], level: 'Beginner',
    formats: ['3 km walk'], capacity: 2000, registered: 740, registrationCloses: '2026-09-28',
    description: 'A World Heart Day walk around the Maidan with free health awareness stalls.',
    highlights: ['Accessible route'], includes: ['Cap'], bring: ['Water'], photo: 'walkathon-1',
  },
  {
    id: 'kolkata-durga-dance', city: 'kolkata', type: 'dance', title: 'Dhunuchi Dance Fitness Workshop',
    organiser: 'Nritya Fit', date: '2026-10-10', time: '18:00',
    venue: 'Rabindra Sarobar Stadium Hall', address: 'Lake Gardens, Kolkata 700045',
    price: paid(['Workshop', 349]), ageGroups: ['teens', 'adults', 'masters'], access: ['women', 'beginners'], level: 'Beginner',
    formats: ['90 min workshop'], capacity: 80, registered: 61, registrationCloses: '2026-10-09',
    description: 'A festive dance cardio class inspired by the dhunuchi naach, in time for Durga Puja.',
    highlights: ['No dance experience needed'], includes: ['Water'], bring: ['Comfortable clothes'], photo: 'dancing-1',
  },

  // ── Hyderabad ──────────────────────────────────────────────
  {
    id: 'hyd-functional-games', city: 'hyderabad', type: 'hyrox', title: 'Deccan Functional Fitness Games',
    organiser: 'Box Hyderabad', date: '2026-11-29', time: '08:00',
    venue: 'Gachibowli Indoor Stadium', address: 'Gachibowli, Hyderabad 500032',
    price: paid(['Scaled', 2499], ['Rx', 3499], ['Teams of 3', 7499]), ageGroups: ['teens', 'adults', 'masters'], access: ['women'], level: 'Intermediate',
    formats: ['Scaled', 'Rx', 'Teams'], capacity: 360, registered: 245, registrationCloses: '2026-11-15',
    description: 'A two-day functional fitness competition with a scaled division for first-timers.',
    highlights: ['Scaled division', 'Masters 40+ category'], includes: ['Athlete kit'], bring: ['Lifting shoes (optional)'], photo: 'strength-3',
  },
  {
    id: 'hyd-lake-run', city: 'hyderabad', type: 'running', title: 'Hussain Sagar Night Run',
    organiser: 'Hyderabad Runners Society', date: '2026-10-31', time: '19:00',
    venue: 'Necklace Road', address: 'Necklace Road, Hyderabad 500063',
    price: paid(['10 km', 1100], ['5 km', 650]), ageGroups: ['teens', 'adults', 'masters'], access: ['wheelchair', 'beginners'], level: 'All levels',
    formats: ['10 km', '5 km'], capacity: 5000, registered: 2600, registrationCloses: '2026-10-24',
    description: 'A lit-up evening loop around the lake with music stations along the way.',
    highlights: ['Evening start avoids the heat'], includes: ['Glow bib', 'Medal'], bring: ['Reflective gear'], photo: 'running-3',
  },

  // ── Pune ───────────────────────────────────────────────────
  {
    id: 'pune-sinhagad-trek', city: 'pune', type: 'trek', title: 'Sinhagad Fort Heritage Trek',
    organiser: 'Sahyadri Trekkers', date: '2026-10-18', time: '05:30',
    venue: 'Sinhagad base village', address: 'Donje, Pune district',
    price: paid(['Guided trek', 499]), ageGroups: ['teens', 'adults', 'masters'], access: ['beginners'], level: 'Beginner',
    formats: ['2.7 km ascent, about 3 hours'], capacity: 60, registered: 42, registrationCloses: '2026-10-16',
    description: 'A guided morning trek up a historic fort with stops to explain its history.',
    highlights: ['Certified trek leader', 'Pitla bhakri breakfast at the top'], includes: ['Guide', 'Breakfast'], bring: ['Shoes with grip', '2 L water'], photo: 'hiking-1',
  },
  {
    id: 'pune-kids-triathlon', city: 'pune', type: 'triathlon', title: 'Kids Aquathlon & Tri Fun Day',
    organiser: 'Pune Tri Club', date: '2026-12-20', time: '07:00',
    venue: 'Balewadi Sports Complex', address: 'Balewadi, Pune 411045',
    price: paid(['Child entry', 599]), ageGroups: ['kids', 'teens'], access: ['family', 'beginners'], level: 'Beginner',
    formats: ['50 m swim + 1 km run (6–9 yrs)', '100 m swim + 3 km cycle + 1 km run (10–15 yrs)'],
    capacity: 300, registered: 97, registrationCloses: '2026-12-10',
    description: 'A first taste of multisport for children, with lifeguards in every lane and no podium pressure: every finisher gets the same medal.',
    highlights: ['Every finisher medal', 'Parents run the last 100 m'], includes: ['Swim cap', 'Medal'], bring: ['Helmet', 'Cycle'], photo: 'swimming-3',
  },

  // ── Jaipur ─────────────────────────────────────────────────
  {
    id: 'jaipur-heritage-run', city: 'jaipur', type: 'running', title: 'Pink City Heritage Run',
    organiser: 'Rajasthan Road Runners', date: '2027-01-31', time: '06:30',
    venue: 'Albert Hall Museum', address: 'Ram Niwas Garden, Jaipur 302004',
    price: paid(['21.1 km', 1599], ['10 km', 999], ['Family 4 km', 399]), ageGroups: ['kids', 'teens', 'adults', 'masters', 'seniors'], access: ['family', 'seniors', 'wheelchair'], level: 'All levels',
    formats: ['21.1 km', '10 km', '4 km family'], capacity: 9000, registered: 2400, registrationCloses: '2027-01-20',
    description: 'A winter run past Hawa Mahal and the old city walls.',
    highlights: ['Folk music along the route'], includes: ['Bib', 'Medal', 'Safa for finishers'], bring: ['Warm layer'], photo: 'running-1',
  },

  // ── Ahmedabad ──────────────────────────────────────────────
  {
    id: 'ahd-garba-fit', city: 'ahmedabad', type: 'dance', title: 'Garba Fitness Nights',
    organiser: 'Riverfront Fit', date: '2026-10-12', endDate: '2026-10-20', time: '19:30',
    venue: 'Sabarmati Riverfront Event Centre', address: 'Riverfront, Ahmedabad 380009',
    price: paid(['Single night', 299], ['All 9 nights', 1999]), ageGroups: ['kids', 'teens', 'adults', 'masters', 'seniors'], access: ['family', 'beginners', 'seniors'], level: 'Beginner',
    formats: ['Warm-up + 2-hour garba'], capacity: 3000, registered: 2110, registrationCloses: '2026-10-11',
    description: 'Navratri garba with a guided warm-up, hydration breaks and a seated circle for older dancers.',
    highlights: ['Step-tutorial corner for beginners'], includes: ['Water', 'Wristband'], bring: ['Comfortable footwear'], photo: 'dancing-3',
  },

  // ── Goa ────────────────────────────────────────────────────
  {
    id: 'goa-river-marathon', city: 'goa', type: 'running', title: 'Goa River Marathon',
    organiser: 'Goa Runners', date: '2026-12-13', time: '05:00',
    venue: 'Vasco da Gama', address: 'Vasco, South Goa',
    price: paid(['42.2 km', 2999], ['21.1 km', 1999], ['10 km', 1299]), ageGroups: ['adults', 'masters', 'seniors'], access: ['beginners'], level: 'Intermediate',
    formats: ['42.2 km', '21.1 km', '10 km'], capacity: 6000, registered: 3300, registrationCloses: '2026-11-30',
    description: 'A scenic route along the Zuari river with village crowds cheering you on.',
    highlights: ['Full marathon qualifier course'], includes: ['Bib', 'Medal', 'Post-race meal'], bring: ['Sunscreen'], photo: 'running-2',
  },
  {
    id: 'goa-beach-yoga', city: 'goa', type: 'yoga', title: 'Beach Sunset Yoga Retreat Day',
    organiser: 'Ashwem Yoga Shala', date: '2026-11-14', time: '16:30',
    venue: 'Ashwem Beach', address: 'Mandrem, North Goa',
    price: paid(['Half-day', 1499]), ageGroups: ['adults', 'masters', 'seniors'], access: ['women', 'beginners', 'seniors'], level: 'Beginner',
    formats: ['Yin yoga', 'Pranayama', 'Sound bath'], capacity: 40, registered: 12, registrationCloses: '2026-11-12',
    description: 'A slow, restorative half-day with bolsters and props for every body.',
    highlights: ['Props for every pose'], includes: ['Mat', 'Sattvic dinner'], bring: ['Shawl'], photo: 'yoga-4',
  },

  // ── Chandigarh ─────────────────────────────────────────────
  {
    id: 'chd-sukhna-cycle', city: 'chandigarh', type: 'cycling', title: 'Sukhna Lake to Morni Hills Ride',
    organiser: 'Tricity Pedallers', date: '2026-11-08', time: '06:00',
    venue: 'Sukhna Lake parking', address: 'Sector 1, Chandigarh',
    price: paid(['60 km', 699]), ageGroups: ['adults', 'masters'], access: [], level: 'Advanced',
    formats: ['60 km with 1,000 m climb'], capacity: 150, registered: 118, registrationCloses: '2026-11-04',
    description: 'A challenging hill ride with a support vehicle and a regroup at the top.',
    highlights: ['Support vehicle'], includes: ['Breakfast'], bring: ['Road bike', 'Spare tube'], photo: 'cycling-1',
  },

  // ── Kochi ──────────────────────────────────────────────────
  {
    id: 'kochi-para-swim', city: 'kochi', type: 'adaptive', title: 'Adaptive Swim Gala',
    organiser: 'Kerala Para Aquatics', date: '2026-10-17', time: '08:30',
    venue: 'Regional Sports Centre Pool', address: 'Kadavanthra, Kochi 682020',
    price: free, ageGroups: ['kids', 'teens', 'adults', 'masters', 'seniors'], access: ['wheelchair', 'isl', 'family'], level: 'All levels',
    formats: ['25 m and 50 m heats', 'Assisted water confidence session'], capacity: 150, registered: 64, registrationCloses: '2026-10-12',
    description: 'A friendly swim gala with pool hoists, one-to-one volunteers and heats for every ability.',
    highlights: ['Pool hoist', 'Accessible changing rooms'], includes: ['Certificate', 'Lunch'], bring: ['Swimwear'], photo: 'para-3',
  },

  // ── Guwahati ───────────────────────────────────────────────
  {
    id: 'guwahati-brahmaputra-run', city: 'guwahati', type: 'running', title: 'Brahmaputra Riverfront Run',
    organiser: 'Northeast Runners', date: '2026-11-29', time: '05:45',
    venue: 'Uzan Bazar Riverfront', address: 'Uzan Bazar, Guwahati 781001',
    price: paid(['21.1 km', 1299], ['10 km', 799], ['5 km', 399]), ageGroups: ['teens', 'adults', 'masters', 'seniors'], access: ['beginners', 'women'], level: 'All levels',
    formats: ['21.1 km', '10 km', '5 km'], capacity: 4000, registered: 1300, registrationCloses: '2026-11-20',
    description: 'A riverside run celebrating running communities across the Northeast.',
    highlights: ['Bihu performers at the finish'], includes: ['Bib', 'Medal', 'Gamosa'], bring: ['ID'], photo: 'running-3',
  },

  // ── Leh ────────────────────────────────────────────────────
  {
    id: 'leh-high-altitude-run', city: 'leh', type: 'trek', title: 'Ladakh High-Altitude Run & Trek',
    organiser: 'Ladakh Adventure Sports', date: '2026-09-13', time: '06:00',
    venue: 'Leh Polo Ground', address: 'Leh, Ladakh',
    price: paid(['21 km', 3499], ['7 km', 1999]), ageGroups: ['adults', 'masters'], access: [], level: 'Advanced',
    formats: ['21 km', '7 km'], capacity: 1200, registered: 1200, registrationCloses: '2026-08-25',
    description: 'Run at 3,500 m. Participants must arrive in Leh at least four days early to acclimatise.',
    highlights: ['Mandatory acclimatisation certificate'], includes: ['Bib', 'Medal'], bring: ['Warm layers'], photo: 'hiking-2',
  },

  // ── Lucknow ────────────────────────────────────────────────
  {
    id: 'lucknow-strength-meet', city: 'lucknow', type: 'hyrox', title: 'Awadh Strength & Conditioning Open',
    organiser: 'Lucknow Barbell Club', date: '2026-12-05', time: '09:00',
    venue: 'KD Singh Babu Stadium', address: 'Hazratganj, Lucknow 226001',
    price: paid(['Novice', 999], ['Open', 1499]), ageGroups: ['teens', 'adults', 'masters', 'seniors'], access: ['women', 'beginners'], level: 'All levels',
    formats: ['Deadlift', 'Farmer carry', 'Sled push'], capacity: 200, registered: 88, registrationCloses: '2026-11-28',
    description: 'A novice-friendly strength meet with women’s and masters categories and technique briefings before every lift.',
    highlights: ['Technique judges coach novices', 'Masters 50+ category'], includes: ['Certificate', 'T-shirt'], bring: ['Flat shoes'], photo: 'strength-1',
  },

  // ── Bhubaneswar ────────────────────────────────────────────
  {
    id: 'bbsr-hockey-walk', city: 'bhubaneswar', type: 'walk', title: 'Kalinga Stadium Family Fitness Day',
    organiser: 'Odisha Sports Fans', date: '2026-10-02', time: '07:00',
    venue: 'Kalinga Stadium', address: 'Nayapalli, Bhubaneswar 751012',
    price: free, ageGroups: ['kids', 'teens', 'adults', 'masters', 'seniors'], access: ['family', 'wheelchair', 'seniors', 'beginners'], level: 'Beginner',
    formats: ['2 km walk', 'Hockey skills zone', 'Kids races'], capacity: 3000, registered: 1480, registrationCloses: '2026-10-01',
    description: 'A Gandhi Jayanti morning of walking, hockey drills and sack races for the whole family.',
    highlights: ['Meet state hockey players'], includes: ['Breakfast'], bring: ['Water'], photo: 'para-2',
  },
];

// ── Helpers ──────────────────────────────────────────────────

export function getCity(slug) {
  return CITIES.find((c) => c.slug === slug) || null;
}

export function getEvent(id) {
  return EVENTS.find((e) => e.id === id) || null;
}

export function eventsForCity(slug) {
  return EVENTS.filter((e) => e.city === slug);
}

/** Today as YYYY-MM-DD in the viewer's local time. */
export function localToday(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function isPast(event, today = localToday()) {
  return (event.endDate || event.date) < today;
}

export function lowestPrice(event) {
  return Math.min(...event.price.tiers.map((t) => t.amount));
}

export function formatPrice(event) {
  if (event.price.free) return 'Free';
  return `From ₹${lowestPrice(event).toLocaleString('en-IN')}`;
}

export function formatDate(iso, opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', opts);
}

export function daysBetween(fromIso, toIso) {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

export function spotsLeft(event) {
  return Math.max(0, event.capacity - event.registered);
}

/** Upcoming events per city, soonest first, for the map and its side panel. */
export function citySummaries(today = localToday()) {
  return CITIES.map((city) => {
    const upcoming = eventsForCity(city.slug)
      .filter((e) => !isPast(e, today))
      .sort((a, b) => a.date.localeCompare(b.date));
    return { ...city, upcoming, next: upcoming[0] || null };
  }).filter((c) => c.upcoming.length > 0);
}
