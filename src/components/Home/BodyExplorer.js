"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import './BodyExplorer.css';

const ZONES_DATA = {
  chest: {
    title: 'Chest & Pectorals',
    focus: 'Upper Body Strength & Breathing Expansion',
    yoga: 'Cobra Pose (Bhujangasana), Camel Pose',
    workout: 'Push-ups, Dumbbell Press, Chest Flies',
    diet: 'High-protein lentils, tofu, and lean seeds',
    link: '/yoga'
  },
  abs: {
    title: 'Abs & Core Stability',
    focus: 'Spinal Alignment & Digestion Agni',
    yoga: 'Boat Pose (Navasana), Plank Asana',
    workout: 'Hanging Leg Raises, Crunches, Russian Twists',
    diet: 'Fiber-rich grains, probiotics, hydrating melons',
    link: '/yoga'
  },
  shoulders: {
    title: 'Shoulders & Deltoids',
    focus: 'Rotator Mobility & Posture Uprightness',
    yoga: 'Downward-Facing Dog (Adho Mukha), Warrior I',
    workout: 'Overhead Press, Lateral Raises, Face Pulls',
    diet: 'Omega-3 walnuts, flaxseeds, antioxidant berries',
    link: '/yoga'
  },
  arms: {
    title: 'Biceps & Triceps',
    focus: 'Grip Strength & Functional Pulling',
    yoga: 'Four-Limbed Staff (Chaturanga), Crow Pose',
    workout: 'Bicep Curls, Tricep Dips, Hammer Curls',
    diet: 'Plant proteins, chickpeas, nutrient-dense almonds',
    link: '/yoga'
  },
  back: {
    title: 'Back & Lats (Dorsal Spine)',
    focus: 'Decompression & Posterior Chain Integrity',
    yoga: 'Bridge Pose (Setu Bandhasana), Cobra Pose',
    workout: 'Pull-ups, Lat Pulldowns, Bent-Over Rows',
    diet: 'Magnesium-rich greens, spinach, pumpkin seeds',
    link: '/yoga'
  },
  glutes: {
    title: 'Glutes & Hip Flexors',
    focus: 'Pelvic Stability & Kinetic Force Transfer',
    yoga: 'Warrior II (Virabhadrasana), Chair Pose (Utkatasana)',
    workout: 'Squats, Hip Thrusts, Romanian Deadlifts',
    diet: 'Complex carbohydrates, sweet potatoes, quinoa',
    link: '/yoga'
  },
  legs: {
    title: 'Quads & Calves (Lower Kinetic Chain)',
    focus: 'Balance, Grounding & Agility',
    yoga: 'Tree Pose (Vrikshasana), Triangle Pose (Trikonasana)',
    workout: 'Walking Lunges, Calf Raises, Leg Extensions',
    diet: 'Potassium-rich bananas, coconut water, dark greens',
    link: '/yoga'
  },
  spine: {
    title: 'Spine & Mental Serenity',
    focus: 'Nervous System Reset & Prana Flow',
    yoga: 'Meditation & Pranayama, Child Pose (Balasana)',
    workout: 'Mobility stretches, breathing drills',
    diet: 'Warm herbal infusions, chamomile, ashwagandha',
    link: '/meditation'
  }
};

export default function BodyExplorer({ gender = 'male' }) {
  const [activeZone, setActiveZone] = useState('chest');

  const zoneInfo = ZONES_DATA[activeZone] || ZONES_DATA.chest;

  return (
    <div className="body-explorer-container">
      <div className="body-explorer-header">
        <div>
          <h2>
            <i className="fa-solid fa-person-running"></i>
            Interactive Anatomy & Wellness Focus
          </h2>
          <p className="body-explorer-subtitle">
            Click any muscle or wellness zone to inspect targeted Yoga poses, workouts, and nutrition
          </p>
        </div>
      </div>

      {/* Muscle / Focus Pills */}
      <div className="body-explorer-pills">
        {Object.entries(ZONES_DATA).map(([key, item]) => (
          <button
            key={key}
            className={`body-pill-btn ${activeZone === key ? 'active' : ''}`}
            onClick={() => setActiveZone(key)}
          >
            {item.title.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* SVG Figures: Front & Back */}
      <div className="body-figures-stage">
        {/* FRONT FIGURE */}
        <div className="figure-column">
          <span className="figure-label">Anterior (Front)</span>
          <svg
            className="svg-figure-wrapper"
            viewBox="0 0 200 420"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Head / Neck */}
            <path
              className={`muscle-zone ${activeZone === 'spine' ? 'active' : ''}`}
              d="M86 42 C86 26 114 26 114 42 C114 55 108 65 100 65 C92 65 86 55 86 42 Z"
              onClick={() => setActiveZone('spine')}
            />
            {/* Neck */}
            <path
              className={`muscle-zone ${activeZone === 'spine' ? 'active' : ''}`}
              d="M93 65 L107 65 L111 76 L89 76 Z"
              onClick={() => setActiveZone('spine')}
            />

            {/* Traps / Shoulders Front */}
            <path
              className={`muscle-zone ${activeZone === 'shoulders' ? 'active' : ''}`}
              d="M89 76 L65 85 C60 92 58 102 62 110 L72 106 C72 95 80 84 89 76 Z"
              onClick={() => setActiveZone('shoulders')}
            />
            <path
              className={`muscle-zone ${activeZone === 'shoulders' ? 'active' : ''}`}
              d="M111 76 L135 85 C140 92 142 102 138 110 L128 106 C128 95 120 84 111 76 Z"
              onClick={() => setActiveZone('shoulders')}
            />

            {/* Chest */}
            <path
              className={`muscle-zone ${activeZone === 'chest' ? 'active' : ''}`}
              d="M74 88 L98 88 L98 122 L72 118 C68 105 69 95 74 88 Z"
              onClick={() => setActiveZone('chest')}
            />
            <path
              className={`muscle-zone ${activeZone === 'chest' ? 'active' : ''}`}
              d="M102 88 L126 88 C131 95 132 105 128 118 L102 122 Z"
              onClick={() => setActiveZone('chest')}
            />

            {/* Arms / Biceps */}
            <path
              className={`muscle-zone ${activeZone === 'arms' ? 'active' : ''}`}
              d="M58 112 C52 125 50 145 56 160 L67 155 C67 140 70 120 72 112 Z"
              onClick={() => setActiveZone('arms')}
            />
            <path
              className={`muscle-zone ${activeZone === 'arms' ? 'active' : ''}`}
              d="M142 112 C148 125 150 145 144 160 L133 155 C133 140 130 120 128 112 Z"
              onClick={() => setActiveZone('arms')}
            />
            {/* Forearms */}
            <path
              className={`muscle-zone ${activeZone === 'arms' ? 'active' : ''}`}
              d="M55 162 L44 205 L52 208 L65 165 Z"
              onClick={() => setActiveZone('arms')}
            />
            <path
              className={`muscle-zone ${activeZone === 'arms' ? 'active' : ''}`}
              d="M145 162 L156 205 L148 208 L135 165 Z"
              onClick={() => setActiveZone('arms')}
            />

            {/* Abs / Core */}
            <path
              className={`muscle-zone ${activeZone === 'abs' ? 'active' : ''}`}
              d="M74 124 L126 124 L124 175 C115 190 85 190 76 175 Z"
              onClick={() => setActiveZone('abs')}
            />

            {/* Pelvis / Hips */}
            <path
              className={`muscle-zone ${activeZone === 'glutes' ? 'active' : ''}`}
              d="M76 177 C84 192 116 192 124 177 L132 195 C118 206 82 206 68 195 Z"
              onClick={() => setActiveZone('glutes')}
            />

            {/* Upper Legs / Quads */}
            <path
              className={`muscle-zone ${activeZone === 'legs' ? 'active' : ''}`}
              d="M68 200 L96 200 L93 285 L64 280 C60 250 62 225 68 200 Z"
              onClick={() => setActiveZone('legs')}
            />
            <path
              className={`muscle-zone ${activeZone === 'legs' ? 'active' : ''}`}
              d="M104 200 L132 200 C138 225 140 250 136 280 L107 285 Z"
              onClick={() => setActiveZone('legs')}
            />

            {/* Calves / Lower Leg */}
            <path
              className={`muscle-zone ${activeZone === 'legs' ? 'active' : ''}`}
              d="M66 295 L92 298 L87 375 L74 375 C68 350 64 320 66 295 Z"
              onClick={() => setActiveZone('legs')}
            />
            <path
              className={`muscle-zone ${activeZone === 'legs' ? 'active' : ''}`}
              d="M108 298 L134 295 C136 320 132 350 126 375 L113 375 Z"
              onClick={() => setActiveZone('legs')}
            />
          </svg>
        </div>

        {/* BACK FIGURE */}
        <div className="figure-column">
          <span className="figure-label">Posterior (Back)</span>
          <svg
            className="svg-figure-wrapper"
            viewBox="0 0 200 420"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Head Back */}
            <path
              className={`muscle-zone ${activeZone === 'spine' ? 'active' : ''}`}
              d="M86 42 C86 26 114 26 114 42 C114 55 108 65 100 65 C92 65 86 55 86 42 Z"
              onClick={() => setActiveZone('spine')}
            />

            {/* Trapezius & Upper Back */}
            <path
              className={`muscle-zone ${activeZone === 'back' ? 'active' : ''}`}
              d="M89 68 L111 68 L134 85 L100 128 L66 85 Z"
              onClick={() => setActiveZone('back')}
            />

            {/* Shoulders Back */}
            <path
              className={`muscle-zone ${activeZone === 'shoulders' ? 'active' : ''}`}
              d="M64 86 L74 95 L68 116 C60 108 58 98 64 86 Z"
              onClick={() => setActiveZone('shoulders')}
            />
            <path
              className={`muscle-zone ${activeZone === 'shoulders' ? 'active' : ''}`}
              d="M136 86 C142 98 140 108 132 116 L126 95 Z"
              onClick={() => setActiveZone('shoulders')}
            />

            {/* Lats & Mid Back */}
            <path
              className={`muscle-zone ${activeZone === 'back' ? 'active' : ''}`}
              d="M66 118 L98 130 L98 174 L78 170 C70 155 66 135 66 118 Z"
              onClick={() => setActiveZone('back')}
            />
            <path
              className={`muscle-zone ${activeZone === 'back' ? 'active' : ''}`}
              d="M134 118 C134 135 130 155 122 170 L102 174 L102 130 Z"
              onClick={() => setActiveZone('back')}
            />

            {/* Arms Back (Triceps) */}
            <path
              className={`muscle-zone ${activeZone === 'arms' ? 'active' : ''}`}
              d="M56 116 C50 130 48 150 54 165 L64 160 C66 145 68 125 70 116 Z"
              onClick={() => setActiveZone('arms')}
            />
            <path
              className={`muscle-zone ${activeZone === 'arms' ? 'active' : ''}`}
              d="M144 116 C150 130 152 150 146 165 L136 160 C134 145 132 125 130 116 Z"
              onClick={() => setActiveZone('arms')}
            />

            {/* Glutes */}
            <path
              className={`muscle-zone ${activeZone === 'glutes' ? 'active' : ''}`}
              d="M74 175 L98 176 L98 218 C82 220 70 205 74 175 Z"
              onClick={() => setActiveZone('glutes')}
            />
            <path
              className={`muscle-zone ${activeZone === 'glutes' ? 'active' : ''}`}
              d="M102 176 L126 175 C130 205 118 220 102 218 Z"
              onClick={() => setActiveZone('glutes')}
            />

            {/* Hamstrings */}
            <path
              className={`muscle-zone ${activeZone === 'legs' ? 'active' : ''}`}
              d="M72 224 L96 224 L93 282 L66 280 C64 260 66 240 72 224 Z"
              onClick={() => setActiveZone('legs')}
            />
            <path
              className={`muscle-zone ${activeZone === 'legs' ? 'active' : ''}`}
              d="M104 224 L128 224 C134 240 136 260 134 280 L107 282 Z"
              onClick={() => setActiveZone('legs')}
            />

            {/* Calves Back */}
            <path
              className={`muscle-zone ${activeZone === 'legs' ? 'active' : ''}`}
              d="M66 295 L92 298 L87 375 L74 375 C68 350 64 320 66 295 Z"
              onClick={() => setActiveZone('legs')}
            />
            <path
              className={`muscle-zone ${activeZone === 'legs' ? 'active' : ''}`}
              d="M108 298 L134 295 C136 320 132 350 126 375 L113 375 Z"
              onClick={() => setActiveZone('legs')}
            />
          </svg>
        </div>
      </div>

      {/* Selected Muscle Zone Details */}
      <div className="body-details-card">
        <div className="body-details-info">
          <h4>
            <i className="fa-solid fa-bullseye" style={{ color: '#2563eb' }}></i>
            {zoneInfo.title}
          </h4>
          <p>
            <strong>Targeted Yoga:</strong> {zoneInfo.yoga}
          </p>
          <p>
            <strong>Exercises:</strong> {zoneInfo.workout} &bull; <strong>Nutrition:</strong> {zoneInfo.diet}
          </p>
        </div>
        <div className="body-details-actions">
          <Link href={zoneInfo.link} className="body-action-btn primary">
            <i className="fa-solid fa-play"></i> Practice Now
          </Link>
          <Link href="/cards" className="body-action-btn secondary">
            <i className="fa-solid fa-utensils"></i> Diet Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
