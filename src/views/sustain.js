"use client";

import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next'; // Import i18next
import Navbar from '../components/Navbar/navbar';
import YourComponent from '../components/sustain/card';
const video = '/media/treeVideo.mp4'; // served from public/media
import '../App.css';

const Card = () => {
  const { t } = useTranslation(); // Hook for translations
  const videoRef = useRef(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div style={{ height: "100vh", top: 0, position: "sticky" }}>
        <Navbar />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className='videodiv' style={{ display: 'flex', flexDirection: 'row' }}>
          <video
            className='video'
            ref={videoRef}
            width="100%"
            loop
            autoPlay
          >
            <source src={video} type="video/mp4" />
            {t('cards.videoFallback')}
          </video>
          <div>
            <h1 className='hstyle' style={{ marginTop: '140px', marginLeft: '80px', color: '#2646A6' }}>
              {t('cards.videoHeader')}
            </h1>
            {/* The virtual forest is a standalone static page in public/, not
                a Next.js route, so it is a plain anchor rather than a button
                driving window.location. A link is also what this actually is:
                it can be opened in a new tab and read by assistive tech. */}
            <a className='playbtn' href='/aframe-environment-component-master/index.html'>
              {t('cards.buttonText')}
            </a>
          </div>
        </div>
        {/* YourComponent below the video */}
        <div style={{ flex: 1 }}>
          <YourComponent />
        </div>
      </div>
    </div>
  );
};

export default Card;
