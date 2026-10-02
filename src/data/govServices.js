/**
 * Official government weather and related services (PRD 20.16, 26.3).
 * Official URLs only. `personas` decides where each is highlighted; 'all'
 * shows everywhere. Play Store ids VERIFY before release.
 */
export const GOV_SERVICES = [
  { id: 'imd', owner: 'MoES / IMD', url: 'https://mausam.imd.gov.in', personas: ['all'], icon: 'fa-solid fa-tower-broadcast', theme: 'purple', category: 'portal', type: 'Website' },
  { id: 'mausamApp', owner: 'IMD', url: 'https://play.google.com/store/apps/details?id=com.imd.masuam', personas: ['all'], verify: true, icon: 'fa-solid fa-mobile-screen-button', theme: 'blue', category: 'app', type: 'Mobile App' },
  { id: 'meghdoot', owner: 'IMD, ICAR', url: 'https://play.google.com/store/apps/details?id=com.aas.meghdoot', personas: ['farm'], verify: true, icon: 'fa-solid fa-cloud-sun-rain', theme: 'emerald', category: 'farm', type: 'Agromet App' },
  { id: 'damini', owner: 'IITM', url: 'https://play.google.com/store/apps/details?id=com.lightening.live.damini', personas: ['work', 'farm', 'fitness'], verify: true, icon: 'fa-solid fa-bolt', theme: 'amber', category: 'safety', type: 'Safety App' },
  { id: 'sachet', owner: 'NDMA', url: 'https://sachet.ndma.gov.in', personas: ['all'], icon: 'fa-solid fa-triangle-exclamation', theme: 'red', category: 'safety', type: 'Disaster Portal' },
  { id: 'umang', owner: 'MeitY', url: 'https://web.umang.gov.in', personas: ['all'], icon: 'fa-solid fa-layer-group', theme: 'orange', category: 'app', type: 'Super App' },
  { id: 'cpcb', owner: 'CPCB', url: 'https://airquality.cpcb.gov.in', personas: ['health', 'family'], icon: 'fa-solid fa-lungs', theme: 'teal', category: 'health', type: 'AQI Portal' },
  { id: 'incois', owner: 'MoES', url: 'https://incois.gov.in', personas: ['coast', 'fisher'], icon: 'fa-solid fa-water', theme: 'cyan', category: 'coast', type: 'Ocean Portal' },
  { id: 'fitIndia', owner: 'MoYAS', url: 'https://fitindia.gov.in', personas: ['fitness'], icon: 'fa-solid fa-person-running', theme: 'gold', category: 'health', type: 'Fitness Portal' },
  { id: 'pmkisan', owner: 'MoA&FW', url: 'https://pmkisan.gov.in', personas: ['farm'], icon: 'fa-solid fa-wheat-awn', theme: 'emerald', category: 'farm', type: 'Farmer Support' },
  { id: 'pmfby', owner: 'MoA&FW', url: 'https://pmfby.gov.in', personas: ['farm'], icon: 'fa-solid fa-shield-heart', theme: 'emerald', category: 'farm', type: 'Crop Insurance' },
  { id: 'enam', owner: 'MoA&FW', url: 'https://enam.gov.in', personas: ['farm'], icon: 'fa-solid fa-store', theme: 'emerald', category: 'farm', type: 'Mandi Market' },
  { id: 'ndma', owner: 'NDMA', url: 'https://ndma.gov.in', personas: ['work', 'family'], icon: 'fa-solid fa-shield-halved', theme: 'red', category: 'safety', type: 'NDMA Guidelines' },
  { id: 'indiaPortal', owner: 'NIC', url: 'https://www.india.gov.in', personas: ['all'], icon: 'fa-solid fa-landmark', theme: 'purple', category: 'portal', type: 'National Portal' },
];
