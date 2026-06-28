// Inline SVG icons for the chat UI — 2px stroke, round caps/joins, currentColor.
// Keeps the interface crisp at any size and easily tintable via `color`.

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function PlusIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function SearchIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function PhoneIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  )
}

export function VideoIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="6" width="14" height="12" rx="2.5" />
      <path d="m16 10 6-3.5v11L16 14" />
    </svg>
  )
}

export function PaperclipIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7.5-7.5" />
    </svg>
  )
}

export function SmileIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
      <path d="M9 9.5h.01M15 9.5h.01" />
    </svg>
  )
}

export function SendIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  )
}

export function KebabIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="5" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="12" cy="19" r="1.4" />
    </svg>
  )
}

export function MicIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  )
}

export function MicOffIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m2 2 20 20" />
      <path d="M9 9v2a3 3 0 0 0 4.5 2.6M15 11V5a3 3 0 0 0-5.7-1.3" />
      <path d="M5 11a7 7 0 0 0 10.5 6M19 11a7 7 0 0 1-.3 2M12 18v3" />
    </svg>
  )
}

export function VideoOffIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m2 2 20 20" />
      <path d="M16 10.5V8a2 2 0 0 0-2-2H8.5M5 6a2 2 0 0 0-1 1.7v8.6A2 2 0 0 0 6 18h8a2 2 0 0 0 1.5-.7" />
      <path d="m16 10 6-3.5v11l-3-1.7" />
    </svg>
  )
}

export function PhoneOffIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M22 2 2 22" />
      <path d="M9.5 5.6A14 14 0 0 0 4.1 4 2 2 0 0 0 2 6a16 16 0 0 0 1.4 6M8 13a16 16 0 0 0 6 6 16 16 0 0 0 6 1.4 2 2 0 0 0 2-2.1 14 14 0 0 0-1.6-5.4" />
    </svg>
  )
}

export function LogoIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-4 4v-4H6.5A2.5 2.5 0 0 1 4 12.5v-7Z"
        fill="currentColor"
      />
    </svg>
  )
}
