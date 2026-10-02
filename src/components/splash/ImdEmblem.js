"use client";

import React from "react";

/**
 * High-fidelity vector SVG of the official India Meteorological Department (IMD) Emblem
 * featuring the Ashoka Lion Capital, isobar contour globe, and Sanskrit motto "आदित्यात् जायते वृष्टिः".
 */
export default function ImdEmblem({ size = 88, className = "" }) {
  return (
    <div
      className={`ms-imd-emblem-wrap ${className}`}
      style={{ width: size, height: size * 1.25 }}
      aria-label="India Meteorological Department Emblem"
      role="img"
    >
      <svg
        viewBox="0 0 200 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          {/* Gold gradients for Lion Capital & Borders */}
          <linearGradient id="imdGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#eab308" />
            <stop offset="70%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>

          <linearGradient id="imdLionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#e2e8f0" />
            <stop offset="70%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Blue Earth & Weather Isobar Gradient */}
          <radialGradient id="imdGlobeGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="45%" stopColor="#38bdf8" />
            <stop offset="80%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </radialGradient>

          {/* Ribbon gradient */}
          <linearGradient id="imdRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>

          {/* Soft shadow filter */}
          <filter id="imdShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.45" />
          </filter>
          <filter id="imdGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g filter="url(#imdShadow)">
          {/* ========================================================= */}
          {/* TOP: ASHOKA LION CAPITAL OF INDIA                        */}
          {/* ========================================================= */}
          <g transform="translate(100, 36) scale(0.68)">
            {/* Base Pedestal */}
            <rect x="-32" y="10" width="64" height="6" rx="2" fill="url(#imdLionGrad)" stroke="#334155" strokeWidth="0.75" />
            <circle cx="0" cy="13" r="2.5" fill="#0f172a" />
            <circle cx="-18" cy="13" r="2" fill="#0f172a" />
            <circle cx="18" cy="13" r="2" fill="#0f172a" />

            {/* Central Lion */}
            <path
              d="M -16,10 C -18,-5 -14,-22 -8,-32 C -5,-37 0,-38 5,-32 C 11,-22 15,-5 13,10 Z"
              fill="url(#imdLionGrad)"
              stroke="#1e293b"
              strokeWidth="0.8"
            />
            {/* Mane Details */}
            <path d="M -12,-15 C -8,-22 8,-22 12,-15 M -10,-5 C -5,-12 5,-12 10,-5" stroke="#334155" strokeWidth="0.9" fill="none" />
            {/* Snout & Crown */}
            <ellipse cx="0" cy="-28" rx="6" ry="5" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.6" />
            <path d="M -3,-28 L 0,-25 L 3,-28" stroke="#0f172a" strokeWidth="0.8" fill="none" />

            {/* Left Lion Profile */}
            <path
              d="M -16,10 C -24,4 -28,-12 -23,-24 C -20,-28 -15,-24 -13,-18 C -11,-10 -11,-2 -11,10 Z"
              fill="url(#imdLionGrad)"
              stroke="#1e293b"
              strokeWidth="0.8"
            />
            <circle cx="-20" cy="-20" r="1.5" fill="#0f172a" />

            {/* Right Lion Profile */}
            <path
              d="M 16,10 C 24,4 28,-12 23,-24 C 20,-28 15,-24 13,-18 C 11,-10 11,-2 11,10 Z"
              fill="url(#imdLionGrad)"
              stroke="#1e293b"
              strokeWidth="0.8"
            />
            <circle cx="20" cy="-20" r="1.5" fill="#0f172a" />
          </g>

          {/* ========================================================= */}
          {/* MAIN CIRCULAR EMBLEM                                     */}
          {/* ========================================================= */}
          <g transform="translate(100, 130)">
            {/* Outer Gold Rope Ring */}
            <circle cx="0" cy="0" r="66" fill="url(#imdGoldGrad)" stroke="#78350f" strokeWidth="1" />
            <circle cx="0" cy="0" r="62" fill="#0f2b48" stroke="url(#imdGoldGrad)" strokeWidth="1.2" />

            {/* Outer Ring Inscriptions (Hindi & English) */}
            {/* Top Arc: भारत मौसम विज्ञान विभाग */}
            <path id="imdTopPath" d="M -50,-10 A 52 52 0 0 1 50,-10" fill="none" />
            <text fill="#ffffff" fontSize="7" fontWeight="bold" letterSpacing="0.4" fontFamily="sans-serif">
              <textPath href="#imdTopPath" startOffset="50%" textAnchor="middle">
                भारत मौसम विज्ञान विभाग
              </textPath>
            </text>

            {/* Bottom Arc: INDIA METEOROLOGICAL DEPARTMENT */}
            <path id="imdBottomPath" d="M -53,8 A 54 54 0 0 0 53,8" fill="none" />
            <text fill="#fef08a" fontSize="5.5" fontWeight="bold" letterSpacing="0.4" fontFamily="sans-serif">
              <textPath href="#imdBottomPath" startOffset="50%" textAnchor="middle">
                INDIA METEOROLOGICAL DEPARTMENT
              </textPath>
            </text>

            {/* Inner Globe Border */}
            <circle cx="0" cy="0" r="42" fill="url(#imdGlobeGrad)" stroke="url(#imdGoldGrad)" strokeWidth="1.5" />

            {/* Latitude / Longitude & Isobar Meteorological Lines */}
            <g stroke="#ffffff" strokeOpacity="0.45" strokeWidth="0.75" fill="none">
              {/* Parallels */}
              <ellipse cx="0" cy="-18" rx="35" ry="8" />
              <ellipse cx="0" cy="0" rx="42" ry="12" />
              <ellipse cx="0" cy="18" rx="35" ry="8" />
              {/* Meridians */}
              <ellipse cx="0" cy="0" rx="18" ry="42" />
              <ellipse cx="0" cy="0" rx="32" ry="42" />
              <line x1="0" y1="-42" x2="0" y2="42" />
            </g>

            {/* Isobar Contour Loops (Atmospheric pressure lines) */}
            <g stroke="#e0f2fe" strokeOpacity="0.7" strokeWidth="0.9" fill="none" strokeDasharray="1.5 1">
              <path d="M -26,-10 Q -10,-25 15,-18 Q 30,-10 20,10 Q 0,25 -20,15 Z" />
              <path d="M -18,-5 Q 0,-15 12,-10 Q 20,0 10,12 Q -5,18 -15,8 Z" />
            </g>

            {/* India Map Silhouette */}
            <path
              d="M -1,-24 
                 L 4,-20 L 3,-16 L 8,-14 L 14,-16 L 16,-12 L 12,-9 L 14,-5 L 18,-4 L 17,2 L 12,5 L 7,8 
                 L 4,16 L 1,22 L -2,22 L -6,14 L -9,7 L -15,5 L -16,1 L -12,-3 L -15,-8 L -11,-12 
                 L -9,-17 L -4,-18 L -3,-24 Z"
              fill="#ffffff"
              fillOpacity="0.88"
              stroke="#0369a1"
              strokeWidth="0.8"
            />

            {/* Wind Vector Arrows / IMD Symbolics */}
            <g stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" fill="none">
              <path d="M -22,12 Q -15,18 -4,15" markerEnd="url(#arrow)" />
              <path d="M 6,18 Q 16,15 22,8" />
            </g>
          </g>

          {/* ========================================================= */}
          {/* BOTTOM BANNER / MOTTO RIBBON                              */}
          {/* ========================================================= */}
          <g transform="translate(100, 206)">
            {/* Tricolor Ribbon Background */}
            <path
              d="M -60,0 
                 C -35,-6 35,-6 60,0 
                 L 54,16 
                 C 30,11 -30,11 -54,16 
                 Z"
              fill="url(#imdRibbonGrad)"
              stroke="#78350f"
              strokeWidth="0.9"
            />
            {/* Ribbon Tails */}
            <path d="M -60,0 L -70,8 L -56,15 L -54,16 Z" fill="#c2410c" stroke="#78350f" strokeWidth="0.8" />
            <path d="M 60,0 L 70,8 L 56,15 L 54,16 Z" fill="#15803d" stroke="#78350f" strokeWidth="0.8" />

            {/* Motto Text: आदित्यात् जायते वृष्टिः (From the sun arises rain) */}
            <text
              x="0"
              y="9"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="7"
              fontWeight="800"
              fontFamily="sans-serif"
              filter="drop-shadow(0 1px 1.5px rgba(0,0,0,0.8))"
              letterSpacing="0.3"
            >
              आदित्यात् जायते वृष्टिः
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
