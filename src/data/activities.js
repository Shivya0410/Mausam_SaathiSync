// Activity listing data for /activities/[slug].
//
// The tennis and meditation venues are carried over unchanged from the old
// /tennis and /meditation pages. The rest are public parks, tracks and
// sports complexes, listed with indicative timings and prices. None of it has
// been verified with the venue, which the listing page says on screen.
//
// `photo` keys point at src/data/fitnessPhotos.js. `inclusive` tags drive the
// accessibility filters, so keep them to the values in INCLUSIVE_TAGS.

export const INCLUSIVE_TAGS = {
  wheelchair: { label: 'Wheelchair accessible', icon: 'fa-solid fa-wheelchair' },
  women: { label: 'Women-friendly', icon: 'fa-solid fa-venus' },
  seniors: { label: 'Senior-friendly', icon: 'fa-solid fa-person-cane' },
  kids: { label: 'Kids welcome', icon: 'fa-solid fa-child' },
  beginners: { label: 'Beginner-friendly', icon: 'fa-solid fa-seedling' },
};

const youtube = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const ACTIVITIES = [
  {
    slug: 'running',
    title: 'Running',
    icon: 'fa-solid fa-person-running',
    tagline: 'From your first 1 km to your first half marathon.',
    about:
      'Running needs little more than shoes and a safe route. Start with run–walk intervals, keep most runs at a pace where you can still talk, and build distance by no more than about 10% a week.',
    photos: ['running-1', 'running-2', 'running-3'],
    facts: { intensity: 'Moderate to high', kit: 'Running shoes, water', bestTime: 'Early morning in summer' },
    tips: [
      'Warm up with 5 minutes of brisk walking and leg swings.',
      'In Indian summers, run before 7 AM and carry water or ORS.',
      'Alternate hard and easy days so your legs can recover.',
    ],
    adaptations: 'Walk–run intervals suit beginners and seniors. Many parks below have flat, paved loops suitable for wheelchair racers and prams.',
    venues: [
      { name: 'Lodhi Garden Walking Loop', area: 'Lodhi Road', city: 'Delhi NCR', type: 'Park', price: 'Free', timing: '5:00 AM – 8:00 PM', facilities: ['2.5 km paved loop', 'Drinking water', 'Washrooms'], inclusive: ['wheelchair', 'seniors', 'beginners', 'women'], photo: 'running-1' },
      { name: 'Jawaharlal Nehru Stadium Track', area: 'Pragati Vihar', city: 'Delhi NCR', type: 'Track', price: '₹50 / day', timing: '6:00 – 9:00 AM, 4:00 – 7:00 PM', facilities: ['400 m synthetic track', 'Changing rooms'], inclusive: ['wheelchair', 'women'], photo: 'running-2' },
      { name: 'Sanjay Van Trails', area: 'Mehrauli', city: 'Delhi NCR', type: 'Trail', price: 'Free', timing: '6:00 AM – 6:00 PM', facilities: ['Dirt trails', 'Shade'], inclusive: ['beginners'], photo: 'running-3' },
      { name: 'Marine Drive Promenade', area: 'Churchgate', city: 'Mumbai', type: 'Promenade', price: 'Free', timing: 'Open 24 hours', facilities: ['3.6 km seafront', 'Flat and lit'], inclusive: ['wheelchair', 'seniors', 'beginners', 'women', 'kids'], photo: 'running-1' },
      { name: 'Cubbon Park Running Loop', area: 'Central Bengaluru', city: 'Bengaluru', type: 'Park', price: 'Free', timing: '6:00 AM – 6:00 PM', facilities: ['Shaded roads', 'Car-free on weekend mornings'], inclusive: ['seniors', 'beginners', 'women', 'kids'], photo: 'running-2' },
    ],
    resources: [
      { title: 'Couch to 5K for complete beginners', type: 'Video series', level: 'Beginner', duration: '8 weeks', link: youtube('couch to 5k beginner running plan') },
      { title: 'Easy running form drills', type: 'Online video', level: 'Beginner', duration: '10 minutes', link: youtube('running form drills beginners') },
      { title: 'Running safely in heat and humidity', type: 'Guide', level: 'All levels', duration: '6 minutes', link: youtube('running in hot humid weather tips') },
    ],
  },
  {
    slug: 'cycling',
    title: 'Cycling',
    icon: 'fa-solid fa-person-biking',
    tagline: 'Low-impact cardio that doubles as a greener commute.',
    about:
      'Cycling is kind to the knees and easy to fit into a day. Wear a helmet, ride with traffic, and start on car-free routes or weekend "cycle days" before city roads.',
    photos: ['cycling-1', 'cycling-2', 'cycling-3'],
    facts: { intensity: 'Low to high', kit: 'Helmet, lights, water', bestTime: 'Weekend mornings' },
    tips: [
      'Set saddle height so your knee is slightly bent at the bottom of the stroke.',
      'Use front and rear lights after dusk.',
      'Public bike-share docks are an easy way to try before you buy.',
    ],
    adaptations: 'Tricycles, tandem and hand-cycles make cycling possible for many riders with balance or mobility needs.',
    venues: [
      { name: 'Raahgiri Day, Connaught Place', area: 'Connaught Place', city: 'Delhi NCR', type: 'Car-free street', price: 'Free', timing: 'Sundays 6:00 – 10:00 AM', facilities: ['Car-free roads', 'Community rides'], inclusive: ['kids', 'beginners', 'women', 'seniors'], photo: 'cycling-3' },
      { name: 'Yamuna Sports Complex Velodrome Road', area: 'Surajmal Vihar', city: 'Delhi NCR', type: 'Sports complex', price: '₹100 / session', timing: '6:00 – 9:00 AM', facilities: ['Closed loop', 'Parking'], inclusive: ['beginners'], photo: 'cycling-1' },
      { name: 'Aarey Colony Loop', area: 'Goregaon East', city: 'Mumbai', type: 'Road loop', price: 'Free', timing: 'Early morning', facilities: ['Green route', 'Rolling hills'], inclusive: [], photo: 'cycling-2' },
      { name: 'Nandi Hills Climb', area: 'Chikkaballapur', city: 'Bengaluru', type: 'Hill route', price: '₹20 entry', timing: '6:00 AM – 6:00 PM', facilities: ['8 km climb', 'Sunrise views'], inclusive: [], photo: 'cycling-1' },
    ],
    resources: [
      { title: 'Road cycling basics for beginners', type: 'Online video', level: 'Beginner', duration: '12 minutes', link: youtube('road cycling beginner basics') },
      { title: 'Fixing a flat tyre on the road', type: 'Online video', level: 'Beginner', duration: '8 minutes', link: youtube('how to fix a flat bicycle tyre') },
    ],
  },
  {
    slug: 'climbing',
    title: 'Climbing',
    icon: 'fa-solid fa-mountain',
    tagline: 'Problem-solving with your whole body.',
    about:
      'Bouldering walls are the easiest way in: short routes, crash mats, no ropes. Most gyms rent shoes and run a short induction for first-timers.',
    photos: ['climbing-1', 'climbing-2', 'climbing-3'],
    facts: { intensity: 'Moderate', kit: 'Climbing shoes (rentable), chalk', bestTime: 'Any time, indoors' },
    tips: [
      'Climb with your legs and keep your arms straight to save grip.',
      'Learn how to fall and land before trying harder routes.',
      'Rest between attempts; fingers tire before muscles do.',
    ],
    adaptations: 'Adaptive and para-climbing sessions use auto-belays and adjusted routes.',
    venues: [
      { name: 'Community Bouldering Wall', area: 'South Delhi', city: 'Delhi NCR', type: 'Indoor gym', price: '₹600 / session', timing: '7:00 AM – 10:00 PM', facilities: ['Shoe rental', 'Beginner induction'], inclusive: ['beginners', 'women', 'kids'], photo: 'climbing-1' },
      { name: 'Indoor Climbing Centre', area: 'Andheri West', city: 'Mumbai', type: 'Indoor gym', price: '₹750 / session', timing: '8:00 AM – 10:00 PM', facilities: ['Auto-belays', 'Kids batches'], inclusive: ['beginners', 'kids'], photo: 'climbing-2' },
      { name: 'Turahalli Boulders', area: 'Kanakapura Road', city: 'Bengaluru', type: 'Outdoor rock', price: 'Free', timing: 'Daylight only', facilities: ['Natural boulders'], inclusive: [], photo: 'climbing-3' },
    ],
    resources: [
      { title: 'Bouldering technique for beginners', type: 'Online video', level: 'Beginner', duration: '15 minutes', link: youtube('bouldering technique for beginners') },
    ],
  },
  {
    slug: 'hiking',
    title: 'Hiking',
    icon: 'fa-solid fa-person-hiking',
    tagline: 'Weekend treks from the Aravallis to the Himalaya.',
    about:
      'Hiking builds endurance at your own pace. Start with well-marked day trails, tell someone your route, and carry more water than you think you need.',
    photos: ['hiking-1', 'hiking-2', 'hiking-3'],
    facts: { intensity: 'Low to high', kit: 'Grippy shoes, water, first aid', bestTime: 'October to March' },
    tips: [
      'Start early to finish before the afternoon heat or mountain weather.',
      'Leave no trace: carry back all plastic.',
      'At altitude, climb slowly and watch for headache or nausea.',
    ],
    adaptations: 'Many forest reserves have short, level nature walks suitable for seniors and families.',
    venues: [
      { name: 'Asola Bhatti Wildlife Sanctuary', area: 'Tughlakabad', city: 'Delhi NCR', type: 'Nature trail', price: '₹50 entry', timing: '7:00 AM – 5:00 PM', facilities: ['Guided walks', 'Bird watching'], inclusive: ['seniors', 'kids', 'beginners'], photo: 'hiking-3' },
      { name: 'Sanjay Gandhi National Park Trails', area: 'Borivali', city: 'Mumbai', type: 'National park', price: '₹70 entry', timing: '7:30 AM – 6:30 PM', facilities: ['Kanheri Caves trail', 'Cycles on hire'], inclusive: ['kids', 'beginners'], photo: 'hiking-2' },
      { name: 'Savandurga Day Trek', area: 'Magadi', city: 'Bengaluru', type: 'Day trek', price: 'Free', timing: '6:00 AM – 4:00 PM', facilities: ['Monolith climb'], inclusive: [], photo: 'hiking-1' },
    ],
    resources: [
      { title: 'Packing for your first day hike', type: 'Online video', level: 'Beginner', duration: '9 minutes', link: youtube('what to pack for a day hike beginner') },
    ],
  },
  {
    slug: 'dancing',
    title: 'Dancing',
    icon: 'fa-solid fa-music',
    tagline: 'Zumba, Bhangra, Garba, Bharatanatyam: cardio that feels like a celebration.',
    about:
      'Dance fitness is social, joyful and easy to scale. Choose low-impact classes if you are new or have joint concerns, and wear supportive shoes on hard floors.',
    photos: ['dancing-1', 'dancing-2', 'dancing-3'],
    facts: { intensity: 'Low to moderate', kit: 'Comfortable shoes, water', bestTime: 'Evening batches' },
    tips: ['Follow the low-impact option when a class gets jumpy.', 'Stand where you can see the instructor clearly.'],
    adaptations: 'Chair-based dance and seated Zumba are widely offered for seniors and wheelchair users.',
    venues: [
      { name: 'Community Zumba in the Park', area: 'Nehru Park, Chanakyapuri', city: 'Delhi NCR', type: 'Outdoor class', price: 'Free', timing: 'Daily 6:30 – 7:30 AM', facilities: ['Open lawn'], inclusive: ['women', 'seniors', 'beginners'], photo: 'dancing-2' },
      { name: 'Bhangra Fitness Studio', area: 'Rajouri Garden', city: 'Delhi NCR', type: 'Studio', price: '₹300 / class', timing: 'Evenings', facilities: ['Sprung floor', 'AC'], inclusive: ['beginners', 'women'], photo: 'dancing-1' },
      { name: 'Seated Dance for Seniors', area: 'Bandra West', city: 'Mumbai', type: 'Community centre', price: '₹100 / class', timing: 'Tue & Thu 10:00 AM', facilities: ['Chairs provided', 'Step-free entry'], inclusive: ['seniors', 'wheelchair'], photo: 'dancing-3' },
    ],
    resources: [
      { title: 'Low-impact Bollywood dance workout', type: 'Online video', level: 'Beginner', duration: '20 minutes', link: youtube('low impact bollywood dance workout beginners') },
      { title: 'Chair dance workout for seniors', type: 'Online video', level: 'All levels', duration: '15 minutes', link: youtube('chair dance workout seniors') },
    ],
  },
  {
    slug: 'gardening',
    title: 'Gardening',
    icon: 'fa-solid fa-seedling',
    tagline: 'Gentle movement, fresh air and a harvest to show for it.',
    about:
      'Digging, carrying and planting count as moderate activity, and community gardens add a social side. Kneel on a pad, lift with your legs, and garden in the cooler hours.',
    photos: ['gardening-1', 'gardening-2', 'gardening-3'],
    facts: { intensity: 'Low to moderate', kit: 'Gloves, hat, knee pad', bestTime: 'Early morning' },
    tips: ['Switch tasks every 20 minutes to avoid strain.', 'Raised beds reduce bending.'],
    adaptations: 'Raised and table-height beds make gardening comfortable for seniors and wheelchair users.',
    venues: [
      { name: 'Community Kitchen Garden', area: 'Vasant Kunj', city: 'Delhi NCR', type: 'Community garden', price: 'Free', timing: 'Weekends 7:00 – 10:00 AM', facilities: ['Raised beds', 'Tools provided'], inclusive: ['seniors', 'kids', 'wheelchair', 'beginners'], photo: 'gardening-3' },
      { name: 'Rooftop Farming Workshop', area: 'Powai', city: 'Mumbai', type: 'Workshop', price: '₹500 / workshop', timing: 'Saturdays', facilities: ['Seed kit included'], inclusive: ['beginners', 'kids'], photo: 'gardening-2' },
      { name: 'Urban Farmers Meetup', area: 'Lalbagh', city: 'Bengaluru', type: 'Meetup', price: 'Free', timing: 'Monthly, 2nd Sunday', facilities: ['Seed swap'], inclusive: ['seniors', 'beginners', 'women'], photo: 'gardening-1' },
    ],
    resources: [
      { title: 'Balcony vegetable garden for beginners', type: 'Online video', level: 'Beginner', duration: '14 minutes', link: youtube('balcony vegetable garden india beginners') },
    ],
  },
  {
    slug: 'swimming',
    title: 'Swimming',
    icon: 'fa-solid fa-person-swimming',
    tagline: 'Full-body, zero-impact, and a great escape from the heat.',
    about:
      'Swimming works every major muscle group without loading the joints. If you are new, take lessons in a pool with a lifeguard, and always swim with others around.',
    photos: ['swimming-1', 'swimming-2', 'swimming-3'],
    facts: { intensity: 'Low to high', kit: 'Swimsuit, cap, goggles', bestTime: 'Any time, indoor pools' },
    tips: ['Breathe out steadily underwater; don\'t hold your breath.', 'Kickboards and pull buoys help you practise one skill at a time.'],
    adaptations: 'Aqua aerobics and hoist-equipped pools suit seniors, pregnancy and many disabilities.',
    venues: [
      { name: 'Talkatora Swimming Pool', area: 'Talkatora Garden', city: 'Delhi NCR', type: 'Public pool', price: '₹1,500 / month', timing: 'Batches from 6:00 AM', facilities: ['Olympic-size pool', 'Coaching'], inclusive: ['women', 'kids'], photo: 'swimming-2' },
      { name: 'Siri Fort Sports Complex Pool', area: 'August Kranti Marg', city: 'Delhi NCR', type: 'Sports complex', price: '₹2,000 / month', timing: 'Batches from 6:00 AM', facilities: ['Heated pool', 'Women-only batches'], inclusive: ['women', 'seniors', 'beginners'], photo: 'swimming-1' },
      { name: 'Aqua Aerobics for Seniors', area: 'Juhu', city: 'Mumbai', type: 'Class', price: '₹400 / class', timing: 'Mon, Wed, Fri 9:00 AM', facilities: ['Shallow pool', 'Pool hoist'], inclusive: ['seniors', 'wheelchair'], photo: 'swimming-3' },
    ],
    resources: [
      { title: 'Learn freestyle breathing', type: 'Online video', level: 'Beginner', duration: '10 minutes', link: youtube('freestyle breathing technique beginners') },
    ],
  },
  {
    slug: 'tennis',
    title: 'Tennis',
    icon: 'fa-solid fa-table-tennis-paddle-ball',
    tagline: 'Speed, footwork and a friendly rally.',
    about:
      'Tennis combines short sprints with hand–eye coordination. Group coaching is the quickest way to learn the basic strokes, and most academies rent racquets.',
    photos: ['tennis-1', 'tennis-2', 'tennis-3'],
    facts: { intensity: 'Moderate to high', kit: 'Racquet (rentable), court shoes', bestTime: 'Morning and evening' },
    tips: ['Stay on the balls of your feet between shots.', 'Book floodlit courts for summer evenings.'],
    adaptations: 'Wheelchair tennis uses the same court with a two-bounce rule.',
    venues: [
      { name: 'East Delhi Tennis Academy', area: 'Swasthya Vihar', address: 'Clay Courts, Vikash Marg Rd, Block B, Swasthya Vihar, Delhi, 110092', city: 'Delhi NCR', type: 'Academy', phone: '09124667821', facilities: ['Indoor Courts', 'Outdoor Courts', 'Pro Shop'], rating: 4.4, inclusive: ['beginners', 'kids'], photo: 'tennis-1' },
      { name: 'Yamuna Sports Complex', area: 'Surajmal Vihar', address: 'M876+873, Surajmal Vihar, Delhi, 110092', city: 'Delhi NCR', type: 'Sports complex', phone: '09876346324', facilities: ['Clay Courts', 'Hard Courts', 'Coaching Available'], rating: 4.6, inclusive: ['wheelchair', 'women'], photo: 'tennis-2' },
      { name: 'BASE Sports', area: 'Surajmal Vihar', address: '78, Yamuna Sports Complex, Surajmal Vihar, New Delhi, Delhi 110092', city: 'Delhi NCR', type: 'Academy', phone: '09845323553', facilities: ['Indoor & Outdoor', 'Night Lighting', 'Equipment Rental'], rating: 4.2, inclusive: ['beginners'], photo: 'tennis-3' },
      { name: 'Adian Deportes', area: 'Sector 81', address: 'Faridabad Sector 81, Faridabad', city: 'Delhi NCR', type: 'Academy', phone: '8050237589', facilities: ['Clay Courts', 'Hard Courts', 'Coaching Available'], rating: 4.3, inclusive: ['kids'], photo: 'tennis-1' },
      { name: 'Gallant Play Arena G K 1', area: 'Greater Kailash 1', address: 'Greater Kailash 1, Delhi', city: 'Delhi NCR', type: 'Arena', phone: '08967346523', facilities: ['Indoor Courts', 'Outdoor Courts', 'Pro Shop'], rating: 4.1, inclusive: ['women'], photo: 'tennis-2' },
      { name: 'Uprising Tennis Academy', area: 'Sadarpur', address: 'Sadarpur, Ghaziabad', city: 'Delhi NCR', type: 'Academy', phone: '09843452553', facilities: ['Clay Courts', 'Hard Courts', 'Coaching Available'], rating: 4.5, inclusive: ['kids', 'beginners'], photo: 'tennis-3' },
      { name: 'Green park Sports Complex', area: 'Sawda', address: 'MXWP+62X, Sawda, Delhi, 110081', city: 'Delhi NCR', type: 'Sports complex', phone: '98739 31800', facilities: ['Indoor & Outdoor', 'Night Lighting', 'Equipment Rental'], rating: 4.2, inclusive: [], photo: 'tennis-1' },
      { name: 'Gallant Play Arena South City 1', area: 'Sector 41', address: 'Sec - 41, South City 1', city: 'Delhi NCR', type: 'Arena', phone: '09842365453', facilities: ['Indoor Courts', 'Outdoor Courts', 'Pro Shop'], rating: 4.7, inclusive: ['women', 'kids'], photo: 'tennis-2' },
      { name: 'United Shuttlers Badminton Academy', area: 'Surajmal Vihar', address: 'Yamuna Sports Complex, Gate No-4, Surajmal Vihar, Delhi, 110092', city: 'Delhi NCR', type: 'Academy', phone: '09823321875', facilities: ['Indoor & Outdoor', 'Night Lighting', 'Equipment Rental'], rating: 4.0, inclusive: ['beginners'], photo: 'tennis-3' },
    ],
    resources: [
      { title: 'The Basic Swing Pattern', type: 'Online video', level: 'Beginner', duration: '5 minutes', link: 'https://www.youtube.com/watch?v=VsiShyD6O2U' },
      { title: 'Better Court Coverage', type: 'Online video', level: 'Beginner', duration: '6 minutes', link: 'https://www.youtube.com/watch?v=AYkgzXkE0uc' },
      { title: 'Baseline Accuracy Drill', type: 'Online video', level: 'Beginner', duration: '5 minutes', link: youtube('tennis baseline accuracy drill') },
    ],
  },
  {
    slug: 'meditation',
    title: 'Meditation',
    icon: 'fa-solid fa-spa',
    tagline: 'A few quiet minutes a day for a calmer mind.',
    about:
      'Meditation is a skill, not a mood. Start with five minutes of breath awareness at the same time each day, and join a group session if you find it hard to stay consistent alone.',
    photos: ['meditation-1', 'yoga-2', 'yoga-4'],
    facts: { intensity: 'Gentle', kit: 'A cushion or chair', bestTime: 'Morning or before bed' },
    tips: ['Sitting on a chair is just as valid as sitting cross-legged.', 'When the mind wanders, notice it and return to the breath; that is the practice.'],
    adaptations: 'Every practice here can be done seated in a chair or lying down.',
    venues: [
      { name: 'Vipassana Sadhana Sansthan', area: 'Chattarpur', address: 'C6P3+HW2, Logistics farms Village Bhatti, Chattarpur Mandir Rd, opposite Radha Soami Satsang, Phase IV, New Delhi, Delhi 110074', city: 'Delhi NCR', type: 'Meditation centre', phone: '011 2645 2772', facilities: ['Meditation Halls', 'Individual Meditation Rooms', 'Counseling and Support'], rating: 4.7, inclusive: ['seniors', 'beginners'], photo: 'meditation-1' },
      { name: 'Pyramid Meditation Centre', area: 'Safdarjung Enclave', address: 'Rooftop, 17, B-7/Extension, Block B 7, Safdarjung Enclave, New Delhi, 110029', city: 'Delhi NCR', type: 'Meditation centre', phone: '070428 31591', facilities: ['Yoga and Wellness Classes', 'Community Activities'], rating: 4.3, inclusive: ['beginners'], photo: 'yoga-2' },
      { name: 'The Art Of Living', area: 'New Rajinder Nagar', address: '200 DDA Site 1, New Rajinder Nagar, New Delhi, 110060', city: 'Delhi NCR', type: 'Meditation centre', phone: '083768 21223', facilities: ['Yoga Programs', 'Happiness Program', 'Cultural and Community Events'], rating: 4.7, inclusive: ['seniors', 'women', 'beginners'], photo: 'yoga-4' },
      { name: 'BramhakumariS Meditation Centre', area: 'Hari Nagar', address: 'Manav Kalyan Bhavan, R 4, West, opp. Pratap Nagar, Pratap Nagar, Market, Hari Nagar, New Delhi, Delhi, 110064', city: 'Delhi NCR', type: 'Meditation centre', phone: '097384 21345', facilities: ['Yoga and Wellness Classes', 'Community Activities'], rating: 4.3, inclusive: ['seniors', 'women'], photo: 'meditation-1' },
      { name: 'Yogoda Satsanga Dhyana Kendra', area: 'Gole Market', address: '11-12, Bhai Vir Singh Marg, Sector 2, Gole Market, New Delhi, Delhi 110001', city: 'Delhi NCR', type: 'Meditation centre', phone: '011 2334 6271', facilities: ['Yoga and Wellness Classes', 'Meditation Halls', 'Individual Meditation Rooms'], rating: 4.8, inclusive: ['seniors'], photo: 'yoga-2' },
      { name: 'Dhammarama', area: 'Dwarka', address: 'Metro Station Gate, Plot 8 Metro view Residency, 1, opposite Sector 11, Sector 11 Dwarka, Dwarka, Delhi, 110075', city: 'Delhi NCR', type: 'Meditation centre', phone: '078386 09598', facilities: ['Meditation Halls', 'Individual Meditation Rooms', 'Counseling and Support'], rating: 4.3, inclusive: ['wheelchair', 'beginners'], photo: 'yoga-4' },
      { name: 'Tushita Mahayana Meditation Centre', area: 'Hauz Khas', address: 'No. 9, Padmini enclave, Block F Rd, Kausalya Park, Block J, Padmini Enclave, Hauz Khas, New Delhi, Delhi 110016', city: 'Delhi NCR', type: 'Meditation centre', phone: '093199 83001', facilities: ['Yoga and Wellness Classes', 'Meditation Halls', 'Individual Meditation Rooms'], rating: 4.4, inclusive: ['beginners'], photo: 'meditation-1' },
      { name: 'Sri Aurobindo Ashram', area: 'Sarvodaya Enclave', address: 'Begumpur Road, Sarvodaya Enclave, New Delhi', city: 'Delhi NCR', type: 'Ashram', phone: '08130253768', facilities: ['Meditation Halls', 'Individual Meditation Rooms', 'Counseling and Support'], rating: 4.6, inclusive: ['seniors', 'wheelchair'], photo: 'yoga-2' },
      { name: 'Zorba The Buddha', area: 'Ghitorni', address: 'No.7, Tropical Drive, Mehrauli-Gurgaon Road, Ghitorni, New Delhi', city: 'Delhi NCR', type: 'Retreat', phone: '07123498991', facilities: ['Yoga and Wellness Classes', 'Meditation Halls', 'Individual Meditation Rooms'], rating: 4.1, inclusive: ['women'], photo: 'yoga-4' },
      { name: 'Transcendental Meditation', area: 'Shalimar Bagh', address: 'Block BP, West Shalimar Bagh, New Delhi', city: 'Delhi NCR', type: 'Meditation centre', phone: '09124667821', facilities: ['Meditation Halls', 'Individual Meditation Rooms', 'Counseling and Support'], rating: 4.8, inclusive: ['beginners'], photo: 'meditation-1' },
    ],
    resources: [
      { title: 'Peace and Relaxation', type: 'Online video', level: 'Beginner', duration: '15 minutes', link: 'https://www.youtube.com/watch?v=MSdqEhO1egc' },
      { title: 'Meditation for Stress Relief and Anxiety', type: 'Online video', level: 'Beginner', duration: '20 minutes', link: 'https://www.youtube.com/watch?v=uNiJW0KMwf4' },
      { title: 'Pranayama for Inner Balance', type: 'Online video', level: 'Beginner', duration: '10 minutes', link: 'https://www.youtube.com/watch?v=blbv5UTBCGg' },
    ],
  },
];

export function getActivity(slug) {
  return ACTIVITIES.find((a) => a.slug === slug) || null;
}
