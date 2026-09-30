"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  decodeGoogleCredential,
  exchangeGoogleCredentialForAppToken,
  getGoogleClientId,
  getRememberedGoogleAccount,
  loadGsiScript,
  saveRememberedGoogleAccount,
} from "../../services/googleAuth";
import authStyles from "./AuthForm.module.css";

// GIS keeps one global config: re-initialising on every React remount
// (StrictMode double-fires effects in dev) logs "initialize() is called
// multiple times". Initialise once per client ID; every mount still renders
// its own button into its own container.
let gsiInitializedFor = "";
// The global GIS callback must always reach the CURRENT page's handlers
// (login vs register mount different callbacks), so it dispatches through
// this ref, refreshed on every mount.
let gsiCredentialHandler = null;

/**
 * Structured Google sign-in button (Google Identity Services).
 *
 * Stages, always visible and labelled — never a bare stuck spinner:
 *   1. loading   — skeleton notice (12s timeout in the service, then blocked)
 *   2. ready     — "Continue as X" hint when remembered + official GIS button
 *   3. verifying — "Signing you in…" after account pick, button kept mounted
 *   4. done / blocked / failed — explicit message + retry + email fallback
 *
 * Outcomes:
 *   - known user  → onSuccess(appToken, account)
 *   - new user    → onNeedsProfile({ credential, profileToken, suggested,
 *                    account }) so the caller can render the profile form.
 *                   The GIS credential itself is never stored.
 */
export default function GoogleAuthButton({
  mode = "continue",
  variant = "card",
  onSuccess,
  onNeedsProfile,
  onError,
}) {
  const { t } = useTranslation();
  const btnRef = useRef(null);
  // idle | loading | ready | verifying | blocked | failed
  const [status, setStatus] = useState("idle");
  const [detail, setDetail] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [remembered, setRemembered] = useState(null);
  const clientId = getGoogleClientId();

  useEffect(() => {
    setRemembered(getRememberedGoogleAccount());
  }, []);

  const reportError = useCallback(
    (message) => {
      if (onError) onError(message);
    },
    [onError]
  );

  useEffect(() => {
    if (!clientId) {
      setStatus("idle");
      return;
    }

    let cancelled = false;

    // Refreshed every mount so the one global GIS callback always reaches
    // this page's handlers even though initialize() runs only once.
    gsiCredentialHandler = async (response) => {
      const credential = response?.credential;
      if (!credential) {
        const msg = t("google.failed");
        setStatus("failed");
        setDetail(msg);
        reportError(msg);
        return;
      }
      const account = decodeGoogleCredential(credential) || {};
      try {
        setStatus("verifying");
        setDetail("");
        const result = await exchangeGoogleCredentialForAppToken(credential);
        if (cancelled) return;
        if (result?.needsProfile) {
          setStatus("ready");
          if (onNeedsProfile) {
            await onNeedsProfile({
              credential,
              profileToken: result.profileToken || "",
              suggested: result.suggested || {},
              account,
            });
          } else {
            const msg = t("google.needsProfile");
            setStatus("failed");
            setDetail(msg);
            reportError(msg);
          }
          return;
        }
        saveRememberedGoogleAccount(account);
        setRemembered(getRememberedGoogleAccount());
        setStatus("ready");
        if (onSuccess) await onSuccess(result.token, account);
      } catch (err) {
        if (cancelled) return;
        const msg = err?.message || t("google.failed");
        const isMissingBackend = /no POST .* route yet|\(HTTP 404\)/.test(msg);
        setStatus("failed");
        setDetail(
          isMissingBackend
            ? `${t("google.failed")} Backend Google login is not enabled yet — please use email login.`
            : msg
        );
        reportError(msg);
      }
    };

    const init = async () => {
      setStatus("loading");
      setDetail("");
      try {
        const google = await loadGsiScript();
        if (cancelled) return;

        if (gsiInitializedFor !== clientId) {
          google.accounts.id.initialize({
            client_id: clientId,
            // Explicit button only (no One Tap): predictable inside Next.js
            // prerender + alongside email forms.
            auto_select: false,
            cancel_on_tap_outside: true,
            callback: (response) => gsiCredentialHandler?.(response),
          });
          gsiInitializedFor = clientId;
        }

        if (btnRef.current) {
          btnRef.current.innerHTML = "";
          google.accounts.id.renderButton(btnRef.current, {
            type: "standard",
            theme: variant === "hero" ? "filled_blue" : "outline",
            size: "large",
            shape: "pill",
            width: 280,
            text:
              mode === "signup"
                ? "signup_with"
                : mode === "login"
                  ? "signin_with"
                  : "continue_with",
            logo_alignment: "left",
          });
        }

        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          setStatus("blocked");
          setDetail(err?.message || "");
          reportError(err?.message || t("google.failed"));
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      try {
        window.google?.accounts?.id?.cancel?.();
      } catch {
        /* ignore teardown errors */
      }
    };
  }, [clientId, mode, variant, onSuccess, onNeedsProfile, reportError, t, retryKey]);

  const retry = () => {
    setDetail("");
    setRetryKey((k) => k + 1);
  };

  if (!clientId) {
    return (
      <p className={authStyles.googleNotice} role="note">
        {t("google.needClientId")} <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>{" "}
        {t("google.needClientId2")} <code>.env.local</code> {t("google.needClientId3")} {t("google.orEmail")}
      </p>
    );
  }

  return (
    <div className={variant === "hero" ? "home-google-wrap" : authStyles.googleWrap}>
      {remembered && (status === "ready" || status === "verifying") && (
        <p className={authStyles.accountHint} role="note">
          {remembered.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={remembered.picture} alt="" width={22} height={22} referrerPolicy="no-referrer" />
          ) : (
            <i className="fa-brands fa-google" aria-hidden="true" />
          )}
          <span>
            {t("google.lastAccount")}: <strong>{remembered.name || remembered.email}</strong>
          </span>
        </p>
      )}

      {status === "loading" && (
        <p className={authStyles.googleNotice} role="status" aria-live="polite">
          <span className={authStyles.spinner} aria-hidden="true" /> {t("google.loading")}
        </p>
      )}

      {status === "verifying" && (
        <p className={authStyles.googleNotice} role="status" aria-live="polite">
          <span className={authStyles.spinner} aria-hidden="true" /> {t("google.verifying")}
        </p>
      )}

      {/* GIS injects its official button here. Kept mounted across verifies so
          a backend error can be retried without re-picking the account. */}
      <div ref={btnRef} aria-hidden={status !== "ready" && status !== "verifying"} />

      {status === "blocked" && (
        <p className={authStyles.googleNotice} role="alert">
          {detail || t("google.blocked")}{" "}
          <button type="button" className={authStyles.retryBtn} onClick={retry}>
            {t("google.retry")}
          </button>{" "}
          {t("google.orEmail")}
        </p>
      )}

      {status === "failed" && detail && (
        <p className={authStyles.googleNotice} role="alert">
          {detail}{" "}
          <button type="button" className={authStyles.retryBtn} onClick={retry}>
            {t("google.retry")}
          </button>
        </p>
      )}
    </div>
  );
}
