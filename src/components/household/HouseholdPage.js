"use client";

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import Avatar, { AVATAR_SEEDS } from '../shared/Avatar';
import { ChipGroup } from '../persona/Sections';
import { useStore } from '../../lib/hooks/useStore';
import { usePersonal } from '../../lib/hooks/usePersonal';
import { stores, addMember, updateMember, removeMember, toggleChoice, personaList, MAX_MEMBERS } from '../../lib/stores';
import { PERSONAS, SENSITIVITIES } from '../../config/personas';
import { LANGUAGES } from '../../config/site';
import { personalView } from '../../lib/mausam/personal';
import { cardText, cardSpeech } from '../../lib/mausam/cardText';
import { speak } from '../../lib/speech';
import { useA11y } from '../../lib/context/A11yProvider';

const TILES = PERSONAS.filter((p) => p.tile);
const EMPTY = { name: '', avatar: AVATAR_SEEDS[0], personas: [], sensitivities: [], lang: 'en' };

function MemberForm({ initial, onSave, onCancel, submitKey }) {
  const { t } = useTranslation();
  const [m, setM] = useState(initial);
  const [error, setError] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    if (!m.name.trim()) return setError(true);
    onSave(m);
  };
  return (
    <form onSubmit={submit} className="ms-form" noValidate>
      <label className="ms-field">
        <span>{t('household.nickname')}</span>
        <input type="text" maxLength={20} value={m.name} onChange={(e) => setM((x) => ({ ...x, name: e.target.value }))} aria-invalid={error} aria-describedby={error ? 'hh-err' : undefined} placeholder={t('household.nicknameHint')} />
      </label>
      {error ? <p id="hh-err" className="ms-error" role="alert">{t('household.nameRequired')}</p> : null}
      <fieldset className="ms-fieldset">
        <legend>{t('household.avatar')}</legend>
        <div className="ms-chipgroup" role="radiogroup" aria-label={t('household.avatar')}>
          {AVATAR_SEEDS.map((seed, i) => (
            <button key={seed} type="button" role="radio" aria-checked={m.avatar === seed} aria-label={t('household.avatarN', { n: i + 1 })} className={`ms-avatar-btn ${m.avatar === seed ? 'is-on' : ''}`} onClick={() => setM((x) => ({ ...x, avatar: seed }))}>
              <Avatar seed={seed} size={36} decorative />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="ms-fieldset">
        <legend>{t('household.theirDay')}</legend>
        <div className="ms-chipgroup">
          {TILES.map((p) => (
            <button key={p.id} type="button" className="ms-chip-btn" aria-pressed={m.personas.includes(p.id)} onClick={() => setM((x) => ({ ...x, personas: toggleChoice(x.personas, p.id) }))}>
              {t(p.nameKey)}
            </button>
          ))}
        </div>
      </fieldset>
      {m.personas.includes('health') ? (
        <fieldset className="ms-fieldset">
          <legend>{t('onboarding.details.sensitivities')}</legend>
          <div className="ms-chipgroup">
            {SENSITIVITIES.map((s) => (
              <button key={s} type="button" className="ms-chip-btn" aria-pressed={m.sensitivities.includes(s)} onClick={() => setM((x) => ({ ...x, sensitivities: x.sensitivities.includes(s) ? x.sensitivities.filter((y) => y !== s) : [...x.sensitivities, s] }))}>
                {t(`sensitivities.${s}`)}
              </button>
            ))}
          </div>
          <p className="ms-muted">{t('sensitivities.onlyOnPhone')}</p>
        </fieldset>
      ) : null}
      <ChipGroup label={t('household.language')} options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))} value={m.lang} onChange={(v) => setM((x) => ({ ...x, lang: v }))} />
      <p className="ms-actions">
        <button type="submit" className="ms-btn">{t(submitKey)}</button>
        {onCancel ? <button type="button" className="ms-btn ms-btn--secondary" onClick={onCancel}>{t('common.cancel')}</button> : null}
      </p>
    </form>
  );
}

/** Household (PRD 3.6, 9.6): up to 5 more people on this phone. */
export default function HouseholdPage() {
  const { t, i18n } = useTranslation();
  const { speechRate } = useA11y();
  const [household, setHousehold] = useStore(stores.household);
  const personal = usePersonal();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const members = household.members;

  const readAloud = (m) => {
    if (!personal.inputs) return;
    const v = personalView({ ...personal.inputs, personas: personaList({ primary: m.personas?.[0], secondary: m.personas?.slice(1) || [] }), sensitivities: m.sensitivities || [] });
    const mt = i18n.getFixedT(m.lang || 'en');
    const text = [mt('household.cardsFor', { name: m.name }), ...v.cards.slice(0, 4).map((c) => cardSpeech(cardText(c, { t: mt, lang: m.lang, today: personal.today })))].join('. ');
    speak(text, { lang: m.lang, rate: speechRate });
  };

  return (
    <>
      <PageHeader title={t('pages.household.title')} subtitle={t('pages.household.subtitle')} />
      <section className="ms-card" aria-labelledby="hh-list">
        <h2 id="hh-list">{t('household.members', { count: members.length, max: MAX_MEMBERS })}</h2>
        {members.length ? (
          <ul className="ms-members-cards">
            {members.map((m) => (
              <li key={m.id} className="ms-member-card">
                {editing === m.id ? (
                  <MemberForm
                    initial={{ ...EMPTY, ...m }}
                    submitKey="common.save"
                    onCancel={() => setEditing(null)}
                    onSave={(x) => {
                      setHousehold((h) => updateMember(h, m.id, x));
                      setEditing(null);
                    }}
                  />
                ) : (
                  <>
                    <div className="ms-member-head">
                      <Avatar seed={m.avatar || m.name} size={44} decorative />
                      <div>
                        <strong>{m.name}</strong>
                        <p className="ms-muted">
                          {(m.personas || []).map((p) => t(`personas.${p}.name`)).join(', ') || t('personas.citizen.name')} · {LANGUAGES.find((l) => l.code === m.lang)?.label || 'English'}
                        </p>
                      </div>
                    </div>
                    <p className="ms-actions">
                      <button type="button" className="ms-chip-btn" onClick={() => readAloud(m)} disabled={!personal.inputs}>
                        <i className="fa-solid fa-volume-high" aria-hidden="true"></i> {t('household.readCards', { name: m.name })}
                      </button>
                      <button type="button" className="ms-chip-btn" onClick={() => setEditing(m.id)}>
                        <i className="fa-solid fa-pen" aria-hidden="true"></i> {t('household.edit')}
                      </button>
                      <button type="button" className="ms-chip-btn" onClick={() => setHousehold((h) => removeMember(h, m.id))}>
                        <i className="fa-solid fa-trash" aria-hidden="true"></i> {t('household.remove', { name: m.name })}
                      </button>
                    </p>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="ms-muted">{t('household.none')}</p>
        )}
        {members.length < MAX_MEMBERS ? (
          adding ? (
            <MemberForm
              initial={{ ...EMPTY, lang: i18n.language === 'hi' ? 'hi' : 'en' }}
              submitKey="household.add"
              onCancel={() => setAdding(false)}
              onSave={(x) => {
                setHousehold((h) => ({ ...addMember(h, x), selected: 'everyone' }));
                setAdding(false);
              }}
            />
          ) : (
            <button type="button" className="ms-btn" onClick={() => setAdding(true)}>
              <i className="fa-solid fa-plus" aria-hidden="true"></i> {t('household.addMember')}
            </button>
          )
        ) : (
          <p className="ms-muted">{t('household.full')}</p>
        )}
      </section>
      <p className="ms-muted">{t('household.privacy')}</p>
    </>
  );
}
