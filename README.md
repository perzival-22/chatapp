# QuickChat

A real-time chat app: **React (Vite) + Tailwind CSS v4**, with **Firebase** (Auth + Firestore) planned for the live layer, deployed on **Vercel**.

> **Current status: DRAFT.** The UI is complete and clickable, running on in-memory dummy data. Firebase is scaffolded but not yet wired in. See *Going live* below.

## Run locally

```bash
npm install
npm run dev
```

Open the printed URL (default http://localhost:5173). The app starts on the **Login** screen, tick the agree box and hit *Login now* (no credentials needed in the draft) to enter the chat.

```bash
npm run build     # production build into dist/
npm run preview   # preview the production build
```

## What works in the draft

- **Login / Sign-up** screen (toggle between modes). Fake auth, lands you in the app.
- **Chat** screen: searchable conversation list, switch chats, send text messages, attach an image (local preview), unread badges, online dots, auto-scroll.
- **Right panel**: contact info, shared media, last-seen.
- **Profile** screen: edit name, bio, avatar with live preview.

All state lives in `src/context/AppContext.jsx`. Switching to real data means changing that one file, the screens don't change.

## Project structure

```
assets/                 # provided images + assets.js
src/
  context/AppContext.jsx  # all app state (the ONE file to swap for Firebase)
  data/dummyData.js       # in-memory users/chats; shapes mirror Firestore
  pages/                  # Login, Chat, Profile
  components/             # Sidebar, ChatBox, RightSidebar
  lib/firebase.js         # Firebase init — READY, not yet imported
  lib/time.js             # time formatting helpers
```

## Going live (Firebase)

1. Create a Firebase project; enable **Email/Password** auth and **Cloud Firestore**.
2. Copy `.env.example` → `.env.local` and fill in your web-app config.
3. In `AppContext.jsx`, replace the fake functions with their Firebase versions:
   - `login` / `logout` → `signInWithEmailAndPassword` / `signOut`; track the user with `onAuthStateChanged`.
   - `chats` → an `onSnapshot` listener on the `chats` collection.
   - `sendMessage` → `addDoc` into `chats/{id}/messages`; for images, upload to Storage first and store the download URL.

### Firestore schema (already matched by the dummy data)

```
users/{uid}      { uid, name, email, bio, avatar, lastSeen }
chats/{chatId}   { participants: [uid], updatedAt }
chats/{chatId}/messages/{msgId}   { senderId, text, image, createdAt }
```

Lock it down with Security Rules so users only read/write chats they're a participant of. Firebase web API keys are *not* secrets, rules are your real protection.

## Deploy to Vercel

1. Push to GitHub and import the repo in Vercel (framework preset: **Vite**).
2. Add the `VITE_FIREBASE_*` variables under **Settings → Environment Variables**.
3. `vercel.json` already rewrites all routes to `/` so React Router deep links work.
4. In the Firebase console, add your Vercel domain under **Auth → Settings → Authorized domains**.

## Notes

- This is a React SPA + Firebase, not a traditional full-stack app, Firebase *is* the backend, so there's no server to run or deploy.
- The provided images are from a chat-app asset pack; the draft uses them for branding and avatars.
