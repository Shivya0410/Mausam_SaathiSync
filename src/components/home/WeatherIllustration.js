"use client";

import React, { useMemo } from 'react';
import { isThunderCode, isFogCode, isRainCode, isSnowCode, isDrizzleCode } from '../../lib/mausam/wmo';

/**
 * Dynamic Indian-inspired weather illustration component.
 * Adapts visual state, backdrop gradients, and micro-animations dynamically based on:
 * - Time of day (day / sunset / night)
 * - Condition (sunny, partly cloudy, overcast, rain, storm, fog, snow, heatwave, smog/poor AQI)
 * - Temperature & warning urgency
 */
export default function WeatherIllustration({
  wmo = 0,
  isDay = true,
  tempC = 28,
  feelsC = 30,
  aqi = 50,
  warningLevel = 1,
  size = 'hero', // 'hero' | 'compact' | 'badge'
}) {
  const state = useMemo(() => {
    const isThunder = isThunderCode(wmo) || warningLevel >= 3;
    const isHeavyRain = wmo === 65 || wmo === 82;
    const isRain = isRainCode(wmo) || isHeavyRain;
    const isDrizzle = isDrizzleCode(wmo);
    const isFog = isFogCode(wmo);
    const isSnow = isSnowCode(wmo);
    const isHeat = (tempC >= 38 || feelsC >= 42) && isDay && !isRain;
    const isSmog = aqi >= 201 && !isRain;
    const isCloudy = wmo === 2 || wmo === 3;
    const isClear = wmo === 0 || wmo === 1;

    let theme = 'clear-day';
    if (!isDay) theme = 'night';
    if (isThunder) theme = 'thunderstorm';
    else if (isHeavyRain) theme = 'heavy-rain';
    else if (isRain) theme = 'rainy';
    else if (isDrizzle) theme = 'drizzle';
    else if (isFog) theme = 'foggy';
    else if (isSnow) theme = 'snow';
    else if (isHeat) theme = 'heatwave';
    else if (isSmog) theme = 'smog';
    else if (isCloudy) theme = isDay ? 'cloudy' : 'cloudy-night';

    return {
      theme,
      isDay,
      isThunder,
      isRain,
      isHeavyRain,
      isDrizzle,
      isFog,
      isSnow,
      isHeat,
      isSmog,
      isCloudy,
      isClear,
    };
  }, [wmo, isDay, tempC, feelsC, aqi, warningLevel]);

  return (
    <div className={`ms-wx-scene ms-wx-scene--${state.theme} ms-wx-scene--${size}`} aria-hidden="true">
      <div className="ms-wx-bg-glow"></div>

      {/* Sun / Moon celestial body */}
      {state.isDay ? (
        <div className={`ms-wx-sun ${state.isHeat ? 'ms-wx-sun--heat' : ''}`}>
          <div className="ms-wx-sun-core"></div>
          <div className="ms-wx-sun-rays"></div>
          {state.isHeat && <div className="ms-wx-heat-shimmer"></div>}
        </div>
      ) : (
        <div className="ms-wx-moon">
          <div className="ms-wx-moon-crescent"></div>
          <div className="ms-wx-moon-glow"></div>
          <div className="ms-wx-stars">
            <span className="ms-star ms-star-1">✦</span>
            <span className="ms-star ms-star-2">★</span>
            <span className="ms-star ms-star-3">✦</span>
            <span className="ms-star ms-star-4">★</span>
            <span className="ms-star ms-star-5">✦</span>
          </div>
        </div>
      )}

      {/* Cloud Layers */}
      {(state.isCloudy || state.isRain || state.isThunder || state.isFog || state.isSmog || wmo === 1 || wmo === 2) && (
        <div className="ms-wx-clouds">
          <div className={`ms-wx-cloud ms-cloud-back ${state.isThunder ? 'ms-cloud--storm' : ''}`}>
            <svg viewBox="0 0 120 60" className="ms-cloud-svg">
              <path d="M 20,50 A 18,18 0 0,1 30,22 A 25,25 0 0,1 70,18 A 20,20 0 0,1 98,30 A 16,16 0 0,1 110,50 Z" />
            </svg>
          </div>
          <div className={`ms-wx-cloud ms-cloud-front ${state.isThunder ? 'ms-cloud--storm' : ''}`}>
            <svg viewBox="0 0 140 70" className="ms-cloud-svg">
              <path d="M 15,58 A 20,20 0 0,1 32,26 A 30,30 0 0,1 82,20 A 24,24 0 0,1 116,35 A 18,18 0 0,1 130,58 Z" />
            </svg>
          </div>
        </div>
      )}

      {/* Thunder & Lightning effect */}
      {state.isThunder && (
        <div className="ms-wx-lightning">
          <div className="ms-lightning-flash"></div>
          <svg viewBox="0 0 24 40" className="ms-lightning-bolt">
            <polygon points="13,0 4,22 12,22 9,40 20,16 12,16" fill="url(#lightning-grad)" />
            <defs>
              <linearGradient id="lightning-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFF9C4" />
                <stop offset="60%" stopColor="#FFD54F" />
                <stop offset="100%" stopColor="#FF6F00" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* Rain Drops */}
      {(state.isRain || state.isDrizzle || state.isThunder) && (
        <div className={`ms-wx-rain ${state.isHeavyRain ? 'ms-wx-rain--heavy' : ''}`}>
          <span className="ms-drop ms-drop-1"></span>
          <span className="ms-drop ms-drop-2"></span>
          <span className="ms-drop ms-drop-3"></span>
          <span className="ms-drop ms-drop-4"></span>
          <span className="ms-drop ms-drop-5"></span>
          <span className="ms-drop ms-drop-6"></span>
          <span className="ms-drop ms-drop-7"></span>
          <span className="ms-drop ms-drop-8"></span>
          <span className="ms-drop ms-drop-9"></span>
        </div>
      )}

      {/* Fog / Mist Layers */}
      {state.isFog && (
        <div className="ms-wx-fog">
          <div className="ms-fog-layer ms-fog-1"></div>
          <div className="ms-fog-layer ms-fog-2"></div>
          <div className="ms-fog-layer ms-fog-3"></div>
        </div>
      )}

      {/* Smog / Poor AQI Particles */}
      {state.isSmog && (
        <div className="ms-wx-smog">
          <div className="ms-smog-particle ms-sp-1"></div>
          <div className="ms-smog-particle ms-sp-2"></div>
          <div className="ms-smog-particle ms-sp-3"></div>
          <div className="ms-smog-particle ms-sp-4"></div>
          <div className="ms-smog-haze"></div>
        </div>
      )}

      {/* Snow flurries */}
      {state.isSnow && (
        <div className="ms-wx-snow">
          <span className="ms-flake ms-flake-1">❄</span>
          <span className="ms-flake ms-flake-2">✻</span>
          <span className="ms-flake ms-flake-3">❄</span>
          <span className="ms-flake ms-flake-4">❅</span>
          <span className="ms-flake ms-flake-5">❄</span>
        </div>
      )}
    </div>
  );
}
