"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../store/auth";
import { loadForUser, saveForUser } from "../../utils/userScopedStorage";
import { awardBadges } from "../../utils/badges";
import { symptomLabel } from "../../utils/symptomOptions";
import "./SheFitExtra.css";

const BASE = "swasth.hydration.v1";
const GOAL = 8;

function todayId() {
  return new Date().toISOString().slice(0, 10);
}

/** Daily water tracker: glasses logged per day, per user. Goal = 8. */
export function HydrationTracker() {
  const { t } = useTranslation();
  const { user, isLoggedIN } = useAuth();
  const [log, setLog] = useState({});

  useEffect(() => {
    setLog(loadForUser(BASE, user, {}));
  }, [user, isLoggedIN]);

  const today = todayId();
  const count = log[today] || 0;

  const setCount = (n) => {
    const next = { ...log, [today]: Math.max(0, Math.min(16, n)) };
    setLog(next);
    if (isLoggedIN) saveForUser(BASE, user, next);
    if (n >= GOAL) awardBadges(user, ["hydrated"]);
  };

  return (
    <div className="sfx-card">
      <div className="sfx-card-head">
        <span className="sfx-icon sfx-blue"><i className="fa-solid fa-droplet"></i></span>
        <div>
          <h3>{t("shefit.waterTitle")}</h3>
          <p>{t("shefit.waterSub", { count, goal: GOAL })}</p>
        </div>
      </div>
      <div className="sfx-drops" role="group" aria-label={t("shefit.waterTitle")}>
        {Array.from({ length: GOAL }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`sfx-drop ${i < count ? "sfx-drop-on" : ""}`}
            onClick={() => setCount(i < count ? i : i + 1)}
            aria-label={`${i + 1} / ${GOAL}`}
            aria-pressed={i < count}
          >
            <i className="fa-solid fa-droplet"></i>
          </button>
        ))}
      </div>
      <div className="sfx-water-actions">
        <button type="button" onClick={() => setCount(count - 1)} disabled={count <= 0}>−</button>
        <span>{Math.round((count / GOAL) * 100)}%</span>
        <button type="button" onClick={() => setCount(count + 1)} disabled={count >= 16}>+</button>
      </div>
      {!isLoggedIN && <p className="sfx-note">{t("shefit.loginToSave")}</p>}
    </div>
  );
}

const COACHES = [
  {
    id: "prenatal",
    initials: "PY",
    color: "#7e57c2",
    nameKey: "shefit.coach1Name",
    roleKey: "shefit.coach1Role",
    tipKey: "shefit.coach1Tip",
    tagsKey: "shefit.coach1Tags",
  },
  {
    id: "pcos",
    initials: "PC",
    color: "#00897b",
    nameKey: "shefit.coach2Name",
    roleKey: "shefit.coach2Role",
    tipKey: "shefit.coach2Tip",
    tagsKey: "shefit.coach2Tags",
  },
  {
    id: "strength",
    initials: "SN",
    color: "#e65100",
    nameKey: "shefit.coach3Name",
    roleKey: "shefit.coach3Role",
    tipKey: "shefit.coach3Tip",
    tagsKey: "shefit.coach3Tags",
  },
];

/** Coach cards with real weekly guidance (educational, not medical advice). */
export function CoachCards() {
  const { t } = useTranslation();
  return (
    <div className="sfx-grid">
      {COACHES.map((c) => (
        <div key={c.id} className="sfx-card sfx-coach">
          <div className="sfx-card-head">
            <span className="sfx-avatar" style={{ background: c.color }} aria-hidden="true">
              {c.initials}
            </span>
            <div>
              <h3>{t(c.nameKey)}</h3>
              <p className="sfx-role">{t(c.roleKey)}</p>
            </div>
            <span className="sfx-online" aria-hidden="true"></span>
          </div>
          <p className="sfx-tip">“{t(c.tipKey)}”</p>
          <p className="sfx-tags">{t(c.tagsKey)}</p>
          <div className="sfx-coach-actions">
            <a className="sfx-chat" href="/wellness">
              <i className="fa-solid fa-comment-dots" aria-hidden="true"></i> {t("shefit.chatBtn")}
            </a>
            <a className="sfx-cta" href="/wellness">{t("shefit.findSupport")} →</a>
          </div>
        </div>
      ))}
    </div>
  );
}

const PHASES = [
  { id: "menstrual", icon: "fa-solid fa-cloud-rain", color: "#7e57c2", dayRange: [1, 5], nameKey: "shefit.phase1", tipKey: "shefit.phase1Tip" },
  { id: "follicular", icon: "fa-solid fa-seedling", color: "#2e7d32", dayRange: [6, 13], nameKey: "shefit.phase2", tipKey: "shefit.phase2Tip" },
  { id: "ovulation", icon: "fa-solid fa-sun", color: "#f9a825", dayRange: [14, 16], nameKey: "shefit.phase3", tipKey: "shefit.phase3Tip" },
  { id: "luteal", icon: "fa-solid fa-moon", color: "#5c6bc0", dayRange: [17, 28], nameKey: "shefit.phase4", tipKey: "shefit.phase4Tip" },
];

/** Visual cycle-phase guide; highlights your likely phase from last log. */
export function PhaseGuide({ entries = [] }) {  const { t } = useTranslation();
  let cycleDay = null;
  if (entries.length) {
    const last = [...entries].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
    const diff = Math.floor((Date.now() - new Date(last.startDate).getTime()) / 86400000) + 1;
    if (diff >= 1 && diff <= 40) cycleDay = diff;
  }
  const activeId = cycleDay
    ? (PHASES.find((p) => cycleDay >= p.dayRange[0] && cycleDay <= p.dayRange[1]) || PHASES[3]).id
    : null;

  return (
    <div className="sfx-grid sfx-grid-4">
      {PHASES.map((p) => (
        <div key={p.id} className={`sfx-card sfx-phase ${activeId === p.id ? "sfx-phase-active" : ""}`}>
          <span className="sfx-icon" style={{ background: p.color }}>
            <i className={p.icon}></i>
          </span>
          <h3>
            {t(p.nameKey)}{" "}
            <small>
              ({t("shefit.dayRange", { from: p.dayRange[0], to: p.dayRange[1] })})
            </small>
          </h3>
          <p>{t(p.tipKey)}</p>
          {activeId === p.id && <span className="sfx-you">{t("shefit.youAreHere")}</span>}
        </div>
      ))}
    </div>
  );
}


function avgLength(entries) {
  if (entries.length < 2) return { avg: 28, estimated: true };
  const sorted = [...entries].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    const d = Math.round(
      (new Date(sorted[i].startDate) - new Date(sorted[i - 1].startDate)) / 86400000
    );
    if (d > 0) gaps.push(d);
  }
  if (!gaps.length) return { avg: 28, estimated: true };
  return { avg: Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length), estimated: false };
}

function phaseFor(day) {
  if (day <= 5) return { id: "menstrual", nameKey: "shefit.phase1", tipKey: "shefit.phase1Tip", color: "#c2185b" };
  if (day <= 13) return { id: "follicular", nameKey: "shefit.phase2", tipKey: "shefit.phase2Tip", color: "#2e7d32" };
  if (day <= 16) return { id: "ovulation", nameKey: "shefit.phase3", tipKey: "shefit.phase3Tip", color: "#f9a825" };
  return { id: "luteal", nameKey: "shefit.phase4", tipKey: "shefit.phase4Tip", color: "#7e57c2" };
}

/**
 * "Today" card, BloomCycle-style: cycle progress ring, current phase with
 * next-period countdown, glass insight chips, and a Mon–Sun week strip.
 * Windows are labelled as typical estimates from the user's own average.
 */
export function CycleRingCard({ entries = [] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n?.language?.startsWith("hi") ? "hi" : "en";

  const sorted = [...entries].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const last = sorted[0];
  const { avg } = avgLength(entries);
  const cycleDay = last
    ? Math.min(Math.max(Math.floor((Date.now() - new Date(last.startDate).getTime()) / 86400000) + 1, 1), 99)
    : null;
  const progress = cycleDay ? Math.min(cycleDay / avg, 1) : 0;
  const nextIn = cycleDay ? Math.max(avg - cycleDay + 1, 0) : null;
  const phase = cycleDay ? phaseFor(cycleDay) : null;

  const freq = {};
  sorted.slice(0, 3).forEach((e) => (e.symptoms || []).forEach((s) => { freq[s] = (freq[s] || 0) + 1; }));
  const topSymptom = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Current Mon–Sun week; dots mark days inside a logged range.
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const logged = entries.some((e) => iso >= e.startDate && iso <= (e.endDate || e.startDate));
    return { iso, n: d.getDate(), isToday: iso === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`, logged };
  });

  const R = 70;
  const C = 2 * Math.PI * R;
  const dot = (frac, color) => {
    const a = (-90 + 360 * frac) * (Math.PI / 180);
    return { x: 85 + R * Math.cos(a), y: 85 + R * Math.sin(a), color };
  };
  const dots = [dot(5 / avg, "#c2185b"), dot(14 / avg, "#f9a825"), dot(1, "#7e57c2")];

  return (
    <div className="sfx-today">
      <div className="sfx-ring-wrap">
        <svg viewBox="0 0 170 170" className="sfx-ring" role="img" aria-label={t("shefit.todayRingLabel")}>
          <defs>
            <linearGradient id="sfxRingGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7e57c2" />
              <stop offset="100%" stopColor="#ec407a" />
            </linearGradient>
          </defs>
          <circle cx="85" cy="85" r={R} fill="none" stroke="#f3e2ea" strokeWidth="13" />
          <circle
            cx="85" cy="85" r={R} fill="none"
            stroke="url(#sfxRingGrad)" strokeWidth="13" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
            transform="rotate(-90 85 85)"
          />
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="5" fill={d.color} stroke="#fff" strokeWidth="2" />
          ))}
        </svg>
        <div className="sfx-ring-center">
          {cycleDay ? (
            <>
              <small>{t("shefit.dayLabel")}</small>
              <strong>{cycleDay}</strong>
              <small>{t("shefit.dayOf", { n: avg })}</small>
            </>
          ) : (
            <small className="sfx-ring-empty">{t("shefit.ringEmpty")}</small>
          )}
        </div>
      </div>

      <div className="sfx-today-side">
        {phase ? (
          <>
            <p className="sfx-phase-kicker" style={{ color: phase.color }}>
              <i className="fa-solid fa-droplet" aria-hidden="true"></i> {t(phase.nameKey)}
            </p>
            <p className="sfx-phase-count">
              {nextIn === 0 ? t("shefit.dueNow") : t("shefit.daysLeft", { n: nextIn })}
            </p>
            <p className="sfx-phase-tip">{t(phase.tipKey)}</p>
          </>
        ) : (
          <p className="sfx-phase-tip">{t("shefit.ringEmptyLong")}</p>
        )}

        <div className="sfx-glass-row">
          <div className="sfx-glass">
            <span className="sfx-glass-ic sfx-glass-rose"><i className="fa-solid fa-droplet"></i></span>
            <span><small>{t("shefit.nextPeriod")}</small><strong>{nextIn == null ? "—" : nextIn === 0 ? t("shefit.dueNow") : t("shefit.daysLeftShort", { n: nextIn })}</strong></span>
          </div>
          <div className="sfx-glass">
            <span className="sfx-glass-ic sfx-glass-violet"><i className="fa-solid fa-flower"></i></span>
            <span><small>{t("shefit.topSymptom")}</small><strong>{topSymptom ? symptomLabel(topSymptom, lang) : t("shefit.noneYet")}</strong></span>
          </div>
          <div className="sfx-glass">
            <span className="sfx-glass-ic sfx-glass-green"><i className="fa-solid fa-calendar-check"></i></span>
            <span><small>{t("cyc.loggedCycles")}</small><strong>{entries.length}</strong></span>
          </div>
        </div>

        <div className="sfx-legend">
          <span><i style={{ background: "#c2185b" }}></i>{t("shefit.legendPeriod")}</span>
          <span><i style={{ background: "#7e57c2" }}></i>{t("shefit.legendFertile")}</span>
          <span><i style={{ background: "#f9a825" }}></i>{t("shefit.legendOvulation")}</span>
        </div>
        <p className="sfx-estimate">{t("shefit.estimatesNote")}</p>

        <div className="sfx-week" aria-label={t("shefit.weekTitle")}>
          {week.map((d) => (
            <span key={d.iso} className={`sfx-wday ${d.isToday ? "sfx-wtoday" : ""} ${d.logged ? "sfx-wlogged" : ""}`}>
              {d.n}
              {d.logged && <i aria-hidden="true"></i>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
