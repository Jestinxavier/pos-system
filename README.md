# St. Xavier Oils POS

A modern Point of Sale web app for St. Xavier Oils, built with React + TypeScript + Firebase.

## Highlights

- Secure login flow with Firebase Authentication
- Fast billing workflow with quantity/weight/price-based cart input
- Multi-method payment support (`cash`, `UPI`, `card`)
- Invoice modal with share and download actions
- Product management with Firestore persistence
- Orders history and dashboard insights
- Responsive UI built with Tailwind + shadcn/ui

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS + shadcn/ui + Radix UI
- Firebase (Auth + Firestore + Hosting)
- React Router + TanStack Query
- Vitest + Playwright (configured)

## Screenshots

### Dashboard

![Dashboard](https://res.cloudinary.com/dtwj3t1s2/image/upload/v1775759977/Screenshot_2026-04-10_at_12.07.29_AM_idcuz0.png)

### Product Ordering (POS)

![Product Ordering Page](https://res.cloudinary.com/dtwj3t1s2/image/upload/v1775759976/Screenshot_2026-04-10_at_12.08.12_AM_olyzsd.png)

### Product Add Page

![Product Add Page](https://res.cloudinary.com/dtwj3t1s2/image/upload/v1775759982/Screenshot_2026-04-10_at_12.08.26_AM_elnail.png)

### Order Listing Page

![Order Listing Page](https://res.cloudinary.com/dtwj3t1s2/image/upload/v1775759972/Screenshot_2026-04-10_at_12.08.34_AM_scqenu.png)

## Project Structure

```txt
src/
  pages/         # Dashboard, POS, Products, Orders, Login
  components/    # Shared UI + POS modals (Invoice, Payment, Keypad)
  lib/           # Firebase setup, auth/data providers, Firestore store API
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill `.env`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_DEBUG_FLOW=false
```

### 3. Enable Firebase Auth

- In Firebase Console, enable `Authentication -> Sign-in method -> Email/Password`.

### 4. Run locally

```bash
npm run dev
```

App runs at `http://localhost:5173`.

## Available Scripts

```bash
npm run dev            # start local dev server
npm run build          # production build
npm run build:dev      # development-mode build
npm run preview        # preview production build locally
npm run lint           # run ESLint
npm run test           # run Vitest once
npm run test:watch     # run Vitest in watch mode
npm run hosting:serve  # start Firebase Hosting emulator
npm run hosting:deploy # build + deploy to Firebase Hosting
```

## Firebase Hosting Deployment

1. Login:

```bash
npx firebase-tools login
```

2. Confirm project mapping in `.firebaserc` (`stxavieroils-pos`).
3. Deploy:

```bash
npm run hosting:deploy
```

## Data Notes

- Firestore collections used:
  - `products`
  - `orders`
- Default products are auto-seeded when `products` is empty.
- `firebase.json` is configured as SPA hosting (`dist` + rewrite all routes to `index.html`).

## Troubleshooting

- Blank page or auth errors: re-check all `VITE_FIREBASE_*` values in `.env`.
- Login works but data fails: verify Firestore is enabled and security rules permit your use case.
- Routing issues on deploy: keep SPA rewrites in `firebase.json`.
