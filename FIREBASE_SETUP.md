# QuickChat → Firebase + Vercel: Step-by-Step

This turns the dummy-data draft into a real, deployable app. Work through the phases **in order**. Each code block says exactly which file to edit and what to replace.

Estimated time: 60–90 min the first time.

---

## Phase 0 — Prerequisites

- Node 18+ installed (`node -v`).
- A Google account (for Firebase) and a GitHub account (for Vercel).
- Run the draft once to confirm it works: `npm install && npm run dev`.

---

## Phase 1 — Create the Firebase project

1. Go to <https://console.firebase.google.com> → **Add project**. Name it `quickchat` (or anything). You can disable Google Analytics.
2. When the project opens, click the **`</>` (Web)** icon to "Add an app to get started".
3. Register the app (nickname `quickchat-web`). **Do not** check "Firebase Hosting", you're using Vercel.
4. Firebase shows a `firebaseConfig` object. Leave this tab open, you'll copy these values in Phase 3.

### Enable Authentication
5. Left sidebar → **Build → Authentication → Get started**.
6. **Sign-in method** tab → **Email/Password** → toggle **Enable** → Save.

### Enable Firestore
7. Left sidebar → **Build → Firestore Database → Create database**.
8. Choose a location close to you. Start in **Production mode** (you'll paste rules in Phase 7).

### Enable Storage (for image/avatar uploads)
9. Left sidebar → **Build → Storage → Get started**. Accept the default rules for now (you'll harden them in Phase 7).

---

## Phase 2 — The data model

You don't create these by hand; the code writes them. This is just so you understand what you're building.

```
users/{uid}
  { uid, name, email, bio, avatar, lastSeen }

chats/{chatId}                       chatId = the two uids sorted + joined, e.g. "u_a_u_b"
  { participants: [uidA, uidB],
    participantInfo: { uidA: {name, avatar}, uidB: {name, avatar} },  // denormalized for fast list rendering
    lastMessage: string,
    lastMessageAt: Timestamp }

chats/{chatId}/messages/{msgId}
  { senderId, text, image, createdAt: Timestamp }
```

Why `participantInfo` is duplicated onto the chat doc: it lets the conversation list render names/avatars without a separate read per chat. Standard chat-app denormalization.

---

## Phase 3 — Add your keys

1. Copy `.env.example` to a new file named **`.env.local`** in the project root.
2. Fill each value from the `firebaseConfig` object in your Firebase tab:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=quickchat-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=quickchat-xxxx
VITE_FIREBASE_STORAGE_BUCKET=quickchat-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
```

`.env.local` is already git-ignored. These keys are **not secrets** (they ship to the browser); your protection is the Security Rules in Phase 7. Restart `npm run dev` after creating this file, Vite only reads env vars at startup.

> `src/lib/firebase.js` already reads these. No change needed there.

---

## Phase 4 — Rewrite the state layer (`src/context/AppContext.jsx`)

This is the core change. **Replace the entire file** with the version below. The public API (`user`, `chats`, `sendMessage`, etc.) stays the same, so most components barely change. New additions: `signup`, `findUser`, `allUsers`, `startChat`, `authReady`.

```jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  addDoc, collection, doc, getDoc, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { auth, db, storage } from '../lib/firebase.js'
import assets from '../../assets/assets.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)         // current user's Firestore profile
  const [authReady, setAuthReady] = useState(false)
  const [allUsers, setAllUsers] = useState([])   // everyone (to start new chats)
  const [chats, setChats] = useState([])
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [messages, setMessages] = useState([])

  const isAuthed = !!user

  // --- Auth: keep the profile in sync with Firebase Auth -------------------
  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const snap = await getDoc(doc(db, 'users', fbUser.uid))
        setUser(snap.exists() ? snap.data() : null)
      } else {
        setUser(null)
      }
      setAuthReady(true)
    })
  }, [])

  // --- Load all users (for the "start new chat" search) -------------------
  useEffect(() => {
    if (!user) return
    return onSnapshot(collection(db, 'users'), (qs) => {
      setAllUsers(qs.docs.map((d) => d.data()).filter((u) => u.uid !== user.uid))
    })
  }, [user])

  // --- Live conversation list for the current user ------------------------
  useEffect(() => {
    if (!user) { setChats([]); return }
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    )
    return onSnapshot(q, (qs) => {
      setChats(qs.docs.map((d) => {
        const data = d.data()
        const otherId = data.participants.find((id) => id !== user.uid)
        return {
          id: d.id,
          participantId: otherId,
          lastMessage: data.lastMessage || '',
          messages: [], // filled by the message listener when selected
        }
      }))
    })
  }, [user])

  // --- Live messages for the selected chat --------------------------------
  useEffect(() => {
    if (!selectedChatId) { setMessages([]); return }
    const q = query(
      collection(db, 'chats', selectedChatId, 'messages'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, (qs) => {
      setMessages(qs.docs.map((d) => {
        const m = d.data()
        return { id: d.id, ...m, createdAt: m.createdAt?.toMillis?.() ?? Date.now() }
      }))
    })
  }, [selectedChatId])

  // --- Actions ------------------------------------------------------------
  const signup = async (name, email, password) => {
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password)
    const profile = {
      uid: fbUser.uid, name, email,
      bio: 'Hi, I am using QuickChat.',
      avatar: assets.avatar_icon, lastSeen: Date.now(),
    }
    await setDoc(doc(db, 'users', fbUser.uid), profile)
    setUser(profile)
  }

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const logout = () => signOut(auth)

  const updateProfile = async (patch) => {
    let next = { ...patch }
    if (patch.avatarFile) {
      const r = ref(storage, `avatars/${user.uid}`)
      await uploadBytes(r, patch.avatarFile)
      next.avatar = await getDownloadURL(r)
      delete next.avatarFile
    }
    await updateDoc(doc(db, 'users', user.uid), next)
    setUser((u) => ({ ...u, ...next }))
  }

  // Deterministic id so two people always share ONE chat doc
  const chatIdFor = (a, b) => [a, b].sort().join('_')

  const startChat = async (other) => {
    const id = chatIdFor(user.uid, other.uid)
    await setDoc(
      doc(db, 'chats', id),
      {
        participants: [user.uid, other.uid],
        participantInfo: {
          [user.uid]: { name: user.name, avatar: user.avatar },
          [other.uid]: { name: other.name, avatar: other.avatar },
        },
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
      },
      { merge: true }
    )
    setSelectedChatId(id)
  }

  const sendMessage = async ({ text, imageFile }) => {
    if (!selectedChatId || (!text?.trim() && !imageFile)) return
    let image = null
    if (imageFile) {
      const r = ref(storage, `chats/${selectedChatId}/${Date.now()}`)
      await uploadBytes(r, imageFile)
      image = await getDownloadURL(r)
    }
    await addDoc(collection(db, 'chats', selectedChatId, 'messages'), {
      senderId: user.uid, text: text?.trim() || '', image, createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'chats', selectedChatId), {
      lastMessage: image ? '📷 Photo' : text.trim(),
      lastMessageAt: serverTimestamp(),
    })
  }

  const selectChat = (id) => setSelectedChatId(id)

  const findUser = (uid) => {
    if (user && uid === user.uid) return user
    return allUsers.find((u) => u.uid === uid) || { name: 'Unknown', avatar: assets.avatar_icon }
  }

  const value = useMemo(() => ({
    user, isAuthed, authReady, allUsers, chats, selectedChatId,
    selectedChat: selectedChatId
      ? { id: selectedChatId, participantId: chats.find((c) => c.id === selectedChatId)?.participantId, messages }
      : null,
    login, signup, logout, updateProfile, sendMessage, selectChat, startChat, findUser,
  }), [user, isAuthed, authReady, allUsers, chats, selectedChatId, messages])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
```

After this phase the app talks to Firebase but components still call the old function signatures. Fix them in Phase 5. It won't run correctly until then.

You can now delete `src/data/dummyData.js`, nothing imports it after Phase 5.

---

## Phase 5 — Update the components

### 5a. `src/pages/Login.jsx`
The form currently fakes login. Wire it to the real functions.

- At the top of the component, add local state for the fields:
  ```jsx
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, signup } = useApp()
  ```
- Bind each input with `value={...} onChange={(e) => setX(e.target.value)}`.
- Replace `handleSubmit`:
  ```jsx
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (isSignup) await signup(name, email, password)
      else await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.code?.replace('auth/', '').replaceAll('-', ' ') || 'Something went wrong')
    }
  }
  ```
- Show `{error && <p className="text-red-300 text-sm">{error}</p>}` above the submit button.

### 5b. `src/components/Sidebar.jsx`
- Remove `import { findUser } from '../data/dummyData.js'`.
- Get it from context: `const { chats, selectedChatId, selectChat, user, logout, findUser } = useApp()`.
- The conversation preview line uses `last?.text`; replace the `last` lookup with the denormalized field:
  ```jsx
  // delete: const last = c.messages[c.messages.length - 1]
  // change the preview <p> to:
  <p className="text-xs text-white/55 truncate">{c.lastMessage || 'Say hi 👋'}</p>
  ```
- (Optional) Wire the search box to start new chats from `allUsers`, see Phase 6.

### 5c. `src/components/ChatBox.jsx`
- Remove `import { findUser } from '../data/dummyData.js'`; get `findUser` from `useApp()`.
- The image handler now passes a **File**, not a preview URL:
  ```jsx
  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (file) sendMessage({ imageFile: file })
    e.target.value = ''
  }
  ```
- The text send stays `sendMessage({ text })`. (Both are now async, no other change needed.)

### 5d. `src/components/RightSidebar.jsx`
- Remove the dummy import; get `findUser` from `useApp()`. Media still reads `selectedChat.messages`.

### 5e. `src/pages/Profile.jsx`
- Keep the live preview using a local object URL, but send the **File** on save:
  ```jsx
  const [avatarFile, setAvatarFile] = useState(null)
  const handleAvatar = (e) => {
    const file = e.target.files?.[0]
    if (file) { setAvatarFile(file); setAvatar(URL.createObjectURL(file)) }
  }
  const handleSave = async (e) => {
    e.preventDefault()
    await updateProfile({ name, bio, ...(avatarFile && { avatarFile }) })
    navigate('/')
  }
  ```

### 5f. `src/App.jsx` — wait for auth before routing
Add a guard so a logged-in user isn't bounced to `/login` on refresh while Firebase checks the session:
```jsx
const { isAuthed, authReady } = useApp()
if (!authReady) return <div className="min-h-screen grid place-items-center text-white">Loading…</div>
```
Put those two lines at the top of the `App` component, before the `return`.

---

## Phase 6 — (Optional) Start new conversations

The draft only shows existing chats. To message someone new, let the search box surface `allUsers` and call `startChat`. In `Sidebar.jsx`:

```jsx
const { ..., allUsers, startChat } = useApp()

// when query is non-empty, show matching users who aren't already in a chat:
const userMatches = query
  ? allUsers.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))
  : []
```
Render `userMatches` under the chat list; each row calls `() => { startChat(u); setQuery('') }`.

To test end-to-end you need **two accounts**, sign up as two users (use an incognito window for the second), then start a chat from one to the other.

---

## Phase 7 — Security rules (do NOT skip)

Without these, anyone can read/write your whole database.

**Firestore** (Firestore Database → Rules → paste → Publish):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /chats/{chatId} {
      allow read, write: if request.auth != null
        && request.auth.uid in resource.data.participants;
      allow create: if request.auth != null
        && request.auth.uid in request.resource.data.participants;
      match /messages/{msgId} {
        allow read, create: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }
  }
}
```

**Storage** (Storage → Rules → paste → Publish):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### The composite index
The chats query (`array-contains` + `orderBy`) needs an index. The first time it runs, the **browser console** prints an error with a direct link, click it, then **Create index**, wait ~1 min. (Or Firestore → Indexes → add: collection `chats`, fields `participants` Array-contains + `lastMessageAt` Descending.)

---

## Phase 8 — Verify locally

```bash
npm run dev
```
Checklist: sign up → land in chat → start a chat with a second account → send text → send an image → reload (stays logged in) → edit profile → logout. Then:
```bash
npm run build
```
Must finish with no errors before deploying.

---

## Phase 9 — Deploy to Vercel

1. Push the project to a **GitHub** repo (`.env.local` is git-ignored, good, don't commit it).
2. <https://vercel.com> → **Add New → Project** → import the repo. Framework preset auto-detects **Vite**.
3. Expand **Environment Variables** and add all six `VITE_FIREBASE_*` keys (same values as `.env.local`). Add them for **Production, Preview, and Development**.
4. **Deploy**. `vercel.json` already rewrites routes so React Router deep links work.
5. Copy your live URL (e.g. `quickchat-xxx.vercel.app`).

### Authorize the domain in Firebase
6. Firebase → **Authentication → Settings → Authorized domains → Add domain** → paste your `*.vercel.app` domain. Without this, login fails in production with an `auth/unauthorized-domain` error.

Redeploys happen automatically on every `git push`.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Missing or insufficient permissions` | Rules not published, or you're querying chats you're not a participant of. Re-check Phase 7. |
| `The query requires an index` | Click the link in the console error (Phase 7, composite index). |
| Login works locally, fails on Vercel (`unauthorized-domain`) | Add the Vercel domain to Firebase Authorized domains (Phase 9.6). |
| `auth/api-key-not-valid` | Env vars missing/typo on Vercel, or you didn't restart `npm run dev` after editing `.env.local`. |
| Blank page after deploy | Open the browser console; usually an env var is missing in Vercel. |
| Images don't upload | Storage not enabled, or Storage rules not published. |

---

## What you're NOT building (so you don't over-scope)
Read receipts / unread counts, typing indicators, presence (online/offline) and message editing/deletion are all extra. The `online` and `unread` bits in the draft are cosmetic. Add them later with a `presence` doc and a `readBy` field if you want them.
