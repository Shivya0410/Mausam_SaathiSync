"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../store/auth";
import WithNavbar from "../../components/layout/WithNavbar";
import { loadForUser, saveForUser } from "../../utils/userScopedStorage";
import { CHALLENGES, featuredChallenge } from "../../data/challenges";
import ChallengesHero from "../../components/challenges/ChallengesHero";
import FeaturedChallenge from "../../components/challenges/FeaturedChallenge";
import CategoryFilters from "../../components/challenges/CategoryFilters";
import CommunityChallenges from "../../components/challenges/CommunityChallenges";
import InviteFriends from "../../components/challenges/InviteFriends";
import "../../components/challenges/Challenges.css";

const JOIN_KEY = "swasth.joinedChallenges.v1";

export default function ChallengesPage() {
  const { user, isLoggedIN } = useAuth();
  const [filter, setFilter] = useState("all");
  const [joined, setJoined] = useState({});

  useEffect(() => {
    setJoined(loadForUser(JOIN_KEY, user, {}));
  }, [user, isLoggedIN]);

  const join = (id) => {
    if (joined[id]) return;
    const next = { ...joined, [id]: new Date().toISOString() };
    setJoined(next);
    if (isLoggedIN) saveForUser(JOIN_KEY, user, next);
  };

  const featured = featuredChallenge();
  const joinedIds = new Set(Object.keys(joined));

  return (
    <WithNavbar>
    <div className="chal-page">
      <ChallengesHero />
      <section className="chal-section" aria-label={featured.title}>
        <FeaturedChallenge
          challenge={featured}
          joined={joinedIds.has(featured.id)}
          joinedAt={joined[featured.id]}
          onJoin={() => join(featured.id)}
        />
      </section>
      <section className="chal-section">
        <CategoryFilters value={filter} onChange={setFilter} />
        <CommunityChallenges
          challenges={CHALLENGES.filter((c) => c.id !== featured.id)}
          filter={filter}
          onFilter={setFilter}
          joinedIds={joinedIds}
          onJoin={join}
        />
      </section>
      <InviteFriends />
    </div>
    </WithNavbar>
  );
}
