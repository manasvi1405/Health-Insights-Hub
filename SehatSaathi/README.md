# SehatSaathi

A mobile-first health companion web app for elderly users in India.

Built with **plain HTML, CSS, and JavaScript** on the frontend and **Node.js + Express + MongoDB** on the backend. No frameworks, no build step.

---

## Features

- **Phone OTP login** — sign in using your mobile number (test login bundled for development).
- **AI Scanner** — take a photo of a medicine, prescription, or lab report and get a plain-language explanation from Google Gemini.
- **Voice readout (Listen button)** — every AI explanation can be read aloud in your language.
- **Multi-language support** — English, Hindi, Marathi, Tamil, Bengali. Whole UI re-translates instantly.
- **Medicine reminders** — track medicines, dosage, frequency, and stock count with low-stock alerts.
- **Emergency SOS** — one tap sends your live GPS location to your saved emergency contacts.
- **Profile & emergency contacts** — manage personal info and trusted people to alert.
- **MongoDB persistence** — every user, reminder, scan, and contact is stored in MongoDB.

---

## Folder structure

```
SehatSaathi/
├── README.md              ← this file
├── package.json           ← Node dependencies
├── .env.example           ← copy to .env and fill in your secrets
├── .gitignore
├── server.js              ← single Express server (API + static frontend)
│
└── public/                ← everything served to the browser
    ├── index.html         ← login page (the home page when not signed in)
    ├── language.html      ← language picker
    ├── home.html          ← dashboard (greeting + due meds + recent scans)
    ├── scan.html          ← AI scanner (medicine/prescription/report)
    ├── reminders.html     ← medicine reminders list + add
    ├── profile.html       ← user profile + contacts + language
    ├── sos.html           ← emergency SOS button
    │
    ├── css/
    │   └── style.css      ← all styling, mobile-first 390px width
    │
    └── js/
        ├── api.js         ← tiny fetch wrapper that adds your auth token
        ├── auth.js        ← token/user storage + login guard + logout
        ├── i18n.js        ← translations for all 5 languages
        ├── speak.js       ← text-to-speech using the browser's voice
        ├── layout.js      ← injects the shared header + bottom nav + SOS button
        ├── login.js       ← phone OTP flow
        ├── home.js        ← dashboard rendering
        ├── scan.js        ← scan flow (camera, upload, AI result, listen)
        ├── reminders.js   ← reminders list + add/take/delete
        ├── profile.js     ← profile editing + contacts
        └── sos.js         ← geolocation + SOS API
```

Everything is cleanly separated so you can read one file at a time.

---

## How to run

### 1. Install Node.js
You need Node.js 18 or newer. Download from <https://nodejs.org>.

### 2. Install dependencies
Open a terminal in the `SehatSaathi` folder and run:

```bash
npm install
```

### 3. Set up your secrets
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then open `.env` in any text editor and fill in:

| Variable | What to put |
|---|---|
| `MONGODB_URI` | Your MongoDB connection string. Free tier: create a cluster at <https://www.mongodb.com/cloud/atlas>, click **Connect** → **Drivers** → copy the connection string. |
| `SESSION_SECRET` | Any long random string (used to sign login tokens). E.g. `xY9k!23qW8s_random_string_here`. |
| `GEMINI_API_KEY` | Free Google Gemini API key from <https://aistudio.google.com/apikey>. Needed for the AI scanner. |
| `PORT` | The port to run on. Default `3000`. |

### 4. Start the server
```bash
npm start
```

Then open <http://localhost:3000> in your browser.

> Tip: Use Chrome's device toolbar (F12 → toggle device toolbar) and pick "iPhone 12 Pro" or any phone size for the proper mobile look.

---

## Test login (development only)

For testing without sending real SMS, use:

- **Mobile:** `8446530525`
- **OTP:** `123456`

Any other phone number will generate a random 6-digit OTP that gets printed to the **server console** (since real SMS sending is not configured by default).

---

## How the data flows

```
┌──────────────────────┐       HTTPS /api/*      ┌───────────────────┐       ┌──────────┐
│  Browser (HTML/JS)   │ ◀──────────────────────▶│  Express server   │ ◀────▶│ MongoDB  │
│  + LocalStorage      │     JSON, JWT token     │  (server.js)      │       │  Atlas   │
└──────────────────────┘                          └─────────┬─────────┘       └──────────┘
                                                            │
                                                            ▼
                                                  ┌────────────────────┐
                                                  │  Google Gemini AI  │
                                                  │  (image analysis)  │
                                                  └────────────────────┘
```

- The browser stores your **JWT token** and chosen **language** in `localStorage` (key names: `sehat_token`, `sehat_user`, `sehat_lang`).
- Every API request adds the token in the `Authorization: Bearer <token>` header.
- The Express server verifies the token, queries MongoDB, and returns JSON.
- For scanning, the image is base64-encoded and sent to Google Gemini, which returns a plain-language explanation in the user's chosen language.

---

## API endpoints (quick reference)

| Method | Path                         | Purpose                                  |
|--------|------------------------------|------------------------------------------|
| POST   | /api/auth/send-otp           | Send a 6-digit OTP to a phone number     |
| POST   | /api/auth/verify-otp         | Verify OTP, returns JWT token            |
| GET    | /api/users/me                | Current user profile                     |
| PUT    | /api/users/me                | Update profile (name, age, language…)    |
| GET    | /api/reminders               | List all medicine reminders              |
| POST   | /api/reminders               | Create a new reminder                    |
| PUT    | /api/reminders/:id           | Update a reminder                        |
| DELETE | /api/reminders/:id           | Delete a reminder                        |
| POST   | /api/reminders/:id/taken     | Mark medicine as taken (decrements stock)|
| GET    | /api/scans                   | Last 20 scans                            |
| POST   | /api/scans                   | Send image to AI for analysis            |
| GET    | /api/contacts                | Emergency contacts                       |
| POST   | /api/contacts                | Add an emergency contact                 |
| DELETE | /api/contacts/:id            | Delete an emergency contact              |
| POST   | /api/sos                     | Send SOS alert with GPS location         |
| GET    | /api/home/summary            | Greeting + due meds + low stock + scans  |

All endpoints (except `/api/auth/*`) require the `Authorization: Bearer <token>` header.

---

## MongoDB collections

The server creates these automatically the first time you use the app:

- **users** — `{ name, phone, age, language, bloodGroup, address, ... }`
- **reminders** — `{ userId, medName, dosage, frequency, times, stockCount, autoReminder }`
- **scans** — `{ userId, type, aiInsight, summary, createdAt }`
- **contacts** — `{ userId, name, phone, relation, isPrimary }`

You can browse them in MongoDB Atlas → **Browse Collections**, or with [MongoDB Compass](https://www.mongodb.com/products/tools/compass).

---

## Customising

- **Change theme color** — edit the `--primary` CSS variable at the top of `public/css/style.css`.
- **Add a new language** — add entries to the `TRANSLATIONS` map in `public/js/i18n.js`, add the language to the picker in `public/language.html` and `public/profile.html`, and add a speech-synthesis code in `public/js/speak.js`.
- **Send real SMS** — wire a provider like Twilio inside `app.post("/api/auth/send-otp", …)` in `server.js`.
- **Send SOS via SMS** — same idea — extend `app.post("/api/sos", …)` to actually message each contact.

---

## License

Personal/educational use. Adapt freely.
