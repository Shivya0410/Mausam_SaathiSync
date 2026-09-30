// Tunable thresholds for the 30-second chair stand test.
// Kept in one place so they can be adjusted after real testing without
// touching the detection/state-machine logic in ChairStandTest.js.
export const CHAIR_STAND_CONFIG = {
  // Knee angle (hip-knee-ankle, degrees) below which the person is
  // considered seated.
  SEATED_ANGLE_MAX: 110,

  // Knee angle above which the person is considered standing.
  // Left as a gap above SEATED_ANGLE_MAX (hysteresis) so a knee angle
  // hovering near one boundary can't flicker between states.
  STANDING_ANGLE_MIN: 155,

  // Minimum keypoint confidence to trust a joint for angle calculation.
  MIN_KEYPOINT_SCORE: 0.35,

  // Consecutive detection ticks a candidate state must hold before it's
  // accepted, to debounce single-frame pose jitter.
  CONFIRM_FRAMES: 3,

  // Detection loop interval in ms (matches the existing yoga pipeline).
  DETECTION_INTERVAL_MS: 100,

  // Test duration in seconds.
  TEST_DURATION_SECONDS: 30,

  // Simple, non-clinical rep-count bands for the end-of-test message.
  FEEDBACK_BANDS: [
    { max: 7, label: "Fewer reps than average — consider pacing yourself and consulting a professional if this feels difficult." },
    { max: 12, label: "A moderate number of reps for this test." },
    { max: Infinity, label: "A strong number of reps for this test." },
  ],
};
