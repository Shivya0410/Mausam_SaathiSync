"use client";

import { AuthProvider } from "../store/auth";
import { LanguageSync } from "../lib/i18n/useLanguage";
import "../i18n";

// Part 2 adds A11yProvider, PlaceProvider and SettingsProvider here
// (PRD section 14.1). The language control lives in the top bar.
export default function Providers({ children }) {
  return (
    <AuthProvider>
      <LanguageSync />
      {children}
    </AuthProvider>
  );
}
