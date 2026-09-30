"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./ChatbotFloat.css";

// Rule-based, fully offline multilingual assistant. Matches keywords in the
// active language (en/hi) against FAQ entries; falls back to a help message.
// No network, no PII — safe to mount site-wide next to WhatsAppFloat.
const RULES = [
  {
    id: "yoga",
    en: ["yoga", "pose", "asana", "stretch", "flexibility"],
    hi: ["योग", "आसन", "स्ट्रेच"],
    answerKey: "chatbot.aYoga",
    link: "/start/yoga",
  },
  {
    id: "gym",
    en: ["gym", "workout", "strength", "weight", "muscle", "exercise"],
    hi: ["जिम", "वर्कआउट", "वजन", "मांसपेशी", "कसरत", "व्यायाम"],
    answerKey: "chatbot.aGym",
    link: "/start/gym",
  },
  {
    id: "diet",
    en: ["diet", "food", "eat", "calorie", "weight loss", "protein", "recipe", "meal"],
    hi: ["डाइट", "खाना", "भोजन", "कैलोरी", "वजन", "प्रोटीन", "रेसिपी"],
    answerKey: "chatbot.aDiet",
    link: "/cards",
  },
  {
    id: "period",
    en: ["period", "cycle", "menstrual", "pregnancy", "pcos", "cramp"],
    hi: ["पीरियड", "मासिक", "चक्र", "गर्भ", "ऐंठन"],
    answerKey: "chatbot.aPeriod",
    link: "/she",
  },
  {
    id: "tracker",
    en: ["track", "streak", "progress", "habit", "score", "badge"],
    hi: ["ट्रैक", "स्ट्रीक", "प्रगति", "आदत", "स्कोर", "बैज"],
    answerKey: "chatbot.aTracker",
    link: "/tracker",
  },
  {
    id: "login",
    en: ["login", "sign in", "account", "register", "password", "google"],
    hi: ["लॉगिन", "खाता", "अकाउंट", "रजिस्टर", "पासवर्ड"],
    answerKey: "chatbot.aLogin",
    link: "/login",
  },
  {
    id: "event",
    en: ["event", "marathon", "run", "challenge", "community", "blog"],
    hi: ["इवेंट", "मैराथन", "दौड़", "चुनौती", "समुदाय", "ब्लॉग"],
    answerKey: "chatbot.aEvent",
    link: "/community",
  },
  {
    id: "hello",
    en: ["hello", "hi", "hey", "namaste", "good morning", "good evening"],
    hi: ["नमस्ते", "नमस्कार", "हैलो"],
    answerKey: "chatbot.aHello",
    link: null,
  },
];

function findAnswer(text) {
  const q = ` ${String(text || "").toLowerCase()} `;
  for (const rule of RULES) {
    const keywords = [...rule.en, ...rule.hi];
    if (keywords.some((k) => q.includes(k.toLowerCase()))) return rule;
  }
  return null;
}

export default function ChatbotFloat() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [seededFor, setSeededFor] = useState("");
  const bodyRef = useRef(null);

  const lang = i18n?.language?.startsWith("hi") ? "hi" : "en";

  useEffect(() => {
    if (open && seededFor !== lang) {
      setMessages([{ from: "bot", text: t("chatbot.greeting") }]);
      setSeededFor(lang);
    }
  }, [open, lang, seededFor, t]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open]);

  const send = (raw) => {
    const text = String(raw || "").trim();
    if (!text) return;
    const rule = findAnswer(text);
    const reply = rule
      ? { from: "bot", text: t(rule.answerKey), link: rule.link }
      : { from: "bot", text: t("chatbot.fallback") };
    setMessages((prev) => [...prev, { from: "user", text }, reply]);
    setInput("");
  };

  const quickReplies = ["yoga", "diet", "period", "tracker"].map((k) => ({
    label: t(`chatbot.q${k[0].toUpperCase()}${k.slice(1)}`),
    value: k === "period" ? "period" : k,
  }));

  return (
    <div className="cb-wrap">
      {open && (
        <div className="cb-panel" role="dialog" aria-label={t("chatbot.title")}>
          <div className="cb-head">
            <span className="cb-avatar" aria-hidden="true">
              <i className="fa-solid fa-robot"></i>
            </span>
            <div>
              <strong>{t("chatbot.title")}</strong>
              <small>{t("chatbot.subtitle")}</small>
            </div>
            <button type="button" className="cb-close" onClick={() => setOpen(false)} aria-label={t("chatbot.close")}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="cb-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} className={`cb-msg cb-${m.from}`}>
                <p>{m.text}</p>
                {m.link && (
                  <a href={m.link} className="cb-link">
                    {t("chatbot.openSection")} →
                  </a>
                )}
              </div>
            ))}
          </div>
          <div className="cb-quick">
            {quickReplies.map((q) => (
              <button key={q.label} type="button" onClick={() => send(q.value)}>
                {q.label}
              </button>
            ))}
          </div>
          <form
            className="cb-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chatbot.placeholder")}
              aria-label={t("chatbot.placeholder")}
            />
            <button type="submit" aria-label={t("chatbot.send")}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        className="cb-btn"
        onClick={() => setOpen((v) => !v)}
        title={t("chatbot.title")}
        aria-label={t("chatbot.title")}
        aria-expanded={open}
      >
        <i className={`fa-solid ${open ? "fa-xmark" : "fa-robot"}`} aria-hidden="true"></i>
      </button>
    </div>
  );
}
