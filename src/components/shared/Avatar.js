// Illustrated profile picture for the sample community members, inbox senders
// and notification sources.
//
// These people are fictional, so they get drawn avatars rather than photos of
// real, identifiable strangers. The drawing is derived from a seed (usually
// the person's name), so the same person always looks the same everywhere.
// Pure SVG with no hooks, so it renders on the server and the client alike.

const BACKGROUNDS = ['#ede4ff', '#ffe3ec', '#dff4ea', '#fff1d6', '#dcecff', '#f3e0ff'];
const SKIN = ['#f5d0b0', '#e8b48f', '#c98e66', '#a86f4c', '#8a5a3b', '#6b4430'];
const HAIR = ['#1f1a17', '#3b2a20', '#5a3a26', '#7b4a2c', '#2b2b3a', '#9a9a9a'];
const SHIRT = ['#6a1b9a', '#493971', '#0f766e', '#c2410c', '#1d4ed8', '#be185d'];

function hash(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(list, h, shift) {
  return list[(h >>> shift) % list.length];
}

export default function Avatar({ seed = 'swasth', size = 40, className, style, title, look }) {
  const h = hash(seed);
  const bg = pick(BACKGROUNDS, h, 0);
  const skin = pick(SKIN, h, 3);
  const hair = pick(HAIR, h, 6);
  const shirt = pick(SHIRT, h, 9);
  // `look` lets a caller pin the drawing, e.g. { hair: 0, glasses: true }.
  const hairStyle = look?.hair ?? (h >>> 12) % 4; // 0 short, 1 long, 2 bun, 3 curly
  const glasses = look?.glasses ?? (h >>> 15) % 5 === 0;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: '50%', flexShrink: 0, display: 'block', ...style }}
      role="img"
      aria-label={title || seed}
    >
      <rect width="64" height="64" fill={bg} />
      {hairStyle === 1 && <path d="M16 30c0-12 7-19 16-19s16 7 16 19v18H16z" fill={hair} />}
      <path d="M12 64c1-12 9-18 20-18s19 6 20 18z" fill={shirt} />
      <rect x="27" y="38" width="10" height="9" rx="4" fill={skin} />
      <ellipse cx="32" cy="29" rx="11" ry="12.5" fill={skin} />
      {hairStyle === 0 && <path d="M21 27c0-9 5-14 11-14s11 5 11 14c-3-5-7-7-11-7s-8 2-11 7z" fill={hair} />}
      {hairStyle === 1 && <path d="M21 27c1-8 5-13 11-13s10 5 11 13c-4-4-7-6-11-6s-7 2-11 6z" fill={hair} />}
      {hairStyle === 2 && (
        <>
          <circle cx="32" cy="12" r="5.5" fill={hair} />
          <path d="M21 27c0-9 5-13 11-13s11 4 11 13c-3-5-7-6-11-6s-8 1-11 6z" fill={hair} />
        </>
      )}
      {hairStyle === 3 && (
        <path
          d="M20 28c-2-4 0-9 4-10 1-4 6-6 9-4 4-2 9 1 9 5 4 2 5 7 2 9-3-4-8-6-12-6s-9 2-12 6z"
          fill={hair}
        />
      )}
      <circle cx="28" cy="30" r="1.3" fill="#2a1f1a" />
      <circle cx="36" cy="30" r="1.3" fill="#2a1f1a" />
      <path d="M28.5 35.5c2 1.6 5 1.6 7 0" stroke="#7a3b2e" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {glasses && (
        <g stroke="#2b2b3a" strokeWidth="1.2" fill="none">
          <circle cx="28" cy="30" r="3.4" />
          <circle cx="36" cy="30" r="3.4" />
          <path d="M31.4 30h1.2" />
        </g>
      )}
    </svg>
  );
}
