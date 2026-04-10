# Berenda — Property Rentals in Addis Ababa

Berenda is a full-stack property rental marketplace built for Ethiopia. Guests can discover and book rental properties across Addis Ababa, while hosts can list, manage, and earn from their spaces. The platform supports both English and Amharic (አማርኛ) with Ethiopian calendar integration.

**Live site:** [berenda.vercel.app](https://berenda.vercel.app)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js / Express (hosted on Render) |
| Payments | Chapa (Telebirr, CBE Birr, Card) |
| Maps | Leaflet + OpenStreetMap |
| Auth | JWT + Google OAuth |
| Deployment | Vercel (frontend) · Render (backend) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/NahomBrook/berenda-frontend.git
cd berenda-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `https://your-backend.onrender.com/api`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `NEXT_PUBLIC_CHAPA_PUBLIC_KEY` | Chapa payment public key |

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import this repo.
3. Under **Environment Variables**, add the three variables above.
4. Click **Deploy**.

Vercel auto-detects Next.js and handles all build configuration. Future pushes to `main` deploy automatically.

### Manual build

```bash
npm run build   # produces .next/
npm start       # serves the production build
```

---

## Project Structure

```
src/
├── app/                   # Next.js App Router pages
│   ├── page.tsx           # Home (property listing)
│   ├── listings/[id]/     # Property detail & booking
│   ├── auth/              # Login & Register
│   ├── profile/           # User dashboard
│   ├── properties/host/   # Host a property
│   ├── admin/             # Admin dashboard
│   ├── chat/              # Messaging
│   ├── payment/           # Payment flow
│   └── terms/             # Terms & Conditions
├── components/
│   ├── layout/Navbar.tsx
│   ├── home/SearchBar.tsx
│   ├── FilterModal.tsx
│   └── DateRangePicker.tsx  # Gregorian + Ethiopian calendar
├── context/
│   └── LanguageContext.tsx  # En/Am language switching
├── services/
│   └── api.ts             # Axios client (auto-retry on cold start)
├── utils/
│   └── translations.ts    # All UI strings in English & Amharic
└── types/
    └── property.ts
```

---

## Features

- **Bilingual** — full English and Amharic UI, persisted across sessions
- **Ethiopian calendar** — date picker supports both Gregorian and Ethiopian calendars
- **Map-based hosting** — hosts pin their property on an interactive map
- **Real-time notifications** — booking alerts with mark-as-read
- **Admin dashboard** — manage users, properties, and bookings
- **Chapa payments** — local Ethiopian payment methods
- **Cold-start resilience** — axios auto-retries on Render free-tier timeouts

---

## Author

**Nahom** — [GitHub](https://github.com/NahomBrook)

Contact: [berenda@gmail.com](mailto:berenda@gmail.com)
