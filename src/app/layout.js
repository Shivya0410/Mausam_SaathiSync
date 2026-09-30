// Global stylesheets are imported here so their order is deterministic.
// Tokens come first so every later stylesheet can reference the variables.
import "../styles/tokens.css";
import "../index.css";
import "../styles/lilac-theme.css";
import "../styles/shell.css";
import "../styles/app.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import Providers from "./providers";
import { SITE } from "../config/site";

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
    icon: "/imgs/favicon.ico",
    apple: "/imgs/apple-touch-icon.png",
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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
