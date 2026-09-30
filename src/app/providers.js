"use client";

import { AuthProvider } from "../store/auth";
import { LanguageSync } from "../lib/i18n/useLanguage";
import { A11yProvider } from "../lib/context/A11yProvider";
import { WeatherProvider } from "../lib/context/WeatherProvider";
import "../i18n";

// Order matters: stores are scoped by the signed-in identity (AuthProvider),
// the weather request depends on lite mode (A11yProvider).
export default function Providers({ children }) {
  return (
    <AuthProvider>
      <LanguageSync />
      <A11yProvider>
        <WeatherProvider>{children}</WeatherProvider>
      </A11yProvider>
    </AuthProvider>
  );
}
