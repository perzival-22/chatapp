# Task: Debug & Fix 1-to-1 Voice/Video Calls (WebRTC + Firestore)

**Role:** Act as a senior web developer. Diagnose with evidence before editing. Do
not rewrite working code; make the smallest change that fixes each confirmed defect.

**Stack:** React + Vite, Firebase Auth + Firestore, WebRTC, deployed on Vercel.

**Symptom to reproduce:** Calls fails
and/or cross-network calls never connect.

---

## Ground rules

1. **Reproduce first, then fix.** Don't change code until you've confirmed the
   failure in the browser and the console. State the root cause before each edit.
2. **One fix per commit.** Keep diffs minimal and reversible.
3. **Verify after each fix** using the acceptance checklist at the bottom.
4. Read these files before touching anything:
   - `src/context/CallContext.jsx` (signaling + RTCPeerConnection lifecycle)
   - `src/components/CallScreen.jsx` (attaches streams to `<video>`)
   - `src/lib/ice.js` (STUN/TURN config)
   - `src/lib/firebase.js` (Firebase init from env)
   - `src/context/AppContext.jsx` (auth → `user.uid`, used by calls)
   - `firestore.rules` (calls collection permissions)

---

## Phase 0 — Reproduce (no code changes)

1. `npm run dev`. Open the app in **two different browsers** (or one normal + one
   incognito), log in as two different accounts.
2. Open DevTools console in BOTH tabs. Start a video call from A to B, accept on B.
3. Record exactly what happens and what each console shows. Capture:
   - Any red errors (permissions, Firestore `permission-denied`, missing index).
   - `chrome://webrtc-internals` (open before the call): does ICE reach
     `connected`/`completed`, or stall at `checking`/`failed`?
4. Classify the failure:
   - **Media attaches but no remote video/audio** → Phase 1 (prime suspect).
   - **ICE never connects across networks** → Phase 2 (TURN/env).
   - **Firestore errors in console** → Phase 3 (rules/index/env).

> Note: a `failed-precondition`/"requires an index" error for the **chats** list
> query is expected and unrelated to calls. Note it, don't let it derail the call fix.

---

## Phase 1 — PRIME SUSPECT: stream attachment race (CallScreen.jsx)

**Hypothesis:** The remote (and on the callee, local) stream never gets attached
to the `<video>` element, so the peer connection succeeds but nothing renders.

**Why:** In `CallScreen.jsx` the effect that sets `video.srcObject` depends on
`[status, callType, localStream, remoteStream]`. `localStream` and `remoteStream`
are **refs** — mutating `.current` does not re-run the effect. In
`CallContext.acceptCall`, `setStatus('connected')` runs **before**
`await buildPeer(...)`, so when the effect fires on the status change the refs are
still `null`. It runs once, finds nothing, and never reattaches.

**Confirm before fixing:** In `CallScreen`, log inside the effect:
`console.log('attach effect', status, !!localStream.current, !!remoteStream.current)`.
On the callee you should see it fire with both `false` — proving the race.

**Fix direction (pick one, simplest first):**
- Expose the streams as **state** (e.g. `localStream`/`remoteStream` in `useState`)
  set inside `buildPeer`, so attaching is reactive — OR
- Attach `srcObject` imperatively at the moment streams are created/tracks arrive:
  set the local stream right after `getUserMedia`, and set
  `remoteVid.srcObject = remoteStream.current` inside the `ontrack` handler (or
  pass a callback). Ensure `RTCPeerConnection.ontrack` assigns the remote
  `MediaStream` to the element exactly once.
- Confirm voice calls too: the hidden `<video>` must receive the remote stream or
  there is no audio.

**Re-test:** callee should now see/hear remote media. Remove debug logs.

---

## Phase 2 — TURN / ICE config & env values (ice.js + .env.local)

This is the "are the environment variables valid?" check — do it concretely, not
by eyeballing.

1. Open `.env.local`. The TURN vars are currently **placeholder values** copied
   from `.env.example`:
   - `VITE_TURN_URL` ≈ `turn:your.turn.host:3478`
   - `VITE_TURN_USERNAME` ≈ `your-username`
   - `VITE_TURN_CREDENTIAL` ≈ `your-credential`
2. **Problem:** `ice.js` adds a TURN server whenever `VITE_TURN_URL` is truthy.
   A placeholder URL injects a **bogus, unreachable TURN entry** into
   `iceServers`, which can stall or fail ICE on cross-network calls.
3. **Decide and act:**
   - If you don't have real TURN yet → **clear all three `VITE_TURN_*` values**
     so the app runs STUN-only (works same-network / many home networks).
   - If you need cross-network reliability → get real credentials (metered.ca,
     Twilio NTS, or self-hosted coturn) and paste the real values.
4. **Validate the format** (whatever you set):
   - URL starts with `turn:` or `turns:` and includes host + port.
   - Username/credential are non-empty and not the literal `your-*` placeholders.
5. After changing `.env.local`, **restart `npm run dev`** — Vite only reads env at
   startup. Add a temporary `console.log(rtcConfig)` to confirm the live config
   has no placeholder entries, then remove it.
6. Re-test a call from two devices on **different networks** if TURN is configured.

---

## Phase 3 — Validate Firebase config & permissions

Goal: prove the Firebase env vars are present, correct, and that the `calls`
rules actually permit the signaling reads/writes.

### 3a. Env vars present & correct (firebase.js)

1. Confirm all six exist and are non-empty in `.env.local`:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
   `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
   `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
2. **Quick validity probe** — temporarily log in `firebase.js`:
   ```js
   console.log('FB env ok:', Object.values(firebaseConfig).every(Boolean), firebaseConfig.projectId)
   ```
   If any value is `undefined`, the key name is wrong or the file wasn't loaded.
   Remove the log after.
3. Cross-check `authDomain`/`projectId` match the Firebase Console project that
   has Email/Password auth and Firestore enabled.
4. **Vercel parity:** every `VITE_*` var (Firebase **and** any real TURN values)
   must also be set in Vercel → Project → Settings → Environment Variables, for
   Production **and** Preview. `VITE_*` vars are baked at **build time**, so after
   adding them you must trigger a **new deploy**. Missing prod env = `initializeApp`
   gets `undefined` → everything (including calls) breaks only in production.

### 3b. Firestore rules permit signaling (firestore.rules)

1. Confirm the deployed rules in Firebase Console match the repo's
   `firestore.rules`, specifically the `match /calls/{callId}` block and its
   `{sub}/{candidateId}` subcollection (offer/answer candidates).
2. Watch the console during a call for `permission-denied`. If it appears:
   - Caller must be authed and `request.auth.uid == callerId` on **create**.
   - Callee read/update requires `auth.uid == callerId || calleeId`.
   - Candidate writes require only an authed user — verify both users are signed in.
3. The incoming-call listener queries `where('calleeId','==',user.uid)` — this is
   a single-field filter and needs **no composite index**. If a call-related index
   error nonetheless appears, capture the exact message.

### 3c. Secure-context gotcha

`navigator.mediaDevices.getUserMedia` only works on `https` or `localhost`.
Testing over a LAN IP (e.g. `http://192.168.x.x:5173`) returns `undefined` and
throws. Use `localhost` or an https tunnel. Confirm this isn't the "getUserMedia
failed" cause before blaming permissions.

---

## Phase 4 — Lifecycle / teardown sanity (only if calls drop or hang)

- `onconnectionstatechange` calls `endCall()` on `'disconnected'`, which can be a
  transient state — confirm calls aren't being torn down prematurely on brief
  network blips. If so, only end on `'failed'`/`'closed'` (or debounce
  `'disconnected'`).
- Verify `endCall` cleans up: stops local tracks, closes `pc`, unsubscribes all
  snapshot listeners, and deletes the call doc + candidate subcollections. No
  orphaned `ringing` docs should remain after a normal hangup or decline.
- Confirm declining on the callee flips status to `declined` and the caller's
  `onSnapshot` ends the call on their side.

---

## Acceptance criteria (must all pass)

- [ ] Caller and callee both see remote video and hear audio on a **video** call.
- [ ] **Voice** call has working two-way audio (no black-screen dependency).
- [ ] Same-network call connects on STUN only (TURN vars blank).
- [ ] If TURN is configured with real creds, a **cross-network** call connects.
- [ ] No `permission-denied` or unexpected errors in either console during a call.
- [ ] Mute / camera-toggle / end-call all work; end-call cleans up the Firestore
      call doc and candidate subcollections.
- [ ] `firebaseConfig` has no `undefined` values locally and on Vercel.
- [ ] All temporary `console.log` debug lines removed.

## Deliverable

A short summary listing: each root cause confirmed, the file + line changed, and
the one-line reason. Keep edits minimal; flag anything you chose **not** to change.
