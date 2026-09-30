"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../store/auth";
import { loadForUser, saveForUser } from "../../utils/userScopedStorage";
import styles from "./shefit.module.css";

const BASE = "swasth.savedPins.v1";

/** Per-user saved pins (Pinterest-style bookmarks for SheFit cards). */
export function useSavedPins() {
  const { user, isLoggedIN } = useAuth();
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    setSaved(loadForUser(BASE, user, []));
  }, [user, isLoggedIN]);

  const toggle = useCallback(
    (id) => {
      setSaved((prev) => {
        const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
        if (isLoggedIN) saveForUser(BASE, user, next);
        return next;
      });
    },
    [user, isLoggedIN]
  );

  return { saved, toggle, count: saved.length };
}

/** Round save button that sits on a pin cover. */
export function SavePin({ id }) {
  const { t } = useTranslation();
  const { saved, toggle } = useSavedPins();
  const on = saved.includes(id);
  return (
    <button
      type="button"
      className={`${styles.savePin} ${on ? styles.savePinOn : ""}`}
      aria-pressed={on}
      aria-label={on ? t("shefit.savedPin") : t("shefit.savePin")}
      title={on ? t("shefit.savedPin") : t("shefit.savePin")}
      onClick={(e) => {
        e.stopPropagation();
        toggle(id);
      }}
    >
      <i className={`${on ? "fa-solid" : "fa-regular"} fa-bookmark`} aria-hidden="true"></i>
    </button>
  );
}
