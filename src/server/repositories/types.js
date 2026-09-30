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
 * @typedef {object} CrowdReport
 * Anonymous and public, so NOT owner-scoped: the one deliberate exception to
 * the ownerId rule above. No free text, no photos; coordinates are snapped
 * to a ~500 m grid; the device id is kept only as a salted `clientHash`,
 * which never leaves the server.
 * @property {string} id
 * @property {string} type           'waterlogging' | 'sky' | 'fog'
 * @property {string} label          model label, e.g. 'flooded_street', 'Cb'
 * @property {number} confidence     on-device model confidence, 0 to 1
 * @property {number|null} severity  1 ankle, 2 knee, 3 waist, 4 vehicle stuck
 * @property {number} lat            grid-snapped
 * @property {number} lon            grid-snapped
 * @property {string} status         'ai_verified' | 'unverified' | 'community_verified' | 'cleared'
 * @property {number} confirmations  "Still there? Yes" votes
 * @property {number} clears         "Still there? No" votes
 * @property {string} observedAt
 * @property {string} expiresAt      observedAt + 3 h (waterlogging), 2 h (fog), 1 h (sky)
 * @property {string} modelVersion
 * @property {string} clientHash     server only
 *
 * @typedef {object} ReportVote      stored inside the report as voters[clientHash]
 * @property {string} vote           'still' | 'cleared'
 *
 * @typedef {object} FeedbackItem
 * @property {string} id
 * @property {string} kind           'card' | 'site'
 * @property {string} [ruleId]
 * @property {boolean} [helpful]
 * @property {string|null} message   max 1,000 characters, no personal data asked for
 * @property {string} [lang]
 * @property {string} [page]
 * @property {string} createdAt
 *
 * @typedef {object} PushSubscription
 * @property {string} endpoint
 * @property {object} keys
 * @property {string} districtId
 * @property {object} prefs
 *
 * @typedef {object} WarningState    last warning level sent per district (push de-duplication)
 * @property {string} key
 * @property {number} level
 * @property {string} updatedAt
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
 * @property {{
 *   create: (report: object) => Promise<CrowdReport>,
 *   get: (id: string) => Promise<CrowdReport|null>,
 *   update: (id: string, patch: object) => Promise<CrowdReport|null>,
 *   listNear: (lat: number, lon: number, radiusKm: number, types: string[], now?: number) => Promise<CrowdReport[]>,
 *   listByClient: (clientHash: string, sinceMs: number) => Promise<CrowdReport[]>,
 *   vote: (id: string, clientHash: string, vote: string) => Promise<CrowdReport|null>,
 *   listSince: (sinceMs: number) => Promise<CrowdReport[]>
 * }} reports
 * @property {{ create: (item: object) => Promise<FeedbackItem>, list: () => Promise<FeedbackItem[]> }} feedback
 * @property {{
 *   upsert: (sub: object) => Promise<PushSubscription>,
 *   remove: (endpoint: string) => Promise<boolean>,
 *   listByDistrict: (districtId: string) => Promise<PushSubscription[]>
 * }} push
 * @property {{ get: (key: string) => Promise<WarningState|null>, set: (key: string, value: object) => Promise<void> }} warningState
 * @property {() => { name: string, durable: boolean }} describe
 */

export {};
