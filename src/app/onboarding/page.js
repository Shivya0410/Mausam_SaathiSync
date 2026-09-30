"use client";

import { Suspense } from "react";
import OnboardingQuiz from "../../components/onboarding/OnboardingQuiz";

// useSearchParams requires a Suspense boundary in the App Router.
export default function OnboardingPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Loading your fitness snapshot…</p>}>
      <OnboardingQuiz />
    </Suspense>
  );
}
