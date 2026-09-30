// Global stylesheets are imported here rather than from inside individual
// components so their order is deterministic. These were each imported from
// one or more deep components under Create React App.
//
// Tokens come first so every later stylesheet can reference the variables.
import "../styles/tokens.css";
import "../index.css";
import "../styles/lilac-theme.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "leaflet/dist/leaflet.css";

import Providers from "./providers";

export const metadata = {
  title: "Swasth Infinity",
  description: "A holistic wellness app for fitness, diet, yoga and sustainability.",
  manifest: "/manifest.json",
  icons: {
    icon: "/imgs/favicon.ico",
    apple: "/imgs/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#493971",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
