// Base URL for the legacy sign-in backend (optional login, PRD 9.5).
//
// This used to be derived from `window.location.hostname` at module scope,
// which throws during the Next.js server render because `window` does not
// exist there. Reading it from the environment keeps the value available on
// both the server and the client.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sih24-backend.onrender.com';

export const AUTH_API_URL = `${API_BASE_URL}/api/auth`;

// WhatsApp channel (roadmap, PRD 7.5). WhatsAppFloat is kept for that work
// but is not rendered anywhere: the placeholder number would look broken.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "910000000000";

export const WHATSAPP_LINK =
  `https://wa.me/${WHATSAPP_NUMBER}` +
  `?text=${encodeURIComponent("Namaste Mausam Saathi! I need help.")}`;
