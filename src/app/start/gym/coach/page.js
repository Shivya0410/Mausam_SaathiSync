"use client";

import dynamic from "next/dynamic";

const GymCoach = dynamic(() => import("../../../../views/Gym/GymCoach"), {
  ssr: false,
  loading: () => <p style={{ padding: "2rem" }}>Loading FitVisionAI Coach...</p>,
});

export default function GymCoachPage() {
  return <GymCoach />;
}
