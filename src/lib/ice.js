// STUN is always on (free, public). TURN turns on automatically once you set the
// VITE_TURN_* env vars. Without TURN, cross-network calls (mobile data /
// symmetric NAT / CGNAT) frequently fail to connect — STUN can only discover a
// reflexive address, it can't relay media when the NATs won't let peers reach
// each other directly. TURN provides that relay.
const iceServers = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
]

// VITE_TURN_URL may be a single URL or a comma-separated list. Provide several
// transports for the SAME host so restrictive networks still get through:
//   turn:host:3478?transport=udp   (fastest, often blocked on corp/coffee wifi)
//   turn:host:3478?transport=tcp   (works where UDP is blocked)
//   turns:host:5349?transport=tcp  (TLS on 443/5349 — survives almost any firewall)
const turnUrls = (import.meta.env.VITE_TURN_URL || '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean)

if (turnUrls.length) {
  iceServers.push({
    urls: turnUrls,
    username: import.meta.env.VITE_TURN_USERNAME,
    credential: import.meta.env.VITE_TURN_CREDENTIAL,
  })
}

export const rtcConfig = {
  iceServers,
  // Gather a few extra candidate pairs up front — speeds up connection on
  // flaky/mobile networks.
  iceCandidatePoolSize: 4,
  // Set VITE_TURN_FORCE_RELAY=true to route ALL media through TURN. Use this to
  // *verify* your TURN server works (if calls connect with this on, TURN is
  // good; if they only fail with it on, your TURN creds are wrong). Leave off in
  // production so direct/STUN paths are still preferred when available.
  ...(import.meta.env.VITE_TURN_FORCE_RELAY === 'true'
    ? { iceTransportPolicy: 'relay' }
    : {}),
}
