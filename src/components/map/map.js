"use client";

import React from 'react';
import FitnessEventsMap from './FitnessEventsMap';

// The state data, marker icon and detail pane all moved into FitnessEventsMap
// and fitnessEvents.js, which the home page shares.
const MapComponent = () => (
  <div style={{ display: 'flex', height: '100vh' }}>
    <FitnessEventsMap placeholder="Click on a state to see fitness events." />
  </div>
);

export default MapComponent;
