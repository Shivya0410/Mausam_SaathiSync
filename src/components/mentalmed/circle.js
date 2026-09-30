"use client";

import React, { useState, useEffect, useRef } from "react";
import "./circle.css";

const audioOptions = [
  { id: "none", name: "Select Background Sound" },
  { id: "nature", name: "Forest Sounds" },
  { id: "mountain", name: "Mountain Stream" },
  { id: "birds", name: "Bird Chirping" },
  { id: "instrumental", name: "Calm Instrumental" },
];

const BreathingMeditation = () => {
  const [breathPhase, setBreathPhase] = useState("inhale");
  const [circleSize, setCircleSize] = useState(100);
  const [breathCount, setBreathCount] = useState(0);
  const [selectedAudio, setSelectedAudio] = useState("none");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    const breathDuration = 4000; // Total breath cycle duration
    const startTime = Date.now();

    const animateBreathing = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = (elapsedTime % breathDuration) / breathDuration;

      if (progress < 0.5) {
        // Inhale phase
        setBreathPhase("inhale");
        const inhaleProgress = progress * 2;
        setCircleSize(100 + inhaleProgress * 150);
      } else {
        // Exhale phase
        setBreathPhase("exhale");
        const exhaleProgress = (progress - 0.5) * 2;
        setCircleSize(250 - exhaleProgress * 150);
      }

      // Complete breath cycle
      if (elapsedTime % breathDuration >= breathDuration - 10) {
        setBreathCount((prev) => prev + 1);
      }

      animationFrameId = requestAnimationFrame(animateBreathing);
    };

    animationFrameId = requestAnimationFrame(animateBreathing);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleAudioChange = (event) => {
    const audioId = event.target.value;
    setSelectedAudio(audioId);

    if (audioRef.current) {
      if (audioId === "none") {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // In a real app, you'd set the actual audio source here
        audioRef.current.src = ""; // Placeholder
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className={`meditation-container meditation-${breathPhase}`}>
      <div className="audio-header">
        <select
          value={selectedAudio}
          onChange={handleAudioChange}
          className="audio-select"
        >
          {audioOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>

        {selectedAudio !== "none" && (
          <button onClick={toggleAudio} className="audio-toggle">
            {isPlaying ? "❚❚ Pause" : "▶ Play"}
          </button>
        )}
      </div>

      <svg
        className="background-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#gradient)" />
        <circle cx="20" cy="20" r="10" fill="#ffffff" opacity="0.3" />
        <circle cx="80" cy="30" r="7" fill="#ffffff" opacity="0.2" />
        <circle cx="50" cy="70" r="5" fill="#ffffff" opacity="0.1" />
      </svg>

      <div
        className="breathing-circle"
        style={{
          width: `${circleSize}px`,
          height: `${circleSize}px`,
        }}
      >
        <div className="circle-text">
          {breathPhase === "inhale" ? "INHALE" : "EXHALE"}
        </div>
      </div>

      <audio ref={audioRef} loop className="hidden-audio" />

      <div className="breath-count">Breath Cycles: {breathCount}</div>
    </div>
  );
};

export default BreathingMeditation;