/**
 * Repository contract for the entities the implemented endpoints touch.
 *
 * Entity names match section 9 of the architecture brief so the eventual
 * database schema and this interface do not drift apart.
 *
 * Every method takes `ownerId` as its first argument. That is not a
 * convention, it is the mechanism: there is no method that can read or write
 * a record without being told whose it is, so an endpoint physically cannot
 * return another user's data by forgetting a filter.
 *
 * @typedef {object} UserPreferences
 * @property {string}  ownerId
 * @property {string}  locale        'en' | 'hi'
 * @property {string}  timezone      IANA zone, e.g. 'Asia/Kolkata'
 * @property {boolean} reducedMotion
 * @property {boolean} largeText
 * @property {number}  version       incremented on each write
 * @property {string}  updatedAt     ISO timestamp
 *
 * @typedef {object} DailyCheckIn
 * @property {string} ownerId
 * @property {string} localDate      YYYY-MM-DD in the owner's timezone
 * @property {string} energy         'low' | 'medium' | 'high'
 * @property {string} [note]
 * @property {string} createdAt
 *
 * @typedef {object} HabitLog
 * @property {string} id
 * @property {string} ownerId
 * @property {string} kind           'water' | 'steps' | 'movement' | 'mindfulness'
 * @property {number} quantity
 * @property {string} unit
 * @property {string} source         'manual' — the only honest value today
 * @property {string} localDate
 * @property {string} createdAt
 *
 * @typedef {object} IdempotencyRecord
 * @property {string} ownerId
 * @property {string} key
 * @property {string} bodyHash
 * @property {object} result
 * @property {string} createdAt
 */

/**
 * @typedef {object} Repositories
 * @property {{
 *   get:   (ownerId: string) => Promise<UserPreferences|null>,
 *   upsert:(ownerId: string, patch: object) => Promise<UserPreferences>
 * }} preferences
 * @property {{
 *   findByDate: (ownerId: string, localDate: string) => Promise<DailyCheckIn|null>,
 *   create:     (ownerId: string, checkIn: object) => Promise<DailyCheckIn>
 * }} checkIns
 * @property {{
 *   append:  (ownerId: string, habit: object) => Promise<HabitLog>,
 *   listAll: (ownerId: string) => Promise<HabitLog[]>
 * }} habits
 * @property {{
 *   find:   (ownerId: string, key: string) => Promise<IdempotencyRecord|null>,
 *   record: (ownerId: string, key: string, bodyHash: string, result: object) => Promise<void>
 * }} idempotency
 * @property {() => { name: string, durable: boolean }} describe
 */

export {};
