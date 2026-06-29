import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import Avatar from './Avatar.jsx'
import {
  LogoIcon, PlusIcon, SearchIcon, CheckCheckIcon,
  HomeIcon, HeartIcon, MessageIcon, UserIcon,
} from './icons.jsx'
import { formatTime } from '../lib/time.js'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'archived', label: 'Archived' },
]

export default function Sidebar() {
  const { chats, selectedChatId, selectChat, user, logout, findUser, allUsers, startChat } = useApp()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const [menuOpen, setMenuOpen] = useState(false)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  const userMatches = query
    ? allUsers.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))
    : []

  const searched = chats.filter((c) => {
    const other = findUser(c.participantId)
    const q = query.toLowerCase()
    return other.name.toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q)
  })

  const visibleChats = searched.filter((c) => {
    if (tab === 'unread') return (c.unread || 0) > 0
    if (tab === 'archived') return !!c.archived
    return !c.archived
  })

  const railPeople = allUsers.slice(0, 10)

  const focusSearch = () => searchRef.current?.focus()

  return (
    <aside
      className="text-white flex flex-col h-full border-r relative"
      style={{ background: '#0c0c14', borderColor: '#181826' }}
    >
      <div
        className="px-4 pt-5 pb-4 rounded-b-[24px]"
        style={{
          background: 'linear-gradient(135deg, #8b7bff, #6d5cff)',
          boxShadow: '0 14px 30px rgba(109,92,255,.28)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-[11px] grid place-items-center text-white bg-white/15">
              <LogoIcon width={19} height={19} />
            </span>
            <div className="leading-tight">
              <p className="font-display font-bold text-[18px]">Chat Box</p>
              <p className="text-[11px] text-white/70">{chats.length} conversations</p>
            </div>
          </div>

          <button
            onClick={focusSearch}
            title="New chat" aria-label="New chat"
            className="press w-9 h-9 rounded-[11px] grid place-items-center text-white bg-white/15 hover:bg-white/25 transition"
          >
            <PlusIcon width={18} height={18} />
          </button>
        </div>

        {railPeople.length > 0 && (
          <div className="mt-4 flex gap-3 overflow-x-auto scroll-thin pb-1">
            {railPeople.map((u) => (
              <button
                key={u.uid}
                onClick={() => startChat(u)}
                className="press shrink-0 flex flex-col items-center gap-1 w-[52px]"
                title={`Chat with ${u.name}`}
              >
                <Avatar
                  name={u.name} src={u.avatar} uid={u.uid} size={46} radius={999}
                  online={u.online} ringColor="#6d5cff"
                />
                <span className="text-[11px] text-white/85 truncate w-full text-center">
                  {u.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-3">
        <div
          className="flex items-center gap-2 rounded-[12px] px-3 py-2.5 border"
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

      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-1">
          {TABS.map((t) => {
            const active = tab === t.id
            const count = t.id === 'all'
              ? chats.filter((c) => !c.archived).length
              : t.id === 'unread'
                ? chats.filter((c) => (c.unread || 0) > 0).length
                : chats.filter((c) => c.archived).length
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="press flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition"
                style={{
                  background: active ? 'rgba(139,123,255,.16)' : 'transparent',
                  color: active ? '#a99bff' : '#7c7c92',
                }}
              >
                {t.label}
                {count > 0 && (
                  <span
                    className="grid place-items-center min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-semibold"
                    style={{
                      background: active ? '#6d5cff' : '#20202e',
                      color: active ? '#fff' : '#7c7c92',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {userMatches.length > 0 && (
        <div className="px-2 pb-2 border-b" style={{ borderColor: '#181826' }}>
          <p className="text-[11px] uppercase tracking-[.1em] px-3 pt-1 pb-1.5" style={{ color: '#52526a' }}>
            People
          </p>
          {userMatches.map((u) => (
            <button
              key={u.uid}
              onClick={() => { startChat(u); setQuery('') }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] mb-0.5 text-left transition hover:bg-[#13131c]"
            >
              <Avatar name={u.name} src={u.avatar} uid={u.uid} size={38} radius={999} ringColor="#0c0c14" />
              <p className="text-sm font-medium truncate">{u.name}</p>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scroll-thin px-2 py-1">
        {visibleChats.map((c) => {
          const other = findUser(c.participantId)
          const active = c.id === selectedChatId
          const unread = c.unread || 0
          return (
            <button
              key={c.id}
              onClick={() => selectChat(c.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] mb-0.5 text-left transition"
              style={{ background: active ? '#13131c' : 'transparent' }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#13131c' }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Avatar
                name={other.name} src={other.avatar} uid={other.uid}
                size={46} radius={999} online={other.online}
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
                  <p
                    className="text-[13px] truncate"
                    style={{ color: unread > 0 ? '#cfcfe0' : '#7c7c92', fontWeight: unread > 0 ? 500 : 400 }}
                  >
                    {c.lastMessage || 'Say hi 👋'}
                  </p>
                  {unread > 0 ? (
                    <span
                      className="shrink-0 h-[18px] min-w-[18px] px-1.5 grid place-items-center text-[11px] font-semibold rounded-full text-white"
                      style={{ background: '#6d5cff' }}
                    >
                      {unread}
                    </span>
                  ) : (
                    c.lastMessageAt > 0 && (
                      <CheckCheckIcon width={15} height={15} style={{ color: '#52526a' }} />
                    )
                  )}
                </div>
              </div>
            </button>
          )
        })}
        {visibleChats.length === 0 && userMatches.length === 0 && (
          <p className="text-center text-[13px] mt-8" style={{ color: '#52526a' }}>
            {query
              ? 'No matches found.'
              : tab === 'unread'
                ? 'No unread conversations.'
                : tab === 'archived'
                  ? 'Nothing archived.'
                  : 'No conversations yet.'}
          </p>
        )}
      </div>

      <div
        className="relative px-3 py-3 hidden md:flex items-center gap-3 border-t"
        style={{ borderColor: '#181826' }}
      >
        <Avatar name={user.name} src={user.avatar} uid={user.uid} size={38} radius={999} online ringColor="#0c0c14" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate font-display">{user.name}</p>
          <p className="text-[11px] flex items-center gap-1.5" style={{ color: '#34e0a1' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#34e0a1' }} />
            Active now
          </p>
        </div>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          title="Menu" aria-label="Account menu"
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
          <AccountMenu
            className="absolute right-3 bottom-14"
            onProfile={() => navigate('/profile')}
            onLogout={logout}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>

      <nav
        className="md:hidden flex items-center justify-around px-2 pt-2 pb-3 border-t relative"
        style={{ background: '#0c0c14', borderColor: '#181826' }}
      >
        <NavBtn label="Home" active={false} onClick={() => selectChat(null)}>
          <HomeIcon width={22} height={22} />
        </NavBtn>
        <NavBtn label="Favorites" active={false} onClick={() => {}}>
          <HeartIcon width={22} height={22} />
        </NavBtn>

        <button
          onClick={() => selectChat(null)}
          aria-label="Messages"
          className="press -mt-7 w-14 h-14 rounded-full grid place-items-center text-white"
          style={{
            background: 'linear-gradient(135deg, #8b7bff, #6d5cff)',
            boxShadow: '0 8px 20px rgba(109,92,255,.45)',
          }}
        >
          <MessageIcon width={24} height={24} />
        </button>

        <NavBtn label="Activity" active={false} onClick={() => {}}>
          <CheckCheckIcon width={22} height={22} />
        </NavBtn>
        <NavBtn label="Profile" active={false} onClick={() => setMenuOpen((v) => !v)}>
          <UserIcon width={22} height={22} />
        </NavBtn>

        {menuOpen && (
          <AccountMenu
            className="absolute right-3 bottom-[68px]"
            onProfile={() => navigate('/profile')}
            onLogout={logout}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </nav>
    </aside>
  )
}

function NavBtn({ children, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="press w-11 h-11 grid place-items-center rounded-[12px] transition"
      style={{ color: active ? '#8b7bff' : '#52526a' }}
    >
      {children}
    </button>
  )
}

function AccountMenu({ className = '', onProfile, onLogout, onClose }) {
  return (
    <div
      className={`${className} z-30 w-40 rounded-[12px] border text-sm overflow-hidden`}
      style={{ background: '#13131c', borderColor: '#232334', boxShadow: '0 20px 50px rgba(0,0,0,.5)' }}
      onMouseLeave={onClose}
    >
      <button
        onClick={() => { onClose?.(); onProfile() }}
        className="block w-full text-left px-4 py-2.5 hover:bg-[#1c1c28] transition text-white"
      >
        Edit profile
      </button>
      <hr style={{ borderColor: '#232334' }} />
      <button
        onClick={() => { onClose?.(); onLogout() }}
        className="block w-full text-left px-4 py-2.5 hover:bg-[#1c1c28] transition"
        style={{ color: '#ff6ba8' }}
      >
        Logout
      </button>
    </div>
  )
}
