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

Enable sync from **Settings → Sync** once a Supabase project is configured.
Sign in on both devices with the same email address. On each device, open the emailed sign-in link in the browser where you requested it. For projects configured to send typed codes, enter the code in Settings instead.
The current deployment uses Supabase's default mailer, which sends only to email addresses on the project's team.
Choose **Import and enable sync** to copy this device's real entries and budget settings after reviewing the preview.
**Enable sync without importing** opens the cloud ledger and keeps the device-only ledger separate.
Sample entries are excluded from imports. Existing cloud records take priority during imports.

Transactions and budget fields sync individually. Edits made during a temporary connection loss are queued in the browser and retry when the tracker reconnects. If both devices change the same budget field, the last change received by the server wins.
Signing out returns to the device-only ledger.

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

1. Create or select a Supabase project. Run [the ledger setup SQL](supabase/schema.sql) in the project's SQL Editor.
2. In Authentication, enable the Email provider and set the published site URL. The default passwordless email template uses a sign-in link.
3. Fill in the project URL, **publishable key**, and published site URL in [sync-config.js](assets/js/sync-config.js). Set `emailMode` to `link` for a link-based deployment. Keep service-role keys and SMTP credentials out of this public repository.
4. To enable typed codes on a free project, configure custom SMTP and set the **Magic Link** email template to include `{{ .Token }}` in place of the confirmation link. Then set `emailMode` to `code`. Custom SMTP also enables delivery to users outside your Supabase project team.
5. Deploy and test on two devices with the same email. Open the cloud ledger without importing on the second device, and check that a new transaction on each device appears on the other.

The database accepts sync requests only from the account that owns the records. The GitHub Pages site can run in device-only mode with an empty sync configuration.

## Project layout

| File | Purpose |
| --- | --- |
| `index.html` | Page markup and external dependencies |
| `assets/css/styles.css` | Custom typography and styles |
| `assets/js/app.js` | Transactions, budgets, charts, CSV export, and browser storage |
| `assets/js/sync.js` | Passwordless sign-in, local change queue, and cloud sync |
| `assets/js/sync-config.js` | Public Supabase connection settings |
| `supabase/schema.sql` | Private database tables and authenticated sync function |
| `manifest.webmanifest` | App name, launch URL, and home-screen install settings |
| `assets/icons/` | PNG app icons for the launcher and home screen |
| `.nojekyll` | Tells GitHub Pages to publish the static files directly |

GitHub Pages deploys from the root of the `main` branch. Asset links are relative so they work locally and under the `/AThoneSaYin/` project URL.
