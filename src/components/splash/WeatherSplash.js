"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ImdEmblem from "./ImdEmblem";
import "./WeatherSplash.css";

const SESSION_STORAGE_KEY = "mausam_splash_seen_v1";

// Scene definitions for the default 3-scene cinematic intro sequence
const SCENES = [
  { id: "thunderstorm", theme: "dark", duration: 1800 },
  { id: "cloudy", theme: "light", duration: 1600 },
  { id: "rain", theme: "dark", duration: 1600 },
];

/**
 * Realistic SVG Lightning Bolt paths generator for dramatic storm illumination
 */
function LightningBolts() {
  return (
    <div className="ms-lightning-bolt-wrap" aria-hidden="true">
      <svg className="ms-lightning-svg" viewBox="0 0 400 350" preserveAspectRatio="none">
        {/* Main central lightning trunk */}
        <path
          className="ms-lightning-path"
          d="M 210,0 L 225,45 L 205,85 L 235,130 L 215,175 L 245,230 L 230,280 L 260,340"
        />
        {/* Left branch */}
        <path
          className="ms-lightning-branch"
          d="M 225,45 L 180,80 L 165,120 L 140,150 L 125,200"
        />
        <path
          className="ms-lightning-branch"
          d="M 180,80 L 195,115 L 185,145"
        />
        {/* Right branch */}
        <path
          className="ms-lightning-branch"
          d="M 235,130 L 275,165 L 290,210 L 320,250"
        />
        <path
          className="ms-lightning-branch"
          d="M 215,175 L 185,215 L 175,260"
        />
        {/* Secondary distant bolt */}
        <path
          className="ms-lightning-branch"
          style={{ animationDelay: "0.4s" }}
          d="M 330,10 L 345,50 L 330,85 L 350,130 L 335,170"
        />
      </svg>
    </div>
  );
}

/**
 * Canvas-powered high-performance rain particle renderer
 */
function RainCanvas({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Initialize 130 rain particles with varied speeds, depths, and lengths
    const rainCount = Math.min(130, Math.floor((width * height) / 6000));
    const raindrops = Array.from({ length: rainCount }, () => ({
      x: Math.random() * (width + 100) - 50,
      y: Math.random() * height,
      length: 18 + Math.random() * 24,
      speed: 14 + Math.random() * 16,
      opacity: 0.25 + Math.random() * 0.55,
      thickness: 0.8 + Math.random() * 1.4,
      slant: -2.5 - Math.random() * 1.5, // Slight natural wind slant
    }));

    // Splashes on the lower threshold
    const splashes = [];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw and update raindrops
      for (let i = 0; i < raindrops.length; i++) {
        const drop = raindrops[i];
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.slant, drop.y + drop.length);
        ctx.strokeStyle = `rgba(215, 235, 255, ${drop.opacity})`;
        ctx.lineWidth = drop.thickness;
        ctx.lineCap = "round";
        ctx.stroke();

        drop.x += drop.slant * 0.8;
        drop.y += drop.speed;

        // Reset drop when hitting bottom or bounds
        if (drop.y > height) {
          // Trigger subtle splash particle
          if (Math.random() < 0.35 && splashes.length < 25) {
            splashes.push({
              x: drop.x,
              y: height - 10 - Math.random() * 20,
              radius: 1,
              maxRadius: 3 + Math.random() * 4,
              opacity: 0.7,
            });
          }
          drop.y = -drop.length - Math.random() * 20;
          drop.x = Math.random() * (width + 100) - 50;
        }
      }

      // Draw ripples / splashes
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.radius * 1.8, s.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(224, 242, 254, ${s.opacity})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        s.radius += 0.35;
        s.opacity -= 0.04;
        if (s.opacity <= 0 || s.radius >= s.maxRadius) {
          splashes.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="ms-rain-canvas" aria-hidden="true" />;
}

/**
 * Premium Animated Weather Splash Component for Mausam Saathi
 * 
 * Supports:
 * - 3-stage animated weather sequence (Thunderstorm -> Clearing Sky -> Rain -> Exit)
 * - Dynamic weather states (for single static weather preview or future live API linkage)
 * - Session persistence (only shows once per session, bypassable with forceShow)
 * - Accessible skip button and prefers-reduced-motion support
 */
export default function WeatherSplash({
  forceShow = false,
  onComplete,
  mode = "intro", // "intro" (3 scenes) | "weather" (single weather)
  weatherState = "thunderstorm",
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);

  // Check initial visibility on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasSeen = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!hasSeen || forceShow) {
      setIsVisible(true);
    }
  }, [forceShow]);

  // Complete and exit handler
  const handleFinish = useCallback(() => {
    setIsExiting(true);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
      } catch {
        // Ignore storage errors in private mode
      }
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 650);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Handle Scene Progression for the 3-Stage Intro
  useEffect(() => {
    if (!isVisible || isExiting || mode !== "intro") return;

    // Check for user's reduced motion preference
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timer = setTimeout(handleFinish, 1800);
      return () => clearTimeout(timer);
    }

    const currentScene = SCENES[currentSceneIdx];
    const timer = setTimeout(() => {
      if (currentSceneIdx < SCENES.length - 1) {
        setCurrentSceneIdx((prev) => prev + 1);
      } else {
        handleFinish();
      }
    }, currentScene.duration);

    return () => clearTimeout(timer);
  }, [isVisible, isExiting, currentSceneIdx, mode, handleFinish]);

  if (!isVisible) return null;

  const activeSceneId = mode === "intro" ? SCENES[currentSceneIdx].id : weatherState;
  const activeTheme = mode === "intro" ? SCENES[currentSceneIdx].theme : "dark";

  return (
    <div
      className={`ms-splash-container ${
        activeTheme === "light" ? "ms-splash--light-theme" : "ms-splash--dark-theme"
      } ${isExiting ? "ms-splash--exiting" : ""}`}
      role="dialog"
      aria-label="Mausam Opening Intro"
    >
      {/* =================================================================== */}
      {/* SCENE 1: THUNDERSTORM                                              */}
      {/* =================================================================== */}
      <div
        className={`ms-splash-scene ms-splash-scene--thunderstorm ${
          activeSceneId === "thunderstorm" ? "ms-splash-scene--active" : ""
        }`}
      >
        <div className="ms-storm-flash-overlay" />
        <LightningBolts />
        <div className="ms-storm-clouds">
          <div className="ms-storm-cloud-puff ms-storm-cloud-puff--1" />
          <div className="ms-storm-cloud-puff ms-storm-cloud-puff--2" />
          <div className="ms-storm-cloud-puff ms-storm-cloud-puff--3" />
        </div>
      </div>

      {/* =================================================================== */}
      {/* SCENE 2: CLOUDY / CLEARING SKY                                     */}
      {/* =================================================================== */}
      <div
        className={`ms-splash-scene ms-splash-scene--cloudy ${
          activeSceneId === "cloudy" ? "ms-splash-scene--active" : ""
        }`}
      >
        <div className="ms-sun-radiance" />
        <div className="ms-sun-rays" />
        <div className="ms-cloudy-clouds-wrap">
          <div className="ms-cumulus-cloud ms-cumulus-cloud--1" />
          <div className="ms-cumulus-cloud ms-cumulus-cloud--2" />
          <div className="ms-cumulus-cloud ms-cumulus-cloud--3" />
        </div>
      </div>

      {/* =================================================================== */}
      {/* SCENE 3: RAIN                                                      */}
      {/* =================================================================== */}
      <div
        className={`ms-splash-scene ms-splash-scene--rain ${
          activeSceneId === "rain" || activeSceneId === "rainy" ? "ms-splash-scene--active" : ""
        }`}
      >
        <div className="ms-bokeh-orbs">
          <div className="ms-bokeh-orb ms-bokeh-orb--1" />
          <div className="ms-bokeh-orb ms-bokeh-orb--2" />
          <div className="ms-bokeh-orb ms-bokeh-orb--3" />
        </div>
        <RainCanvas active={activeSceneId === "rain" || activeSceneId === "rainy"} />
        <div className="ms-lens-droplets">
          <div className="ms-water-drop ms-water-drop--1" />
          <div className="ms-water-drop ms-water-drop--2" />
          <div className="ms-water-drop ms-water-drop--3" />
          <div className="ms-water-drop ms-water-drop--4" />
          <div className="ms-water-drop ms-water-drop--5" />
          <div className="ms-water-drop ms-water-drop--6" />
        </div>
      </div>

      {/* =================================================================== */}
      {/* CENTERED MAUSAM & IMD BRANDING                                     */}
      {/* =================================================================== */}
      <div className="ms-splash-branding">
        <h1 className="ms-splash-title">Mausam</h1>
        <div className="ms-splash-emblem-wrap">
          <ImdEmblem size={96} />
        </div>
        <div className="ms-splash-app-label">Unified Mobile App</div>
        <div className="ms-splash-dept-label">India Meteorological Department</div>
      </div>

      {/* =================================================================== */}
      {/* CONTROLS: SKIP & PROGRESS DOTS                                      */}
      {/* =================================================================== */}
      <button
        type="button"
        className="ms-splash-skip-btn"
        onClick={handleFinish}
        aria-label="Skip splash intro"
      >
        <span>Skip</span>
        <span>✕</span>
      </button>

      {mode === "intro" && (
        <div className="ms-splash-progress-dots" aria-hidden="true">
          {SCENES.map((s, idx) => (
            <span
              key={s.id}
              className={`ms-splash-dot ${idx === currentSceneIdx ? "ms-splash-dot--active" : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
