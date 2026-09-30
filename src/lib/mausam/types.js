/**
 * Normalised data model (PRD section 12.3). JSDoc only; no runtime code.
 *
 * Every provider adapter converts its payload into these shapes, so rules,
 * indices and components never see a provider's own field names.
 *
 * @typedef {object} Place
 * @property {string} id 'current' | 'home' | 'work' | uuid
 * @property {string} name display name
 * @property {number} lat rounded to 2 decimals when sent to the server
 * @property {number} lon
 * @property {string} [district] IMD district name
 * @property {string} [districtId]
 * @property {string} [state]
 * @property {string} [stationId] nearest IMD station within 25 km
 * @property {boolean} [isCoastal] within 5 km of the coastline
 * @property {number} [elevationM]
 * @property {string} [timezone] e.g. 'Asia/Kolkata'
 * @property {'home'|'work'|'school'|'farm'|'beach'|'trip'|'other'} [type]
 *
 * @typedef {object} Hour
 * @property {string} time ISO with offset
 * @property {number} tempC
 * @property {number} feelsC per PRD 6.6.1
 * @property {number} rh
 * @property {number} dewPointC
 * @property {number} precipProb 0 to 100
 * @property {number} precipMm
 * @property {number} wmo WMO weather code
 * @property {number} cloudPct
 * @property {number|null} visibilityM
 * @property {number} windKmh
 * @property {number} gustKmh
 * @property {number} windDirDeg
 * @property {number} uv
 * @property {boolean} isDay
 * @property {number|null} aqi NAQI for the hour, when known
 * @property {{m0_1:number, m3_9:number, m9_27:number, t0:number}|null} soil
 *
 * @typedef {object} Day
 * @property {string} date YYYY-MM-DD
 * @property {number} maxC
 * @property {number} minC
 * @property {number} feelsMaxC
 * @property {number} precipMm
 * @property {number} precipProbMax
 * @property {number} wmo
 * @property {number} windMaxKmh
 * @property {number} gustMaxKmh
 * @property {number} uvMax
 * @property {string} sunrise ISO with offset
 * @property {string} sunset ISO with offset
 * @property {string} [imdText]
 * @property {'imd'|'open-meteo'|'fixture'} source
 *
 * @typedef {object} AirQuality
 * @property {number} aqi NAQI 0 to 500
 * @property {'good'|'satisfactory'|'moderate'|'poor'|'very_poor'|'severe'} category
 * @property {string} dominant 'pm2_5' | 'pm10' | ...
 * @property {number} pm25
 * @property {number} pm10
 * @property {'cpcb'|'computed'|'fixture'} method
 * @property {string} [stationName]
 * @property {number} [stationDistanceKm]
 * @property {Array<{time:string, aqi:number}>} hourly past 12 h + next 48 h
 *
 * @typedef {object} Marine
 * @property {Array<{time:string, waveM:number, swellM:number, swellPeriodS:number, waveDirDeg:number, sstC:number|null, seaLevelM:number|null}>} hourly
 * @property {Array<{time:string, type:'high'|'low', heightM:number}>} tides empty if unavailable
 *
 * @typedef {object} Warning
 * @property {string} id
 * @property {'imd_district'|'imd_nowcast'|'imd_marine'|'imd_highway'|'imd_cyclone'|'ndma_cap'} source
 * @property {string} hazard hazard id (src/lib/mausam/hazards.js)
 * @property {1|2|3|4} level 1 green, 2 yellow, 3 orange, 4 red
 * @property {string} title
 * @property {string} text verbatim
 * @property {string} [instruction] verbatim (CAP)
 * @property {string} area
 * @property {string} issuedAt
 * @property {string} validFrom
 * @property {string} validTo
 * @property {string} issuer
 * @property {string} lang
 *
 * @typedef {object} WeatherSnapshot
 * @property {Place} place
 * @property {number} utcOffsetSeconds
 * @property {object} current { time, tempC, feelsC, rh, wmo, windKmh, gustKmh, windDirDeg, visibilityM, uv, isDay, source, updatedAt }
 * @property {Hour[]} hourly past 12 h + next 48 h
 * @property {Day[]} daily up to 16 days
 * @property {AirQuality|null} air
 * @property {Marine|null} marine
 * @property {Warning[]} warnings
 * @property {'ok'|'partial'|'unavailable'|'not_applicable'} warningsStatus
 * @property {object|null} sun { sunrise, sunset, dawn, dusk, goldenHour, moonPhase, moonIllumination }
 * @property {Array<{name:string, fields:string[], updatedAt:string}>} sources
 * @property {boolean} isDemo true if any fixture was used
 * @property {boolean} [stale] served from cache after upstream failure
 * @property {string} fetchedAt
 *
 * @typedef {object} CrowdReport
 * @property {string} id
 * @property {'waterlogging'|'sky'|'fog'} type
 * @property {string} label
 * @property {number} confidence
 * @property {number|null} severity 1 to 4 for waterlogging
 * @property {number} lat grid-rounded
 * @property {number} lon
 * @property {string} areaName locality only, never a street address
 * @property {'ai_verified'|'unverified'|'community_verified'|'cleared'} status
 * @property {number} confirmations
 * @property {number} clears
 * @property {string} observedAt
 * @property {string} expiresAt
 * @property {string} modelVersion
 *
 * @typedef {object} DecisionCard
 * @property {string} id `${ruleId}:${date}:${placeId}`
 * @property {string} ruleId
 * @property {'official'|'tip'|'good'} kind
 * @property {number} severity tips 1 to 3; official = IMD level; good = 0
 * @property {string|null} hazard hazard group
 * @property {object} params numbers and times for i18n interpolation
 * @property {string[]} chips pictorial action tags
 * @property {string} whyKey
 * @property {Array} sources
 * @property {Array} [addOns] tip advice folded into an official card
 * @property {boolean} dismissible false for official cards
 */

export {};
