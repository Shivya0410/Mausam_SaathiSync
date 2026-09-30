/**
 * Official government weather and related services (PRD 20.16, 26.3).
 * Official URLs only. `personas` decides where each is highlighted; 'all'
 * shows everywhere. Play Store ids VERIFY before release.
 */
export const GOV_SERVICES = [
  { id: 'imd', owner: 'MoES/IMD', url: 'https://mausam.imd.gov.in', personas: ['all'] },
  { id: 'mausamApp', owner: 'IMD', url: 'https://play.google.com/store/apps/details?id=com.imd.masuam', personas: ['all'], verify: true },
  { id: 'meghdoot', owner: 'IMD, ICAR', url: 'https://play.google.com/store/apps/details?id=com.aas.meghdoot', personas: ['farm'], verify: true },
  { id: 'damini', owner: 'IITM', url: 'https://play.google.com/store/apps/details?id=com.lightening.live.damini', personas: ['work', 'farm', 'fitness'], verify: true },
  { id: 'sachet', owner: 'NDMA', url: 'https://sachet.ndma.gov.in', personas: ['all'] },
  { id: 'umang', owner: 'MeitY', url: 'https://web.umang.gov.in', personas: ['all'] },
  { id: 'cpcb', owner: 'CPCB', url: 'https://airquality.cpcb.gov.in', personas: ['health', 'family'] },
  { id: 'incois', owner: 'MoES', url: 'https://incois.gov.in', personas: ['coast', 'fisher'] },
  { id: 'fitIndia', owner: 'MoYAS', url: 'https://fitindia.gov.in', personas: ['fitness'] },
  { id: 'indiaPortal', owner: 'NIC', url: 'https://www.india.gov.in', personas: ['all'] },
];
