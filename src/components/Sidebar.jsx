import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import Avatar from './Avatar.jsx'
import {
  SearchIcon, CheckCheckIcon, ChevronLeftIcon,
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

  const tabCount = (id) =>
    id === 'all'
      ? chats.filter((c) => !c.archived).length
      : id === 'unread'
        ? chats.filter((c) => (c.unread || 0) > 0).length
        : chats.filter((c) => c.archived).length

  const railPeople = allUsers.slice(0, 10)
  const focusSearch = () => searchRef.current?.focus()

  return (
    <aside className="flex flex-col h-full bg-white relative" style={{ color: 'var(--text-primary)' }}>
      {/* Header — violet gradient block */}
      <div className="qc-grad px-5 pt-5 pb-5 rounded-b-[26px] text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={focusSearch}
            aria-label="Menu"
            className="press w-9 h-9 rounded-[12px] grid place-items-center bg-white/15 hover:bg-white/25 transition shrink-0"
          >
            <ChevronLeftIcon width={20} height={20} />
          </button>
          <div className="flex-1 leading-tight">
            <p className="font-bold text-[19px] tracking-[-0.01em]">Chat Box</p>
            <p className="text-[11.5px] text-white/75">{chats.length} conversations</p>
          </div>
        </div>

        {railPeople.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-[.12em] text-white/65 mb-2">Active now</p>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-0.5">
              {railPeople.map((u) => (
                <button
                  key={u.uid}
                  onClick={() => startChat(u)}
                  className="press shrink-0 flex flex-col items-center gap-1 w-[54px]"
                  title={`Chat with ${u.name}`}
                >
                  <Avatar
                    name={u.name} src={u.avatar} uid={u.uid} size={48} radius={999}
                    online={u.online} ringColor="#6d4ae0"
                  />
                  <span className="text-[11px] text-white/85 truncate w-full text-center">
                    {u.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="px-5 pt-4">
        <div
          className="flex items-center gap-2.5 rounded-[14px] px-3.5 py-3"
          style={{ background: 'var(--bg-surface)' }}
        >
          <SearchIcon width={17} height={17} style={{ color: 'var(--text-secondary)' }} />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="bg-transparent text-[13.5px] outline-none flex-1 placeholder:text-[var(--text-secondary)]"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Segmented tabs */}
      <div className="px-5 pt-4 pb-1">
        <div className="flex items-center gap-2">
          {TABS.map((t) => {
            const active = tab === t.id
            const count = tabCount(t.id)
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="press flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition"
                style={{
                  background: active ? 'var(--violet-soft)' : 'transparent',
                  color: active ? 'var(--violet)' : 'var(--text-secondary)',
                }}
              >
                {t.label}
                {count > 0 && (
                  <span
                    className="grid place-items-center min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold"
                    style={{
                      background: active ? 'var(--violet)' : '#e9e7f2',
                      color: active ? '#fff' : 'var(--text-secondary)',
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

      {/* People matches (start a new chat) */}
      {userMatches.length > 0 && (
        <div className="px-3 pb-2 border-b" style={{ borderColor: '#f0eef7' }}>
          <p className="text-[11px] uppercase tracking-[.1em] px-3 pt-2 pb-1.5" style={{ color: 'var(--text-secondary)' }}>
            People
          </p>
          {userMatches.map((u) => (
            <button
              key={u.uid}
              onClick={() => { startChat(u); setQuery('') }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] mb-0.5 text-left transition hover:bg-[var(--bg-surface)]"
            >
              <Avatar name={u.name} src={u.avatar} uid={u.uid} size={40} radius={999} />
              <p className="text-[14px] font-semibold truncate">{u.name}</p>
            </button>
          ))}
        </div>
      )}

      {/* Conversation rows */}
      <div className="flex-1 overflow-y-auto scroll-thin px-3 py-2">
        {visibleChats.map((c) => {
          const other = findUser(c.participantId)
          const active = c.id === selectedChatId
          const unread = c.unread || 0
          return (
            <button
              key={c.id}
              onClick={() => selectChat(c.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[16px] mb-0.5 text-left transition"
              style={{ background: active ? 'var(--bg-surface)' : 'transparent' }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-surface)' }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Avatar name={other.name} src={other.avatar} uid={other.uid} size={50} radius={999} online={other.online} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[15px] font-semibold truncate">{other.name}</p>
                  {c.lastMessageAt > 0 && (
                    <span className="text-[11.5px] shrink-0" style={{ color: 'var(--text-secondary)' }}>
                      {formatTime(c.lastMessageAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p
                    className="text-[13px] truncate"
                    style={{ color: unread > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: unread > 0 ? 600 : 400 }}
                  >
                    {c.lastMessage || 'Say hi 👋'}
                  </p>
                  {unread > 0 ? (
                    <span
                      className="qc-glow shrink-0 h-[20px] min-w-[20px] px-1.5 grid place-items-center text-[11px] font-bold rounded-full text-white"
                    >
                      {unread}
                    </span>
                  ) : (
                    c.lastMessageAt > 0 && (
                      <CheckCheckIcon width={16} height={16} style={{ color: 'var(--violet)' }} />
                    )
                  )}
                </div>
              </div>
            </button>
          )
        })}
        {visibleChats.length === 0 && userMatches.length === 0 && (
          <p className="text-center text-[13px] mt-10" style={{ color: 'var(--text-secondary)' }}>
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

      {/* Bottom tab bar */}
      <nav
        className="flex items-center justify-around px-4 pt-2 pb-4 border-t relative bg-white"
        style={{ borderColor: '#f0eef7' }}
      >
        <NavBtn label="Home" onClick={() => selectChat(null)}>
          <HomeIcon width={23} height={23} />
        </NavBtn>
        <NavBtn label="Favorites" onClick={() => {}}>
          <HeartIcon width={23} height={23} />
        </NavBtn>

        <button
          onClick={() => selectChat(null)}
          aria-label="Messages"
          className="press -mt-8 rounded-full grid place-items-center text-white qc-grad"
          style={{ width: 60, height: 60, boxShadow: '0 8px 20px rgba(109,74,224,.4)' }}
        >
          <MessageIcon width={26} height={26} />
        </button>

        <NavBtn label="Activity" onClick={() => {}}>
          <CheckCheckIcon width={23} height={23} />
        </NavBtn>
        <NavBtn label="Profile" onClick={() => setMenuOpen((v) => !v)}>
          <UserIcon width={23} height={23} />
        </NavBtn>

        {menuOpen && (
          <AccountMenu
            className="absolute right-4 bottom-[76px]"
            user={user}
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
      className="press w-11 h-11 grid place-items-center rounded-[14px] transition"
      style={{ color: active ? 'var(--violet)' : '#b4b3c6' }}
    >
      {children}
    </button>
  )
}

function AccountMenu({ className = '', user, onProfile, onLogout, onClose }) {
  return (
    <div
      className={`${className} z-30 w-48 rounded-[16px] border text-sm overflow-hidden bg-white`}
      style={{ borderColor: '#ece9f6', boxShadow: '0 20px 50px rgba(28,27,46,.18)' }}
      onMouseLeave={onClose}
    >
      <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: '#f0eef7' }}>
        <Avatar name={user.name} src={user.avatar} uid={user.uid} size={36} radius={999} online />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
          <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--online)' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--online)' }} />
            Active now
          </p>
        </div>
      </div>
      <button
        onClick={() => { onClose?.(); onProfile() }}
        className="block w-full text-left px-4 py-2.5 transition hover:bg-[var(--bg-surface)]"
        style={{ color: 'var(--text-primary)' }}
      >
        Edit profile
      </button>
      <button
        onClick={() => { onClose?.(); onLogout() }}
        className="block w-full text-left px-4 py-2.5 transition hover:bg-[var(--bg-surface)]"
        style={{ color: 'var(--end-call)' }}
      >
        Logout
      </button>
    </div>
  )
}
