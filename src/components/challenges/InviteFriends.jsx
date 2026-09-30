"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

/** Invite card: copies a challenges link, shows confirmation. */
export default function InviteFriends() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const cats = ["steps", "distance", "workout", "yoga", "nutrition"];

  const invite = async () => {
    const link = `${window.location.origin}/challenges`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* clipboard unavailable */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="chal-invite" aria-label={t("chal.inviteTitle")}>
      <div>
        <h2>{t("chal.inviteTitle")}</h2>
        <p>{t("chal.inviteSub")}</p>
        <div className="chal-invite-cats">
          {cats.map((c) => (
            <span key={c}>{t(`chal.invite_${c}`)}</span>
          ))}
        </div>
      </div>
      <button type="button" className="chal-invite-btn" onClick={invite}>
        {copied ? t("chal.copied") : t("chal.inviteBtn")}
      </button>
    </section>
  );
}
