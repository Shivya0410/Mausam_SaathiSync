"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './dietcards.css';

import chocolateImg from '../../assets/chocolate.jpg';
import chikkiImg from '../../assets/chikki.jpg';
import chipsImg from '../../assets/chips.jpg';
import makhanaImg from '../../assets/makhana.jpg';
import momosImg from '../../assets/momos.jpg';
import paniyaramImg from '../../assets/paniyaram.jpg';
import pastriesImg from '../../assets/pastries.jpg';
import raagicakeImg from '../../assets/raagicake.jpg';
import omleteImg from '../../assets/omlete.jpg';
import moongdaalchilaImg from '../../assets/moongdaalchila.jpg';
import nachosImg from '../../assets/nachos.jpg';
import khakraImg from '../../assets/khakra.jpg';
import subwayImg from '../../assets/subway.jpg';
import paratharollImg from '../../assets/paratharoll.jpg';
import maggiImg from '../../assets/maggi.jpg';
import vermicelliImg from '../../assets/vermicelli.jpg';

// Photo swap cards: local food photography, craving on the front,
// lighter Indian alternative in the footer. No invented nutrition numbers.
const SWAPS = [
  {
    id: 'chocolate',
    photo: chocolateImg,
    swapPhoto: chikkiImg,
    junkKey: 'chocolate',
    junkDescKey: 'chocolateDescription',
    swapName: 'Til-Gud Chikki',
    swapDescKey: 'chikkiDescription',
    fallback: { junk: 'Chocolate', junkDesc: 'Why load up on sugar and fats from chocolate when you’ve just burned it off in that spin class?' },
  },
  {
    id: 'chips',
    photo: chipsImg,
    swapPhoto: makhanaImg,
    junkKey: 'chips',
    junkDescKey: 'chipsDescription',
    swapName: 'Roasted Makhana',
    swapDescKey: 'makhanaDescription',
    fallback: { junk: 'Chips', junkDesc: 'Crunching on chips? That’s hundreds of empty calories!' },
  },
  {
    id: 'momos',
    photo: momosImg,
    swapPhoto: paniyaramImg,
    junkKey: 'momos',
    junkDescKey: 'momosDescription',
    swapName: 'Steamed Paniyaram',
    swapDescKey: 'paniyaramDescription',
    fallback: { junk: 'Momos', junkDesc: 'Ditch those deep-fried momos!' },
  },
  {
    id: 'pastries',
    photo: pastriesImg,
    swapPhoto: raagicakeImg,
    junkKey: 'pastries',
    junkDescKey: 'pastriesDescription',
    swapName: 'Ragi Cake',
    swapDescKey: 'ragiCakeDescription',
    fallback: { junk: 'Pastries', junkDesc: 'Do you really want that sugary pastry to undo your gym work?' },
  },
  {
    id: 'omelette',
    photo: omleteImg,
    swapPhoto: moongdaalchilaImg,
    junkKey: 'omelette',
    junkDescKey: 'omeletteDescription',
    swapName: 'Moong Dal Cheela',
    swapDescKey: 'moongDalCheelaDescription',
    fallback: { junk: 'Omelette', junkDesc: 'Is it giving you the nutrition you deserve?' },
  },
  {
    id: 'nachos',
    photo: nachosImg,
    swapPhoto: khakraImg,
    junkKey: 'nachos',
    junkDescKey: 'nachosDescription',
    swapName: 'Whole-grain Khakra',
    swapDescKey: 'khakraDescription',
    fallback: { junk: 'Nachos', junkDesc: 'Treat your body to something that works with your efforts.' },
  },
  {
    id: 'subway',
    photo: subwayImg,
    swapPhoto: paratharollImg,
    junkKey: 'subway',
    junkDescKey: 'subwayDescription',
    swapName: 'Paneer Roti Roll',
    swapDescKey: 'paneerRollDescription',
    fallback: { junk: 'SubWay', junkDesc: 'Processed bread and sauces undoing your fitness progress.' },
  },
  {
    id: 'maggi',
    photo: maggiImg,
    swapPhoto: vermicelliImg,
    junkKey: 'maggi',
    junkDescKey: 'maggiDescription',
    swapName: 'Veg Vermicelli Upma',
    swapDescKey: 'vermicelliUpmaDescription',
    fallback: { junk: 'Maggi', junkDesc: 'Is that quick Maggi fix worth sabotaging your goals?' },
  },
];

export default function SwapCards() {
  const { t } = useTranslation();
  const [added, setAdded] = useState({});

  return (
    <div className="photo-swap-list">
      {SWAPS.map((s) => {
        const junk = t(s.junkKey, { defaultValue: s.fallback.junk });
        const junkDesc = t(s.junkDescKey, { defaultValue: s.fallback.junkDesc });
        const swapDesc = t(s.swapDescKey, { defaultValue: '' });
        const isAdded = !!added[s.id];

        return (
          <article key={s.id} className="photo-swap-card">
            <img className="photo-swap-bg" src={s.photo.src} alt={junk} loading="lazy" />
            <div className="photo-swap-scrim" aria-hidden="true" />

            <span className="photo-swap-pill">{junk}</span>

            <p className="photo-swap-desc">{junkDesc}</p>

            <div className="photo-swap-foot">
              <img className="photo-swap-thumb" src={s.swapPhoto.src} alt={s.swapName} loading="lazy" />
              <div className="photo-swap-foot-text">
                <strong>{s.swapName}</strong>
                {swapDesc ? <span>{swapDesc}</span> : null}
              </div>
              <button
                type="button"
                className={`photo-swap-add ${isAdded ? 'added' : ''}`}
                onClick={() => setAdded((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
                aria-pressed={isAdded}
              >
                {isAdded ? <i className="fa-solid fa-check"></i> : null}
                {isAdded
                  ? t('addedToDiet', { defaultValue: 'Added' })
                  : t('addToDiet', { defaultValue: 'Add to Diet' })}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
