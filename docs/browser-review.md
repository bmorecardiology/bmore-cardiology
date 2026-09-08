# Browser review on the Mac mini

The local static checks and 10 tracker regression tests passed during implementation. All six handouts were rendered and visually inspected; each is one page. A browser executable was unavailable in the implementation environment, and browser installation was blocked by its network policy. The browser automation below has been syntax-checked but has not been executed there.

## Prepare a separate checkout

From the existing repository on the Mac, fetch the new branch and create a worktree in a new directory. If that directory already exists, choose another unused path.

```sh
git fetch origin
git worktree add ../bmore-cardiology-education-review origin/patient-education-and-tracker-update
cd ../bmore-cardiology-education-review
python3 -m http.server 8000
```

If port 8000 is already in use, use an available port and set `SITE_URL` below accordingly. Keep the server running. In a second terminal in this worktree:

```sh
python3 scripts/check_site.py
node --test qa/tracker.test.cjs
npm install
npx playwright install chromium webkit
export SITE_PASSWORD='enter the existing site password here'
npm run check:browser
BROWSER=webkit npm run check:browser
```

The browser check defaults to `http://127.0.0.1:8000`, accepts `SITE_URL` for another local port, and refuses a remote hostname. It creates a fresh browser profile with synthetic readings. It does not access the readings in your normal browser profile.

## What the automated browser check covers

It checks all 25 pages at widths of 390, 900 and 1365 pixels: navigation, images, horizontal overflow, active states, menu expansion and Escape. It also checks a wrong password followed by successful unlocking, click-outside closing, link-click closing and the keyboard skip link.

Tracker scenarios cover the original stored-data format, weight-only and BP-only entries, reload persistence, person filtering, invalid partial BP, charts and averages, a simulated storage-write failure, CSV export, print styling, deletion, safe rendering of names, and preserving/backup of malformed data.

Screenshots and sample exports appear in `browser-artifacts/<browser>/`. Chromium also produces a tracker print PDF. Inspect these results; a passing script does not evaluate visual quality or medical accuracy.

## Human browser checks

1. Open the home page, an article, each test guide and the tracker in Safari and Chrome. Confirm readable text, comfortable spacing, accessible buttons and no clipped navigation at desktop and mobile widths, including a narrow 320-pixel view and 200% zoom.
2. Navigate using only Tab, Shift+Tab, Enter and Escape. The skip link should move to main content. Menu links should be reachable when expanded and absent from the tab order when collapsed.
3. Download every test summary and the BP log. Check print preview and an actual printout at 100% scale. Print a guide and tracker view; selected person and dates should be clear and measurements should not be clipped.
4. On an actual iPhone and Android device, test the menu, date/time and numeric keyboards, adding/deleting fictional readings, downloads, rotation and zoom. WebKit automation is useful but is not an actual iPhone test.
5. Confirm the tracker notice is understandable: saving does not contact the clinician, data stays in this browser, and clearing browser data removes it. Keep testing separate from any real patient record.
6. Have Dr. Pollock review the clinical changes using `docs/clinical-review.md`, especially BP instructions, SAMSON, CAC/aspirin and test preparation. Review the voice of the proposed notes and video scripts.

Record the tested commit, browsers/devices, pass/fail results and screenshots in the PR review. After approval and merge, verify GitHub Pages deployment and check the main navigation, one PDF download and the tracker on the live site.
