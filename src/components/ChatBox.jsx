import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useCall } from '../context/CallContext.jsx'
import Avatar from './Avatar.jsx'
import {
  LogoIcon, PaperclipIcon, PhoneIcon, SendIcon, SmileIcon, VideoIcon,
  KebabIcon, ChevronLeftIcon, CheckCheckIcon,
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

export default function ChatBox() {
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

  if (!selectedChat) {
    return (
      <section
        className="hidden md:flex flex-col items-center justify-center gap-4"
        style={{ background: '#0a0a0f', color: '#52526a' }}
      >
        <span
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white"
          style={{ background: 'linear-gradient(135deg, #8b7bff, #6d5cff)' }}
        >
          <LogoIcon width={34} height={34} />
        </span>
        <p className="text-[15px]">Pick a conversation to start chatting.</p>
      </section>
    )
  }

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
    'press w-[40px] h-[40px] rounded-[11px] grid place-items-center text-white bg-white/15 hover:bg-white/25 transition'

  return (
    <section className="flex flex-col h-full relative" style={{ background: '#0a0a0f', color: '#ececf4' }}>
      <header
        className="flex items-center gap-2.5 px-3 sm:px-4 py-3 sticky top-0 z-10 rounded-b-[22px]"
        style={{
          background: 'linear-gradient(135deg, #8b7bff, #6d5cff)',
          boxShadow: '0 12px 26px rgba(109,92,255,.26)',
        }}
      >
        <button
          onClick={() => selectChat(null)}
          aria-label="Back" title="Back"
          className={`md:hidden ${headerBtn}`}
        >
          <ChevronLeftIcon width={20} height={20} />
        </button>

        <Avatar name={other.name} src={other.avatar} uid={other.uid} size={40} radius={999} online={other.online} ringColor="#6d5cff" />
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold leading-tight truncate text-white">{other.name}</p>
          {other.online ? (
            <p className="text-[12px] flex items-center gap-1.5 text-white/85">
              <span className="w-1.5 h-1.5 rounded-full inline-block bg-white/90" />
              Active now
            </p>
          ) : (
            <p className="text-[12px] text-white/70">Offline</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => startCall(other, 'voice')} title="Voice call" aria-label="Voice call" className={headerBtn}>
            <PhoneIcon width={18} height={18} />
          </button>
          <button onClick={() => startCall(other, 'video')} title="Video call" aria-label="Video call" className={headerBtn}>
            <VideoIcon width={18} height={18} />
          </button>
          <button title="More" aria-label="More options" className={`hidden sm:grid ${headerBtn}`}>
            <KebabIcon width={18} height={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scroll-thin px-4 sm:px-5 py-5 space-y-1.5">
        {selectedChat.messages.map((m, i) => {
          const mine = m.senderId === user.uid
          const prev = selectedChat.messages[i - 1]
          const showDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt)
          return (
            <div key={m.id}>
              {showDay && (
                <div className="flex justify-center my-4">
                  <span
                    className="text-[11px] px-3 py-1 rounded-full uppercase tracking-[.06em]"
                    style={{ background: '#14141f', color: '#52526a' }}
                  >
                    {dayLabel(m.createdAt)}
                  </span>
                </div>
              )}
              <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                {!mine && (
                  <Avatar name={other.name} src={other.avatar} uid={other.uid} size={28} radius={999} className="mb-5" />
                )}
                <div className="max-w-[72%] sm:max-w-[60%]">
                  {m.image && (
                    <img
                      src={m.image}
                      alt="attachment"
                      className="max-w-[240px] rounded-[18px] mb-1 border"
                      style={{ borderColor: '#20202e' }}
                    />
                  )}
                  {m.text && (
                    <div
                      className="px-4 py-2.5 text-[14.5px] leading-[1.45]"
                      style={
                        mine
                          ? {
                              background: 'linear-gradient(135deg, #8b7bff, #6d5cff)',
                              color: '#fff',
                              borderRadius: '18px 18px 6px 18px',
                              boxShadow: '0 6px 18px rgba(109,92,255,.25)',
                            }
                          : {
                              background: '#16161f',
                              color: '#ececf4',
                              borderRadius: '18px 18px 18px 6px',
                            }
                      }
                    >
                      {m.text}
                    </div>
                  )}
                  <div className={`flex items-center gap-1 mt-1 ${mine ? 'justify-end' : ''}`}>
                    <span className="text-[11px]" style={{ color: '#52526a' }}>
                      {formatTime(m.createdAt)}
                    </span>
                    {mine && <CheckCheckIcon width={14} height={14} style={{ color: '#6d5cff' }} />}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {selectedChat.messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2" style={{ color: '#52526a' }}>
            <Avatar name={other.name} src={other.avatar} uid={other.uid} size={64} radius={999} />
            <p className="text-[14px] mt-2">Say hi to {firstName} 👋</p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {emojiOpen && (
        <div
          className="emoji-pop absolute bottom-[76px] left-5 z-20 w-[300px] rounded-[16px] border p-3"
          style={{ background: '#13131c', borderColor: '#232334', boxShadow: '0 20px 50px rgba(0,0,0,.5)' }}
        >
          <p className="text-[11px] uppercase tracking-[.1em] mb-2 px-1" style={{ color: '#52526a' }}>
            Smileys &amp; people
          </p>
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => addEmoji(e)}
                className="h-8 w-8 grid place-items-center rounded-lg text-[18px] transition hover:scale-110"
                onMouseEnter={(ev) => (ev.currentTarget.style.background = '#1c1c28')}
                onMouseLeave={(ev) => (ev.currentTarget.style.background = 'transparent')}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="px-3 sm:px-4 py-3 border-t" style={{ borderColor: '#181826' }}>
        <div
          className="flex items-center gap-2 rounded-[16px] border px-2.5 py-1.5"
          style={{ background: '#13131c', borderColor: '#20202e' }}
        >
          <label
            className="press cursor-pointer shrink-0 w-9 h-9 grid place-items-center rounded-[10px] transition"
            title="Attach image" style={{ color: '#7c7c92' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#7c7c92')}
          >
            <input type="file" accept="image/*" hidden onChange={handleImage} aria-label="Attach image" />
            <PaperclipIcon width={19} height={19} />
          </label>

          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${firstName}…`}
            className="bg-transparent text-[14.5px] outline-none flex-1"
            style={{ color: '#ececf4' }}
          />

          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            title="Emoji" aria-label="Emoji"
            className="press shrink-0 w-9 h-9 grid place-items-center rounded-[10px] transition"
            style={{
              color: emojiOpen ? '#8b7bff' : '#7c7c92',
              background: emojiOpen ? '#1c1c28' : 'transparent',
            }}
          >
            <SmileIcon width={20} height={20} />
          </button>

          <button
            type="submit"
            title="Send" aria-label="Send"
            disabled={!text.trim()}
            className="press shrink-0 w-10 h-10 grid place-items-center rounded-full text-white transition disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #8b7bff, #6d5cff)',
              boxShadow: '0 8px 20px rgba(109,92,255,.4)',
            }}
          >
            <SendIcon width={18} height={18} />
          </button>
        </div>
      </form>
    </section>
  )
}
