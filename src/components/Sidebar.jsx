import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../../assets/assets.js'
import { useApp } from '../context/AppContext.jsx'
import { findUser } from '../data/dummyData.js'

export default function Sidebar() {
  const { chats, selectedChatId, selectChat, user, logout } = useApp()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const visibleChats = chats.filter((c) =>
    findUser(c.participantId).name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <aside className="text-white flex flex-col h-full bg-black/10 border-r border-white/10">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between">
          <img src={assets.logo} alt="QuickChat" className="h-7" />
          <div className="relative">
            <img
              src={assets.menu_icon}
              alt="menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="h-5 cursor-pointer opacity-80 hover:opacity-100"
            />
            {menuOpen && (
              <div
                className="absolute right-0 top-7 z-10 w-36 rounded-md bg-zinc-800/95 border border-white/10 text-sm shadow-xl"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => navigate('/profile')}
                  className="block w-full text-left px-4 py-2 hover:bg-white/10"
                >
                  Edit Profile
                </button>
                <hr className="border-white/10" />
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 hover:bg-white/10"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 flex items-center gap-2 rounded-full bg-black/20 border border-white/10 px-3 py-2">
          <img src={assets.search_icon} alt="" className="h-3.5 opacity-70" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users"
            className="bg-transparent text-xs outline-none placeholder-white/50 flex-1"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scroll-thin px-2">
        {visibleChats.map((c) => {
          const other = findUser(c.participantId)
          const last = c.messages[c.messages.length - 1]
          const active = c.id === selectedChatId
          return (
            <button
              key={c.id}
              onClick={() => selectChat(c.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-left transition
                ${active ? 'bg-violet-500/30' : 'hover:bg-white/8'}`}
            >
              <div className="relative shrink-0">
                <img src={other.avatar} alt={other.name} className="h-9 w-9 rounded-full object-cover" />
                {other.online && (
                  <img src={assets.green_dot} alt="" className="absolute -bottom-0.5 -right-0.5 h-3" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{other.name}</p>
                <p className="text-xs text-white/55 truncate">
                  {last?.image ? '📷 Photo' : last?.text || 'Say hi 👋'}
                </p>
              </div>
              {c.unread > 0 && (
                <span className="shrink-0 h-5 min-w-5 px-1.5 grid place-items-center text-[11px] rounded-full bg-violet-500">
                  {c.unread}
                </span>
              )}
            </button>
          )
        })}
        {visibleChats.length === 0 && (
          <p className="text-center text-xs text-white/50 mt-6">No conversations found.</p>
        )}
      </div>

      {/* Current user footer */}
      <div className="p-4 flex items-center gap-3 border-t border-white/10">
        <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-emerald-400">online</p>
        </div>
      </div>
    </aside>
  )
}
