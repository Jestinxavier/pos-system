# St.Xavier Oils POS

## Firebase Auth Setup
1. Create a Firebase project and enable Email/Password sign-in.
2. Copy `.env.example` to `.env` and fill in your Firebase config values.
3. Install dependencies and run the app.

## Firebase Hosting Deploy
1. Login to Firebase CLI:
   `npx firebase-tools login`
2. Verify project mapping in `.firebaserc`:
   `stxavieroils-pos`
3. Build and deploy:
   `npm run hosting:deploy`

## Notes
- `firebase.json` is configured to serve `dist` and rewrite all routes to `index.html` (React Router SPA).
- If you change project ID, update `.firebaserc`.
