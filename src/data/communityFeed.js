// Community feed for /blogs and the "Daily fitness blogs" panel on Home.
//
// SAMPLE COMMUNITY CONTENT. The members below are fictional and their posts,
// clap counts and responses are written for the demo; the feed says so on
// screen. Jane's and Mike's posts are the two blogs that used to live at
// /blog1 and /blog2, carried over word for word.
//
// Body blocks: { p } paragraph, { h } subheading, { quote }, { list: [] }.
// `look` pins an author's avatar drawing (see components/shared/Avatar).
// `activity` is the synced workout shown as a stats card; `devices` are keys
// from src/data/devices.js.

export const TOPICS = ['Running', 'Cycling', 'Yoga', 'Strength', 'HYROX', 'Walking', 'Adaptive', 'Nutrition', 'Dance', 'Trail'];

export const AUTHORS = {
  ananya: { look: { hair: 1 }, name: 'Ananya Iyer', city: 'Chennai', bio: 'Marathoner, physics teacher, filter-coffee loyalist.', followers: 1840 },
  rohan: { look: { hair: 0 }, name: 'Rohan Mehta', city: 'Mumbai', bio: 'Desk job by day, HYROX doubles by weekend.', followers: 3210 },
  priya: { look: { hair: 2 }, name: 'Priya Nair', city: 'Kochi', bio: 'Yoga teacher. Slow flows, better sleep.', followers: 5120 },
  arjun: { look: { hair: 0, glasses: true }, name: 'Arjun Singh', city: 'Chandigarh', bio: 'Chasing Shivalik climbs on two wheels.', followers: 960 },
  meenakshi: { look: { hair: 2, glasses: true }, name: 'Meenakshi Rao', city: 'Bengaluru', bio: '63, retired banker, 8,000 steps before breakfast.', followers: 2475 },
  kabir: { look: { hair: 3 }, name: 'Kabir Khan', city: 'Delhi', bio: 'Wheelchair racer and accessibility advocate.', followers: 4380 },
  farhan: { look: { hair: 0 }, name: 'Farhan Ali', city: 'Hyderabad', bio: 'Strength coach. Vegetarian protein nerd.', followers: 2890 },
  sneha: { look: { hair: 1 }, name: 'Sneha Das', city: 'Kolkata', bio: 'Dance fitness instructor, Rabindra Sangeet on repeat.', followers: 1310 },
  tenzin: { look: { hair: 2 }, name: 'Tenzin Dolma', city: 'Leh', bio: 'Trail runner who trains where the air is thin.', followers: 1720 },
  jane: { look: { hair: 1 }, name: 'Jane', city: 'Pune', bio: 'Runner and cyclist, collecting streaks.', followers: 640 },
  mike: { look: { hair: 3 }, name: 'Mike', city: 'Goa', bio: 'Weekend cyclist chasing longer rides.', followers: 590 },
};

export const POSTS = [
  {
    slug: 'hyrox-delhi-prep-whoop',
    author: 'rohan',
    title: 'Six weeks to HYROX Delhi: what my WHOOP taught me about recovery',
    subtitle: 'I trained harder by training less often. The strain and recovery data made the case.',
    topic: 'HYROX',
    publishedAt: '2026-09-14',
    cover: 'hyrox-1',
    devices: ['whoop', 'apple-watch', 'strava'],
    claps: 1284,
    responses: [
      { author: 'farhan', text: 'The sled push point is so real. Most people under-train it and lose minutes there.' },
      { author: 'ananya', text: 'Loved the recovery-based schedule. Stealing this for marathon block.' },
    ],
    activity: {
      label: 'Simulation race, 8 × 1 km + stations',
      stats: [
        ['Total time', '1:18:42'],
        ['Avg heart rate', '162 bpm'],
        ['Day strain', '18.6'],
        ['Next-day recovery', '41%'],
      ],
      zones: [8, 14, 31, 35, 12],
    },
    body: [
      { p: 'When I signed up for HYROX Delhi I did what most first-timers do: I trained every single day. Two weeks in, my runs were slower, my wall balls were sloppy and I was sleeping badly.' },
      { h: 'Letting recovery set the schedule' },
      { p: 'My WHOOP recovery score kept sitting in the yellow and red. So I made a rule: green days are for hard station work, yellow days are easy 5K runs, red days are mobility and a walk. Nothing else changed.' },
      { list: ['Green (67%+): sled push, burpee broad jumps, wall balls', 'Yellow (34–66%): easy Zone 2 run on Strava', 'Red (under 34%): mobility, 30-minute walk, early night'] },
      { p: 'Within three weeks my 1 km splits during simulations dropped by about 20 seconds, and my Apple Watch showed my heart rate recovering faster between stations.' },
      { quote: 'The hardest workout was the rest day I did not want to take.' },
      { p: 'The data is a guide, not a verdict. If you feel unwell, rest regardless of what a band says, and if you have a heart condition talk to a doctor before race-pace training.' },
    ],
  },
  {
    slug: 'first-wheelchair-10k',
    author: 'kabir',
    title: 'My first wheelchair 10K, and what race organisers can do better',
    subtitle: 'Ramps are the start, not the finish line.',
    topic: 'Adaptive',
    publishedAt: '2026-09-12',
    cover: 'para-1',
    devices: ['apple-watch', 'strava'],
    claps: 2318,
    responses: [
      { author: 'meenakshi', text: 'Sharing this with our walkathon committee. The toilet point had never occurred to us.' },
      { author: 'priya', text: 'Thank you for writing this so clearly, Kabir.' },
    ],
    activity: {
      label: 'Wheelchair 10K, Delhi',
      stats: [
        ['Distance', '10.0 km'],
        ['Time', '38:15'],
        ['Avg pace', '3:49 /km'],
        ['Push strokes', '2,940'],
      ],
    },
    body: [
      { p: 'Apple Watch has a wheelchair mode that counts pushes instead of steps, and it is the reason I started logging my training at all. Last Sunday I raced my first official 10K.' },
      { h: 'What worked' },
      { list: ['A separate start wave five minutes before runners', 'Marshals who knew which roads had speed breakers', 'A finish area without a gravel patch'] },
      { h: 'What organisers can fix' },
      { p: 'Accessible toilets at the start, not just the expo. A clear course map with gradients. And please list access details on the registration page, so we do not have to email three people to find out.' },
      { p: 'If you run a local event and want a quick accessibility checklist, message me. Happy to help for free.' },
    ],
  },
  {
    slug: 'sleep-yoga-ultrahuman',
    author: 'priya',
    title: 'Twenty minutes of Yin yoga did more for my sleep than any app',
    subtitle: 'What a smart ring showed me over thirty evenings.',
    topic: 'Yoga',
    publishedAt: '2026-09-11',
    cover: 'yoga-2',
    devices: ['ultrahuman', 'google-fit'],
    claps: 3012,
    responses: [{ author: 'sneha', text: 'Trying the legs-up-the-wall one tonight!' }],
    activity: {
      label: '30-day evening Yin practice',
      stats: [
        ['Sessions', '30'],
        ['Avg session', '21 min'],
        ['Avg sleep', '7 h 12 m'],
        ['Resting HR change', '−4 bpm'],
      ],
    },
    body: [
      { p: 'I teach energetic morning classes, but my own evenings were chaotic. For thirty nights I swapped my phone for a short Yin sequence and tracked sleep on my Ultrahuman ring.' },
      { h: 'The sequence' },
      { list: ['Child’s pose, 3 minutes', 'Supported butterfly, 4 minutes', 'Reclined twist, 3 minutes each side', 'Legs up the wall, 5 minutes', 'Slow breathing, 3 minutes'] },
      { p: 'My average sleep went up by about 35 minutes and I woke up less often. One person’s month is not a study, but it is a gentle experiment anyone can try.' },
      { quote: 'Rest is a practice too.' },
    ],
  },
  {
    slug: 'sixty-three-and-walking',
    author: 'meenakshi',
    title: 'Sixty-three and walking 8,000 steps before breakfast',
    subtitle: 'How our Cubbon Park group keeps each other going, rain or shine.',
    topic: 'Walking',
    publishedAt: '2026-09-10',
    cover: 'walkathon-1',
    devices: ['noise', 'google-fit'],
    claps: 1876,
    responses: [{ author: 'kabir', text: 'Your group’s "no one walks alone" rule is beautiful.' }],
    activity: {
      label: 'Morning walk, Cubbon Park',
      stats: [
        ['Steps', '8,412'],
        ['Distance', '5.9 km'],
        ['Duration', '72 min'],
        ['Avg heart rate', '104 bpm'],
      ],
    },
    body: [
      { p: 'After retiring I realised the bank had been my exercise: the commute, the stairs, the walk to lunch. Without it I barely crossed 2,000 steps.' },
      { p: 'A neighbour invited me to her 6 AM walking group. My daughter gave me a Noise watch and set up Google Fit, and now our WhatsApp group shares screenshots every morning.' },
      { h: 'Our three rules' },
      { list: ['No one walks alone, and no one is left behind', 'Talk while walking. If you can’t, slow down', 'Chai only after the second round'] },
      { p: 'My knees feel better on the flat park roads than on a treadmill. If you are starting later in life, begin with ten minutes and add a little each week.' },
    ],
  },
  {
    slug: 'vegetarian-protein-hyderabad',
    author: 'farhan',
    title: 'Hitting your protein on a vegetarian Indian plate, without powders',
    subtitle: 'Dal, paneer, soya and sprouts, planned across the day.',
    topic: 'Nutrition',
    publishedAt: '2026-09-09',
    cover: 'strength-3',
    devices: ['healthifyme', 'whoop'],
    claps: 2640,
    responses: [
      { author: 'rohan', text: 'The besan chilla breakfast is my go-to now.' },
      { author: 'arjun', text: 'Saving this. Always struggled on long ride days.' },
    ],
    activity: {
      label: 'A typical training-day plate (logged in HealthifyMe)',
      stats: [
        ['Protein', '96 g'],
        ['Meals', '4'],
        ['Fibre', '38 g'],
        ['Water', '3.1 L'],
      ],
    },
    body: [
      { p: 'Most of my clients are vegetarian and assume they cannot eat enough protein for strength training. Usually they can, if protein turns up at every meal rather than only at dinner.' },
      { h: 'One day, four meals' },
      { list: ['Breakfast: 2 besan–moong chillas with curd', 'Lunch: rajma, brown rice, salad, buttermilk', 'Snack: roasted chana and a fruit', 'Dinner: paneer or soya bhurji with 2 millet rotis and dal'] },
      { p: 'Your needs depend on your body, training and health. If you have kidney concerns or other conditions, check with a registered dietitian before increasing protein.' },
    ],
  },
  {
    slug: 'shivalik-climbs-garmin',
    author: 'arjun',
    title: 'Morni Hills repeats: pacing climbs with power, not ego',
    subtitle: 'My Garmin kept me honest on the steepest ramps.',
    topic: 'Cycling',
    publishedAt: '2026-09-08',
    cover: 'cycling-1',
    devices: ['garmin', 'strava'],
    claps: 812,
    responses: [{ author: 'mike', text: 'Great tip on eating before you are hungry.' }],
    activity: {
      label: 'Sukhna Lake to Morni Hills',
      stats: [
        ['Distance', '62.4 km'],
        ['Elevation', '1,040 m'],
        ['Moving time', '2:51:10'],
        ['Avg power', '188 W'],
      ],
      zones: [12, 30, 34, 18, 6],
    },
    body: [
      { p: 'I used to attack the first ramp and crawl the last. This season I set a power ceiling on my Garmin for each climb and refused to cross it in the first half.' },
      { p: 'The result: a Strava PR on the final climb without feeling wrecked. Eat something every 40 minutes, and start descending only once your hands have warmed up.' },
    ],
  },
  {
    slug: 'garba-cardio-fitbit',
    author: 'sneha',
    title: 'Is garba a workout? My Fitbit says it absolutely is',
    subtitle: 'Nine nights of dancing, tracked.',
    topic: 'Dance',
    publishedAt: '2026-09-06',
    cover: 'dancing-3',
    devices: ['fitbit'],
    claps: 1455,
    responses: [{ author: 'meenakshi', text: 'Our society garba has a seated circle for elders too. Everyone dances!' }],
    activity: {
      label: 'Garba night (2 hours)',
      stats: [
        ['Active minutes', '104'],
        ['Avg heart rate', '131 bpm'],
        ['Steps', '11,860'],
        ['Active Zone Minutes', '88'],
      ],
    },
    body: [
      { p: 'Every Navratri my students ask if they can skip class. This year I tracked a full garba night on my Fitbit, and it logged more active minutes than my usual class does.' },
      { p: 'Warm up your calves and ankles, wear cushioned footwear on hard floors, sip water between rounds, and join the slower outer circle whenever you need to.' },
    ],
  },
  {
    slug: 'trail-running-at-altitude',
    author: 'tenzin',
    title: 'Running at 3,500 metres: the slow way is the only way',
    subtitle: 'Heart rate, not pace, is what matters up here.',
    topic: 'Trail',
    publishedAt: '2026-09-04',
    cover: 'hiking-2',
    devices: ['garmin', 'strava'],
    claps: 1990,
    responses: [{ author: 'ananya', text: 'Humbling to read this from sea level.' }],
    activity: {
      label: 'Stok village trail loop',
      stats: [
        ['Distance', '14.2 km'],
        ['Elevation', '680 m'],
        ['Time', '1:58:30'],
        ['Avg heart rate', '148 bpm'],
      ],
    },
    body: [
      { p: 'Visitors arrive in Leh and try to run their city pace on day two. Please don’t. Your body needs several days to adjust to the altitude.' },
      { p: 'I run by heart rate on my Garmin and walk every uphill. Headache, nausea or breathlessness at rest mean stop, descend and get help.' },
    ],
  },
  {
    slug: 'marathon-block-chennai-heat',
    author: 'ananya',
    title: 'Training for a December marathon through a Chennai summer',
    subtitle: 'Run early, run slow, and respect the humidity.',
    topic: 'Running',
    publishedAt: '2026-09-02',
    cover: 'running-2',
    devices: ['garmin', 'strava', 'apple-watch'],
    claps: 1122,
    responses: [{ author: 'rohan', text: 'The electrolyte schedule is gold.' }],
    activity: {
      label: 'Long run, ECR',
      stats: [
        ['Distance', '28.0 km'],
        ['Avg pace', '6:12 /km'],
        ['Time', '2:53:36'],
        ['Temperature', '29 °C at 5 AM'],
      ],
      zones: [10, 46, 30, 12, 2],
    },
    body: [
      { p: 'Chennai at 5 AM is already 29 °C. My long runs are 30–45 seconds per km slower than my goal pace, and that is by design.' },
      { list: ['Start before sunrise', 'Electrolytes every 30 minutes', 'Loop past a shop so you can refill water', 'Treat heat headaches as a signal to stop'] },
    ],
  },
  {
    slug: 'jane-30-day-running-streak',
    author: 'jane',
    title: 'We completed the 30-Day Running Streak Challenge!🏃‍♀️🎉',
    subtitle: 'Thirty days, thirty runs, and a cycling record along the way.',
    topic: 'Running',
    publishedAt: '2026-08-28',
    cover: 'running-1',
    devices: ['strava'],
    claps: 734,
    responses: [],
    activity: {
      label: '30-day running streak',
      stats: [
        ['Runs', '30'],
        ['Total distance', '148 km'],
        ['Longest run', '12.5 km'],
        ['Longest ride', '30 mi'],
      ],
    },
    body: [
      { p: 'I’m feeling absolutely exhilarated today! If you would’ve told me a month ago that I would be setting a new cycling record and completing a 30-day running streak, I probably would’ve laughed in disbelief. But here I am, sharing this milestone with all of you—and I’m bursting with pride!' },
      { p: 'It all started when I decided to push myself a little further this year. I’ve always been passionate about fitness, but I wanted to challenge myself in new ways. A friend of mine told me about the 30-Day Running Streak Challenge, where you commit to running every day for 30 days straight. At first, I was hesitant—could I really do it? Would my body hold up? But with a little determination and the right mindset, I jumped in.' },
      { p: 'Every morning, I set out for a run, and with each passing day, I noticed my endurance growing. It wasn’t always easy, especially on those cold, rainy mornings, but the satisfaction of crossing off another day on my streak kept me motivated. Some days I ran short distances, others I pushed myself a bit further, but I stuck to it.' },
      { p: 'Along the way, I also set my sights on a cycling goal. I’ve always loved cycling, but I never quite pushed myself to ride long distances. This time, I decided to set a new personal record—and I’m beyond excited to share that I crushed it! I cycled 30 miles in one go, a distance I’d only dreamed of achieving before. The feeling of accomplishment after finishing that ride was indescribable. It was the perfect complement to completing my running streak.' },
      { p: 'So, what have I learned from this experience? First, fitness is all about consistency and pushing your limits, even when it feels tough. Every mile, every step, and every day adds up to something bigger than just physical achievement—it’s about building mental toughness and resilience. Second, setting goals, no matter how big or small, is a powerful motivator. Whether it’s a cycling record or a streak of daily runs, having a goal to work towards gives you purpose.' },
      { p: 'To anyone reading this, I encourage you to try setting your own challenge. Maybe it’s cycling, running, or even something completely different—but whatever it is, commit to it fully. You’ll be amazed at how much you’re capable of once you put your mind to it!' },
      { p: 'Thanks for following my fitness journey. Here’s to more records, more streaks, and even bigger goals in the future! 💪🎉' },
    ],
  },
  {
    slug: 'mike-30-mile-cycling-record',
    author: 'mike',
    title: 'I just set a new record in cycling: 30 miles!💪',
    subtitle: 'A test of grit, endurance and self-belief.',
    topic: 'Cycling',
    publishedAt: '2026-08-24',
    cover: 'cycling-2',
    devices: ['strava', 'garmin'],
    claps: 689,
    responses: [],
    activity: {
      label: 'Personal-record ride',
      stats: [
        ['Distance', '48.3 km (30 mi)'],
        ['Moving time', '1:52:40'],
        ['Avg speed', '25.7 km/h'],
        ['Elevation', '310 m'],
      ],
    },
    body: [
      { p: 'I’m over the moon to share a huge personal achievement: I just completed a 30-mile cycling ride, smashing my previous record! 💪 This ride wasn’t just another workout—it was a test of grit, endurance, and self-belief. The day started early, with the cool morning air carrying a mix of excitement and nervous energy as I set out. The first 10 miles felt like a breeze. My legs were strong, my cadence steady, and I soaked in the scenery, feeling completely in sync with the rhythm of the ride.' },
      { p: 'Around the 15-mile mark, the challenge began to reveal itself. My energy started to dip, and those subtle inclines I didn’t think twice about earlier began to feel like mountains. I focused on my breathing, my form, and reminding myself why I set this goal in the first place. At mile 20, a second wind kicked in, just as fatigue began to creep in again. I refueled with water and a quick snack, knowing the final 10 miles would push me past my limits.' },
      { p: 'The last stretch was a mental game. My legs were screaming, my shoulders stiff, and my mind started whispering doubts: Do you really have to finish this today? But I leaned into the challenge, letting the thought of crossing the 30-mile mark drive me forward. Every pedal stroke was a small victory, building toward the finish. When I finally hit the 30-mile milestone, I was overwhelmed with pride, a mix of exhaustion and euphoria washing over me.' },
      { p: 'This ride taught me more than just physical endurance—it reminded me of the power of persistence, preparation, and the joy of achieving something you once thought was out of reach. If you’re considering setting a big fitness goal, let this be your sign: go for it! The ride may test you, but the reward is unforgettable. 🚴‍♀️✨' },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────

export function getPost(slug) {
  return POSTS.find((p) => p.slug === slug) || null;
}

export function readMinutes(post) {
  const words = post.body
    .map((b) => b.p || b.h || b.quote || (b.list || []).join(' '))
    .join(' ')
    .split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 150));
}

export function latestPosts(n = POSTS.length) {
  return [...POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, n);
}

export function relativeDate(iso, today) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (today) {
    const [ty, tm, td] = today.split('-').map(Number);
    const days = Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days > 1 && days < 7) return `${days} days ago`;
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
