"use client";

import Navbar from '../Navbar/navbar';
import TopBar from './TopBar';
import SiteFooter from './SiteFooter';
import BottomTabBar from './BottomTabBar';
import SkipLink from './SkipLink';

/**
 * The page template every page uses (PRD section 4.4), in this DOM order:
 * skip link, top bar, (alert ribbon: Part 2), sidebar navigation, main,
 * footer, then the fixed mobile tab bar.
 */
export default function WithNavbar({ children }) {
  return (
    <>
      <SkipLink />
      <TopBar />
      <div className="ms-shell">
        <Navbar />
        <div className="ms-shell-body">
          <main id="main" tabIndex={-1} className="ms-main">
            {children}
          </main>
          <SiteFooter />
        </div>
      </div>
      <BottomTabBar />
    </>
  );
}
