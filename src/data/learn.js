/**
 * Learn articles (PRD 9.3, 21.1). Text lives in the locale files under
 * learn.articles.<slug>.{title, summary, body[]}; this file holds the
 * structure: icon, related pages and sources. Hindi was translated by the
 * build team and needs review by a fluent speaker (PRD 22.4 item 6).
 */
export const ARTICLES = [
  { slug: 'colours', icon: 'fa-solid fa-palette', related: ['/alerts'], sources: ['IMD', 'NDMA'], theme: 'purple', category: 'alerts', readTime: '2 min', tag: 'IMD Alert Colors' },
  { slug: 'heat', icon: 'fa-solid fa-temperature-high', related: ['/health', '/work'], sources: ['IMD heat wave FAQ', 'NDMA heat wave guidelines', 'NCDC'], theme: 'orange', category: 'health', readTime: '3 min', tag: 'Heatwave & First Aid' },
  { slug: 'lightning', icon: 'fa-solid fa-bolt', related: ['/work', '/farm'], sources: ['NDMA lightning guidelines', 'IMD', 'Damini (IITM)'], check: 'lightning', theme: 'amber', category: 'safety', readTime: '2 min', tag: '30-30 Rule' },
  { slug: 'aqi', icon: 'fa-solid fa-lungs', related: ['/health'], sources: ['CPCB National AQI', 'MoEFCC'], theme: 'teal', category: 'health', readTime: '3 min', tag: 'Air Quality & Masks' },
  { slug: 'uv', icon: 'fa-solid fa-sun', related: ['/health', '/coast'], sources: ['WHO UV index guidance'], theme: 'gold', category: 'health', readTime: '2 min', tag: 'UV & Sun Protection' },
  { slug: 'fog', icon: 'fa-solid fa-smog', related: ['/commute', '/travel'], sources: ['IMD fog classification', 'MoRTH road safety'], theme: 'slate', category: 'travel', readTime: '2 min', tag: 'Fog Driving Safety' },
  { slug: 'monsoon-kit', icon: 'fa-solid fa-umbrella', related: ['/ready', '/commute'], sources: ['NDMA flood guidelines'], theme: 'blue', category: 'safety', readTime: '3 min', tag: 'Monsoon Checklist' },
  { slug: 'cyclone', icon: 'fa-solid fa-hurricane', related: ['/alerts', '/coast'], sources: ['IMD cyclone warnings', 'NDMA'], theme: 'red', category: 'safety', readTime: '3 min', tag: 'Cyclone Evacuation' },
  { slug: 'rain-chance', icon: 'fa-solid fa-cloud-rain', related: ['/forecast'], sources: ['IMD rainfall terminology'], theme: 'indigo', category: 'daily', readTime: '2 min', tag: 'Rain Probability' },
  { slug: 'beach', icon: 'fa-solid fa-person-swimming', related: ['/coast'], sources: ['INCOIS', 'Lifesaving guidance'], theme: 'cyan', category: 'safety', readTime: '3 min', tag: 'Rip Currents & Sea' },
  { slug: 'frost-hail', icon: 'fa-solid fa-snowflake', related: ['/farm'], sources: ['IMD agromet', 'ICAR'], theme: 'emerald', category: 'farm', readTime: '3 min', tag: 'Crops & Frost' },
  { slug: 'how-it-works', icon: 'fa-solid fa-diagram-project', related: ['/settings#layout'], sources: [], theme: 'violet', category: 'daily', readTime: '2 min', tag: 'Platform Rules' },
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
