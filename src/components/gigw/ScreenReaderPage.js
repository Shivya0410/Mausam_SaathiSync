"use client";

import { useTranslation } from 'react-i18next';
import ContentPage from './ContentPage';
import ExternalLink from '../shared/ExternalLink';

const READERS = [
  ['nvda', 'https://www.nvaccess.org/download/', 'free'],
  ['jaws', 'https://www.freedomscientific.com/products/software/jaws/', 'commercial'],
  ['talkback', 'https://support.google.com/accessibility/android/answer/6283677', 'builtIn'],
  ['voiceover', 'https://support.apple.com/guide/voiceover/welcome/mac', 'builtIn'],
  ['narrator', 'https://support.microsoft.com/windows/complete-guide-to-narrator-e4397a0d-ef4f-b386-d8ae-c172f109bdb1', 'builtIn'],
];

/** Screen reader access (GIGW G6). */
export default function ScreenReaderPage() {
  const { t } = useTranslation();
  return (
    <ContentPage page="screenReader" ids={['tips']}>
      <div className="ms-card ms-table-wrap" role="region" aria-labelledby="sr-table" tabIndex={0}>
        <table className="ms-table">
          <caption id="sr-table">{t('gigw.screenReader.caption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('gigw.screenReader.colName')}</th>
              <th scope="col">{t('gigw.screenReader.colPlatform')}</th>
              <th scope="col">{t('gigw.screenReader.colType')}</th>
            </tr>
          </thead>
          <tbody>
            {READERS.map(([id, href, type]) => (
              <tr key={id}>
                <th scope="row"><ExternalLink href={href}>{t(`gigw.screenReader.readers.${id}.name`)}</ExternalLink></th>
                <td>{t(`gigw.screenReader.readers.${id}.platform`)}</td>
                <td>{t(`gigw.screenReader.types.${type}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ContentPage>
  );
}
