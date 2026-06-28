import { useEffect, useRef, useState } from 'react'
import assets from '../../assets/assets.js'
import { useApp } from '../context/AppContext.jsx'
import { findUser } from '../data/dummyData.js'
import { formatTime } from '../lib/time.js'

export default function ChatBox() {
  const { selectedChat, user, sendMessage } = useApp()
  const [text, setText] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedChat?.messages.length, selectedChat?.id])

  if (!selectedChat) {
    return (
      <section className="hidden md:flex flex-col items-center justify-center text-white/70 gap-3">
        <img src={assets.logo_icon} alt="" className="h-16 opacity-80" />
        <p>Pick a conversation to start chatting.</p>
      </section>
    )
  }

  const other = findUser(selectedChat.participantId)

  const handleSend = (e) => {
    e.preventDefault()
    sendMessage({ text })
    setText('')
  }

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // DRAFT: preview only via object URL. Later -> upload to Firebase Storage,
    // then store the download URL on the message.
    sendMessage({ image: URL.createObjectURL(file) })
    e.target.value = ''
  }

  return (
    <section className="flex flex-col h-full text-white bg-black/5">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10">
        <div className="relative">
          <img src={other.avatar} alt={other.name} className="h-9 w-9 rounded-full object-cover" />
          {other.online && (
            <img src={assets.green_dot} alt="" className="absolute -bottom-0.5 -right-0.5 h-3" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium leading-tight">{other.name}</p>
          <p className="text-xs text-white/55">{other.online ? 'Active now' : 'Offline'}</p>
        </div>
        <img src={assets.help_icon} alt="info" className="h-5 opacity-70 hover:opacity-100 cursor-pointer" />
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-4 space-y-3">
        {selectedChat.messages.map((m) => {
          const mine = m.senderId === user.uid
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end gap-2 max-w-[78%] ${mine ? 'flex-row-reverse' : ''}`}>
                <img
                  src={mine ? user.avatar : other.avatar}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover shrink-0"
                />
                <div>
                  {m.image && (
                    <img
                      src={m.image}
                      alt="attachment"
                      className="max-w-[220px] rounded-lg mb-1 border border-white/10"
                    />
                  )}
                  {m.text && (
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-sm leading-snug
                        ${mine
                          ? 'bg-gradient-to-r from-violet-500 to-purple-600 rounded-br-sm'
                          : 'bg-white/12 rounded-bl-sm'}`}
                    >
                      {m.text}
                    </div>
                  )}
                  <p className={`text-[10px] text-white/45 mt-1 ${mine ? 'text-right' : ''}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-white/10">
        <div className="flex-1 flex items-center gap-2 rounded-full bg-black/20 border border-white/10 px-4 py-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="bg-transparent text-sm outline-none flex-1 placeholder-white/45"
          />
          <label className="cursor-pointer shrink-0">
            <input type="file" accept="image/*" hidden onChange={handleImage} />
            <img src={assets.gallery_icon} alt="attach" className="h-5 opacity-70 hover:opacity-100" />
          </label>
        </div>
        <button type="submit" className="shrink-0 hover:brightness-110 transition" aria-label="Send">
          <img src={assets.send_button} alt="send" className="h-9" />
        </button>
      </form>
    </section>
  )
}
