// Gradient-initials avatar (spec §2). Renders an uploaded photo when one exists,
// otherwise a deterministic gradient tile with the contact's initials.

const GRADIENTS = [
  ['#f0883e', '#e0653e'], // orange
  ['#8b7bff', '#6d5cff'], // indigo
  ['#34e0a1', '#16b67d'], // emerald
  ['#ff6ba8', '#e0457e'], // pink
  ['#4ec0f0', '#3d8ae0'], // blue
  ['#b07bff', '#8b5cff'], // violet
]

function pickGradient(key = '') {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Real uploaded photos are http(s) URLs from Firebase Storage; bundled PNG
// placeholders (the default avatar) resolve to a local path — treat those as
// "no photo" so they fall back to gradient initials.
const isPhoto = (src) => typeof src === 'string' && /^https?:\/\//.test(src)

export default function Avatar({
  name = '',
  src,
  uid,
  size = 40,
  radius = 13,
  online = false,
  ringColor = '#0c0c14',
  className = '',
}) {
  const [c1, c2] = pickGradient(uid || name)
  const dot = Math.max(9, Math.round(size * 0.28))

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {isPhoto(src) ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          style={{ borderRadius: radius }}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-display font-semibold text-white select-none"
          style={{
            borderRadius: radius,
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            fontSize: Math.round(size * 0.4),
          }}
        >
          {initials(name)}
        </div>
      )}

      {online && (
        <span
          className="absolute rounded-full"
          style={{
            width: dot,
            height: dot,
            right: -1,
            bottom: -1,
            background: '#34e0a1',
            boxShadow: `0 0 0 2.5px ${ringColor}`,
          }}
        />
      )}
    </div>
  )
}
