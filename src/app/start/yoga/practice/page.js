"use client";

import dynamic from "next/dynamic";

// TensorFlow.js, the MoveNet detector and react-webcam all reach for browser
// globals when their modules are evaluated, so this route is kept out of the
// server render entirely.
const Yogacv = dynamic(() => import("../../../../views/Yoga/Yoga"), {
  ssr: false,
  loading: () => <p style={{ padding: "2rem" }}>Loading pose detection...</p>,
});

export default function YogaPracticePage() {
  return <Yogacv />;
}
