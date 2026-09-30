/**
 * FitVisionAI Workout CV Engine
 * Ported & adapted from Niyatiiii06/FitVisionAI
 * Implements joint angle calculations, state-machine rep counting,
 * real-time form scoring, and posture safety feedback for Gym workouts.
 */

import { calculateAngle } from "./mediapipeYoga";
import { POINTS } from "./data";

/**
 * Extracts gym-specific angles from keypoints
 */
export function extractGymAngles(keypoints) {
  const kp = (idx) => keypoints[idx] || { x: 0, y: 0 };

  const rs = kp(POINTS.RIGHT_SHOULDER);
  const re = kp(POINTS.RIGHT_ELBOW);
  const rw = kp(POINTS.RIGHT_WRIST);

  const ls = kp(POINTS.LEFT_SHOULDER);
  const le = kp(POINTS.LEFT_ELBOW);
  const lw = kp(POINTS.LEFT_WRIST);

  const rh = kp(POINTS.RIGHT_HIP);
  const lh = kp(POINTS.LEFT_HIP);

  const rk = kp(POINTS.RIGHT_KNEE);
  const lk = kp(POINTS.LEFT_KNEE);

  const ra = kp(POINTS.RIGHT_ANKLE);
  const la = kp(POINTS.LEFT_ANKLE);

  // Knee angles (Hip -> Knee -> Ankle)
  const leftKnee = calculateAngle(lh, lk, la);
  const rightKnee = calculateAngle(rh, rk, ra);
  const avgKnee = Math.round((leftKnee + rightKnee) / 2);

  // Hip angles (Shoulder -> Hip -> Knee)
  const leftHip = calculateAngle(ls, lh, lk);
  const rightHip = calculateAngle(rs, rh, rk);
  const avgHip = Math.round((leftHip + rightHip) / 2);

  // Elbow angles (Shoulder -> Elbow -> Wrist)
  const leftElbow = calculateAngle(ls, le, lw);
  const rightElbow = calculateAngle(rs, re, rw);
  const avgElbow = Math.round((leftElbow + rightElbow) / 2);

  // Shoulder angles (Elbow -> Shoulder -> Hip)
  const leftShoulder = calculateAngle(le, ls, lh);
  const rightShoulder = calculateAngle(re, rs, rh);
  const avgShoulder = Math.round((leftShoulder + rightShoulder) / 2);

  // Body alignment angle (Shoulder -> Hip -> Ankle)
  const leftBody = calculateAngle(ls, lh, la);
  const rightBody = calculateAngle(rs, rh, ra);
  const avgBody = Math.round((leftBody + rightBody) / 2);

  return {
    leftKnee,
    rightKnee,
    avgKnee,
    leftHip,
    rightHip,
    avgHip,
    leftElbow,
    rightElbow,
    avgElbow,
    leftShoulder,
    rightShoulder,
    avgShoulder,
    leftBody,
    rightBody,
    avgBody,
  };
}

/**
 * Exercise State Machine & Posture Checker Class (from FitVisionAI)
 */
export class FitVisionWorkoutTracker {
  constructor(exercise = "Squat") {
    this.exercise = exercise;
    this.repCount = 0;
    this.stage = "UP"; // "UP" or "DOWN"
    this.caloriesBurned = 0;
  }

  setExercise(exercise) {
    this.exercise = exercise;
    this.repCount = 0;
    this.stage = "UP";
  }

  reset() {
    this.repCount = 0;
    this.stage = "UP";
    this.caloriesBurned = 0;
  }

  processFrame(keypoints) {
    const angles = extractGymAngles(keypoints);
    let formScore = 100;
    let feedback = [];
    let stateChanged = false;

    if (this.exercise === "Squat") {
      // FitVisionAI Squat Logic
      // State transition
      if (angles.avgKnee < 110 && this.stage === "UP") {
        this.stage = "DOWN";
        stateChanged = true;
      } else if (angles.avgKnee > 155 && this.stage === "DOWN") {
        this.stage = "UP";
        this.repCount += 1;
        this.caloriesBurned += 0.32; // ~0.32 kcal per squat
        stateChanged = true;
      }

      // Form checking
      if (this.stage === "DOWN") {
        if (angles.avgKnee > 115) {
          formScore -= 25;
          feedback.push("Go lower — aim for parallel thighs");
        }
        if (angles.avgHip > 130) {
          formScore -= 20;
          feedback.push("Push hips back to protect knees");
        }
      } else {
        if (angles.avgBody < 155) {
          formScore -= 15;
          feedback.push("Keep back upright and chest high");
        }
      }

      if (feedback.length === 0) {
        feedback.push(
          this.stage === "DOWN" ? "Great depth! Power up through heels" : "Good stance. Begin your descent"
        );
      }
    } else if (this.exercise === "Push-up") {
      // FitVisionAI Push-up Logic
      if (angles.avgElbow < 100 && this.stage === "UP") {
        this.stage = "DOWN";
        stateChanged = true;
      } else if (angles.avgElbow > 150 && this.stage === "DOWN") {
        this.stage = "UP";
        this.repCount += 1;
        this.caloriesBurned += 0.28;
        stateChanged = true;
      }

      // Form checking
      if (angles.avgBody < 155) {
        formScore -= 30;
        feedback.push("Keep core tight — avoid sagging hips");
      }
      if (this.stage === "DOWN" && angles.avgElbow > 110) {
        formScore -= 20;
        feedback.push("Bend elbows to 90° for full chest range");
      }

      if (feedback.length === 0) {
        feedback.push(
          this.stage === "DOWN" ? "Chest near floor! Push up strongly" : "Plank straight. Lower with control"
        );
      }
    } else if (this.exercise === "Bicep Curl") {
      // Bicep Curl Logic
      if (angles.avgElbow < 55 && this.stage === "DOWN") {
        this.stage = "UP";
        stateChanged = true;
      } else if (angles.avgElbow > 150 && this.stage === "UP") {
        this.stage = "DOWN";
        this.repCount += 1;
        this.caloriesBurned += 0.22;
        stateChanged = true;
      }

      if (angles.avgShoulder > 35) {
        formScore -= 25;
        feedback.push("Keep elbows pinned to your sides");
      }

      if (feedback.length === 0) {
        feedback.push(
          this.stage === "UP" ? "Squeeze biceps at top! Lower slowly" : "Full extension. Curl upward"
        );
      }
    } else {
      // Plank / Static Core
      if (angles.avgBody >= 160) {
        formScore = 95;
        feedback.push("Excellent plank alignment! Keep breathing");
      } else {
        formScore = 65;
        feedback.push("Flatten spine — align shoulders, hips and ankles");
      }
    }

    formScore = Math.max(20, Math.min(100, formScore));

    return {
      exercise: this.exercise,
      reps: this.repCount,
      stage: this.stage,
      formScore,
      status: formScore >= 80 ? "Good" : formScore >= 60 ? "Fair" : "Needs Correction",
      tip: feedback[0] || "Maintain controlled tempo",
      angles,
      calories: Math.round(this.caloriesBurned * 10) / 10,
      stateChanged,
    };
  }
}
