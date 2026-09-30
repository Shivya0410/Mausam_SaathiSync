"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { MYTH_FACT_QUESTIONS } from "./mythFactData";
import { useAuth } from "../../store/auth";
import { awardBadges } from "../../utils/badges";
import styles from "./shefit.module.css";

// A lightweight quiz: finishing all questions earns the Quiz Whiz badge
// (per-user). Answers themselves are never persisted or sent anywhere.
export default function MythOrFact() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [correct, setCorrect] = useState(0);

  const total = MYTH_FACT_QUESTIONS.length;
  const question = MYTH_FACT_QUESTIONS[index];
  const revealed = selected !== null;
  const isCorrect = revealed && selected === question.answer;
  const lang = i18n?.language?.startsWith("hi") ? "hi" : "en";
  const statement = lang === "hi" && question.statementHi ? question.statementHi : question.statement;
  const explanation = lang === "hi" && question.explanationHi ? question.explanationHi : question.explanation;

  const handleAnswer = (choice) => {
    if (revealed) return;
    setSelected(choice);
    if (choice === question.answer) setCorrect((c) => c + 1);
  };

  const handleNext = () => {
    if (index + 1 >= total) {
      setDone(true);
      awardBadges(user, ["quiz_whiz"]);
      return;
    }
    setIndex((prev) => prev + 1);
    setSelected(null);
  };

  const handleRestart = () => {
    setIndex(0);
    setSelected(null);
    setCorrect(0);
    setDone(false);
  };

  if (done) {
    return (
      <div className={styles.quizCard}>
        <p className={styles.quizEmoji} aria-hidden="true">🏅</p>
        <h3 className={styles.quizDoneTitle}>{t("shefit.quizDone", { total, correct })}</h3>
        <p className={styles.quizDoneText}>
          {t("shefit.quizBadgeNote")}
        </p>
        <button className={styles.primaryBtn} onClick={handleRestart}>
          {t("shefit.playAgain")}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.quizCard}>
      <div className={styles.quizProgressTop} aria-hidden="true">
        <span style={{ width: `${((index + (revealed ? 1 : 0)) / total) * 100}%` }} />
      </div>
      <p className={styles.quizEmoji} aria-hidden="true">💡</p>
      <p className={styles.quizKicker}>{t("shefit.quizKicker")}</p>
      <h3 className={styles.quizStatement}>&ldquo;{statement}&rdquo;</h3>

      <div className={styles.quizChoices}>
        <button
          className={`${styles.quizChoiceBtn} ${
            revealed && question.answer === "myth" ? styles.quizChoiceCorrect : ""
          } ${revealed && selected === "myth" && !isCorrect ? styles.quizChoiceWrong : ""}`}
          onClick={() => handleAnswer("myth")}
          disabled={revealed}
        >
          {t("shefit.myth")}
        </button>
        <button
          className={`${styles.quizChoiceBtn} ${
            revealed && question.answer === "fact" ? styles.quizChoiceCorrect : ""
          } ${revealed && selected === "fact" && !isCorrect ? styles.quizChoiceWrong : ""}`}
          onClick={() => handleAnswer("fact")}
          disabled={revealed}
        >
          {t("shefit.fact")}
        </button>
      </div>

      {revealed && (
        <div className={styles.quizResult}>
          <p className={isCorrect ? styles.quizCorrectLabel : styles.quizWrongLabel}>
            {isCorrect ? t("shefit.right") : t("shefit.wrong")}
          </p>
          <p className={styles.quizExplanation}>{explanation}</p>
          <button className={styles.primaryBtn} onClick={handleNext}>
            {index + 1 >= total ? t("shefit.finish") : t("shefit.next")}
          </button>
        </div>
      )}

      <p className={styles.quizProgress}>
        {t("shefit.quizProgress", { current: index + 1, total })}
      </p>
    </div>
  );
}
