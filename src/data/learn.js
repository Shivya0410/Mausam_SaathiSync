/**
 * Learn articles (PRD 9.3, 21.1). Text lives in the locale files under
 * learn.articles.<slug>.{title, summary, body[]}; this file holds the
 * structure: icon, related pages and sources. Hindi was translated by the
 * build team and needs review by a fluent speaker (PRD 22.4 item 6).
 */
export const ARTICLES = [
  { slug: 'colours', icon: 'fa-solid fa-palette', related: ['/alerts'], sources: ['IMD', 'NDMA'] },
  { slug: 'heat', icon: 'fa-solid fa-temperature-high', related: ['/health', '/work'], sources: ['IMD heat wave FAQ', 'NDMA heat wave guidelines', 'NCDC'] },
  { slug: 'lightning', icon: 'fa-solid fa-bolt', related: ['/work', '/farm'], sources: ['NDMA lightning guidelines', 'IMD', 'Damini (IITM)'], check: 'lightning' },
  { slug: 'aqi', icon: 'fa-solid fa-lungs', related: ['/health'], sources: ['CPCB National AQI', 'MoEFCC'] },
  { slug: 'uv', icon: 'fa-solid fa-sun', related: ['/health', '/coast'], sources: ['WHO UV index guidance'] },
  { slug: 'fog', icon: 'fa-solid fa-smog', related: ['/commute', '/travel'], sources: ['IMD fog classification', 'MoRTH road safety'] },
  { slug: 'monsoon-kit', icon: 'fa-solid fa-umbrella', related: ['/ready', '/commute'], sources: ['NDMA flood guidelines'] },
  { slug: 'cyclone', icon: 'fa-solid fa-hurricane', related: ['/alerts', '/coast'], sources: ['IMD cyclone warnings', 'NDMA'] },
  { slug: 'rain-chance', icon: 'fa-solid fa-cloud-rain', related: ['/forecast'], sources: ['IMD rainfall terminology'] },
  { slug: 'beach', icon: 'fa-solid fa-person-swimming', related: ['/coast'], sources: ['INCOIS', 'Lifesaving guidance'] },
  { slug: 'frost-hail', icon: 'fa-solid fa-snowflake', related: ['/farm'], sources: ['IMD agromet', 'ICAR'] },
  { slug: 'how-it-works', icon: 'fa-solid fa-diagram-project', related: ['/settings#layout'], sources: [] },
];

export const ARTICLE_BY_SLUG = Object.fromEntries(ARTICLES.map((a) => [a.slug, a]));

/**
 * Old learn-link ids used on persona pages (learnTitles.<id>) to slugs.
 */
export const LEARN_ID_TO_SLUG = {
  aqi: 'aqi',
  uv: 'uv',
  heat: 'heat',
  beach: 'beach',
  cyclone: 'cyclone',
  lightning: 'lightning',
  fog: 'fog',
  monsoonKit: 'monsoon-kit',
  frostHail: 'frost-hail',
  rainChance: 'rain-chance',
};

/** Three-question check for the Lightning Smart badge (PRD 9.4). */
export const ARTICLE_CHECKS = {
  lightning: [
    { id: 'q1', options: ['tree', 'car', 'field'], answer: 'car' },
    { id: 'q2', options: ['5', '30', '60'], answer: '30' },
    { id: 'q3', options: ['yes', 'no'], answer: 'no' },
  ],
};
