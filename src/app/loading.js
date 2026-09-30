"use client";

import dynamic from "next/dynamic";

// The bicycle animation drives a gsap timeline against DOM nodes it queries by
// selector, so it is browser-only. Next shows this when a route actually
// suspends, replacing the LoaderWrapper that used to force a 500ms spinner on
// every single navigation.
const AnimatedComponent = dynamic(() => import("../components/bicycle/animation"), {
  ssr: false,
});

export default function Loading() {
  return <AnimatedComponent />;
}
