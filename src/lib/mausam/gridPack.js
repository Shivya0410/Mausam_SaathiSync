// Homepage grid packing (PRD 5.9). Pure.
//
// Fill 12-column rows left to right in rank order. When the next widget
// does not fit the space left in a row, pull the next widget (within a
// short look-ahead) that does fit. The returned order is also the DOM
// order, so reading order equals visual order (WCAG 2.4.3).

export const SPAN = { full: 12, half: 6, third: 4 };

/**
 * @param {Array<{ id, size: 'full'|'half'|'third' }>} items in rank order
 * @param {{ cols?: number, lookAhead?: number }} [opts]
 * @returns {Array} the same items, reordered
 */
export function packRows(items, { cols = 12, lookAhead = 3 } = {}) {
  const queue = items.slice();
  const out = [];
  let left = cols;
  while (queue.length) {
    let idx = queue.findIndex((it, i) => i <= lookAhead && SPAN[it.size] <= left);
    if (idx === -1) {
      left = cols; // start a new row with the next item
      idx = 0;
    }
    const [item] = queue.splice(idx, 1);
    out.push(item);
    left -= SPAN[item.size];
    if (left <= 0) left = cols;
  }
  return out;
}
