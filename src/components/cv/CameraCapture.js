"use client";

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toCanvas, fileToCanvas } from '../../lib/cv/image';

/**
 * Still-photo capture for the camera features (PRD 11.0, 20.10). The camera
 * starts only on "Open camera"; "Choose from gallery" is always offered and
 * is often more reliable. Tracks are stopped on close and unmount. Nothing
 * is uploaded: the caller gets a canvas in memory.
 *
 * Props: { onCapture(canvas), hintKey }
 */
export default function CameraCapture({ onCapture, hintKey }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);
  const [mode, setMode] = useState('idle');
  const [message, setMessage] = useState('');

  const stop = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };
  useEffect(() => stop, []);

  const open = async () => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setMessage(t('cv.errors.insecure'));
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(t('cv.errors.noCamera'));
      return;
    }
    setMessage(t('cv.status.starting'));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
      streamRef.current = stream;
      setMode('live');
      setMessage(t('cv.status.ready'));
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (e) {
      setMessage(e?.name === 'NotAllowedError' ? t('cv.errors.denied') : e?.name === 'NotFoundError' ? t('cv.errors.noCamera') : t('cv.errors.failed'));
    }
  };

  const close = () => {
    stop();
    setMode('idle');
    setMessage('');
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = toCanvas(v);
    close();
    onCapture(canvas);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const canvas = await fileToCanvas(file);
      onCapture(canvas);
    } catch {
      setMessage(t('cv.errors.badFile'));
    }
  };

  return (
    <div className="ms-camera">
      {mode === 'live' ? (
        <div className="ms-camera-live">
          <video ref={videoRef} className="ms-camera-video" playsInline muted aria-label={t('cv.preview')}></video>
          {hintKey ? <p className="ms-camera-hint">{t(hintKey)}</p> : null}
          <div className="ms-camera-controls">
            <button type="button" className="ms-capture-btn" onClick={capture} aria-label={t('cv.capture')}>
              <span aria-hidden="true"></span>
            </button>
            <button type="button" className="ms-btn ms-btn--secondary" onClick={close}>
              <i className="fa-solid fa-xmark" aria-hidden="true"></i> {t('common.close')}
            </button>
          </div>
        </div>
      ) : (
        <p className="ms-actions">
          <button type="button" className="ms-btn" onClick={open}>
            <i className="fa-solid fa-camera" aria-hidden="true"></i> {t('cv.openCamera')}
          </button>
          <button type="button" className="ms-btn ms-btn--secondary" onClick={() => fileRef.current?.click()}>
            <i className="fa-solid fa-image" aria-hidden="true"></i> {t('cv.gallery')}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="visually-hidden" tabIndex={-1} aria-hidden="true" onChange={onFile} />
        </p>
      )}
      <p className="ms-muted" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
