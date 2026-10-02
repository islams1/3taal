# عتال — Workout Plan

Training site for Shady Tarek's coaching clients: the weekly workout split, per-exercise tracking, and a weekly check-in.

- **Landing** — animated «عتال» logo with the five training days and a *Weekly check-in* button.
- **Day popups** — each exercise with sets, reps, RIR, rest and a video link, plus tracking: previous weight (read back from Google Sheets), current weight, sets done, failure, and a commitment ring.
- **Weekly check-in** — weight, 10 questions and progress photos; saved to Google Sheets / Drive, then sent to the coach on WhatsApp.

Built with React + TypeScript + Vite.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production files in dist/
```

## Google Sheets backend

Data goes to a Google Sheet through a small Apps Script web app.

1. Open the spreadsheet → **Extensions → Apps Script**, paste [`google-apps-script/Code.gs`](google-apps-script/Code.gs), save.
2. **Deploy → New deployment → Web app** — Execute as: *Me*, Who has access: *Anyone*.
3. Copy `.env.example` to `.env.local` and set `VITE_SHEET_URL` to the `/exec` URL.

After changing `Code.gs`: **Deploy → Manage deployments → ✏️ → New version**.

## Where things live

| Path | What |
| --- | --- |
| `src/data/plan.ts` | Days, exercises, sets, reps and video links |
| `src/data/checkin.ts` | Weekly check-in questions |
| `src/lib/whatsapp.ts` | Coach's WhatsApp number and message format |
| `src/index.css` | Styles and colour themes (`data-theme` in `index.html`: `cyan`, `green`, `orange`) |
| `google-apps-script/Code.gs` | Sheet / Drive backend |
