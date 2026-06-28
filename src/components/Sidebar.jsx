import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import Avatar from './Avatar.jsx'
import { LogoIcon, PlusIcon, SearchIcon } from './icons.jsx'
import { formatTime } from '../lib/time.js'

export default function Sidebar() {
  const { chats, selectedChatId, selectChat, user, logout, findUser, allUsers, startChat } = useApp()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  const userMatches = query
    ? allUsers.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))
    : []

  const visibleChats = chats.filter((c) => {
    const other = findUser(c.participantId)
    const q = query.toLowerCase()
    return other.name.toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q)
  })

  const focusSearch = () => searchRef.current?.focus()

  return (
    <aside
      className="text-white flex flex-col h-full border-r"
      style={{ background: '#0c0c14', borderColor: '#181826' }}
    >
      {/* Header: brand + new chat icon button */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white"
              style={{
                background: 'linear-gradient(135deg, #8b7bff, #6d5cff)',
                boxShadow: '0 8px 20px rgba(109,92,255,.4)',
              }}
            >
              <LogoIcon width={18} height={18} />
            </span>
            <span className="font-display font-bold text-[18px]">QuickChat</span>
          </div>

          <div className="relative">
            <button
              onClick={focusSearch}
              title="New chat"
              aria-label="New chat"
              className="press w-9 h-9 rounded-[10px] flex items-center justify-center text-white transition"
              style={{
                background: 'linear-gradient(135deg, #8b7bff, #6d5cff)',
                boxShadow: '0 8px 20px rgba(109,92,255,.4)',
              }}
            >
              <PlusIcon width={18} height={18} />
            </button>
          </div>
        </div>

        {/* New chat (full button) */}
        <button
          onClick={focusSearch}
          className="press mt-4 w-full flex items-center justify-center gap-2 rounded-[12px] py-2.5 text-sm font-semibold text-white transition"
          style={{
            background: 'linear-gradient(135deg, #8b7bff, #6d5cff)',
            boxShadow: '0 8px 22px rgba(109,92,255,.4)',
          }}
        >
          <PlusIcon width={17} height={17} /> New chat
        </button>

        {/* Search */}
        <div
          className="mt-3 flex items-center gap-2 rounded-[10px] px-3 py-2.5 border"
          style={{ background: '#13131c', borderColor: '#20202e' }}
        >
          <SearchIcon width={16} height={16} style={{ color: '#52526a' }} />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="bg-transparent text-[13px] outline-none flex-1"
            style={{ color: '#ececf4' }}
          />
        </div>
      </div>

      {/* New user matches (start a new conversation) */}
      {userMatches.length > 0 && (
        <div className="px-2 pb-2 border-b" style={{ borderColor: '#181826' }}>
          <p
            className="text-[11px] uppercase tracking-[.1em] px-3 pt-1 pb-1.5"
            style={{ color: '#52526a' }}
          >
            People
          </p>
          {userMatches.map((u) => (
            <button
              key={u.uid}
              onClick={() => { startChat(u); setQuery('') }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] mb-0.5 text-left transition hover:bg-[#13131c]"
            >
              <Avatar name={u.name} src={u.avatar} uid={u.uid} size={38} ringColor="#0c0c14" />
              <p className="text-sm font-medium truncate">{u.name}</p>
            </button>
          ))}
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scroll-thin px-2 py-1">
        {visibleChats.map((c) => {
          const other = findUser(c.participantId)
          const active = c.id === selectedChatId
          return (
            <button
              key={c.id}
              onClick={() => selectChat(c.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] mb-0.5 text-left transition"
              style={{ background: active ? '#13131c' : 'transparent' }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#13131c' }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Avatar
                name={other.name}
                src={other.avatar}
                uid={other.uid}
                size={44}
                online={other.online}
                ringColor={active ? '#13131c' : '#0c0c14'}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[15px] font-semibold truncate font-display">{other.name}</p>
                  {c.lastMessageAt > 0 && (
                    <span className="text-[11px] shrink-0" style={{ color: '#52526a' }}>
                      {formatTime(c.lastMessageAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-[13px] truncate" style={{ color: '#7c7c92' }}>
                    {c.lastMessage || 'Say hi 👋'}
                  </p>
                  {c.unread > 0 && (
                    <span
                      className="shrink-0 h-[18px] min-w-[18px] px-1.5 grid place-items-center text-[11px] font-semibold rounded-full text-white"
                      style={{ background: '#6d5cff' }}
                    >
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
        {visibleChats.length === 0 && userMatches.length === 0 && (
          <p className="text-center text-[13px] mt-8" style={{ color: '#52526a' }}>
            {query ? 'No matches found.' : 'No conversations yet.'}
          </p>
        )}
      </div>

      {/* Current user footer */}
      <div
        className="relative px-3 py-3 flex items-center gap-3 border-t"
        style={{ borderColor: '#181826' }}
      >
        <Avatar name={user.name} src={user.avatar} uid={user.uid} size={38} online ringColor="#0c0c14" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate font-display">{user.name}</p>
          <p className="text-[11px] flex items-center gap-1.5" style={{ color: '#34e0a1' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#34e0a1' }} />
            Active now
          </p>
        </div>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          title="Menu"
          aria-label="Account menu"
          className="press w-8 h-8 rounded-[9px] grid place-items-center transition"
          style={{ color: '#7c7c92' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#1c1c28')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" />
          </svg>
        </button>

        {menuOpen && (
          <div
            className="absolute right-3 bottom-14 z-20 w-40 rounded-[12px] border text-sm overflow-hidden"
            style={{ background: '#13131c', borderColor: '#232334', boxShadow: '0 20px 50px rgba(0,0,0,.5)' }}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              onClick={() => navigate('/profile')}
              className="block w-full text-left px-4 py-2.5 hover:bg-[#1c1c28] transition"
            >
              Edit profile
            </button>
            <hr style={{ borderColor: '#232334' }} />
            <button
              onClick={logout}
              className="block w-full text-left px-4 py-2.5 hover:bg-[#1c1c28] transition"
              style={{ color: '#ff6ba8' }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
