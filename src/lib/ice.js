// STUN is always on (free, public). TURN turns on automatically if you set the
// VITE_TURN_* env vars (see Phase 6). Without TURN, ~10–30% of cross-network
// calls will fail to connect — fine for a demo, not for production.
const iceServers = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
]

if (import.meta.env.VITE_TURN_URL) {
  iceServers.push({
    urls: import.meta.env.VITE_TURN_URL, // e.g. turn:your.turn.host:3478
    username: import.meta.env.VITE_TURN_USERNAME,
    credential: import.meta.env.VITE_TURN_CREDENTIAL,
  })
}

export const rtcConfig = { iceServers }
