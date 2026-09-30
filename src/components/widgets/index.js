/**
 * Widget id to component (PRD 5.7). Ids must match src/config/widgets.js
 * and src/components/widgets/available.js.
 */
import {
  HourlyWidget, DailyWidget, RainSoonWidget, Rain5DayWidget, WindWidget, VisibilityWidget, LightningWidget,
  SunTimesWidget, UvWidget, HumidityHeatWidget, HeatDangerWidget,
} from './core';
import { AqiWidget, BestTimeOutWidget, AllergyEstimateWidget, CoolSpotsWidget } from './health';
import { RunWindowWidget, EventComfortWidget } from './active';
import { SeaStateWidget, TidesWidget, WaterTempWidget, FisherWarningWidget } from './sea';
import { NextTripWidget, SavedPlacesWidget, FlightWeatherWidget, PackingListWidget } from './travel';
import { SoilWidget, SprayWindowWidget, FrostHailWidget, AgrometWidget, PlantingGuideWidget } from './farm';
import { CommuteNowWidget, SchoolRunWidget } from './commute';

export const WIDGET_COMPONENTS = {
  aqi: AqiWidget,
  bestTimeOut: BestTimeOutWidget,
  uv: UvWidget,
  humidityHeat: HumidityHeatWidget,
  allergyEstimate: AllergyEstimateWidget,
  runWindow: RunWindowWidget,
  sunTimes: SunTimesWidget,
  wind: WindWidget,
  seaState: SeaStateWidget,
  tides: TidesWidget,
  waterTemp: WaterTempWidget,
  fisherWarning: FisherWarningWidget,
  nextTrip: NextTripWidget,
  savedPlaces: SavedPlacesWidget,
  flightWeather: FlightWeatherWidget,
  packingList: PackingListWidget,
  schoolRun: SchoolRunWidget,
  rainSoon: RainSoonWidget,
  rain5Day: Rain5DayWidget,
  soil: SoilWidget,
  sprayWindow: SprayWindowWidget,
  frostHail: FrostHailWidget,
  agromet: AgrometWidget,
  plantingGuide: PlantingGuideWidget,
  commuteNow: CommuteNowWidget,
  visibility: VisibilityWidget,
  eventComfort: EventComfortWidget,
  heatDanger: HeatDangerWidget,
  lightning: LightningWidget,
  coolSpots: CoolSpotsWidget,
  hourly: HourlyWidget,
  daily: DailyWidget,
};
