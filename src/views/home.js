"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import WithNavbar from "../components/layout/WithNavbar";
import NowCard from "../components/home/NowCard";
import GreetingLine from "../components/home/GreetingLine";
import DecisionCardList from "../components/home/DecisionCardList";
import MyPagesChips from "../components/home/MyPagesChips";
import WidgetGrid from "../components/home/WidgetGrid";
import GovServicesStrip from "../components/home/GovServicesStrip";
import DataFootnote from "../components/home/DataFootnote";
import MemberSwitcher from "../components/home/MemberSwitcher";
import Nudges from "../components/home/Nudges";
import { WIDGET_COMPONENTS } from "../components/widgets";
import { usePersonal } from "../lib/hooks/usePersonal";
import { useStore, useHydrated } from "../lib/hooks/useStore";
import { useWeather } from "../lib/context/WeatherProvider";
import { useA11y } from "../lib/context/A11yProvider";
import { stores, personaList, dismissCard, recordFeedback } from "../lib/stores";
import { personalView } from "../lib/mausam/personal";
import { mergeHouseholdCards } from "../lib/mausam/rules/household";
import { summarize } from "../lib/mausam/summary";
import { summaryText } from "../lib/mausam/cardText";

const LITE_WIDGETS = ["hourly", "daily"];

/**
 * The personalised homepage (PRD section 5): greeting, Now card, decision
 * cards, "My pages", ranked widgets, government services, data sources.
 * Household mode merges everyone's cards (PRD 3.6).
 */
export default function Home() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const hydrated = useHydrated();
  const weather = useWeather();
  const personal = usePersonal();
  const { simple, lite } = useA11y();
  const [onboarding] = useStore(stores.onboarding);
  const [household, setHousehold] = useStore(stores.household);
  const [cardState, setCardState] = useStore(stores.cardState);
  const lang = i18n.language;
  const { view, snapshot, now, today, inputs } = personal;

  // First open goes to setup; demo mode skips it so judges land on Home.
  useEffect(() => {
    if (hydrated && !onboarding.completedAt && !weather.demo) router.replace("/onboarding");
  }, [hydrated, onboarding.completedAt, weather.demo, router]);

  const members = household.members;
  const selected = members.length ? household.selected : "me";
  const member = members.find((m) => m.id === selected) || null;

  // Views for household members (same snapshot; see PRD 3.6).
  const memberView = useMemo(
    () =>
      member && inputs
        ? personalView({ ...inputs, personas: personaList({ primary: member.personas?.[0], secondary: member.personas?.slice(1) || [] }), sensitivities: member.sensitivities || [] })
        : null,
    [member, inputs],
  );
  const everyone = useMemo(() => {
    if (selected !== "everyone" || !inputs || !view) return null;
    const people = [{ member: { id: "me", name: t("household.me") }, placeId: snapshot.place.id, cards: view.cards }];
    for (const m of members) {
      const v = personalView({ ...inputs, personas: personaList({ primary: m.personas?.[0], secondary: m.personas?.slice(1) || [] }), sensitivities: m.sensitivities || [] });
      people.push({ member: m, placeId: snapshot.place.id, cards: v.cards });
    }
    return mergeHouseholdCards(people, 50);
  }, [selected, inputs, view, members, snapshot, t]);

  const active = memberView || view;
  const byId = Object.fromEntries([["me", { id: "me", name: t("household.me") }], ...members.map((m) => [m.id, m])]);

  const entries = everyone
    ? everyone.cards.map((c) => ({
        card: c,
        members: members.length ? c.members.map((id) => byId[id]).filter(Boolean) : [],
        speechLang: c.members.length === 1 ? byId[c.members[0]]?.lang : undefined,
      }))
    : (active?.cards || []).map((c) => ({ card: c, speechLang: member?.lang }));

  const summary = useMemo(
    () => (snapshot && now ? summaryText(summarize(snapshot, now), { t, lang }) : ""),
    [snapshot, now, t, lang],
  );

  const placeId = snapshot?.place?.id ?? weather.place.id;
  const onDismiss = (card) => setCardState((s) => dismissCard(s, today, placeId, card.ruleId));
  const onFeedback = (card, helpful) => setCardState((s) => recordFeedback(s, today, card.id, helpful));
  const feedback = cardState?.[today]?.feedback || {};

  const ranked = active?.ranked || [];
  const gridRanked = lite ? ranked.filter((r) => LITE_WIDGETS.includes(r.id)) : ranked;
  const env = { today, now, snapshot, personal, coolSpots: personal.coolSpots };
  const personaIds = (memberView ? memberView.ctx.personas : personal.personas.map((p) => p.id)) || [];

  return (
    <WithNavbar>
      <div className="ms-home">
        {members.length ? (
          <MemberSwitcher members={members} selected={selected} onSelect={(id) => setHousehold((h) => ({ ...h, selected: id }))} />
        ) : null}
        <GreetingLine text={summary} />
        <div className="ms-home-top">
          <NowCard snapshot={snapshot} status={weather.status} now={now} today={today} summary={summary} onRetry={weather.refresh} />
          {active ? (
            <DecisionCardList
              entries={entries}
              today={today}
              maxVisible={3}
              title={everyone ? t("household.todayForFamily") : undefined}
              feedback={feedback}
              onDismiss={everyone ? undefined : onDismiss}
              onFeedback={onFeedback}
            />
          ) : (
            <div className="ms-cards">
              <div className="ms-skeleton"></div>
            </div>
          )}
        </div>
        {!simple ? <Nudges now={now} /> : null}
        {!simple ? <MyPagesChips personaIds={personaIds} /> : null}
        {active && simple ? (
          <div className="ms-grid">
            <div className="ms-grid-item ms-span--full">
              <WIDGET_COMPONENTS.hourly view={active} env={env} />
            </div>
          </div>
        ) : null}
        {active && !simple ? <WidgetGrid ranked={gridRanked} view={active} env={env} /> : null}
        {!simple && !lite ? <GovServicesStrip personaIds={personaIds} /> : null}
        <DataFootnote snapshot={snapshot} />
      </div>
    </WithNavbar>
  );
}
