# QuickChat → Voice & Video Calls (WebRTC + Firestore signaling)

Adds 1-to-1 voice and video calling over the internet. Media is peer-to-peer (WebRTC); Firestore is only the signaling mailbox. Fits your existing code: `AppContext`, `ChatBox` (the call buttons + placeholder overlay), `Avatar`, `icons.jsx`.

Work through the phases in order. Nothing here touches your messaging code.

---

## How it works (read once)

```
Caller                         Firestore  calls/{callId}                 Callee
  │  getUserMedia (mic/cam)                                                │
  │  createOffer ───────────────►  { offer, callerId, calleeId, type }     │
  │  ICE ──────────────────────►  offerCandidates/*                        │
  │                                       ▲ onSnapshot (calleeId == me) ──► RING
  │                                       │  accept: getUserMedia           │
  │  setRemoteDescription(answer) ◄──────  { answer, status:'accepted' } ◄──┤ createAnswer
  │  addIceCandidate ◄──────────  answerCandidates/*  ◄─────────────────────┤ ICE
  │                                                                         │
  └────────────  media flows DIRECTLY peer-to-peer (no Firestore)  ─────────┘
```

The offer/answer is the "what codecs and media" handshake. ICE candidates are "here are network paths to reach me." STUN helps each peer discover its public address; TURN relays the media when a direct path is impossible.

---

## Phase 1 — ICE servers (STUN now, TURN later)

STUN is free and gets most connections working. TURN is a paid relay that rescues the connections STUN can't make (mobile data, corporate/symmetric NAT). Build the config so you can add TURN later by just filling env vars.

**New file `src/lib/ice.js`:**
```js
// STUN is always on (free, public). TURN turns on automatically if you set the
// VITE_TURN_* env vars (see Phase 6). Without TURN, ~10–30% of cross-network
// calls will fail to connect — fine for a demo, not for production.
const iceServers = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
]

if (import.meta.env.VITE_TURN_URL) {
  iceServers.push({
    urls: import.meta.env.VITE_TURN_URL,          // e.g. turn:your.turn.host:3478
    username: import.meta.env.VITE_TURN_USERNAME,
    credential: import.meta.env.VITE_TURN_CREDENTIAL,
  })
}

export const rtcConfig = { iceServers }
```

---

## Phase 2 — The call engine (`src/context/CallContext.jsx`)

This is the whole feature. It manages one `RTCPeerConnection`, writes/reads the Firestore signaling docs, and exposes simple actions to the UI. **New file:**

```jsx
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, updateDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { rtcConfig } from '../lib/ice.js'
import { useApp } from './AppContext.jsx'

const CallContext = createContext(null)

export function CallProvider({ children }) {
  const { user, findUser } = useApp()

  // 'idle' | 'calling' | 'ringing' | 'connected'
  const [status, setStatus] = useState('idle')
  const [callType, setCallType] = useState('video')   // 'voice' | 'video'
  const [peer, setPeer] = useState(null)              // the other user's profile
  const [incoming, setIncoming] = useState(null)      // { callId, data } when someone rings us
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)

  // streams exposed to <CallScreen> via refs (videos read these)
  const localStream = useRef(null)
  const remoteStream = useRef(null)
  const pc = useRef(null)
  const callRef = useRef(null)       // Firestore doc ref of the active call
  const unsubs = useRef([])          // snapshot unsubscribers to clean up

  const stop = (fn) => { try { fn() } catch {} }

  // ---- shared setup ------------------------------------------------------
  const buildPeer = async (type) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    })
    localStream.current = stream
    remoteStream.current = new MediaStream()

    const connection = new RTCPeerConnection(rtcConfig)
    stream.getTracks().forEach((t) => connection.addTrack(t, stream))
    connection.ontrack = (e) => {
      e.streams[0].getTracks().forEach((t) => remoteStream.current.addTrack(t))
    }
    connection.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(connection.connectionState)) endCall()
    }
    pc.current = connection
    return connection
  }

  // ---- CALLER ------------------------------------------------------------
  const startCall = async (otherUser, type = 'video') => {
    if (status !== 'idle') return
    setCallType(type); setPeer(otherUser); setStatus('calling')
    const connection = await buildPeer(type)

    const ref = doc(collection(db, 'calls'))
    callRef.current = ref
    const offerCandidates = collection(ref, 'offerCandidates')
    const answerCandidates = collection(ref, 'answerCandidates')

    connection.onicecandidate = (e) => {
      if (e.candidate) addDoc(offerCandidates, e.candidate.toJSON())
    }

    const offer = await connection.createOffer()
    await connection.setLocalDescription(offer)

    await setDoc(ref, {
      callerId: user.uid,
      callerName: user.name,
      callerAvatar: user.avatar,
      calleeId: otherUser.uid,
      type,
      offer: { type: offer.type, sdp: offer.sdp },
      status: 'ringing',
      createdAt: serverTimestamp(),
    })

    // listen for the answer + status changes
    unsubs.current.push(onSnapshot(ref, (snap) => {
      const data = snap.data()
      if (!data) return
      if (data.answer && !connection.currentRemoteDescription) {
        connection.setRemoteDescription(new RTCSessionDescription(data.answer))
        setStatus('connected')
      }
      if (data.status === 'declined' || data.status === 'ended') endCall()
    }))

    // remote ICE candidates (buffered until remote description exists)
    unsubs.current.push(onSnapshot(answerCandidates, (qs) => {
      qs.docChanges().forEach((c) => {
        if (c.type === 'added' && connection.currentRemoteDescription) {
          connection.addIceCandidate(new RTCIceCandidate(c.doc.data()))
        }
      })
    }))
  }

  // ---- CALLEE ------------------------------------------------------------
  const acceptCall = async () => {
    if (!incoming) return
    const { callId, data } = incoming
    setCallType(data.type)
    setPeer(findUser(data.callerId) || { name: data.callerName, avatar: data.callerAvatar, uid: data.callerId })
    setStatus('connected')
    setIncoming(null)

    const connection = await buildPeer(data.type)
    const ref = doc(db, 'calls', callId)
    callRef.current = ref
    const offerCandidates = collection(ref, 'offerCandidates')
    const answerCandidates = collection(ref, 'answerCandidates')

    connection.onicecandidate = (e) => {
      if (e.candidate) addDoc(answerCandidates, e.candidate.toJSON())
    }

    await connection.setRemoteDescription(new RTCSessionDescription(data.offer))
    const answer = await connection.createAnswer()
    await connection.setLocalDescription(answer)
    await updateDoc(ref, { answer: { type: answer.type, sdp: answer.sdp }, status: 'accepted' })

    unsubs.current.push(onSnapshot(offerCandidates, (qs) => {
      qs.docChanges().forEach((c) => {
        if (c.type === 'added') connection.addIceCandidate(new RTCIceCandidate(c.doc.data()))
      })
    }))
    unsubs.current.push(onSnapshot(ref, (snap) => {
      if (snap.data()?.status === 'ended') endCall()
    }))
  }

  const declineCall = async () => {
    if (incoming) await updateDoc(doc(db, 'calls', incoming.callId), { status: 'declined' })
    setIncoming(null)
  }

  // ---- shared teardown ---------------------------------------------------
  const endCall = async () => {
    unsubs.current.forEach((u) => stop(u)); unsubs.current = []
    stop(() => localStream.current?.getTracks().forEach((t) => t.stop()))
    stop(() => pc.current?.close())
    if (callRef.current) {
      stop(() => updateDoc(callRef.current, { status: 'ended' }))
      // best-effort cleanup of the signaling doc
      const ref = callRef.current
      setTimeout(async () => {
        for (const sub of ['offerCandidates', 'answerCandidates']) {
          const qs = await getDocs(collection(ref, sub)).catch(() => null)
          qs?.forEach((d) => deleteDoc(d.ref))
        }
        deleteDoc(ref).catch(() => {})
      }, 1500)
    }
    pc.current = null; callRef.current = null
    localStream.current = null; remoteStream.current = null
    setStatus('idle'); setPeer(null); setMuted(false); setCameraOff(false)
  }

  // ---- in-call controls --------------------------------------------------
  const toggleMute = () => {
    const track = localStream.current?.getAudioTracks()[0]
    if (track) { track.enabled = !track.enabled; setMuted(!track.enabled) }
  }
  const toggleCamera = () => {
    const track = localStream.current?.getVideoTracks()[0]
    if (track) { track.enabled = !track.enabled; setCameraOff(!track.enabled) }
  }

  // ---- incoming-call listener (always on while logged in) ---------------
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'calls'), where('calleeId', '==', user.uid))
    return onSnapshot(q, (qs) => {
      // ignore while already in a call
      if (status !== 'idle') return
      const ring = qs.docs.find((d) => d.data().status === 'ringing' && !d.data().answer)
      setIncoming(ring ? { callId: ring.id, data: ring.data() } : null)
    })
  }, [user, status])

  return (
    <CallContext.Provider value={{
      status, callType, peer, incoming, muted, cameraOff,
      localStream, remoteStream,
      startCall, acceptCall, declineCall, endCall, toggleMute, toggleCamera,
    }}>
      {children}
    </CallContext.Provider>
  )
}

export const useCall = () => {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error('useCall must be used inside <CallProvider>')
  return ctx
}
```

**Why a single equality filter** on the incoming listener (`where('calleeId','==',...)` then filter status in JS): two `==` filters would force a composite index. One filter needs none. Keeps setup zero-config.

---

## Phase 3 — Wrap the app in the provider

**`src/main.jsx`** — put `CallProvider` *inside* `AppProvider` (it depends on `useApp`):
```jsx
import { CallProvider } from './context/CallContext.jsx'
// ...
<AppProvider>
  <CallProvider>
    <App />
  </CallProvider>
</AppProvider>
```

---

## Phase 4 — The call UI (`src/components/CallScreen.jsx`)

One global overlay that handles ringing (incoming), calling (outgoing), and connected. **New file** (styled to match your dark theme; swap icons for your `icons.jsx` ones):

```jsx
import { useEffect, useRef } from 'react'
import { useCall } from '../context/CallContext.jsx'
import Avatar from './Avatar.jsx'
import { PhoneIcon, VideoIcon } from './icons.jsx'

export default function CallScreen() {
  const {
    status, callType, peer, incoming, muted, cameraOff,
    localStream, remoteStream, acceptCall, declineCall, endCall, toggleMute, toggleCamera,
  } = useCall()

  const localVid = useRef(null)
  const remoteVid = useRef(null)

  // attach streams to <video> elements once we're connected
  useEffect(() => {
    if (localVid.current && localStream.current) localVid.current.srcObject = localStream.current
    if (remoteVid.current && remoteStream.current) remoteVid.current.srcObject = remoteStream.current
  }, [status])

  // ---- incoming call (ringing) ----
  if (incoming && status === 'idle') {
    return (
      <Backdrop>
        <Avatar name={incoming.data.callerName} src={incoming.data.callerAvatar} size={104} radius={28} />
        <p className="font-display font-semibold text-xl mt-4">{incoming.data.callerName}</p>
        <p className="text-[13px] mt-1" style={{ color: '#7c7c92' }}>
          Incoming {incoming.data.type === 'video' ? 'video' : 'voice'} call…
        </p>
        <div className="flex gap-5 mt-8">
          <RoundBtn color="#e0457e" onClick={declineCall} label="Decline"><PhoneIcon width={22} height={22} /></RoundBtn>
          <RoundBtn color="#34c759" onClick={acceptCall} label="Accept">
            {incoming.data.type === 'video' ? <VideoIcon width={22} height={22} /> : <PhoneIcon width={22} height={22} />}
          </RoundBtn>
        </div>
      </Backdrop>
    )
  }

  if (status === 'idle') return null

  const isVideo = callType === 'video'
  return (
    <Backdrop full>
      {isVideo ? (
        <div className="relative w-full h-full">
          <video ref={remoteVid} autoPlay playsInline className="w-full h-full object-cover" />
          <video ref={localVid} autoPlay playsInline muted
            className="absolute bottom-24 right-5 w-36 rounded-2xl border-2 object-cover"
            style={{ borderColor: '#6d5cff' }} />
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* voice call: audio still needs to play, hidden video element carries it */}
          <video ref={remoteVid} autoPlay playsInline className="hidden" />
          <Avatar name={peer?.name} src={peer?.avatar} size={120} radius={32} />
          <p className="font-display font-semibold text-2xl mt-5">{peer?.name}</p>
        </div>
      )}

      <p className="absolute top-6 text-[13px]" style={{ color: '#cfcfe0' }}>
        {status === 'calling' ? 'Calling…' : 'Connected'}
      </p>

      {/* controls */}
      <div className="absolute bottom-8 flex items-center gap-4">
        <RoundBtn color={muted ? '#6d5cff' : '#1c1c28'} onClick={toggleMute} label="Mute">
          {muted ? '🔇' : '🎤'}
        </RoundBtn>
        {isVideo && (
          <RoundBtn color={cameraOff ? '#6d5cff' : '#1c1c28'} onClick={toggleCamera} label="Camera">
            {cameraOff ? '📷' : '🎥'}
          </RoundBtn>
        )}
        <RoundBtn color="#e0457e" onClick={endCall} label="End"><PhoneIcon width={22} height={22} /></RoundBtn>
      </div>
    </Backdrop>
  )
}

function Backdrop({ children, full }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white"
      style={{ background: full ? '#06060a' : 'rgba(6,6,10,.9)', backdropFilter: 'blur(8px)' }}>
      {children}
    </div>
  )
}
function RoundBtn({ children, color, onClick, label }) {
  return (
    <button onClick={onClick} title={label} aria-label={label}
      className="press w-14 h-14 rounded-full grid place-items-center text-white text-xl"
      style={{ background: color }}>
      {children}
    </button>
  )
}
```

Render it **once**, globally. In **`src/App.jsx`**, add `<CallScreen />` just inside the top-level wrapper (after `<Routes>` is fine):
```jsx
import CallScreen from './components/CallScreen.jsx'
// ...
<>
  <Routes>{/* ... */}</Routes>
  <CallScreen />
</>
```

---

## Phase 5 — Wire your existing buttons (`src/components/ChatBox.jsx`)

You already have the buttons calling `setCall('voice'|'video')` and a placeholder overlay. Replace the placeholder with the real engine:

1. Add the import: `import { useCall } from '../context/CallContext.jsx'`
2. Inside the component: `const { startCall } = useCall()`
3. **Delete** the local call state: `const [call, setCall] = useState(null)` and the `setCall(null)` line in the reset `useEffect`.
4. Change the two buttons:
   ```jsx
   <button onClick={() => startCall(other, 'voice')} ...>  <PhoneIcon .../></button>
   <button onClick={() => startCall(other, 'video')} ...>  <VideoIcon .../></button>
   ```
5. **Delete** the entire `{call && ( ... placeholder ... )}` block at the bottom — `CallScreen` replaces it.

---

## Phase 6 — TURN (the part that makes it work for everyone)

STUN-only will fail for users behind symmetric NAT (common on mobile carriers and office networks). To fix, add a TURN relay. Easiest options:

- **Metered** (`metered.ca`) — has a free tier and gives you ready-to-use `turn:` URLs + credentials.
- **Twilio Network Traversal Service** — pay-as-you-go, very reliable.
- **Self-host coturn** on a cheap VPS — cheapest at scale, more ops work.

### Where do these values come from?

You don't invent them and they aren't in your project or Firebase, a TURN provider issues them. **Leave all three blank until you need TURN; STUN-only works without them.** When you're ready:

**Option A — Metered (free tier, fastest):**
1. Sign up at <https://www.metered.ca/> → create a TURN app.
2. The dashboard gives you a TURN URL, a username, and a credential. Paste those three in.
3. Free tier is ~50 GB relay/month, plenty for testing and small usage.

**Option B — Metered Open Relay (zero signup, testing only):**
Public free TURN, fine to verify your code works, not for production (shared, rate-limited). Confirm the current values on <https://www.metered.ca/tools/openrelay/>; they're typically:
```
VITE_TURN_URL=turn:openrelay.metered.ca:80
VITE_TURN_USERNAME=openrelayproject
VITE_TURN_CREDENTIAL=openrelayproject
```

**Option C — Twilio NTS:** pay-as-you-go, generate credentials via their API/console. Most reliable, costs per GB.

**Option D — self-host coturn** on a small VPS: cheapest at scale, you set the username/credential yourself in coturn's config.

Add the values to **`.env.local`** (and the same three to Vercel → Settings → Environment Variables for production):
```
VITE_TURN_URL=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
```
`src/lib/ice.js` already picks these up automatically, blank = STUN-only, filled = STUN+TURN. No code change either way.

> Test reliability with: <https://icetest.info> or Chrome's `chrome://webrtc-internals`. To *prove* TURN works, temporarily set the connection to relay-only (`iceTransportPolicy: 'relay'` in `rtcConfig`) and confirm a call still connects.

---

## Phase 7 — Firestore security rules (add to your existing rules)

Inside `match /databases/{database}/documents { ... }`, add a `calls` block. Only the two participants may touch a call:

```
match /calls/{callId} {
  allow create: if request.auth != null
                && request.auth.uid == request.resource.data.callerId;
  allow read, update, delete: if request.auth != null
                && (request.auth.uid == resource.data.callerId
                    || request.auth.uid == resource.data.calleeId);

  match /{sub}/{candidateId} {
    allow read, write: if request.auth != null;  // candidates are not sensitive
  }
}
```
Publish in Firestore → Rules.

---

## Phase 8 — Test it

Calls need **two real accounts on two devices/browsers**. `getUserMedia` requires HTTPS or `localhost` (both fine: Vite dev is localhost, Vercel is HTTPS).

1. `npm run dev`. Log in as user A in your normal browser, user B in an incognito window (or another device).
2. From A, open the chat with B and hit the video button → B should see the incoming-call overlay.
3. Accept on B → both video tiles light up.
4. Test mute, camera toggle, and End on both sides.
5. **Cross-network test**: put one device on mobile data (not the same WiFi). If it connects on STUN, great; if it hangs on "Calling…", that's exactly the case TURN fixes (Phase 6).

The browser will prompt for mic/camera permission the first time — allow it.

---

## Gotchas & limits

| Symptom | Cause / fix |
|---|---|
| "Calling…" never connects across networks | Symmetric NAT. Add TURN (Phase 6). This is expected, not a bug. |
| No mic/cam prompt, instant fail | Not on HTTPS/localhost, or permission previously denied (reset site permissions). |
| Callee never rings | Not logged in as the `calleeId`, or rules block the read. Check `chrome://webrtc-internals` and the console. |
| Echo on voice calls | Don't unmute the local `<video>`; keep `muted` on the local element (already set). |
| Old call docs pile up | Client cleanup is best-effort. For guaranteed cleanup add a Firestore TTL policy or a Cloud Function on `status == 'ended'`. |
| Two tabs same user | The incoming listener fires in both. Fine for testing; for production track an active-device/session. |

### Out of scope (add later if you want)
Group calls (needs an SFU like LiveKit/mediasoup — mesh P2P doesn't scale past ~3–4 people), screen share (`getDisplayMedia` — swap the video track), call history records, and missed-call notifications.
