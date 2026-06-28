// ---------------------------------------------------------------------------
// Firebase setup — READY but NOT yet used by the draft.
//
// The draft runs entirely on in-memory dummy data (see src/context/AppContext).
// When you're ready to go live:
//   1. npm i firebase   (already in package.json)
//   2. Create a Firebase project, enable Email/Password auth + Firestore.
//   3. Fill in .env.local from .env.example (Vercel: add the same as env vars).
//   4. Replace the fake login/sendMessage in AppContext with the calls below.
// ---------------------------------------------------------------------------
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
