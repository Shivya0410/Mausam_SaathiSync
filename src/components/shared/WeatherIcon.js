"use client";

import { wmoInfo } from '../../lib/mausam/wmo';

// Font Awesome stand-ins for the custom weather icon set (PRD 16.6, Part 3).
// Decorative: every use sits next to text that says the condition.
const FA = {
  'clear-day': 'fa-sun',
  'clear-night': 'fa-moon',
  'partly-day': 'fa-cloud-sun',
  'partly-night': 'fa-cloud-moon',
  cloudy: 'fa-cloud',
  fog: 'fa-smog',
  drizzle: 'fa-cloud-rain',
  rain: 'fa-cloud-rain',
  'heavy-rain': 'fa-cloud-showers-heavy',
  snow: 'fa-snowflake',
  thunder: 'fa-cloud-bolt',
  'thunder-hail': 'fa-cloud-bolt',
};

export default function WeatherIcon({ code, isDay = true, size = 24 }) {
  const info = wmoInfo(code, isDay);
  const icon = FA[info?.icon] || 'fa-cloud';
  return <i className={`fa-solid ${icon} ms-wx-icon ms-wx--${info?.icon || 'cloudy'}`} style={{ fontSize: size }} aria-hidden="true"></i>;
}
