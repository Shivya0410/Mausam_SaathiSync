// Attribution line for a photo from src/data/fitnessPhotos.js. CC BY and
// CC BY-SA licences require crediting the author and naming the licence.
export default function PhotoCredit({ photo, style }) {
  if (!photo) return null;
  return (
    <a
      href={photo.source}
      target="_blank"
      rel="noopener noreferrer"
      style={{ fontSize: '0.68rem', color: 'inherit', opacity: 0.75, textDecoration: 'none', ...style }}
    >
      Photo: {photo.author} · {photo.license} · Wikimedia Commons
    </a>
  );
}
