"use client";

// TaskManager.js
import React, { useCallback, useMemo, useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import StreakCalendar from '../streakcalender/streakcalender';
import {
  CALENDAR_MONTH_LABEL,
  CALENDAR_YEAR_LABEL,
  PROFILE_CALENDAR_CELLS,
  chunkIntoWeeks,
  clampWeekIndex,
  columnCount,
  hideWeekendsInWeeks,
  visibleHeaders,
} from '../../lib/profileCalendar';
import BadgesGrid from '../badges/BadgesGrid';
import ActivityHeatmap from './ActivityHeatmap';
import WeeklyGoals from './WeeklyGoals';
import InsightsPanel from './InsightsPanel';
import XpPreview from './XpPreview';
import GuestBanner from './GuestBanner';
import ContinueJourney from './ContinueJourney';
import ProfilePreferences from './ProfilePreferences';
import { awardBadges, currentStreak } from '../../utils/badges';
import { useAuth } from '../../store/auth';
import { userKey } from '../../utils/userScopedStorage';
import {
  aggregateByDay,
  localTodayISO,
  summarizeEvents,
  trackerStoreToEvents,
} from '../../lib/activityModel';
import {
  getTrackerServerSnapshot,
  getTrackerSnapshot,
  subscribeToTrackerStore,
} from '../../lib/trackerStore';
import SampleDataBadge from '../shared/SampleDataBadge';
import Avatar from '../shared/Avatar';
import { demoProfileStats } from '../../data/demoStats';
import { INBOX, NOTIFICATIONS } from '../../data/profileInbox';
import './profile.scss'; // Import your CSS file here

// Tracker store key (same key the Tracker writes per-user). Y=Yoga,
// M=Meditation, E=Healthy Diet, C=Creative Hub — checked boxes only.
const TRACKER_STORE_KEY = 'swasth.tracker.v1';

const Profile = () => {
  const [selectedMail, setSelectedMail] = useState([]);
  // Hardcoded demo inbox: which message is open, which have been read, and
  // whether the notifications panel is showing. Nothing is sent anywhere.
  const [openMailId, setOpenMailId] = useState(INBOX[0].id);
  const [readMailIds, setReadMailIds] = useState([INBOX[0].id]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const openMail = INBOX.find((m) => m.id === openMailId) || INBOX[0];
  const unreadMail = INBOX.filter((m) => m.unread && !readMailIds.includes(m.id)).length;
  const unreadNotifications = NOTIFICATIONS.filter((n) => n.unread && !readNotificationIds.includes(n.id)).length;

  const openMessage = (id) => {
    setOpenMailId(id);
    setReadMailIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };
  const [color, setColor] = useState('#493971');
  const [calendarVisible, setCalendarVisible] = useState(false);
  // Appointment-calendar controls. The grid below used to be static markup
  // with dead buttons; the cells/events are unchanged (see
  // src/lib/profileCalendar.js) and these three pieces of state only switch
  // which slice of the EXISTING calendar is shown.
  // No behaviour is defined anywhere in the codebase for "Cheat Days", so
  // that button is intentionally left untouched (see report).
  const [calendarView, setCalendarView] = useState('month'); // 'week' | 'month'
  const [showWeekends, setShowWeekends] = useState(true);
  const [weekIndex, setWeekIndex] = useState(0);
  const calendarWeeks = useMemo(() => chunkIntoWeeks(PROFILE_CALENDAR_CELLS), []);
  const safeWeekIndex = clampWeekIndex(weekIndex, calendarWeeks.length);
  const calendarRows = useMemo(
    () => (showWeekends ? calendarWeeks : hideWeekendsInWeeks(calendarWeeks)),
    [calendarWeeks, showWeekends]
  );
  const visibleRows = calendarView === 'week' ? [calendarRows[safeWeekIndex]] : calendarRows;
  const calendarColumns = columnCount(showWeekends);
  // The stylesheet fixes the grid to 7 columns; only override it when
  // weekends are hidden, leaving the existing month styling byte-identical
  // otherwise.
  const calendarGridStyle =
    calendarColumns === 7
      ? undefined
      : { gridTemplateColumns: `repeat(${calendarColumns}, minmax(195px, 1fr))` };

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // Current month (1-12)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); // Current year

  const { user, isLoggedIN, isAuthReady } = useAuth();
  const safeUser = user && typeof user === "object" ? user : null;

  // This account's tracker store only (guest namespace when logged out).
  // Never merged across accounts. useSyncExternalStore keeps the server
  // snapshot empty (SSR-safe) and syncs per-account without setState-in-effect.
  // Snapshots are cached per key (see src/lib/trackerStore.js): returning a
  // fresh object on every getSnapshot/getServerSnapshot call makes React loop
  // ("getServerSnapshot should be cached" -> "Maximum update depth exceeded").
  const trackerKey = userKey(TRACKER_STORE_KEY, user);
  const getTrackerSnapshotForKey = useCallback(
    () => getTrackerSnapshot(trackerKey),
    [trackerKey]
  );
  const allMonths = useSyncExternalStore(
    subscribeToTrackerStore,
    getTrackerSnapshotForKey,
    getTrackerServerSnapshot
  );

  // Qualifying events: checked Y/M/E/C boxes on real dates, no future dates.
  // Page visits, logins, cycle/medical data are never included (see
  // src/lib/activityModel.js).
  const activityEvents = useMemo(() => {
    let today = null;
    try {
      today = localTodayISO(new Date());
    } catch {
      today = null;
    }
    return trackerStoreToEvents(allMonths, today);
  }, [allMonths]);
  const eventsByDay = useMemo(() => aggregateByDay(activityEvents), [activityEvents]);
  const activitySummary = useMemo(() => summarizeEvents(activityEvents), [activityEvents]);

  // Sign-in streak dates from the backend (verified identity field), derived
  // rather than copied into state. Kept separate from the local activity
  // streak so server vs local stays honest.
  const streakData = useMemo(() => {
    if (safeUser && Array.isArray(safeUser.lastLoginDates)) {
      try {
        return safeUser.lastLoginDates.map((date) =>
          new Date(date).toISOString().split("T")[0]
        );
      } catch {
        return [];
      }
    }
    return [];
  }, [safeUser]);

  // Badge awards write to per-user browser storage (external system sync),
  // not React state, so no cascading render is involved.
  useEffect(() => {
    if (!streakData.length) return;
    const run = currentStreak(streakData);
    if (run >= 30) awardBadges(user, ["streak_30", "streak_7"]);
    else if (run >= 7) awardBadges(user, ["streak_7"]);
  }, [streakData, user]);

  const formattedLastLogin = safeUser?.lastLoginDate
            ? new Date(safeUser.lastLoginDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            : "Never";
  const displayName = safeUser
    ? `${safeUser.firstName || ""} ${safeUser.lastName || ""}`.trim() || "Member"
    : "Guest";
  const displayEmail = safeUser?.email || "Browsing without login — data stays on this device";

  // Browser sniffing moved out of the render body: `window` and `navigator` do
  // not exist during the server render, and mutating document.body while
  // rendering is a side effect React does not allow either way.
  useEffect(() => {
    const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
    const isEdge = /Edg/.test(navigator.userAgent);

    if (isChrome) {
      document.body.classList.add('chrome');
    } else if (isEdge) {
      document.body.classList.add('edge');
    }
  }, []);

  const handleMailChange = (id) => {
    setSelectedMail(prevSelected => 
      prevSelected.includes(id) ? prevSelected.filter(mailId => mailId !== id) : [...prevSelected, id]
    );
  };

  const handleColorChange = (e) => {
    setColor(e.target.value);
    document.documentElement.style.setProperty('--button-color', e.target.value);
  };

  const toggleCalendar = () => {
    setCalendarVisible(!calendarVisible);
  };

  const handleMonthChange = (direction) => {
    if (direction === "prev") {
      // Navigate to the previous month
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else if (direction === "next") {
      // Navigate to the next month
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  if (!isAuthReady) {
    return (
      <div style={{ padding: 24 }} role="status" aria-label="Loading profile">
        Loading your profile…
      </div>
    );
  }

  return (
    <div>
      <div className="container">
      <div className="user-profile-area">
        <div className='home-heading'>
          <Link href="/">
              <i className="fa fa-house nav-icon1"></i>
            </Link>
        <div className="task-manager">Back to Home</div>
        </div>
        {!isLoggedIN && (
          <div className="side-wrapper">
            <GuestBanner />
          </div>
        )}
        <div className="side-wrapper">
          <div className="user-profile">
            {isLoggedIN ? (
              <img src="https://akm-img-a-in.tosshub.com/indiatoday/images/story/202212/afp_000_9cq7ux_shilpa_shetty_yoga-one_one.jpg?VersionId=DeAg8M98aY9OSz3Z3gVSU84uySM4f245" alt="" className="user-photo" />
            ) : (
              <Avatar seed="guest" size={70} title="Guest avatar" />
            )}
            <div className="user-name">{displayName}</div>
            <div className="user-mail">{displayEmail}</div>
          </div>
          <div className="user-notification">
            <div className="notify">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" fill="currentColor">
            <path d="M13.533 5.6h-.961a.894.894 0 01-.834-.57.906.906 0 01.197-.985l.675-.675a.466.466 0 000-.66l-1.32-1.32a.466.466 0 00-.66 0l-.676.677a.9.9 0 01-.994.191.906.906 0 01-.56-.837V.467A.467.467 0 007.933 0H6.067A.467.467 0 005.6.467v.961c0 .35-.199.68-.57.834a.902.902 0 01-.983-.195L3.37 1.39a.466.466 0 00-.66 0L1.39 2.71a.466.466 0 000 .66l.675.675c.25.25.343.63.193.995a.902.902 0 01-.834.56H.467A.467.467 0 000 6.067v1.866c0 .258.21.467.467.467h.961c.35 0 .683.202.834.57a.904.904 0 01-.197.984l-.675.676a.466.466 0 000 .66l1.32 1.32a.466.466 0 00.66 0l.68-.68a.894.894 0 01.994-.187.897.897 0 01.556.829v.961c0 .258.21.467.467.467h1.866c.258 0 .467-.21.467-.467v-.961c0-.35.202-.683.57-.834a.904.904 0 01.984.197l.676.675a.466.466 0 00.66 0l1.32-1.32a.466.466 0 000-.66l-.68-.68a.894.894 0 01-.187-.994.897.897 0 01.829-.556h.961c.258 0 .467-.21.467-.467V6.067a.467.467 0 00-.467-.467zM7 9.333C5.713 9.333 4.667 8.287 4.667 7S5.713 4.667 7 4.667 9.333 5.713 9.333 7 8.287 9.333 7 9.333z" /></svg>
            </div>
            <button
              type="button"
              className={`notify ${unreadMail ? 'alert' : ''}`}
              data-count={unreadMail}
              aria-label={`Inbox, ${unreadMail} unread`}
              onClick={() => { setCalendarVisible(false); setShowNotifications(false); }}
            >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
      <path d="M10.688 95.156C80.958 154.667 204.26 259.365 240.5 292.01c4.865 4.406 10.083 6.646 15.5 6.646 5.406 0 10.615-2.219 15.469-6.604 36.271-32.677 159.573-137.385 229.844-196.896 4.375-3.698 5.042-10.198 1.5-14.719C494.625 69.99 482.417 64 469.333 64H42.667c-13.083 0-25.292 5.99-33.479 16.438-3.542 4.52-2.875 11.02 1.5 14.718z" />
      <path d="M505.813 127.406a10.618 10.618 0 00-11.375 1.542C416.51 195.01 317.052 279.688 285.76 307.885c-17.563 15.854-41.938 15.854-59.542-.021-33.354-30.052-145.042-125-208.656-178.917a10.674 10.674 0 00-11.375-1.542A10.674 10.674 0 000 137.083v268.25C0 428.865 19.135 448 42.667 448h426.667C492.865 448 512 428.865 512 405.333v-268.25a10.66 10.66 0 00-6.187-9.677z" /></svg>
            </button>
            <div className="notify-wrap">
            <button
              type="button"
              className={`notify ${unreadNotifications ? 'alert' : ''}`}
              data-count={unreadNotifications}
              aria-label={`Notifications, ${unreadNotifications} unread`}
              aria-expanded={showNotifications}
              onClick={() => setShowNotifications((v) => !v)}
            >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
            <path d="M467.812 431.851l-36.629-61.056a181.363 181.363 0 01-25.856-93.312V224c0-67.52-45.056-124.629-106.667-143.04V42.667C298.66 19.136 279.524 0 255.993 0s-42.667 19.136-42.667 42.667V80.96C151.716 99.371 106.66 156.48 106.66 224v53.483c0 32.853-8.939 65.109-25.835 93.291L44.196 431.83a10.653 10.653 0 00-.128 10.752c1.899 3.349 5.419 5.419 9.259 5.419H458.66c3.84 0 7.381-2.069 9.28-5.397 1.899-3.329 1.835-7.468-.128-10.753zM188.815 469.333C200.847 494.464 226.319 512 255.993 512s55.147-17.536 67.179-42.667H188.815z" /></svg>
            </button>
            </div>
          </div>
          {showNotifications && (
            <div className="notif-panel" role="dialog" aria-label="Notifications">
              <div className="notif-panel-head">
                <strong>Notifications</strong>
                <button type="button" onClick={() => setReadNotificationIds(NOTIFICATIONS.map((n) => n.id))}>
                  Mark all read
                </button>
              </div>
              <ul>
                {NOTIFICATIONS.map((n) => {
                  const isUnread = n.unread && !readNotificationIds.includes(n.id);
                  return (
                    <li key={n.id} className={isUnread ? 'notif-unread' : ''}>
                      <Link
                        href={n.href}
                        onClick={() => setReadNotificationIds((prev) => [...prev, n.id])}
                      >
                        <span className="notif-icon"><i className={n.icon} aria-hidden="true" /></span>
                        <span className="notif-text">
                          <strong>{n.title}</strong>
                          <small>{n.detail}</small>
                        </span>
                        <span className="notif-time">{n.time}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link href="/events/delhi" className="notif-all">See events near you →</Link>
            </div>
          )}
          <div className="progress-status">{demoProfileStats.taskProgress} <SampleDataBadge /></div>
          <div className="progress">
            <div className="progress-bar"></div>
          </div>
          <div className="task-status">
            <div className="task-stat">
              <div className="task-number">{safeUser?.streak ?? "—"}</div>
              <div className="task-condition">Sign-in streak</div>
              <div className="task-tasks">{isLoggedIN ? formattedLastLogin : "login for server streak"}</div>
            </div>
            <div className="task-stat">
              <div className="task-number">{activitySummary.currentStreak}</div>
              <div className="task-condition">Activity streak</div>
              <div className="task-tasks">this browser · {activitySummary.activeDays} active days</div>
            </div>
            {/* Streak above is a real backend field. These two are not, so
                each carries its own marker rather than one on the row. */}
            <div className="task-stat">
              <div className="task-number">{demoProfileStats.fitnessEventsAttended}</div>
              <div className="task-condition">Fitness Events</div>
              <div className="task-tasks"><SampleDataBadge /></div>
            </div>
            <div className="task-stat">
              <div className="task-number">{demoProfileStats.followerCount}</div>
              <div className="task-condition">Follower</div>
              <div className="task-tasks"><SampleDataBadge /></div>
            </div>
          </div>
        </div>
        <div className="side-wrapper">
  <div className="project-title">Medical Complications</div>
  <div className="project-name">
    {user?.medicalComplications && user.medicalComplications.length > 0 ? (
      user.medicalComplications.map((complication, index) => (
        <div key={index} className="project-department">
          {complication || "No data available"}
        </div>
      ))
    ) : (
      <div className="project-department">No medical complications found</div>
    )}
  </div>
</div>

        <div className="side-wrapper">
          <div style={{ padding: "20px", textAlign: "center" }}>
      <h3>
        Sign-in streak for {currentMonth < 10 ? `0${currentMonth}` : currentMonth}-{currentYear}
      </h3>
      <p className="profile-muted">{isLoggedIN ? "Server sign-in dates." : "Log in to see server sign-in dates."}</p>
      <div className="streak-nav">
        <button type="button" onClick={() => handleMonthChange("prev")}>
          Previous Month
        </button>
        <button type="button" onClick={() => handleMonthChange("next")}>
          Next Month
        </button>
      </div>
      <StreakCalendar streakData={streakData} year={currentYear} month={currentMonth} />
    </div>
        </div>
        <div className="side-wrapper">
          <div style={{ padding: "20px" }}>
            <div className="project-title">Activity heatmap · ~12 months</div>
            <p className="profile-muted">Completed Tracker check-ins only (Yoga, Meditation, Diet, Creative Hub). This browser only.</p>
            <ActivityHeatmap eventsByDay={eventsByDay} months={12} />
          </div>
        </div>
        <div className="side-wrapper">
          <div style={{ padding: "20px" }}>
            <div className="project-title">Your Analysis · this browser</div>
            <div className="task-status">
              <div className="task-stat">
                <div className="task-number">{activitySummary.activeDays}</div>
                <div className="task-condition">Active days</div>
                <div className="task-tasks">qualifying check-ins</div>
              </div>
              <div className="task-stat">
                <div className="task-number">{activitySummary.perfectDays}</div>
                <div className="task-condition">Perfect 4/4</div>
                <div className="task-tasks">all logged months</div>
              </div>
              <div className="task-stat">
                <div className="task-number">{activitySummary.totalChecks}</div>
                <div className="task-condition">Total check-ins</div>
                <div className="task-tasks">Y/M/E/C combined</div>
              </div>
            </div>
            <p className="profile-muted">
              Activity streak {activitySummary.currentStreak}d · longest {activitySummary.longestStreak}d
              {activitySummary.bestDay ? ` · best ${activitySummary.bestDay} (${activitySummary.bestScore}/4)` : ""}
            </p>
            <BadgesGrid user={user} />
          </div>
        </div>
        <div className="side-wrapper">
          <div style={{ padding: "20px" }}>
            <div className="project-title">Continue Your Journey</div>
            <ContinueJourney summary={activitySummary} />
          </div>
        </div>
        <div className="side-wrapper">
          <div style={{ padding: "20px" }}>
            <div className="project-title">Weekly goals</div>
            <WeeklyGoals user={user} isLoggedIN={isLoggedIN} events={activityEvents} />
          </div>
        </div>
        <div className="side-wrapper">
          <div style={{ padding: "20px" }}>
            <div className="project-title">XP preview</div>
            <XpPreview events={activityEvents} />
          </div>
        </div>
        <div className="side-wrapper">
          <div style={{ padding: "20px" }}>
            <div className="project-title">Insights &amp; recent activity</div>
            <InsightsPanel summary={activitySummary} events={activityEvents} />
          </div>
        </div>
        <div className="side-wrapper">
          <div style={{ padding: "20px" }}>
            <div className="project-title">Preferences</div>
            <ProfilePreferences user={user} />
          </div>
        </div>
      </div>
      <div className="main-area">
        <div className="header">
          <div className="search-bar">
            <input type="text" placeholder="Search..." />
          </div>
          <div className="inbox-calendar" onClick={toggleCalendar} checked={calendarVisible}
              readOnly>
            <input type="checkbox" className="inbox-calendar-checkbox" />
            <div className="toggle-page">
              <span>Appointment</span>
            </div>
            <div className="layer"></div>
          </div>
          <div className="color-menu">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 464.7 464.7"><path d="M446.6 18.1a62 62 0 00-87.6 0L342.3 35a23 23 0 10-32.5 32.5l5.4 5.4-180.6 180.6L71.9 316c-5 5-8 11.6-8.2 18.7l-.2 3.3-2.5 56.7a9.4 9.4 0 009.4 9.8h.4l30-1.3 18.4-.8 8.3-.4a37 37 0 0024.5-10.8l240.9-240.9 4.5 4.6a23 23 0 0032.5 0c9-9 9-23.6 0-32.6l16.7-16.7a62 62 0 000-87.6zm-174 209.2l-84.6 16 138-138 34.4 34.3-87.8 87.7zM64.5 423.9C28.9 423.9 0 433 0 444.3c0 11.3 28.9 20.4 64.5 20.4s64.5-9.1 64.5-20.4C129 433 100 424 64.5 424z"/>
            </svg>
            <input type="color" value={color} className="colorpicker" onChange={handleColorChange} />
          </div>
        </div>
        <div className="main-container">
          <div className={`inbox-container ${calendarVisible ? 'hide' : ''}`}>
            <div className="inbox">
              {INBOX.map((mail) => {
                const isUnread = mail.unread && !readMailIds.includes(mail.id);
                return (
                <div
                  key={mail.id}
                  className={`msg ${selectedMail.includes(mail.id) ? 'selected-bg' : ''} ${openMailId === mail.id ? 'msg-open' : ''} ${isUnread ? 'msg-unread' : ''} anim-y`}
                  onClick={() => openMessage(mail.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') openMessage(mail.id); }}
                  role="button"
                  tabIndex={0}
                  aria-current={openMailId === mail.id}
                >
                  <input
                    type="checkbox"
                    name="msg"
                    id={mail.id}
                    className="mail-choice"
                    checked={selectedMail.includes(mail.id)}
                    onChange={() => handleMailChange(mail.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label htmlFor={mail.id} onClick={(e) => e.stopPropagation()}></label>
                  <div className="msg-content">
                    <div className="msg-title">{mail.subject}</div>
                    <div className="msg-from">{mail.from} · <span className={`msg-tag msg-tag-${mail.tag.toLowerCase()}`}>{mail.tag}</span></div>
                    <div className="msg-date">{mail.time}</div>
                  </div>
                  <Avatar seed={mail.from} look={mail.look} size={40} className="members mail-members" title={mail.from} />
                </div>
                );
              })}
            </div>
            {/* <div className="add-task">
              <button className="add-button">Add task</button>
            </div> */}
            <div className="mail-detail" key={openMail.id}>
    <div className="mail-detail-header">
     <div className="mail-detail-profile">
      <Avatar seed={openMail.from} look={openMail.look} size={44} className="members inbox-detail" title={openMail.from} />
      <div className="mail-detail-name">
        {openMail.from}
        <div className="mail-detail-role">{openMail.role}</div>
      </div>
     </div>
     <div className="mail-icons">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trash-2">
       <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-tag">
       <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01" /></svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-paperclip">
       <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
     </div>
    </div>
    <div className="mail-contents">
     <div className="mail-contents-subject">
      <div className="mail-contents-title">{openMail.subject}</div>
     </div>
     <div className="mail">
      <div className="mail-time">
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-clock">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" /></svg>
       {openMail.date} · {openMail.time} · <span className={`msg-tag msg-tag-${openMail.tag.toLowerCase()}`}>{openMail.tag}</span>
      </div>
      <div className="mail-inside">
        {openMail.body.map((para) => <p key={para}>{para}</p>)}
      </div>
      {openMail.checklist && openMail.checklist.map((item, i) => (
      <div className="mail-checklist" key={item.label}>
       <input type="checkbox" name="msg" id={`${openMail.id}-check-${i}`} className="mail-choice" defaultChecked={item.done} />
       <label htmlFor={`${openMail.id}-check-${i}`}>{item.label}</label>
      </div>
      ))}
      {openMail.attachment && (
      <div className="mail-doc">
       <div className="mail-doc-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="feather feather-file-text">
         <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
         <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
        <div className="mail-doc-detail">
         <div className="mail-doc-name">{openMail.attachment.name}</div>
         <div className="mail-doc-date">added {openMail.attachment.added}</div>
        </div>
       </div>
      </div>
      )}
     </div>
    </div>
    <div className="mail-textarea">
     <input type="text" placeholder="Write a comment..."/>
     <div className="textarea-icons">
      <div className="attach">
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-paperclip">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
      </div>
      <div className="send">
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-send">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
      </div>
     </div>
    </div>
    
   </div>
          </div>
          
   <div className={`calendar-container ${calendarVisible ? 'calendar-show' : ''}`}>
      <div className="calender-tab anim-y">
        <div className="week-month" role="group" aria-label="Calendar view">
          <button
            type="button"
            className={`button${calendarView === 'week' ? ' active' : ''}`}
            aria-pressed={calendarView === 'week'}
            onClick={() => setCalendarView('week')}
          >
            Week
          </button>
          <button
            type="button"
            className={`button button-month${calendarView === 'month' ? ' active' : ''}`}
            aria-pressed={calendarView === 'month'}
            onClick={() => setCalendarView('month')}
          >
            Month
          </button>
        </div>
        <div className="month-change" style={{display:'flex', flexDirection:'row'}}>
          <div>
          <div className="current-month">{CALENDAR_MONTH_LABEL}</div>
          <div className="current-year">{CALENDAR_YEAR_LABEL}</div>
          </div>
          <img alt="" src='https://png.pngtree.com/png-vector/20231017/ourmid/pngtree-fresh-apple-fruit-red-png-image_10203073.png' style={{width:'50px', height:'50px'
          }}></img>
        </div>
        <div className="week-month" role="group" aria-label="Calendar display options">
          <button
            type="button"
            className={`button button-weekends${showWeekends ? ' active' : ''}`}
            aria-pressed={showWeekends}
            onClick={() => setShowWeekends((v) => !v)}
          >
            Weekends
          </button>
          <button className="button button-task active">Cheat Days</button>
        </div>
      </div>
      {calendarView === 'week' && (
        <div
          className="week-pager anim-y"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', paddingBottom: '16px' }}
        >
          <button
            type="button"
            className="button button-weekends"
            disabled={safeWeekIndex === 0}
            onClick={() => setWeekIndex(safeWeekIndex - 1)}
          >
            Previous week
          </button>
          <span aria-live="polite">Week {safeWeekIndex + 1} of {calendarRows.length}</span>
          <button
            type="button"
            className="button button-weekends"
            disabled={safeWeekIndex === calendarRows.length - 1}
            onClick={() => setWeekIndex(safeWeekIndex + 1)}
          >
            Next week
          </button>
        </div>
      )}
      <div className="calendar-wrapper anim-y">
        <div className="calendar" style={calendarGridStyle}>
          {visibleHeaders(showWeekends).map((header) => (
            <div key={header} className="days">{header}</div>
          ))}
          {visibleRows.map((week, wi) =>
            week.map((cell, ci) => {
              const key = `${wi}-${ci}-${cell.day}${cell.adjacent ? '-adj' : ''}`;
              const className = `day${cell.adjacent ? ' not-work' : ''}${cell.tone ? ` ${cell.tone}` : ''}`;
              return (
                <div key={key} className={className}>
                  {cell.day}
                  {cell.hoverTitle && <div className="hover-title">{cell.hoverTitle}</div>}
                  {(cell.details || []).map((detail) => (
                    <div
                      key={detail.text}
                      className={detail.tone ? `project-detail ${detail.tone}` : 'project-detail'}
                    >
                      {detail.text}
                    </div>
                  ))}
                  {cell.check && (
                    <div className="popup-check">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="feather feather-check-square"
                      >
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
        </div>
      </div>
      </div>
      {!isLoggedIN && (
        <div className="profile-bottom-login">
          <Link href="/login">Log in to sync across devices</Link>
          <span> · Guest data stays in this browser and is never merged automatically.</span>
        </div>
      )}
    </div>
  );
};

export default Profile;
