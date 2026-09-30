// Tunable thresholds for the simple balance/stability check.
// Kept separate from the detection logic in BalanceTest.js so they can be
// adjusted after real testing (camera distance/resolution changes how many
// pixels of sway correspond to real-world movement).
export const BALANCE_CONFIG = {
  // Video/canvas size the pixel thresholds below assume.
  VIDEO_WIDTH: 480,
  VIDEO_HEIGHT: 360,

  // Hip-center movement (pixels) beyond which a frame counts as "unstable".
  SWAY_THRESHOLD_PX: 18,

  // How quickly the reference ("resting") position drifts to follow slow,
  // intentional movement rather than flagging it as instability forever.
  // 0 = reference never updates, 1 = reference always matches current frame.
  REFERENCE_SMOOTHING: 0.02,

  MIN_KEYPOINT_SCORE: 0.35,
  DETECTION_INTERVAL_MS: 100,
  TEST_DURATION_SECONDS: 30,

  // Non-clinical descriptive bands based on % of the test spent stable.
  FEEDBACK_BANDS: [
    { max: 50, label: "Noticeable sway was detected during this attempt. This is a simple indicator, not a diagnosis — consider trying again with support nearby." },
    { max: 80, label: "Some sway was detected — a moderate result for this simple check." },
    { max: Infinity, label: "Good steadiness was maintained for most of this attempt." },
  ],
};
