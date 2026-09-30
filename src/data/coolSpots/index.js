/**
 * Public places where people can usually rest out of the sun and find
 * drinking water (PRD section 8.9): metro and railway concourses, public
 * libraries, government hospitals. None is a confirmed cooling centre: the
 * UI must say "public place, not a confirmed cooling centre" unless an
 * entry is sourced from a published Heat Action Plan (`hap: true`).
 *
 * Coordinates are approximate. VERIFY names, opening hours and access with
 * the city's Heat Action Plan before release.
 */

import { haversineKm } from '../../lib/mausam/geo.js';

const s = (name, type, lat, lon) => ({ name, type, lat, lon, hap: false });

export const COOL_SPOTS = {
  delhi: [
    s('Rajiv Chowk Metro concourse', 'metro', 28.6328, 77.2197),
    s('New Delhi Metro station concourse', 'metro', 28.643, 77.2222),
    s('Kashmere Gate Metro concourse', 'metro', 28.6675, 77.2282),
    s('Central Secretariat Metro concourse', 'metro', 28.6149, 77.2119),
    s('Hauz Khas Metro concourse', 'metro', 28.5434, 77.2066),
    s('Delhi Public Library, S.P. Mukherjee Marg', 'library', 28.6571, 77.2275),
    s('AIIMS, Ansari Nagar (public areas)', 'hospital', 28.5672, 77.21),
    s('Safdarjung Hospital (public areas)', 'hospital', 28.5686, 77.2069),
    s('Lok Nayak Hospital (public areas)', 'hospital', 28.6388, 77.2388),
    s('New Delhi Railway Station concourse', 'railway', 28.6421, 77.2195),
  ],
  mumbai: [
    s('CSMT station concourse', 'railway', 18.9398, 72.8355),
    s('Churchgate station concourse', 'railway', 18.9353, 72.827),
    s('Dadar station concourse', 'railway', 19.0186, 72.8429),
    s('Andheri station concourse', 'railway', 19.1197, 72.8464),
    s('Ghatkopar Metro concourse', 'metro', 19.0864, 72.9082),
    s('KEM Hospital (public areas)', 'hospital', 19.0023, 72.8424),
    s('JJ Hospital (public areas)', 'hospital', 18.963, 72.833),
    s('Asiatic Society Library, Horniman Circle', 'library', 18.9316, 72.8364),
  ],
  lucknow: [
    s('Charbagh Railway Station concourse', 'railway', 26.8318, 80.9203),
    s('Hazratganj Metro concourse', 'metro', 26.8497, 80.9433),
    s('Charbagh Metro concourse', 'metro', 26.8324, 80.9224),
    s('Amir-ud-Daula Public Library, Qaiserbagh', 'library', 26.8556, 80.9321),
    s('Civil Hospital (Shyama Prasad Mukherjee), public areas', 'hospital', 26.8537, 80.9448),
    s('KGMU, public areas', 'hospital', 26.871, 80.9154),
    s('Alambagh Bus Terminal', 'bus', 26.8145, 80.9057),
  ],
  ahmedabad: [
    s('Kalupur Railway Station concourse', 'railway', 23.0268, 72.601),
    s('Civil Hospital, Asarwa (public areas)', 'hospital', 23.053, 72.6035),
    s('SVP Hospital (public areas)', 'hospital', 23.0198, 72.563),
    s('V.S. Hospital (public areas)', 'hospital', 23.0205, 72.569),
    s('M.J. Library, Ellisbridge', 'library', 23.0233, 72.57),
  ],
  hyderabad: [
    s('Ameerpet Metro concourse', 'metro', 17.4375, 78.4483),
    s('Raidurg Metro concourse', 'metro', 17.4432, 78.3771),
    s('Secunderabad Railway Station concourse', 'railway', 17.4337, 78.5016),
    s('Mahatma Gandhi Bus Station (MGBS)', 'bus', 17.3784, 78.4818),
    s('State Central Library, Afzalgunj', 'library', 17.3747, 78.477),
    s('Osmania General Hospital (public areas)', 'hospital', 17.3727, 78.4747),
    s('Gandhi Hospital (public areas)', 'hospital', 17.4217, 78.5034),
  ],
};

/** Cool spots within `km` of a place, nearest first, with distanceM. */
export function coolSpotsNear(place, km = 25) {
  if (!place || !Number.isFinite(place.lat)) return [];
  return Object.values(COOL_SPOTS)
    .flat()
    .map((spot) => ({ ...spot, distanceM: Math.round(haversineKm(place, spot) * 1000) }))
    .filter((spot) => spot.distanceM <= km * 1000)
    .sort((a, b) => a.distanceM - b.distanceM);
}
