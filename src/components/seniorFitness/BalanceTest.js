"use client";

// Self-contained balance/stability check. Reuses the same MoveNet detector,
// keypoint format and drawing helpers as the existing yoga pipeline
// (src/views/Yoga/Yoga.js), with its own webcam ref, canvas ref and
// detection loop so the yoga component is left untouched.
//
// This produces a simple, non-clinical "how steady were you" indicator
// based on 2D hip-center sway. It is not a fall-risk prediction.

import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { POINTS, keypointConnections } from "../../utils/data";
import { drawPoint, drawSegment } from "../../utils/helper";
import { distance, getKeypoint, midpoint } from "../../utils/pose/angles";
import { BALANCE_CONFIG as CFG } from "./balanceConfig";
import styles from "./seniorFitness.module.css";

function computeHipCenter(keypoints) {
  const minScore = CFG.MIN_KEYPOINT_SCORE;
  const leftHip = getKeypoint(keypoints, POINTS, "LEFT_HIP", minScore);
  const rightHip = getKeypoint(keypoints, POINTS, "RIGHT_HIP", minScore);
  if (leftHip && rightHip) return midpoint(leftHip, rightHip);
  return leftHip || rightHip || null;
}

export default function BalanceTest() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const referenceRef = useRef(null);
  const stableTicksRef = useRef(0);
  const totalTicksRef = useRef(0);
  const secondsLeftRef = useRef(CFG.TEST_DURATION_SECONDS);
  const runningRef = useRef(false);
  // Tracks the in-flight MoveNet warm-up promise so mount pre-warming and a
  // fast Start click share one creation instead of making duplicates.
  const warmupPromiseRef = useRef(null);
  const mountedRef = useRef(true);

  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CFG.TEST_DURATION_SECONDS);
  const [isStable, setIsStable] = useState(true);
  const [stablePercent, setStablePercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  // True while the MoveNet detector is loading (mount warm-up or a Start
  // that raced it). The Start button is disabled in this state.
  const [isInitializing, setIsInitializing] = useState(true);

  // Returns the cached detector, creating it once on first call. Concurrent
  // callers share the same in-flight promise, so duplicate detectors are
  // never created. Resolves to null if loading failed.
  const ensureDetector = () => {
    if (detectorRef.current) return Promise.resolve(detectorRef.current);
    if (!warmupPromiseRef.current) {
      warmupPromiseRef.current = poseDetection
        .createDetector(poseDetection.SupportedModels.MoveNet, {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
        })
        .then((detector) => {
          // Unmounted while loading - release immediately instead of caching.
          if (!mountedRef.current) {
            detector.dispose();
            return null;
          }
          detectorRef.current = detector;
          return detector;
        })
        .catch((error) => {
          console.error("Failed to load pose model:", error);
          return null;
        })
        .finally(() => {
          warmupPromiseRef.current = null;
        });
    }
    return warmupPromiseRef.current;
  };

  useEffect(() => {
    mountedRef.current = true;
    tf.setBackend("webgl").catch((error) => {
      console.error("Failed to initialize WebGL backend:", error);
    });
    // Pre-warm the detector on mount so clicking Start feels instant. The
    // webcam below mounts at the same time, so camera startup happens in
    // parallel with model loading.
    ensureDetector().then(() => {
      if (mountedRef.current) setIsInitializing(false);
    });
  }, []);

  // Clears both intervals only. The cached detector is intentionally kept so
  // re-starts (Try Again) are instant; it is released on unmount.
  const stopTimers = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const disposeDetector = () => {
    if (detectorRef.current) {
      detectorRef.current.dispose();
      detectorRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      runningRef.current = false;
      stopTimers();
      disposeDetector();
    };
  }, []);

  const detectFrame = async () => {
    const detector = detectorRef.current;
    if (
      !detector ||
      !webcamRef.current ||
      webcamRef.current.video?.readyState !== 4
    ) {
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      const poses = await detector.estimatePoses(video);
      const keypoints = poses[0]?.keypoints;
      if (!keypoints) return;

      keypoints.forEach((keypoint) => {
        if (keypoint.score <= CFG.MIN_KEYPOINT_SCORE) return;
        if (keypoint.name === "left_eye" || keypoint.name === "right_eye") return;
        drawPoint(ctx, keypoint.x, keypoint.y, 8, "rgb(255,255,255)");
        const connections = keypointConnections[keypoint.name] || [];
        connections.forEach((connection) => {
          const target = keypoints[POINTS[connection.toUpperCase()]];
          if (target) {
            drawSegment(ctx, [keypoint.x, keypoint.y], [target.x, target.y], "rgb(0,200,255)");
          }
        });
      });

      const hipCenter = computeHipCenter(keypoints);
      if (!hipCenter) return;

      if (!referenceRef.current) {
        referenceRef.current = hipCenter;
        return;
      }

      const sway = distance(hipCenter, referenceRef.current);
      const stableTick = sway <= CFG.SWAY_THRESHOLD_PX;

      totalTicksRef.current += 1;
      if (stableTick) stableTicksRef.current += 1;
      setIsStable(stableTick);
      setStablePercent(Math.round((stableTicksRef.current / totalTicksRef.current) * 100));

      // Slowly drift the reference point toward the current position so
      // deliberate repositioning isn't punished forever, while a sudden
      // wobble still registers against the old (pre-wobble) reference.
      const alpha = CFG.REFERENCE_SMOOTHING;
      referenceRef.current = {
        x: referenceRef.current.x + (hipCenter.x - referenceRef.current.x) * alpha,
        y: referenceRef.current.y + (hipCenter.y - referenceRef.current.y) * alpha,
      };
    } catch (err) {
      console.error(err);
    }
  };

  const startTest = async () => {
    // Guards against duplicate/leaked intervals if Start is triggered more
    // than once (e.g. a fast double click) before state has re-rendered:
    // this ref is checked and set synchronously, before the first await.
    if (runningRef.current) return;
    runningRef.current = true;
    stopTimers();

    setIsFinished(false);
    setSecondsLeft(CFG.TEST_DURATION_SECONDS);
    setStablePercent(0);
    setIsStable(true);
    setStatusMessage("");
    referenceRef.current = null;
    stableTicksRef.current = 0;
    totalTicksRef.current = 0;
    secondsLeftRef.current = CFG.TEST_DURATION_SECONDS;

    // Reuse the mount-time warmed detector; if warm-up hasn't finished (or
    // failed), wait for it here with the button showing loading feedback.
    let detector = detectorRef.current;
    if (!detector) {
      setIsInitializing(true);
      detector = await ensureDetector();
      if (!mountedRef.current) {
        runningRef.current = false;
        return;
      }
      setIsInitializing(false);
      if (!detector) {
        runningRef.current = false;
        setStatusMessage(
          "Could not load the pose model. Please check your connection and try again."
        );
        return;
      }
    }
    detectorRef.current = detector;

    setIsRunning(true);
    detectionIntervalRef.current = setInterval(detectFrame, CFG.DETECTION_INTERVAL_MS);

    // Plain setInterval callback (not a React state updater), so calling
    // finishTest() here directly - rather than from inside setSecondsLeft's
    // updater - is a normal, safe side effect.
    timerIntervalRef.current = setInterval(() => {
      secondsLeftRef.current -= 1;
      setSecondsLeft(Math.max(secondsLeftRef.current, 0));
      if (secondsLeftRef.current <= 0) {
        finishTest();
      }
    }, 1000);
  };

  const finishTest = () => {
    if (!runningRef.current) return;
    runningRef.current = false;
    // Keep the cached detector so Try Again starts instantly.
    stopTimers();

    setIsRunning(false);
    setIsFinished(true);

    const percent = totalTicksRef.current
      ? Math.round((stableTicksRef.current / totalTicksRef.current) * 100)
      : 0;
    setStablePercent(percent);

    const band = CFG.FEEDBACK_BANDS.find((b) => percent <= b.max);
    setStatusMessage(band ? band.label : "");
  };

  const stopTest = () => {
    finishTest();
  };

  return (
    <div className={styles.container}>
      <h2>Balance Test</h2>
      <p className={styles.disclaimer}>
        This is a simple functional screening exercise, not a medical
        diagnosis or fall-risk prediction. Only attempt this near a wall,
        counter or sturdy chair you can hold onto, and stop if you feel
        unsteady.
      </p>

      {!isRunning && !isFinished && (
        <div className={styles.instructions}>
          <ol>
            <li>Position the camera so your hips and shoulders are fully visible, about 2 metres away.</li>
            <li>Stand facing the camera with feet together, hands resting on your hips.</li>
            <li>Have a wall, counter or chair within reach in case you need support.</li>
            <li>When ready, click Start and try to stand as still as possible for 30 seconds.</li>
          </ol>
          <button
            className={styles.primaryBtn}
            onClick={startTest}
            disabled={isInitializing}
          >
            {isInitializing ? "Loading pose model…" : "Start Test"}
          </button>
          {isInitializing && (
            <p className={styles.loadingText}>
              Preparing… warming up the camera and pose model.
            </p>
          )}
        </div>
      )}

      {/* The camera mounts with the instructions (hidden until the test
          starts) so camera startup runs in parallel with model warm-up. */}
      <div
        className={`${styles.cameraArea} ${
          !(isRunning || isFinished) ? styles.cameraHidden : ""
        }`}
      >
          <div className={styles.videoWrap}>
            <Webcam ref={webcamRef} width={480} height={360} className={styles.webcam} />
            <canvas ref={canvasRef} width={480} height={360} className={styles.canvasOverlay} />
          </div>

          {isRunning && (
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Time left</span>
                <span className={styles.statValue}>{secondsLeft}s</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Stable time</span>
                <span className={styles.statValue}>{stablePercent}%</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>State</span>
                <span className={styles.statValue}>{isStable ? "Steady" : "Swaying"}</span>
              </div>
            </div>
          )}

          {isRunning && (
            <button className={styles.secondaryBtn} onClick={stopTest}>
              Stop Test
            </button>
          )}

          {isFinished && (
            <div className={styles.resultCard}>
              <h3>Test complete</h3>
              <p className={styles.resultCount}>Steady for {stablePercent}% of the attempt</p>
              <p>{statusMessage}</p>
              <button
                className={styles.primaryBtn}
                onClick={startTest}
                disabled={isInitializing}
              >
                {isInitializing ? "Loading pose model…" : "Try Again"}
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
