"use client";

import dynamic from "next/dynamic";
import WithNavbar from "../../components/layout/WithNavbar";

// TensorFlow.js, the MoveNet detector and react-webcam all reach for browser
// globals when their modules are evaluated, so this route is kept out of the
// server render entirely (same reasoning as /start for the yoga pipeline).
const BalanceTest = dynamic(
  () => import("../../components/seniorFitness/BalanceTest"),
  {
    ssr: false,
    loading: () => <p style={{ padding: "2rem" }}>Loading pose detection...</p>,
  }
);

export default function BalanceTestPage() {
  return (
    <WithNavbar>
      <BalanceTest />
    </WithNavbar>
  );
}
