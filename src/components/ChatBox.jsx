import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useCall } from '../context/CallContext.jsx'
import Avatar from './Avatar.jsx'
import {
  PaperclipIcon, PhoneIcon, SendIcon, SmileIcon, VideoIcon,
  ChevronLeftIcon, CheckCheckIcon,
} from './icons.jsx'
import { formatTime } from '../lib/time.js'

const EMOJIS = [
  '😀', '😄', '😁', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '😉', '😍', '🥰', '😘', '😎', '🤩', '🥳',
  '🤔', '🤗', '😴', '😌', '😏', '😢', '😭', '😤',
  '😡', '🥺', '😱', '🤯', '👍', '👎', '👏', '🙌',
  '🙏', '💪', '🔥', '✨', '🎉', '❤️', '💜', '💯',
]

function dayLabel(ts) {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a, b) => a.toDateString() === b.toDateString()
  if (sameDay(d, today)) return 'Today'
  if (sameDay(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ChatBox({ onOpenProfile }) {
  const { selectedChat, user, sendMessage, findUser, selectChat } = useApp()
  const { startCall } = useCall()
  const [text, setText] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedChat?.messages.length, selectedChat?.id])

  useEffect(() => {
    setEmojiOpen(false)
  }, [selectedChat?.id])

  if (!selectedChat) return null

  const other = findUser(selectedChat.participantId)
  const firstName = other.name?.split(' ')[0] || 'them'

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage({ text })
    setText('')
  }

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (file) sendMessage({ imageFile: file })
    e.target.value = ''
  }

  const addEmoji = (emoji) => {
    setText((t) => t + emoji)
    inputRef.current?.focus()
  }

  const headerBtn =
    'press w-[40px] h-[40px] rounded-[12px] grid place-items-center text-white bg-white/15 hover:bg-white/25 transition'

  return (
    <section className="flex flex-col h-full relative bg-white" style={{ color: 'var(--text-primary)' }}>
      {/* Header — violet gradient */}
      <header className="qc-grad flex items-center gap-2.5 px-3.5 py-3.5 rounded-b-[26px] text-white shrink-0">
        <button onClick={() => selectChat(null)} aria-label="Back" className={headerBtn}>
          <ChevronLeftIcon width={20} height={20} />
        </button>

        <button
          onClick={onOpenProfile}
          className="press flex items-center gap-2.5 flex-1 min-w-0 text-left"
          aria-label={`Open ${other.name}'s profile`}
        >
          <Avatar name={other.name} src={other.avatar} uid={other.uid} size={42} radius={999} online={other.online} ringColor="#6d4ae0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-tight truncate text-white">{other.name}</p>
            {other.online ? (
              <p className="text-[12px] flex items-center gap-1.5 text-white/85">
                <span className="w-1.5 h-1.5 rounded-full inline-block bg-white/90" />
                Active now
              </p>
            ) : (
              <p className="text-[12px] text-white/70">tap to view profile</p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => startCall(other, 'voice')} aria-label="Voice call" className={headerBtn}>
            <PhoneIcon width={18} height={18} />
          </button>
          <button onClick={() => startCall(other, 'video')} aria-label="Video call" className={headerBtn}>
            <VideoIcon width={18} height={18} />
          </button>
        </div>
      </header>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-5 space-y-1.5" style={{ background: 'var(--bg-thread)' }}>
        {selectedChat.messages.map((m, i) => {
          const mine = m.senderId === user.uid
          const prev = selectedChat.messages[i - 1]
          const showDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt)
          return (
            <div key={m.id}>
              {showDay && (
                <div className="flex justify-center my-4">
                  <span
                    className="text-[11px] px-3 py-1 rounded-full uppercase tracking-[.06em] font-semibold"
                    style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}
                  >
                    {dayLabel(m.createdAt)}
                  </span>
                </div>
              )}
              <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                {!mine && (
                  <Avatar name={other.name} src={other.avatar} uid={other.uid} size={28} radius={999} className="mb-5" />
                )}
                <div className="max-w-[80%]">
                  {m.image && (
                    <img
                      src={m.image}
                      alt="attachment"
                      className="max-w-[260px] rounded-[18px] mb-1"
                    />
                  )}
                  {m.text && (
                    <div
                      className="px-[18px] py-[11px] text-[16px] leading-[1.5]"
                      style={
                        mine
                          ? {
                              background: 'linear-gradient(135deg, var(--violet), var(--violet-deep))',
                              color: '#fff',
                              borderRadius: '18px 18px 6px 18px',
                              boxShadow: '0 6px 18px rgba(109,74,224,.28)',
                            }
                          : {
                              background: 'var(--bg-surface)',
                              color: 'var(--text-primary)',
                              borderRadius: '18px 18px 18px 6px',
                            }
                      }
                    >
                      {m.text}
                    </div>
                  )}
                  <div className={`flex items-center gap-1 mt-1 ${mine ? 'justify-end' : 'ml-1'}`}>
                    {mine && <CheckCheckIcon width={14} height={14} style={{ color: 'var(--violet)' }} />}
                    <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      {formatTime(m.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {selectedChat.messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <Avatar name={other.name} src={other.avatar} uid={other.uid} size={72} radius={999} />
            <p className="text-[14px] mt-2">Say hi to {firstName} 👋</p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Emoji popover */}
      {emojiOpen && (
        <div
          className="emoji-pop absolute bottom-[82px] left-4 z-20 w-[300px] rounded-[18px] border p-3 bg-white"
          style={{ borderColor: '#ece9f6', boxShadow: '0 20px 50px rgba(28,27,46,.18)' }}
        >
          <p className="text-[11px] uppercase tracking-[.1em] mb-2 px-1" style={{ color: 'var(--text-secondary)' }}>
            Smileys &amp; people
          </p>
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => addEmoji(e)}
                className="h-8 w-8 grid place-items-center rounded-lg text-[18px] transition hover:scale-110"
                onMouseEnter={(ev) => (ev.currentTarget.style.background = 'var(--bg-surface)')}
                onMouseLeave={(ev) => (ev.currentTarget.style.background = 'transparent')}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <form onSubmit={handleSend} className="px-3.5 py-3 bg-white shrink-0">
        <div
          className="flex items-center gap-1.5 rounded-[20px] px-2 py-1.5"
          style={{ background: 'var(--bg-surface)' }}
        >
          <label
            className="press cursor-pointer shrink-0 w-9 h-9 grid place-items-center rounded-full transition"
            title="Attach image" style={{ color: 'var(--text-secondary)' }}
          >
            <input type="file" accept="image/*" hidden onChange={handleImage} aria-label="Attach image" />
            <PaperclipIcon width={19} height={19} />
          </label>

          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="bg-transparent text-[14.5px] outline-none flex-1 placeholder:text-[var(--text-secondary)]"
            style={{ color: 'var(--text-primary)' }}
          />

          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            aria-label="Emoji"
            className="press shrink-0 w-9 h-9 grid place-items-center rounded-full transition"
            style={{ color: emojiOpen ? 'var(--violet)' : 'var(--text-secondary)' }}
          >
            <SmileIcon width={20} height={20} />
          </button>

          <button
            type="submit"
            aria-label="Send"
            disabled={!text.trim()}
            className="press shrink-0 w-10 h-10 grid place-items-center rounded-full text-white transition disabled:opacity-40 qc-glow"
            style={{ boxShadow: '0 8px 20px rgba(255,112,56,.42)' }}
          >
            <SendIcon width={18} height={18} />
          </button>
        </div>
      </form>
    </section>
  )
}
