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

The tracker opens with sample entries in a fresh browser profile. To start with an empty log, open **Settings → Data Management → Clear All Entries** and confirm. **Load Sample Data** replaces your current entries and budget settings with the sample defaults.

Changes are saved in your browser's local storage for the site address you use. Entries stay in that browser profile. A different browser, device, or site address has its own storage, and clearing site data erases locally saved entries. The CSV export lets you keep a spreadsheet copy of your transactions.

## Run locally

Clone the repository and serve it from its root. With Python 3 installed, run:

```sh
git clone https://github.com/phyothurawin/AThoneSaYin.git
cd AThoneSaYin
python -m http.server 8000
```

Open [http://localhost:8000/](http://localhost:8000/). The app runs without a build step. Internet access is used to load Tailwind CSS, Chart.js, and Google Fonts.

## Project layout

| File | Purpose |
| --- | --- |
| `index.html` | Page markup and external dependencies |
| `assets/css/styles.css` | Custom typography and styles |
| `assets/js/app.js` | Transactions, budgets, charts, CSV export, and browser storage |
| `manifest.webmanifest` | App name, launch URL, and home-screen install settings |
| `assets/icons/` | PNG app icons for the launcher and home screen |
| `.nojekyll` | Tells GitHub Pages to publish the static files directly |

GitHub Pages deploys from the root of the `main` branch. Asset links are relative so they work locally and under the `/AThoneSaYin/` project URL.
