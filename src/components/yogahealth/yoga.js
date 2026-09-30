"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select"; // Multi-select dropdown package
import { useTranslation } from "react-i18next"; // Import useTranslation hook
import "./yoga.css";

const SUGGESTIONS_API = "https://yogaxyz.onrender.com";

// This panel maps self-reported health conditions to yoga poses using an
// external service. That mapping is not clinically reviewed and has no
// provenance or review status attached to its results, so it is off unless
// explicitly enabled. See the architecture brief, section 7.2.
const CONDITION_SUGGESTIONS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_CONDITION_SUGGESTIONS === "true";

function Yoga() {
  const { t } = useTranslation(); // Initialize the useTranslation hook

  const [healthProblems, setHealthProblems] = useState([]); // Health problems list
  const [selectedProblems, setSelectedProblems] = useState([]); // Selected health problems
  const [suggestions, setSuggestions] = useState([]); // Yoga suggestions

  // The service runs on a free tier that sleeps, and a cold start measured at
  // roughly sixty seconds. Without these states the UI simply sits there.
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [problemsError, setProblemsError] = useState("");
  const [suggestionsError, setSuggestionsError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!CONDITION_SUGGESTIONS_ENABLED) return;

    let cancelled = false;
    setLoadingProblems(true);
    setProblemsError("");

    fetch(`${SUGGESTIONS_API}/health-problems`)
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setHealthProblems(
          Array.isArray(data)
            ? data.map((problem) => ({ label: problem, value: problem }))
            : []
        );
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Fetching health problems failed:", error);
        setProblemsError(
          "Could not load the list. The service sleeps when idle and can take about a minute to wake up. Please try again."
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingProblems(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchSuggestions = () => {
    const selectedValues = selectedProblems.map((problem) => problem.value);
    if (selectedValues.length === 0) return;

    setLoadingSuggestions(true);
    setSuggestionsError("");
    setHasSearched(true);

    fetch(`${SUGGESTIONS_API}/suggestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ healthProblems: selectedValues }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response.json();
      })
      .then((data) => setSuggestions(Array.isArray(data) ? data : []))
      // The previous version had no catch at all, so any failure surfaced as
      // an unhandled rejection and the user saw nothing happen.
      .catch((error) => {
        console.error("Fetching suggestions failed:", error);
        setSuggestions([]);
        setSuggestionsError(
          "Could not load suggestions. The service may be waking up. Please try again."
        );
      })
      .finally(() => setLoadingSuggestions(false));
  };

  if (!CONDITION_SUGGESTIONS_ENABLED) {
    return (
      <div className="App">
        <h1 style={{ color: "white" }}>{t("yogaPoseSuggestions")}</h1>
        <p style={{ color: "white", maxWidth: "52ch", margin: "0 auto" }}>
          Pose suggestions based on health conditions are turned off. The
          underlying mapping has not been reviewed by a qualified practitioner,
          so it is not shown by default.
        </p>
      </div>
    );
  }

  return (
    <div className="App">
      <h1 style={{ color: "white" }}>{t("yogaPoseSuggestions")}</h1>

      <p className="yoga-disclaimer">
        <strong>Not medical advice.</strong> These suggestions come from an
        external service, are not clinically reviewed, and carry no source or
        review information. Do not use them to treat a condition. Talk to a
        doctor or a qualified yoga therapist before starting something new.
      </p>

      <div className="dropdown-container">
        <h2 style={{ color: "white" }}>{t("selectHealthProblems")}</h2>
        <Select
          isMulti
          options={healthProblems}
          value={selectedProblems}
          onChange={setSelectedProblems}
          placeholder={
            loadingProblems ? "Loading options..." : t("selectHealthProblems")
          }
          isLoading={loadingProblems}
          isDisabled={loadingProblems || !!problemsError}
        />
        {problemsError && <p className="yoga-error">{problemsError}</p>}
      </div>

      <button
        className="fetch-button"
        onClick={fetchSuggestions}
        disabled={loadingSuggestions || selectedProblems.length === 0}
      >
        {loadingSuggestions ? "Loading..." : t("getSuggestions")}
      </button>

      <div className="suggestions">
        <h2 style={{ color: "white" }}>{t("yogaSuggestions")}</h2>

        {loadingSuggestions && (
          <p style={{ color: "white" }}>
            Fetching suggestions. The service can take up to a minute to wake up.
          </p>
        )}

        {!loadingSuggestions && suggestionsError && (
          <p className="yoga-error">{suggestionsError}</p>
        )}

        {!loadingSuggestions && !suggestionsError && suggestions.length > 0 && (
          <div className="yoga-list">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="yoga-pose">
                <img
                  src={suggestion["Image URL"]}
                  alt={suggestion["Yoga Pose Name"]}
                />
                <p>{suggestion["Yoga Pose Name"]}</p>
              </div>
            ))}
          </div>
        )}

        {!loadingSuggestions && !suggestionsError && suggestions.length === 0 && (
          <p style={{ color: "white" }}>
            {hasSearched ? t("noSuggestions") : "Select one or more options above."}
          </p>
        )}
      </div>
    </div>
  );
}

export default Yoga;
