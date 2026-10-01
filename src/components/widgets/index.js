/**
 * Widget id to component (PRD 5.7). Ids must match src/config/widgets.js
 * and src/components/widgets/available.js.
 *
 * Core weather widgets are bundled; persona-specific groups (health, sea,
 * travel, farm, commute, activity) load only when a page shows one, which
 * keeps them out of the homepage first load (PRD 13.8).
 */
import dynamic from 'next/dynamic';
import {
  HourlyWidget, DailyWidget, RainSoonWidget, Rain5DayWidget, WindWidget, VisibilityWidget, LightningWidget,
  SunTimesWidget, UvWidget, HumidityHeatWidget, HeatDangerWidget,
} from './core';

const Loading = () => <div className="ms-card ms-skeleton" aria-hidden="true"></div>;
const lazy = (load, name) => dynamic(() => load().then((m) => m[name]), { loading: Loading });

const health = () => import('./health');
const active = () => import('./active');
const sea = () => import('./sea');
const travel = () => import('./travel');
const farm = () => import('./farm');
const commute = () => import('./commute');
const reports = () => import('./reports');

export const WIDGET_COMPONENTS = {
  waterlogging: lazy(reports, 'WaterloggingWidget'),
  aqi: lazy(health, 'AqiWidget'),
  bestTimeOut: lazy(health, 'BestTimeOutWidget'),
  uv: UvWidget,
  humidityHeat: HumidityHeatWidget,
  allergyEstimate: lazy(health, 'AllergyEstimateWidget'),
  runWindow: lazy(active, 'RunWindowWidget'),
  sunTimes: SunTimesWidget,
  wind: WindWidget,
  seaState: lazy(sea, 'SeaStateWidget'),
  tides: lazy(sea, 'TidesWidget'),
  waterTemp: lazy(sea, 'WaterTempWidget'),
  fisherWarning: lazy(sea, 'FisherWarningWidget'),
  nextTrip: lazy(travel, 'NextTripWidget'),
  savedPlaces: lazy(travel, 'SavedPlacesWidget'),
  flightWeather: lazy(travel, 'FlightWeatherWidget'),
  packingList: lazy(travel, 'PackingListWidget'),
  schoolRun: lazy(commute, 'SchoolRunWidget'),
  rainSoon: RainSoonWidget,
  rain5Day: Rain5DayWidget,
  soil: lazy(farm, 'SoilWidget'),
  sprayWindow: lazy(farm, 'SprayWindowWidget'),
  frostHail: lazy(farm, 'FrostHailWidget'),
  agromet: lazy(farm, 'AgrometWidget'),
  plantingGuide: lazy(farm, 'PlantingGuideWidget'),
  commuteNow: lazy(commute, 'CommuteNowWidget'),
  visibility: VisibilityWidget,
  eventComfort: lazy(active, 'EventComfortWidget'),
  heatDanger: HeatDangerWidget,
  lightning: LightningWidget,
  coolSpots: lazy(health, 'CoolSpotsWidget'),
  hourly: HourlyWidget,
  daily: DailyWidget,
};
