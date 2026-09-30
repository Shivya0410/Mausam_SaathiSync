"use client";

import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar/navbar";
import Webcam from "react-webcam";

// WebGL backend
import "@tensorflow/tfjs-backend-webgl";

import "./GymCoach.css";

import { POINTS, keypointConnections } from "../../utils/data";
import { drawPoint, drawSegment } from "../../utils/helper";
import { FitVisionWorkoutTracker } from "../../utils/fitvisionGym";

const count = "/media/count.wav";
let skeletonColor = "rgb(255,255,255)";
let interval;

const EXERCISES = ["Squat", "Push-up", "Bicep Curl", "Plank"];

export default function GymCoach() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const trackerRef = useRef(new FitVisionWorkoutTracker("Squat"));

  const [currentExercise, setCurrentExercise] = useState("Squat");
  const [reps, setReps] = useState(0);
  const [stage, setStage] = useState("UP");
  const [formScore, setFormScore] = useState(100);
  const [formStatus, setFormStatus] = useState("Good");
  const [feedbackTip, setFeedbackTip] = useState("Stand upright in front of the camera");
  const [calories, setCalories] = useState(0);
  const [angles, setAngles] = useState({ avgKnee: 180, avgHip: 180, avgElbow: 180, avgBody: 180 });
  const [isModelReady, setIsModelReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // Switch exercise
  const handleSelectExercise = (ex) => {
    setCurrentExercise(ex);
    trackerRef.current.setExercise(ex);
    setReps(0);
    setStage("UP");
    setFormScore(100);
    setFormStatus("Good");
    setFeedbackTip(`Ready for ${ex}. Position yourself in frame.`);
  };

  const handleReset = () => {
    trackerRef.current.reset();
    setReps(0);
    setCalories(0);
    setStage("UP");
    setFormScore(100);
  };

  useEffect(() => {
    let active = true;

    async function initVision() {
      try {
        await tf.ready();
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
        };
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );

        let countAudio = null;
        try {
          countAudio = new Audio(count);
        } catch (e) {}

        if (active) {
          setIsModelReady(true);
          if (interval) clearInterval(interval);
          interval = setInterval(() => {
            detectGymPose(detector, countAudio);
          }, 100);
        }
      } catch (err) {
        console.warn("Gym detector fallback:", err);
        try {
          const detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
          );
          if (active) {
            setIsModelReady(true);
            if (interval) clearInterval(interval);
            interval = setInterval(() => {
              detectGymPose(detector, null);
            }, 100);
          }
        } catch (e) {
          console.error("Gym model load error:", e);
        }
      }
    }

    initVision();

    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, []);

  const detectGymPose = async (detector, countAudio) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4 &&
      canvasRef.current !== null
    ) {
      const video = webcamRef.current.video;
      const pose = await detector.estimatePoses(video);
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      try {
        if (!pose || pose.length === 0) return;
        const keypoints = pose[0].keypoints;

        let keypointMap = {};
        keypoints.forEach((keypoint, idx) => {
          if (keypoint.score > 0.35) {
            keypointMap[idx] = { x: keypoint.x, y: keypoint.y };
            if (
              !(keypoint.name === "left_eye" || keypoint.name === "right_eye")
            ) {
              drawPoint(ctx, keypoint.x, keypoint.y, 8, "rgb(255,255,255)");
              let connections = keypointConnections[keypoint.name];
              try {
                if (connections) {
                  connections.forEach((connection) => {
                    let conName = connection.toUpperCase();
                    if (POINTS[conName] !== undefined && keypoints[POINTS[conName]]) {
                      drawSegment(
                        ctx,
                        [keypoint.x, keypoint.y],
                        [
                          keypoints[POINTS[conName]].x,
                          keypoints[POINTS[conName]].y,
                        ],
                        skeletonColor
                      );
                    }
                  });
                }
              } catch (err) {}
            }
          }
        });

        // FitVisionAI frame processing
        const result = trackerRef.current.processFrame(keypointMap);
        setReps(result.reps);
        setStage(result.stage);
        setFormScore(result.formScore);
        setFormStatus(result.status);
        setFeedbackTip(result.tip);
        setCalories(result.calories);
        setAngles(result.angles);

        // Rep audio beep on state change
        if (result.stateChanged && result.stage === "UP" && result.reps > 0) {
          if (countAudio) countAudio.play().catch(() => {});
        }

        // Color coding
        if (result.formScore >= 80) {
          skeletonColor = "rgb(0, 230, 118)"; // Neon green
        } else if (result.formScore >= 60) {
          skeletonColor = "rgb(255, 179, 0)"; // Amber
        } else {
          skeletonColor = "rgb(255, 82, 82)"; // Red warning
        }
      } catch (err) {
        console.error("Gym pose frame error:", err);
      }
    }
  };

  return (
    <div className="gym-practice-page">
      {/* Sidebar */}
      <div className="gym-practice-sidebar">
        <Navbar />
      </div>

      {/* Main Studio */}
      <div className="gym-practice-main">
        {/* Top Control Bar */}
        <div className="gym-topbar">
          <div className="gym-top-left">
            <Link href="/start/gym" className="back-to-gym-btn">
              ← Back to Gym Dashboard
            </Link>
            <span className="gym-badge">🏋️ AI Workout Coach</span>
          </div>

          <div className="exercise-selector">
            {EXERCISES.map((ex) => (
              <button
                key={ex}
                className={`ex-btn ${currentExercise === ex ? "ex-btn-active" : ""}`}
                onClick={() => handleSelectExercise(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* HUD Stats Row */}
        <div className="gym-hud-row">
          <div className="gym-hud-card">
            <div className="gym-hud-icon">🔢</div>
            <div className="gym-hud-content">
              <span className="gym-hud-label">Reps Completed</span>
              <span className="gym-hud-value">{reps} <small style={{ fontSize: "0.75rem", opacity: 0.6 }}>/ 15</small></span>
            </div>
          </div>

          <div className="gym-hud-card">
            <div className="gym-hud-icon">🎯</div>
            <div className="gym-hud-content">
              <span className="gym-hud-label">Form Quality</span>
              <span
                className="gym-hud-value"
                style={{
                  color: formScore >= 80 ? "#2e7d32" : formScore >= 60 ? "#e65100" : "#c62828",
                }}
              >
                {formStatus} ({formScore}%)
              </span>
            </div>
          </div>

          <div className="gym-hud-card">
            <div className="gym-hud-icon">🔥</div>
            <div className="gym-hud-content">
              <span className="gym-hud-label">Calories Burned</span>
              <span className="gym-hud-value">{calories} <small style={{ fontSize: "0.75rem", opacity: 0.6 }}>kcal</small></span>
            </div>
          </div>

          <div className="gym-hud-card">
            <div className="gym-hud-icon">⚡</div>
            <div className="gym-hud-content">
              <span className="gym-hud-label">Current Stage</span>
              <span className="gym-hud-value" style={{ color: "#e65100" }}>{stage}</span>
            </div>
          </div>
        </div>

        {/* Stage & Camera Grid */}
        <div className="gym-stage">
          {/* Camera Viewport */}
          <div className="gym-cam-card">
            <div className="gym-cam-header">
              <span>FitVisionAI Live Pose Tracker</span>
              <span className="gym-live-indicator">
                <span className="gym-live-dot" />
                {isModelReady ? "Vision Active" : "Initializing AI Model..."}
              </span>
            </div>
            <div className="gym-cam-viewport">
              {cameraError ? (
                <div style={{ color: "#fff", textAlign: "center", padding: "2rem" }}>
                  <p>⚠️ Camera access required for AI workout tracking.</p>
                  <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                    Please allow camera permissions in your browser.
                  </p>
                </div>
              ) : (
                <>
                  <Webcam
                    id="gym-webcam"
                    ref={webcamRef}
                    onUserMediaError={() => setCameraError(true)}
                    videoConstraints={{
                      facingMode: "user",
                      width: 640,
                      height: 480,
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    id="gym-canvas"
                    width={640}
                    height={480}
                  />
                </>
              )}
            </div>
          </div>

          {/* Real-Time Joint Analytics & Feedback Card */}
          <div className="gym-side-card">
            <div className="gym-side-header">
              <h2 className="gym-side-title">{currentExercise} Analysis</h2>
              <span className="stage-pill">Phase: {stage}</span>
            </div>

            {/* Live Joint Angle Metrics */}
            <div className="gym-angle-grid">
              <div className="angle-stat">
                <span className="angle-name">Knee Angle</span>
                <span className="angle-val">{angles.avgKnee}°</span>
              </div>
              <div className="angle-stat">
                <span className="angle-name">Hip Angle</span>
                <span className="angle-val">{angles.avgHip}°</span>
              </div>
              <div className="angle-stat">
                <span className="angle-name">Elbow Angle</span>
                <span className="angle-val">{angles.avgElbow}°</span>
              </div>
              <div className="angle-stat">
                <span className="angle-name">Spine Alignment</span>
                <span className="angle-val">{angles.avgBody}°</span>
              </div>
            </div>

            {/* Real-Time AI Coaching Tip */}
            <div className="gym-feedback-box">
              <div className="gym-feedback-title">💡 FitVisionAI Feedback</div>
              <p className="gym-feedback-text">{feedbackTip}</p>
            </div>

            <button onClick={handleReset} className="gym-reset-btn">
              🔄 Reset Rep Counter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
