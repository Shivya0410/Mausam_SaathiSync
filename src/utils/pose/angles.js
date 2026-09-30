// Small 2D geometry helpers shared by the functional-assessment tests
// (chair stand, balance). These operate on plain {x, y} points, which is
// what MoveNet keypoints already are - no tensors, no extra dependency.

// Angle in degrees at vertex B, formed by rays B->A and B->C.
// Used e.g. for the hip-knee-ankle angle to tell seated from standing.
export function angleBetweenPoints(a, b, c) {
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  const dot = baX * bcX + baY * bcY;
  const magBA = Math.hypot(baX, baY);
  const magBC = Math.hypot(bcX, bcY);
  if (magBA === 0 || magBC === 0) return null;

  const cos = Math.min(1, Math.max(-1, dot / (magBA * magBC)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Picks a named keypoint by score, returning null if below the confidence
// threshold so callers can decide how to handle missing joints.
export function getKeypoint(keypoints, pointsMap, name, minScore = 0.4) {
  const point = keypoints[pointsMap[name]];
  if (!point || point.score < minScore) return null;
  return point;
}
