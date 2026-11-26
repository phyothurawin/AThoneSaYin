# AThoneSaYin (အသုံးစာရင်း)

A Burmese-language expense and savings tracker for recording income and expenses, setting monthly budgets, and seeing where your money goes. It uses Myanmar kyat (Ks) by default.

**[Open the live tracker](https://phyothurawin.github.io/AThoneSaYin/)**

## Install on your phone

Open the live tracker in your phone's browser.

- **Android (Chrome)** — Open the three-dot menu, choose **Install and create shortcut** (or **Add to Home screen**, depending on your Chrome version), then tap **Install**.
- **iPhone (Safari)** — Open **Share → Add to Home Screen**, enable **Open as Web App** if shown, and tap **Add**.

## Features

- Log income and expenses and filter expenses by category.
- Set a monthly budget and spending limits for each category.
- See monthly totals, your remaining balance, category charts, and a six-month spending trend.
- Review suggestions for categories where you could cut spending.
- Export all recorded income and expenses as CSV from Settings (ဆက်တင်).

## Your data

### Optional cloud sync

Open **Settings → Sync → Create sync code** on the first device, then save the displayed code somewhere private.
Review the import preview to choose whether to copy this device's real entries and budget settings. Sample entries are excluded and existing cloud records take priority during imports.
On the second device, enter the same code in **Settings → Sync → Link this device**, then choose whether to import entries from that device or open the cloud ledger.

Anyone who has the code can open the ledger. Keep it private, and save it before leaving the setup screen. Disconnecting returns to the device-only ledger without deleting cloud records. Reconnect with the same code.

Transactions and budget fields sync individually. Edits made during a temporary connection loss are queued in the browser and retry when the tracker reconnects. If both devices change the same budget field, the last change received by the server wins.

### Device-only mode

The tracker opens with sample entries in a fresh browser profile. To start with an empty log, open **Settings → Data Management → Clear All Entries** and confirm. **Load Sample Data** replaces your current entries and budget settings with the sample defaults.

In device-only mode, changes are saved in your browser's local storage for the site address you use. Entries stay in that browser profile. A different browser, device, or site address has its own storage, and clearing site data erases locally saved entries. The CSV export lets you keep a spreadsheet copy of your transactions.

## Run locally

Clone the repository and serve it from its root. With Python 3 installed, run:

```sh
git clone https://github.com/phyothurawin/AThoneSaYin.git
cd AThoneSaYin
python -m http.server 8000
```

Open [http://localhost:8000/](http://localhost:8000/). The app runs without a build step. Internet access is used to load Tailwind CSS, Chart.js, and Google Fonts.

## Configure cloud sync

1. In the Supabase SQL Editor, run [the ledger setup SQL](supabase/schema.sql), then [the device pairing migration](supabase/pairing.sql).
2. Enable **Allow anonymous sign-ins** under Authentication. Supabase creates a separate authenticated session for each browser without asking for an email address.
3. Fill in the project URL and **publishable key** in [sync-config.js](assets/js/sync-config.js). Keep service-role keys out of this public repository.
4. Deploy. Create a sync code on the first device and test linking the second device in its own browser profile.

The database accepts ledger requests only from the ledger owner and devices that present its code during pairing. The website can run in device-only mode with an empty sync configuration.nly from the account that owns the records. The GitHub Pages site can run in device-only mode with an empty sync configuration.

## Project layout

| File | Purpose |
| --- | --- |
| `index.html` | Page markup and external dependencies |
| `assets/css/styles.css` | Custom typography and styles |
| `assets/js/app.js` | Transactions, budgets, charts, CSV export, and browser storage |
| `assets/js/sync.js` | Device pairing, local change queue, and cloud sync |
| `assets/js/sync-config.js` | Public Supabase connection settings |
| `supabase/schema.sql` | Private database tables and authenticated sync function |
| `supabase/pairing.sql` | Device pairing and scoped ledger access |
| `manifest.webmanifest` | App name, launch URL, and home-screen install settings |
| `assets/icons/` | PNG app icons for the launcher and home screen |
| `.nojekyll` | Tells GitHub Pages to publish the static files directly |

GitHub Pages deploys from the root of the `main` branch. Asset links are relative so they work locally and under the `/AThoneSaYin/` project URL.
