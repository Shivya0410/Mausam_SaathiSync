// WHO UV index categories (PRD Appendix A.4). Pure.

export function uvCategory(uv) {
  if (!Number.isFinite(uv)) return null;
  if (uv < 3) return 'low';
  if (uv < 6) return 'moderate';
  if (uv < 8) return 'high';
  if (uv < 11) return 'very_high';
  return 'extreme';
}

/** Run Score UV penalty (PRD 6.6.3). */
export function uvPenalty(uv) {
  if (!Number.isFinite(uv)) return 0;
  if (uv >= 8) return 15;
  if (uv >= 6) return 8;
  return 0;
}
