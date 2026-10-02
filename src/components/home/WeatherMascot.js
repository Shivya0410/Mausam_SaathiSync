"use client";

import React, { useMemo } from 'react';
import { isThunderCode, isFogCode, isRainCode, isSnowCode, isDrizzleCode } from '../../lib/mausam/wmo';

const MASCOT_IMAGES = {
  sunny: '/images/mascot/sunny.jpg',
  heat: '/images/mascot/sunny.jpg',
  rain: '/images/mascot/rainy.jpg',
  drizzle: '/images/mascot/rainy.jpg',
  storm: '/images/mascot/thunder.jpg',
  cold: '/images/mascot/cold.jpg',
  fog: '/images/mascot/cold.jpg',
  night: '/images/mascot/night.jpg',
  cloudy: '/images/mascot/sunny.jpg',
};

/**
 * Mausam Saathi Weather Mascot (inspired by Google Weather's Froggy with an Indian twist).
 * Dynamically changes artwork, scenery, and speech whispers based on:
 * - Current weather condition (rain, sun, cloud, fog, storm, night, heat)
 * - Local time of day
 */
export default function WeatherMascot({
  wmo = 0,
  isDay = true,
  tempC = 28,
  feelsC = 30,
  aqi = 50,
  warningLevel = 1,
  placeName = '',
}) {
  const mood = useMemo(() => {
    const isThunder = isThunderCode(wmo) || warningLevel >= 3;
    const isHeavyRain = wmo === 65 || wmo === 82;
    const isRain = isRainCode(wmo) || isHeavyRain || isDrizzleCode(wmo);
    const isFog = isFogCode(wmo);
    const isSnow = isSnowCode(wmo);
    const isHeat = (tempC >= 38 || feelsC >= 42) && isDay && !isRain;
    const isCold = tempC <= 14;

    if (!isDay) return 'night';
    if (isThunder) return 'storm';
    if (isRain) return 'rain';
    if (isFog) return 'fog';
    if (isSnow || isCold) return 'cold';
    if (isHeat) return 'heat';
    if (wmo === 2 || wmo === 3) return 'cloudy';
    return 'sunny';
  }, [wmo, isDay, tempC, feelsC, warningLevel]);

  const imageSrc = MASCOT_IMAGES[mood] || MASCOT_IMAGES.sunny;

  return (
    <div className={`ms-mascot-scene ms-mascot-scene--${mood}`} aria-hidden="true">
      {/* Background Illustrated Panorama */}
      <img
        src={imageSrc}
        alt=""
        className="ms-mascot-img-bg"
        loading="eager"
      />

      {/* Atmospheric Soft Gradient Overlay */}
      <div className="ms-mascot-vignette"></div>

      {/* Floating Mascot Weather Whisper */}
      <div className="ms-mascot-dialogue">
        <span className="ms-mascot-speech-bubble">
          {mood === 'sunny' && '☀️ "What a bright, pleasant day! Stay energized!"'}
          {mood === 'heat' && '🥵 "Dhoop bohot tezz hai! Drink plenty of water!"'}
          {mood === 'rain' && '🌧️ "Baarish alert! Carry your umbrella & stay dry!"'}
          {mood === 'storm' && '⚡ "Thunderstorm nearby! Head indoors safely!"'}
          {mood === 'fog' && '🌫️ "Dhundh ka mausam! Drive slow with low beam!"'}
          {mood === 'cold' && '🧣 "Thand badh rahi hai! Sip hot chai & stay warm!"'}
          {mood === 'night' && '🌙 "Shubh raatri! Rest well under the starry sky!"'}
          {mood === 'cloudy' && '⛅ "Pleasant breeze and gentle clouds today!"'}
        </span>
      </div>
    </div>
  );
}
