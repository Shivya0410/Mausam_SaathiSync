// Base URL for the Swasth Infinity backend.
//
// This used to be derived from `window.location.hostname` at module scope,
// which throws during the Next.js server render because `window` does not
// exist there. Reading it from the environment keeps the value available on
// both the server and the client.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sih24-backend.onrender.com';

export const AUTH_API_URL = `${API_BASE_URL}/api/auth`;
export const ADMIN_API_URL = `${API_BASE_URL}/api/admin`;

// Floating WhatsApp button (bottom-right, site-wide). Set
// NEXT_PUBLIC_WHATSAPP_NUMBER to the real business number in country-code
// format without "+" (e.g. 919876543210). The default is a placeholder.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "910000000000";

export const WHATSAPP_LINK =
  `https://wa.me/${WHATSAPP_NUMBER}` +
  `?text=${encodeURIComponent("Hi Swasth Infinity! I need help with my wellness journey.")}`;
