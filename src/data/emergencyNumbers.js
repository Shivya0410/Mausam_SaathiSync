/**
 * Emergency and helpline numbers (PRD 26.2). VERIFY each against NDMA's
 * current list before release; `verify: true` marks ones the PRD flags.
 */
export const EMERGENCY_NUMBERS = [
  { number: '112', key: 'national', primary: true },
  { number: '108', key: 'ambulance', primary: true },
  { number: '101', key: 'fire' },
  { number: '100', key: 'police' },
  { number: '1070', key: 'stateEoc', verify: true },
  { number: '1077', key: 'districtEoc', verify: true },
  { number: '1078', key: 'ndma', verify: true },
  { number: '1554', key: 'coastGuard', verify: true },
  { number: '14416', key: 'teleManas' },
];
