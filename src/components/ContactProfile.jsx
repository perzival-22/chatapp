import { useApp } from '../context/AppContext.jsx'
import { useCall } from '../context/CallContext.jsx'
import Avatar from './Avatar.jsx'
import { ChevronLeftIcon, PhoneIcon, VideoIcon, MessageIcon } from './icons.jsx'
import { formatLastSeen } from '../lib/time.js'

// Lightweight contact / identity surface (spec §3.4) — a large ringed avatar
// that mirrors the call screen, used as a transition into a call.
export default function ContactProfile({ onBack }) {
  const { selectedChat, findUser } = useApp()
  const { startCall } = useCall()
  const other = findUser(selectedChat.participantId)

  return (
    <section className="flex flex-col h-full bg-white" style={{ color: 'var(--text-primary)' }}>
      <header className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button
          onClick={onBack}
          aria-label="Back"
          className="press w-10 h-10 rounded-[14px] grid place-items-center transition"
          style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}
        >
          <ChevronLeftIcon width={20} height={20} />
        </button>
        <p className="text-[15px] font-semibold">Profile</p>
      </header>

      <div className="flex-1 flex flex-col items-center px-6 pt-6">
        <h2 className="text-[24px] font-bold tracking-[-0.01em] mb-7">{other.name}</h2>

        {/* Ringed avatar */}
        <div
          className="rounded-full grid place-items-center"
          style={{ padding: 5, background: 'conic-gradient(var(--violet-ring), var(--violet), var(--violet-ring))' }}
        >
          <div className="rounded-full p-[5px] bg-white">
            <Avatar name={other.name} src={other.avatar} uid={other.uid} size={188} radius={999} />
          </div>
        </div>

        {other.online ? (
          <p className="text-[13px] mt-5 flex items-center gap-1.5" style={{ color: 'var(--online)' }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--online)' }} />
            Active now
          </p>
        ) : (
          <p className="text-[13px] mt-5" style={{ color: 'var(--text-secondary)' }}>
            {other.lastSeen ? `Last seen ${formatLastSeen(other.lastSeen)}` : 'Offline'}
          </p>
        )}

        {other.bio && (
          <p className="text-[13.5px] mt-3 leading-relaxed text-center max-w-[260px]" style={{ color: 'var(--text-secondary)' }}>
            {other.bio}
          </p>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center justify-center gap-6 pb-12 pt-4">
        <Action label="Message" onClick={onBack}>
          <MessageIcon width={24} height={24} />
        </Action>
        <Action label="Voice call" onClick={() => startCall(other, 'voice')}>
          <PhoneIcon width={24} height={24} />
        </Action>
        <Action label="Video call" onClick={() => startCall(other, 'video')}>
          <VideoIcon width={24} height={24} />
        </Action>
      </div>
    </section>
  )
}

function Action({ children, label, onClick }) {
  return (
    <button onClick={onClick} aria-label={label} className="press flex flex-col items-center gap-2">
      <span
        className="rounded-[20px] grid place-items-center"
        style={{ width: 60, height: 60, background: 'var(--violet-soft)', color: 'var(--violet)' }}
      >
        {children}
      </span>
      <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </button>
  )
}
