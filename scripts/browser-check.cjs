// Browser checks (PRD 22.4): axe on every route, 320 px reflow at 100% and
// 200% text with high contrast, raw i18n keys, console and CSP errors,
// Hindi, demo labels and the 2-tap onboarding path.
//
// Usage: build with NEXT_PUBLIC_DEMO_MODE=true, start the server, then
//   CHROME_PATH="/path/to/chrome" BASE=http://localhost:3000 npm run check:browser
// Screenshots and results go to .checks/ (git-ignored).
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const BASE = process.env.BASE || 'http://localhost:3000';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = path.join(__dirname, '..', '.checks');
fs.mkdirSync(OUT, { recursive: true });
const DEMO = process.env.DEMO || 'lucknow-heatwave';
const PAGES = ['/', '/alerts', '/onboarding', '/forecast', '/settings', '/health', '/run', '/coast', '/travel', '/family', '/farm', '/commute', '/events', '/work', '/household', '/reports', '/report', '/sky-snap', '/map', '/ready', '/learn', '/learn/lightning', '/learn/how-it-works', '/about', '/help', '/feedback', '/contact', '/sitemap', '/accessibility', '/screen-reader-access', '/policies', '/policies/privacy', '/policies/disclaimer', '/offline'];
const results = { axe: {}, overflow: {}, consoleErrors: {}, rawKeys: {}, checks: [] };

async function seed(context, extra = {}) {
  await context.addInitScript((extra) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('mausam.onboarding.v1', JSON.stringify({ completedAt: new Date().toISOString(), version: 1 }));
    for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  }, extra);
}

async function settle(page) {
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForTimeout(1500);
}

async function rawKeys(page) {
  // Untranslated i18n keys render as dotted identifiers like "widgets.aqi.title".
  return page.evaluate(() => {
    const txt = document.body.innerText;
    const m = txt.match(/\b(cards|alerts|widgets|home|now|common|places|settings|topbar|onboarding|household|health|run|coast|travel|family|farm|commute|events|work|persona|forecast|charts|rules|verdicts|levels|hazards|gov|units|gigw|policies|learn|ready|map|mitra|reports|cv|pwa|footer|nav|pages)\.[a-zA-Z_]+(\.[a-zA-Z0-9_]+)*\b/g) || [];
    return [...new Set(m.filter((x) => !/\.(gov|in|com|org|nic)\b/.test(x) && !/^(mausam|www)\./.test(x)))];
  });
}

async function overflow(page) {
  return page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const over = document.documentElement.scrollWidth > w + 1;
    const culprits = over
      ? [...document.querySelectorAll('body *')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            if (r.right <= w + 1 || r.width === 0) return false;
            for (let p = el.parentElement; p; p = p.parentElement) {
              const o = getComputedStyle(p).overflowX;
              if (o === 'auto' || o === 'scroll' || o === 'hidden') return false;
            }
            return true;
          })
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 2).join('.')} → ${Math.round(el.getBoundingClientRect().right)}`)
      : [];
    return { over, scrollWidth: document.documentElement.scrollWidth, culprits };
  });
}

(async () => {
  const t0 = Date.now();
  const log = (m) => process.env.VERBOSE && console.log(`[${Math.round((Date.now() - t0) / 1000)}s] ${m}`);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });

  // 1. Axe + raw keys + console errors, desktop, demo scenario.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await seed(context, { 'mausam.demo.v1': { scenario: DEMO } });
    for (const path of PAGES) {
      const page = await context.newPage();
      const errs = [];
      page.on('console', (m) => (m.type() === 'error' || /Refused to/.test(m.text())) && errs.push(m.text().slice(0, 200)));
      page.on('pageerror', (e) => errs.push('pageerror: ' + e.message.slice(0, 200)));
      await page.goto(BASE + path + (path.includes('?') ? '&' : '?') + 'demo=' + DEMO);
      await settle(page);
      await page.addScriptTag({ content: AXE });
      const v = await page.evaluate(async () => {
        const r = await window.axe.run(document, { resultTypes: ['violations'] });
        return r.violations.filter((x) => ['serious', 'critical'].includes(x.impact)).map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.length, target: x.nodes.slice(0, 3).map((n) => n.target.join(' ')), summary: x.nodes[0]?.failureSummary?.slice(0, 160) }));
      });
      results.axe[path] = v;
      results.rawKeys[path] = await rawKeys(page);
      results.consoleErrors[path] = errs;
      log('axe ' + path);
      await page.close();
    }
    await context.close();
  }

  // 2. 320px reflow at 100% and at 200% text with high contrast.
  for (const [label, a11y] of [['320', null], ['320-200%-hc', { textScale: 200, contrast: true, simple: false, reduceMotion: false, lite: null, speechRate: 1 }]]) {
    const context = await browser.newContext({ viewport: { width: 320, height: 720 } });
    await seed(context, { 'mausam.demo.v1': { scenario: DEMO }, ...(a11y ? { 'mausam.a11y.v1': a11y } : {}) });
    for (const path of PAGES) {
      const page = await context.newPage();
      await page.goto(BASE + path + '?demo=' + DEMO);
      await settle(page);
      const o = await overflow(page);
      if (o.over) results.overflow[`${label} ${path}`] = o;
      if (a11y && path === '/') {
        const cls = await page.evaluate(() => document.documentElement.className);
        results.checks.push({ name: 'text 200% + high contrast classes on <html>', ok: /ms-text-200/.test(cls) && /ms-hc/.test(cls), detail: cls });
        await page.screenshot({ path: OUT + '/shot-home-320-200-hc.png', fullPage: false });
      }
      if (!a11y && path === '/') await page.screenshot({ path: OUT + '/shot-home-320.png', fullPage: true });
      await page.close();
    }
    await context.close();
  }

  // 3. Hindi.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await seed(context, { 'mausam.demo.v1': { scenario: DEMO }, 'mausam.lang.v1': 'hi' });
    for (const path of ['/', '/alerts', '/settings', '/work']) {
      const page = await context.newPage();
      await page.goto(BASE + path + '?demo=' + DEMO);
      await settle(page);
      const r = await page.evaluate(() => {
        const t = document.querySelector('main')?.innerText || '';
        const dev = (t.match(/[ऀ-ॿ]/g) || []).length;
        const latinWords = (t.match(/\b[A-Za-z]{5,}\b/g) || []);
        return { lang: document.documentElement.lang, dev, latin: latinWords.length, sampleLatin: [...new Set(latinWords)].slice(0, 25) };
      });
      results.checks.push({ name: `Hindi ${path}`, ok: r.dev > 200, detail: r });
      results.rawKeys['hi ' + path] = await rawKeys(page);
      if (path === '/') await page.screenshot({ path: OUT + '/shot-home-hi.png', fullPage: false });
      await page.close();
    }
    await context.close();
  }

  // 4. Demo label present on home.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await seed(context, { 'mausam.demo.v1': { scenario: 'mumbai-monsoon-red' } });
    const page = await context.newPage();
    await page.goto(BASE + '/?demo=mumbai-monsoon-red');
    await settle(page);
    const txt = await page.evaluate(() => document.body.innerText);
    results.checks.push({ name: 'demo scenario shows "Demo data"', ok: /Demo data/i.test(txt), detail: txt.slice(0, 300) });
    results.checks.push({ name: 'Red scenario shows alert ribbon', ok: await page.locator('.ms-ribbon, [class*="ribbon"]').count() > 0 });
    await page.screenshot({ path: OUT + '/shot-home-mumbai.png', fullPage: true });
    await context.close();
  }

  // 5. Onboarding 2-tap path from a fresh phone.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(BASE + '/');
    await page.waitForURL(/\/onboarding/, { timeout: 10000 }).catch(() => {});
    const redirected = page.url().includes('/onboarding');
    await page.getByRole('button', { name: /Use New Delhi for now/i }).click();
    await page.getByRole('button', { name: /Skip, show me the weather/i }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/onboarding'), { timeout: 10000 }).catch(() => {});
    await settle(page);
    const url = page.url();
    const has = await page.evaluate(() => !!document.querySelector('main') && /Delhi/.test(document.querySelector('main').innerText));
    results.checks.push({ name: 'onboarding: redirect, 2 taps to home with Delhi', ok: redirected && !url.includes('/onboarding') && has, detail: { redirected, url } });
    await context.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  const axeCount = Object.values(results.axe).reduce((s, v) => s + v.length, 0);
  console.log('axe serious/critical:', axeCount);
  for (const [p, v] of Object.entries(results.axe)) if (v.length) console.log(' ', p, JSON.stringify(v));
  console.log('overflow:', Object.keys(results.overflow).length);
  for (const [p, v] of Object.entries(results.overflow)) console.log(' ', p, v.scrollWidth, v.culprits.join(' | '));
  for (const [p, v] of Object.entries(results.rawKeys)) if (v.length) console.log('rawKeys', p, v.join(', '));
  for (const [p, v] of Object.entries(results.consoleErrors)) if (v.length) console.log('console', p, v.slice(0, 3).join(' || '));
  for (const c of results.checks) console.log(c.ok ? 'PASS' : 'FAIL', c.name, c.ok ? '' : JSON.stringify(c.detail).slice(0, 400));
  const failed = Object.values(results.axe).some((v) => v.length) || Object.keys(results.overflow).length > 0 || Object.values(results.rawKeys).some((v) => v.length) || Object.values(results.consoleErrors).some((v) => v.length) || results.checks.some((c) => !c.ok);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
