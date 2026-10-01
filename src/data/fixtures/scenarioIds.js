/**
 * Demo scenario ids (PRD 24). Kept apart from the fixture builder so the
 * app shell can check ids without bundling the fixtures (PRD 13.8). A test
 * keeps this list equal to the builder's.
 */
export const SCENARIO_IDS = Object.freeze(['delhi-winter-smog-fog', 'mumbai-monsoon-red', 'chennai-cyclone', 'lucknow-heatwave', 'punjab-village-frost', 'goa-swell-alert']);

export function isScenario(id) {
  return SCENARIO_IDS.includes(id);
}
