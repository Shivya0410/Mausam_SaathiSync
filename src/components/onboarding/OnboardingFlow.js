"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import PlaceSearch from "../places/PlaceSearch";
import { gpsPlace } from "../places/PlaceSwitcher";
import Avatar, { AVATAR_SEEDS } from "../shared/Avatar";
import { LANGUAGES } from "../../config/site";
import { PERSONAS, SENSITIVITIES, MAX_PERSONAS } from "../../config/personas";
import { CITIES } from "../../data/cities";
import { BEACHES } from "../../data/beaches";
import { AIRPORTS } from "../../data/airports";
import { useLanguage } from "../../lib/i18n/useLanguage";
import { useGeolocation } from "../../lib/hooks/useGeolocation";
import { useStore } from "../../lib/hooks/useStore";
import { stores, toPlace, upsertPlace, personasFromChoices, toggleChoice, addMember, newId, DEFAULT_PLACE } from "../../lib/stores";
import { suggestPersonas } from "../../lib/mausam/onboarding";
import styles from "./OnboardingQuiz.module.css";

const STEPS = ["location", "personas", "details", "notify", "household"];
const TILES = PERSONAS.filter((p) => p.tile);

function Chip({ selected, onClick, children, suggested }) {
  return (
    <button type="button" className={`${styles.chip} ${selected ? styles.chipSelected : ""} ${suggested ? styles.chipSuggested : ""}`} aria-pressed={selected} onClick={onClick}>
      {children}
    </button>
  );
}

/**
 * First-run setup (PRD 5.10, 18.4): where are you, what your day looks like,
 * a few details, notifications, household. Every step is skippable; the
 * shortest path is two taps. Everything is saved on this device only.
 */
export default function OnboardingFlow() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const geo = useGeolocation();
  const heading = useRef(null);

  const [, setPlaces] = useStore(stores.places);
  const [, setCurrent] = useStore(stores.currentPlace);
  const [personaState, setPersonas] = useStore(stores.personas);
  const [personaSettings, setPersonaSettings] = useStore(stores.personaSettings);
  const [, setSensitivities] = useStore(stores.sensitivities);
  const [, setTrips] = useStore(stores.trips);
  const [, setEvents] = useStore(stores.events);
  const [notify, setNotify] = useStore(stores.notify);
  const [, setHousehold] = useStore(stores.household);
  const [, setOnboarding] = useStore(stores.onboarding);

  const [step, setStep] = useState(0);
  const [place, setPlace] = useState(null);
  const [choices, setChoices] = useState(() => [personaState.primary, ...personaState.secondary].filter(Boolean));
  const [seaMode, setSeaMode] = useState(null); // 'coast' | 'fisher'
  const [details, setDetails] = useState(() => structuredClone(personaSettings));
  const [sens, setSens] = useState([]);
  const [home, setHome] = useState(null);
  const [work, setWork] = useState(null);
  const [trip, setTrip] = useState({ destination: null, from: "", to: "", mode: "flight", originAirport: "" });
  const [event, setEvent] = useState({ name: "", date: "", slot: "evening", outdoor: true });
  const [notifyDraft, setNotifyDraft] = useState({ official: notify.official, rainHour: true, morning: notify.morning });
  const [permission, setPermission] = useState(() => (typeof Notification === "undefined" ? "unsupported" : "default"));
  const [members, setMembers] = useState([]);
  const [draft, setDraft] = useState({ name: "", avatar: AVATAR_SEEDS[0], personas: [], lang: language });

  // Deep link from the "tell us about your day" nudge: ?step=personas.
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("step");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (s && STEPS.includes(s)) setStep(STEPS.indexOf(s));
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  const month = new Date().getMonth() + 1;
  const suggested = suggestPersonas({ place: place || DEFAULT_PLACE, month, beaches: BEACHES });
  const chosen = seaMode === "fisher" ? choices.map((c) => (c === "coast" ? "fisher" : c)) : choices;
  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = (overrideChoices) => {
    const where = place || DEFAULT_PLACE;
    const ids = overrideChoices ?? chosen;
    setPlaces((list) => {
      let out = upsertPlace(list, where);
      if (home) out = upsertPlace(out, { ...home, type: "home" });
      if (work) out = upsertPlace(out, { ...work, type: "work" });
      return out;
    });
    setCurrent({ id: where.id });
    setPersonas(personasFromChoices(ids));
    setPersonaSettings({
      ...details,
      commute: { ...details.commute, homeId: home?.id ?? details.commute.homeId, workId: work?.id ?? details.commute.workId },
    });
    if (sens.length) setSensitivities({ list: sens, consentAt: new Date().toISOString() });
    if (trip.destination && trip.from && trip.to && trip.to >= trip.from) {
      setTrips((list) => [...list, { id: newId("trip"), name: trip.destination.name, destination: trip.destination, from: trip.from, to: trip.to, mode: trip.mode, originAirport: trip.originAirport || null, departAt: trip.originAirport ? `${trip.from}T07:00:00+05:30` : null }]);
    }
    if (event.name.trim() && event.date) {
      setEvents((list) => [...list, { id: newId("ev"), name: event.name.trim().slice(0, 60), date: event.date, slot: event.slot, outdoor: event.outdoor }]);
    }
    setNotify((n) => ({ ...n, official: notifyDraft.official, rainHour: notifyDraft.rainHour, morning: notifyDraft.morning }));
    if (members.length) setHousehold((h) => members.reduce((acc, m) => addMember(acc, m), h));
    setOnboarding({ completedAt: new Date().toISOString(), version: 1 });
    const target = new URLSearchParams(window.location.search).get("next");
    router.push(target && target.startsWith("/") && !target.startsWith("//") ? target : "/");
  };

  const pickPlace = (p) => {
    setPlace(p);
    next();
  };
  const useLocation = async () => {
    const coords = await geo.request();
    if (coords) pickPlace(gpsPlace(coords, t));
  };

  const setDetail = (persona, patch) => setDetails((d) => ({ ...d, [persona]: { ...d[persona], ...patch } }));
  const stepName = STEPS[step];
  const hi = i18n.language === "hi";

  return (
    <div className={styles.wrap}>
      <div className={styles.progressRow}>
        <p className={styles.stepText}>{t("onboarding.stepOf", { n: step + 1, total: STEPS.length })}</p>
        <button type="button" className="ms-link-btn" onClick={() => (step === STEPS.length - 1 ? finish() : next())}>
          {t("common.skip")}
        </button>
      </div>
      <div className={styles.progress} role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label={t("onboarding.progress")}>
        <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}></span>
      </div>

      <section className={styles.card} aria-labelledby="ob-title">
        <h1 id="ob-title" ref={heading} tabIndex={-1} className={styles.title}>
          {t(`onboarding.${stepName}.title`)}
        </h1>

        {stepName === "location" ? (
          <>
            <div className={styles.langRow} role="group" aria-label={t("topbar.language")}>
              {LANGUAGES.map((l) => (
                <Chip key={l.code} selected={language === l.code} onClick={() => setLanguage(l.code)}>
                  <span lang={l.htmlLang}>{l.label}</span>
                </Chip>
              ))}
            </div>
            <p className={styles.sub}>{t("onboarding.locationWhy")}</p>
            <button type="button" className="ms-btn ms-btn--block" onClick={useLocation} disabled={geo.status === "loading"}>
              <i className="fa-solid fa-location-crosshairs" aria-hidden="true"></i> {geo.status === "loading" ? t("places.locating") : t("places.useMyLocation")}
            </button>
            {geo.status === "error" ? <p role="alert">{t(geo.error === "denied" ? "errors.locationDenied" : "places.locationUnavailable")}</p> : null}
            <PlaceSearch onSelect={(r) => pickPlace(toPlace(r))} labelKey="onboarding.location.search" />
            <p className={styles.label}>{t("onboarding.location.popular")}</p>
            <div className={styles.chips}>
              {CITIES.map((c) => (
                <Chip key={c.id} onClick={() => pickPlace(toPlace({ ...c, id: `city-${c.id}`, district: c.name }))}>
                  {hi ? c.nameHi : c.name}
                </Chip>
              ))}
            </div>
          </>
        ) : null}

        {stepName === "personas" ? (
          <>
            <p className={styles.sub}>{t("onboarding.personas.sub", { max: MAX_PERSONAS })}</p>
            <div className={styles.tiles}>
              {TILES.map((p) => {
                const selected = choices.includes(p.id);
                const isSuggested = suggested.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.tile} ${selected ? styles.tileSelected : ""}`}
                    aria-pressed={selected}
                    onClick={() => setChoices((c) => toggleChoice(c, p.id))}
                  >
                    <i className={p.icon} aria-hidden="true"></i>
                    <strong>{t(p.nameKey)}</strong>
                    <small>{t(p.descKey)}</small>
                    {isSuggested ? <span className={styles.suggested}>{t("onboarding.personas.suggested")}</span> : null}
                  </button>
                );
              })}
            </div>
            {choices.length >= MAX_PERSONAS ? <p className={styles.sub} role="status">{t("onboarding.personas.max", { max: MAX_PERSONAS })}</p> : null}
            {choices.includes("coast") ? (
              <fieldset className="ms-fieldset">
                <legend>{t("onboarding.personas.seaQuestion")}</legend>
                <div className={styles.chips}>
                  <Chip selected={seaMode === "fisher"} onClick={() => setSeaMode("fisher")}>{t("onboarding.personas.seaLivelihood")}</Chip>
                  <Chip selected={seaMode !== "fisher"} onClick={() => setSeaMode("coast")}>{t("onboarding.personas.seaLeisure")}</Chip>
                </div>
              </fieldset>
            ) : null}
            <button type="button" className="ms-link-btn" onClick={() => finish([])}>
              {t("onboarding.skipAll")}
            </button>
          </>
        ) : null}

        {stepName === "details" ? (
          <div className={styles.details}>
            {!chosen.length ? <p className={styles.sub}>{t("onboarding.details.none")}</p> : <p className={styles.sub}>{t("onboarding.details.sub")}</p>}
            {chosen.includes("commute") ? (
              <fieldset className="ms-fieldset">
                <legend>{t("personas.commute.name")}</legend>
                <PlaceSearch labelKey="onboarding.details.home" onSelect={(r) => setHome(toPlace(r, { type: "home" }))} />
                {home ? <p className="ms-muted">{t("onboarding.details.chosen", { name: home.name })}</p> : null}
                <PlaceSearch labelKey="onboarding.details.work" onSelect={(r) => setWork(toPlace(r, { type: "work" }))} />
                {work ? <p className="ms-muted">{t("onboarding.details.chosen", { name: work.name })}</p> : null}
                <div className={styles.row}>
                  <label className="ms-field">
                    <span>{t("onboarding.details.leaveHome")}</span>
                    <input type="time" value={details.commute.times[0] || ""} onChange={(e) => setDetail("commute", { times: [e.target.value, details.commute.times[1] || ""] })} />
                  </label>
                  <label className="ms-field">
                    <span>{t("onboarding.details.leaveWork")}</span>
                    <input type="time" value={details.commute.times[1] || ""} onChange={(e) => setDetail("commute", { times: [details.commute.times[0] || "", e.target.value] })} />
                  </label>
                </div>
                <p className={styles.label}>{t("onboarding.details.mode")}</p>
                <div className={styles.chips}>
                  {["two_wheeler", "car", "public", "walk", "cycle"].map((m) => (
                    <Chip key={m} selected={details.commute.mode === m} onClick={() => setDetail("commute", { mode: m })}>{t(`modes.${m}`)}</Chip>
                  ))}
                </div>
              </fieldset>
            ) : null}
            {chosen.includes("health") ? (
              <fieldset className="ms-fieldset">
                <legend>{t("onboarding.details.sensitivities")}</legend>
                <div className={styles.chips}>
                  {SENSITIVITIES.map((s) => (
                    <Chip key={s} selected={sens.includes(s)} onClick={() => setSens((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]))}>
                      {t(`sensitivities.${s}`)}
                    </Chip>
                  ))}
                </div>
                <p className="ms-muted">{t("sensitivities.onlyOnPhone")} {t("onboarding.details.consent")}</p>
              </fieldset>
            ) : null}
            {chosen.includes("family") ? (
              <fieldset className="ms-fieldset">
                <legend>{t("personas.family.name")}</legend>
                <div className={styles.row}>
                  <label className="ms-field">
                    <span>{t("onboarding.details.schoolMorning")}</span>
                    <input type="time" value={details.family.schoolTimes.morning || ""} onChange={(e) => setDetail("family", { schoolTimes: { ...details.family.schoolTimes, morning: e.target.value || null } })} />
                  </label>
                  <label className="ms-field">
                    <span>{t("onboarding.details.schoolAfternoon")}</span>
                    <input type="time" value={details.family.schoolTimes.afternoon || ""} onChange={(e) => setDetail("family", { schoolTimes: { ...details.family.schoolTimes, afternoon: e.target.value || null } })} />
                  </label>
                </div>
                <p className="ms-muted">{t("onboarding.details.noChildData")}</p>
              </fieldset>
            ) : null}
            {chosen.includes("fitness") ? (
              <fieldset className="ms-fieldset">
                <legend>{t("personas.fitness.name")}</legend>
                <div className={styles.chips}>
                  {["run", "walk", "cycle", "sports", "yoga", "trek"].map((a) => (
                    <Chip key={a} selected={details.fitness.activity === a} onClick={() => setDetail("fitness", { activity: a })}>{t(`activityNames.${a}`)}</Chip>
                  ))}
                </div>
                <p className={styles.label}>{t("onboarding.details.usualTime")}</p>
                <div className={styles.chips}>
                  {["early_morning", "morning", "evening", "night"].map((b) => (
                    <Chip key={b} selected={details.fitness.band === b} onClick={() => setDetail("fitness", { band: b })}>{t(`bandsTime.${b}`)}</Chip>
                  ))}
                </div>
                <p className={styles.label}>{t("onboarding.details.duration")}</p>
                <div className={styles.chips}>
                  {[30, 60, 90].map((m) => (
                    <Chip key={m} selected={details.fitness.durationMin === m} onClick={() => setDetail("fitness", { durationMin: m })}>{t("onboarding.details.minutes", { m })}</Chip>
                  ))}
                </div>
              </fieldset>
            ) : null}
            {chosen.includes("farm") ? (
              <fieldset className="ms-fieldset">
                <legend>{t("personas.farm.name")}</legend>
                <div className={styles.chips}>
                  {["farmer", "gardener"].map((r) => (
                    <Chip key={r} selected={details.farm.role === r} onClick={() => setDetail("farm", { role: r })}>{t(`farmRoles.${r}`)}</Chip>
                  ))}
                </div>
              </fieldset>
            ) : null}
            {chosen.includes("coast") || chosen.includes("fisher") ? (
              <fieldset className="ms-fieldset">
                <legend>{t("onboarding.details.beach")}</legend>
                <label className="ms-field">
                  <span className="visually-hidden">{t("onboarding.details.beach")}</span>
                  <select value={details.coast.currentBeachId || ""} onChange={(e) => setDetail("coast", { currentBeachId: e.target.value || null, beachIds: e.target.value ? [e.target.value] : [] })}>
                    <option value="">{t("onboarding.details.beachNone")}</option>
                    {BEACHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}, {b.state}
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>
            ) : null}
            {chosen.includes("work") ? (
              <fieldset className="ms-fieldset">
                <legend>{t("personas.work.name")}</legend>
                <div className={styles.row}>
                  <label className="ms-field">
                    <span>{t("onboarding.details.workFrom")}</span>
                    <input type="time" value={details.work.hours[0]} onChange={(e) => setDetail("work", { hours: [e.target.value, details.work.hours[1]] })} />
                  </label>
                  <label className="ms-field">
                    <span>{t("onboarding.details.workTo")}</span>
                    <input type="time" value={details.work.hours[1]} onChange={(e) => setDetail("work", { hours: [details.work.hours[0], e.target.value] })} />
                  </label>
                </div>
                <div className={styles.chips}>
                  {["delivery", "construction", "vending", "other"].map((w) => (
                    <Chip key={w} selected={details.work.type === w} onClick={() => setDetail("work", { type: w })}>{t(`workTypes.${w}`)}</Chip>
                  ))}
                </div>
              </fieldset>
            ) : null}
            {chosen.includes("travel") ? (
              <fieldset className="ms-fieldset">
                <legend>{t("onboarding.details.trip")}</legend>
                <PlaceSearch labelKey="onboarding.details.destination" onSelect={(r) => setTrip((x) => ({ ...x, destination: toPlace(r, { type: "other" }) }))} />
                {trip.destination ? <p className="ms-muted">{t("onboarding.details.chosen", { name: trip.destination.name })}</p> : null}
                <div className={styles.row}>
                  <label className="ms-field">
                    <span>{t("onboarding.details.from")}</span>
                    <input type="date" value={trip.from} onChange={(e) => setTrip((x) => ({ ...x, from: e.target.value }))} />
                  </label>
                  <label className="ms-field">
                    <span>{t("onboarding.details.to")}</span>
                    <input type="date" value={trip.to} min={trip.from || undefined} onChange={(e) => setTrip((x) => ({ ...x, to: e.target.value }))} />
                  </label>
                </div>
                <label className="ms-field">
                  <span>{t("onboarding.details.airport")}</span>
                  <select value={trip.originAirport} onChange={(e) => setTrip((x) => ({ ...x, originAirport: e.target.value }))}>
                    <option value="">{t("onboarding.details.noFlight")}</option>
                    {AIRPORTS.map((a) => (
                      <option key={a.icao} value={a.icao}>
                        {a.city} ({a.iata})
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>
            ) : null}
            {chosen.includes("events") ? (
              <fieldset className="ms-fieldset">
                <legend>{t("onboarding.details.event")}</legend>
                <label className="ms-field">
                  <span>{t("onboarding.details.eventName")}</span>
                  <input type="text" maxLength={60} value={event.name} onChange={(e) => setEvent((x) => ({ ...x, name: e.target.value }))} />
                </label>
                <label className="ms-field">
                  <span>{t("onboarding.details.eventDate")}</span>
                  <input type="date" value={event.date} onChange={(e) => setEvent((x) => ({ ...x, date: e.target.value }))} />
                </label>
                <div className={styles.chips}>
                  {["morning", "afternoon", "evening", "night"].map((s) => (
                    <Chip key={s} selected={event.slot === s} onClick={() => setEvent((x) => ({ ...x, slot: s }))}>{t(`slots.${s}`)}</Chip>
                  ))}
                </div>
              </fieldset>
            ) : null}
          </div>
        ) : null}

        {stepName === "notify" ? (
          <>
            <p className={styles.sub}>{t("onboarding.notify.sub")}</p>
            {[
              ["official", "onboarding.notify.official"],
              ["rainHour", "onboarding.notify.rain"],
              ["morning", "onboarding.notify.morning"],
            ].map(([k, label]) => (
              <div key={k} className="ms-switch-row">
                <button type="button" role="switch" aria-checked={notifyDraft[k]} className="ms-switch" onClick={() => setNotifyDraft((n) => ({ ...n, [k]: !n[k] }))}>
                  <span className="ms-switch-track" aria-hidden="true"><span className="ms-switch-thumb"></span></span>
                  <span>{t(label)}</span>
                </button>
              </div>
            ))}
            {permission === "unsupported" ? (
              <p className="ms-muted">{t("onboarding.notify.unsupported")}</p>
            ) : permission === "granted" ? (
              <p role="status">{t("onboarding.notify.granted")}</p>
            ) : (
              <button
                type="button"
                className="ms-btn ms-btn--secondary"
                onClick={async () => {
                  try {
                    setPermission(await Notification.requestPermission());
                  } catch {
                    setPermission("denied");
                  }
                }}
              >
                <i className="fa-solid fa-bell" aria-hidden="true"></i> {t("onboarding.notify.allow")}
              </button>
            )}
            {permission === "denied" ? <p className="ms-muted">{t("onboarding.notify.denied")}</p> : null}
          </>
        ) : null}

        {stepName === "household" ? (
          <>
            <p className={styles.sub}>{t("onboarding.household.sub")}</p>
            {members.length ? (
              <ul className="ms-list">
                {members.map((m) => (
                  <li key={m.id}>
                    <strong>{m.name}</strong> · {m.personas.map((p) => t(`personas.${p}.name`)).join(", ") || t("personas.citizen.name")}
                  </li>
                ))}
              </ul>
            ) : null}
            {members.length < 5 ? (
              <fieldset className="ms-fieldset">
                <legend>{t("household.addMember")}</legend>
                <label className="ms-field">
                  <span>{t("household.nickname")}</span>
                  <input type="text" maxLength={20} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder={t("household.nicknameHint")} />
                </label>
                <p className={styles.label}>{t("household.avatar")}</p>
                <div className={styles.chips} role="radiogroup" aria-label={t("household.avatar")}>
                  {AVATAR_SEEDS.map((seed, i) => (
                    <button key={seed} type="button" role="radio" aria-checked={draft.avatar === seed} aria-label={t("household.avatarN", { n: i + 1 })} className={`${styles.avatarBtn} ${draft.avatar === seed ? styles.chipSelected : ""}`} onClick={() => setDraft((d) => ({ ...d, avatar: seed }))}>
                      <Avatar seed={seed} size={36} decorative />
                    </button>
                  ))}
                </div>
                <p className={styles.label}>{t("household.theirDay")}</p>
                <div className={styles.chips}>
                  {TILES.map((p) => (
                    <Chip key={p.id} selected={draft.personas.includes(p.id)} onClick={() => setDraft((d) => ({ ...d, personas: toggleChoice(d.personas, p.id) }))}>
                      {t(p.nameKey)}
                    </Chip>
                  ))}
                </div>
                <label className="ms-field">
                  <span>{t("household.language")}</span>
                  <select value={draft.lang} onChange={(e) => setDraft((d) => ({ ...d, lang: e.target.value }))}>
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="ms-btn"
                  disabled={!draft.name.trim()}
                  onClick={() => {
                    setMembers((list) => [...list, { ...draft, id: newId("m"), name: draft.name.trim().slice(0, 20) }]);
                    setDraft({ name: "", avatar: AVATAR_SEEDS[(members.length + 1) % AVATAR_SEEDS.length], personas: [], lang: language });
                  }}
                >
                  <i className="fa-solid fa-plus" aria-hidden="true"></i> {t("household.add")}
                </button>
              </fieldset>
            ) : null}
          </>
        ) : null}
      </section>

      <div className={styles.navRow}>
        {step > 0 ? (
          <button type="button" className="ms-btn ms-btn--secondary" onClick={back}>
            {t("common.back")}
          </button>
        ) : <span></span>}
        {stepName === "location" ? (
          <button type="button" className="ms-btn" onClick={() => pickPlace(place || DEFAULT_PLACE)}>
            {place ? t("common.next") : t("onboarding.location.useDefault")}
          </button>
        ) : stepName === "household" ? (
          <button type="button" className="ms-btn" onClick={() => finish()}>
            {t("onboarding.finish")}
          </button>
        ) : (
          <button type="button" className="ms-btn" onClick={next}>
            {t("common.next")}
          </button>
        )}
      </div>
      {place ? (
        <p className="ms-muted" role="status">
          {t("onboarding.placeChosen", { name: hi && place.nameHi ? place.nameHi : place.name })}
        </p>
      ) : null}
    </div>
  );
}
