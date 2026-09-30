"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

/**
 * Route-level error boundary. `error.message` is deliberately not rendered:
 * it may carry internal detail. The digest lets a report be matched to a
 * server log.
 */
export default function Error({ error, reset }) {
  const { t } = useTranslation();
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <main id="main" className="ms-main">
      <section className="ms-card" role="alert">
        <h1>{t("errors.pageCrashed")}</h1>
        <p>{t("errors.pageCrashedHint")}</p>
        {error?.digest ? <p>Ref: {error.digest}</p> : null}
        <p className="ms-actions">
          <button type="button" className="ms-btn" onClick={reset}>
            {t("common.retry")}
          </button>
          <Link href="/" className="ms-btn ms-btn--secondary">
            {t("common.goHome")}
          </Link>
        </p>
      </section>
    </main>
  );
}
