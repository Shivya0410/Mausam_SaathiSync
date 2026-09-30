"use client";

import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar/navbar";
import { useTranslation } from "react-i18next";

// Set WebGL backend
import "@tensorflow/tfjs-backend-webgl";
import Webcam from "react-webcam";
const count = "/media/count.wav";

import "./Yoga.css";

import DropDown from "../../components/DropDown/DropDown";
import { poseImages } from "../../utils/pose_images";
import { POINTS, keypointConnections, poseInstructions } from "../../utils/data";
import { drawPoint, drawSegment } from "../../utils/helper";
import { evaluateMediaPipePose } from "../../utils/mediapipeYoga";

let skeletonColor = "rgb(255,255,255)";
let poseList = [
  "Tree",
  "Chair",
  "Cobra",
  "Warrior",
  "Dog",
  "Shoulderstand",
  "Traingle",
  "Pose",
];

let interval;
let flag = false;

function Yogacv() {
  const { t } = useTranslation();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [startingTime, setStartingTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [poseTime, setPoseTime] = useState(0);
  const [bestPerform, setBestPerform] = useState(0);
  const [currentPose, setCurrentPose] = useState("Tree");
  const [accuracy, setAccuracy] = useState(0);
  const [liveFeedback, setLiveFeedback] = useState("");
  const [isModelReady, setIsModelReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    const timeDiff = (currentTime - startingTime) / 1000;
    if (flag) {
      setPoseTime(Math.round(timeDiff));
    }
    if ((currentTime - startingTime) / 1000 > bestPerform) {
      setBestPerform(Math.round(timeDiff));
    }
  }, [currentTime]);

  useEffect(() => {
    setCurrentTime(0);
    setPoseTime(0);
    setBestPerform(0);
    setAccuracy(0);
    setLiveFeedback("");
  }, [currentPose]);

  useEffect(() => {
    let active = true;

    async function setupVision() {
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
          countAudio.loop = true;
        } catch (e) {
          console.warn("Audio not supported or blocked", e);
        }

        if (active) {
          setIsModelReady(true);
          if (interval) clearInterval(interval);
          interval = setInterval(() => {
            detectPose(detector, countAudio);
          }, 100);
        }
      } catch (err) {
        console.warn("MoveNet Thunder fallback to Lightning:", err);
        try {
          const detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
          );
          if (active) {
            setIsModelReady(true);
            if (interval) clearInterval(interval);
            interval = setInterval(() => {
              detectPose(detector, null);
            }, 100);
          }
        } catch (fallbackErr) {
          console.error("Pose detector load error:", fallbackErr);
        }
      }
    }

    setupVision();

    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, []);

  const detectPose = async (detector, countAudio) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4 &&
      canvasRef.current !== null
    ) {
      let notDetected = 0;
      const video = webcamRef.current.video;
      const pose = await detector.estimatePoses(video);
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      try {
        if (!pose || pose.length === 0) return;
        const keypoints = pose[0].keypoints;

        // Extract keypoint coordinate map for MediaPipe angle engine
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
          } else {
            notDetected += 1;
          }
        });

        if (notDetected > 6) {
          skeletonColor = "rgb(255,255,255)";
          setAccuracy(Math.max(10, Math.round((1 - notDetected / 17) * 100)));
          setLiveFeedback("Step into the camera frame so your full body is visible");
          return;
        }

        // Run MediaPipe 8-joint angle calculation & posture evaluation
        const evalResult = evaluateMediaPipePose(keypointMap, currentPose);
        setAccuracy(evalResult.accuracy);
        setLiveFeedback(evalResult.tip);

        if (evalResult.isAligned) {
          skeletonColor = "rgb(0,230,118)"; // Bright neon green for correct posture
          if (!flag) {
            if (countAudio) countAudio.play().catch(() => {});
            setStartingTime(new Date().getTime());
            flag = true;
          }
          setCurrentTime(new Date().getTime());
        } else {
          skeletonColor = "rgb(255,255,255)"; // White when adjusting
          flag = false;
          if (countAudio) {
            countAudio.pause();
            countAudio.currentTime = 0;
          }
        }
      } catch (err) {
        console.error("Detection loop error:", err);
      }
    }
  };

  const instructions = poseInstructions[currentPose] || [];

  return (
    <div className="practice-page">
      {/* Sidebar */}
      <div className="practice-sidebar">
        <Navbar />
      </div>

      {/* Main Studio */}
      <div className="practice-main">
        {/* Top Control Bar */}
        <div className="practice-topbar">
          <div className="practice-top-left">
            <Link href="/start/yoga" className="back-to-dash-btn">
              ← Back to Yoga Dashboard
            </Link>
            <div className="practice-title-wrap">
              <span className="practice-badge">🧘 AI Pose Coach Studio</span>
            </div>
          </div>

          <div className="practice-top-right">
            <DropDown
              poseList={poseList}
              currentPose={currentPose}
              setCurrentPose={setCurrentPose}
            />
          </div>
        </div>

        {/* HUD Stats Row */}
        <div className="hud-stats-row">
          <div className="hud-stat-card">
            <div className="hud-icon">⏱️</div>
            <div className="hud-content">
              <span className="hud-label">Pose Hold Time</span>
              <span className="hud-value">{poseTime}s</span>
            </div>
          </div>

          <div className="hud-stat-card">
            <div className="hud-icon">🏆</div>
            <div className="hud-content">
              <span className="hud-label">Best Record</span>
              <span className="hud-value">{bestPerform}s</span>
            </div>
          </div>

          <div className="hud-stat-card">
            <div className="hud-icon">🎯</div>
            <div className="hud-content">
              <span className="hud-label">Posture Accuracy</span>
              <span
                className="hud-value"
                style={{ color: accuracy >= 80 ? "#2e7d32" : "#e65100" }}
              >
                {accuracy}%
              </span>
            </div>
          </div>

          <div className="hud-stat-card">
            <div className="hud-icon">✨</div>
            <div className="hud-content">
              <span className="hud-label">Target Pose</span>
              <span className="hud-value">{currentPose}</span>
            </div>
          </div>
        </div>

        {/* Studio Stage */}
        <div className="practice-stage">
          {/* Camera Viewport */}
          <div className="camera-card">
            <div className="camera-header">
              <span>Live Camera Feed</span>
              <span className="live-indicator">
                <span className="live-dot-pulse" />
                {isModelReady ? "MediaPipe Active" : "Initializing AI Model..."}
              </span>
            </div>
            <div className="camera-viewport">
              {cameraError ? (
                <div style={{ color: "#fff", textAlign: "center", padding: "2rem" }}>
                  <p>⚠️ Camera access required for AI pose detection.</p>
                  <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                    Please allow camera permissions in your browser.
                  </p>
                </div>
              ) : (
                <>
                  <Webcam
                    id="webcam"
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
                    id="my-canvas"
                    width={640}
                    height={480}
                  />
                </>
              )}
            </div>
          </div>

          {/* Reference Pose & Guidance Card */}
          <div className="reference-card">
            <div className="ref-header">
              <h2 className="ref-title">{currentPose} Pose Reference</h2>
            </div>
            <div className="ref-img-wrap">
              <img
                src={poseImages[currentPose]}
                alt={`Reference for ${currentPose}`}
                className="ref-pose-img"
              />
            </div>
            <div className="pose-tips-box">
              <h4 className="pose-tips-title">
                💡 Real-Time Feedback
              </h4>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.82rem", fontWeight: "700", color: accuracy >= 80 ? "#2e7d32" : "#e65100" }}>
                {liveFeedback || "Position yourself in front of the camera"}
              </p>
              <h4 className="pose-tips-title" style={{ marginTop: "0.6rem" }}>
                📋 Key Alignment Rules
              </h4>
              <ul className="pose-tips-list">
                {instructions.slice(0, 3).map((inst, i) => (
                  <li key={i}>{inst}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Yogacv;
