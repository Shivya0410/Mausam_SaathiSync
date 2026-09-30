"use client";

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WEATHER_MYTHS } from '../../data/weatherMyths';
import { useReady } from '../../lib/hooks/useReady';
import { recordQuiz } from '../../lib/mausam/ready';

/** Weather myths quiz (PRD 9.3, 21.2). Finishing it earns "Weather Wise". */
export default function MythQuiz() {
  const { t } = useTranslation();
  const [, update, fresh] = useReady();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = WEATHER_MYTHS[i];

  const pick = (ans) => {
    if (picked) return;
    setPicked(ans);
    if (ans === q.answer) setScore((s) => s + 1);
  };
  const next = () => {
    if (i + 1 < WEATHER_MYTHS.length) {
      setI(i + 1);
      setPicked(null);
      return;
    }
    const final = score;
    setDone(true);
    update((s) => recordQuiz(s, 'myths', { done: true, score: final, total: WEATHER_MYTHS.length, at: new Date().toISOString() }));
  };
  const restart = () => {
    setI(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  if (done) {
    return (
      <div role="status">
        <p><strong>{t('learn.quiz.result', { score, total: WEATHER_MYTHS.length })}</strong></p>
        {fresh.includes('weather_wise') ? <p className="ms-callout">{t('learn.quiz.badge')}</p> : null}
        <button type="button" className="ms-btn ms-btn--secondary" onClick={restart}>{t('learn.quiz.again')}</button>
      </div>
    );
  }
  return (
    <div className="ms-quiz">
      <p className="ms-muted">{t('learn.quiz.progress', { n: i + 1, total: WEATHER_MYTHS.length })}</p>
      <p className="ms-quiz-statement" id={`myth-${q.id}`}>“{t(`learn.myths.${q.id}.statement`)}”</p>
      <div className="ms-actions" role="group" aria-labelledby={`myth-${q.id}`}>
        {['myth', 'fact'].map((a) => (
          <button
            key={a}
            type="button"
            className={`ms-btn ${picked ? (a === q.answer ? 'ms-btn--good' : picked === a ? 'ms-btn--danger' : 'ms-btn--secondary') : 'ms-btn--secondary'}`}
            aria-pressed={picked === a}
            onClick={() => pick(a)}
            disabled={Boolean(picked)}
          >
            {t(`learn.quiz.${a}`)}
          </button>
        ))}
      </div>
      {picked ? (
        <div role="status">
          <p>
            <strong>{picked === q.answer ? t('learn.quiz.right') : t('learn.quiz.wrong')}</strong> {t(`learn.quiz.itsA.${q.answer}`)}{' '}
            {t(`learn.myths.${q.id}.why`)}
          </p>
          <button type="button" className="ms-btn" onClick={next}>
            {i + 1 < WEATHER_MYTHS.length ? t('common.next') : t('learn.quiz.finish')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
