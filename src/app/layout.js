// Global stylesheets are imported here so their order is deterministic.
// Tokens come first so every later stylesheet can reference the variables.
import "../styles/tokens.css";
import "../index.css";
import "../styles/lilac-theme.css";
import "../styles/shell.css";
import "../styles/app.css";
import "../styles/icons.css";
import "../styles/weather-visuals.css";

import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import Providers from "./providers";
import { SITE } from "../config/site";
import { prefetchScript } from "../lib/prefetchSnapshot";
import { DEFAULT_PLACE } from "../lib/stores";
import { SCENARIO_IDS } from "../data/fixtures/scenarioIds";

const PREFETCH = prefetchScript({
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
  scenarioIds: [...SCENARIO_IDS],
  defaultPlace: DEFAULT_PLACE,
});

// Unicode fonts for Latin and Devanagari so Hindi never falls back to a poor
// system font (PRD section 15.4). Exposed as CSS variables for tokens.css.
const notoSans = Noto_Sans({ subsets: ["latin"], display: "swap", variable: "--font-noto-sans" });
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  display: "swap",
  variable: "--font-noto-devanagari",
});

export const metadata = {
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: SITE.themeColor,
};

// lang starts as "en" to match the server render; LanguageSync updates it
// on the client when the saved language is Hindi.
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${notoSans.variable} ${notoDevanagari.variable}`}>
      <head>
        {/* Starts the weather request before the app's JS loads (PRD 13.8). */}
        <script dangerouslySetInnerHTML={{ __html: PREFETCH }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
