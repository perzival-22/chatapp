import assets from '../../assets/assets.js'
import { useApp } from '../context/AppContext.jsx'
import { findUser } from '../data/dummyData.js'
import { formatLastSeen } from '../lib/time.js'

export default function RightSidebar() {
  const { selectedChat, logout } = useApp()
  if (!selectedChat) return null

  const other = findUser(selectedChat.participantId)
  const media = selectedChat.messages.filter((m) => m.image).map((m) => m.image)

  return (
    <aside className="hidden xl:flex flex-col h-full text-white bg-black/10 border-l border-white/10">
      {/* Profile */}
      <div className="flex flex-col items-center text-center px-6 pt-8 pb-5 border-b border-white/10">
        <img src={other.avatar} alt={other.name} className="h-20 w-20 rounded-full object-cover" />
        <div className="mt-3 flex items-center gap-2">
          {other.online && <img src={assets.green_dot} alt="" className="h-2.5" />}
          <h3 className="font-medium">{other.name}</h3>
        </div>
        <p className="text-xs text-white/55 mt-1">{other.bio}</p>
        <p className="text-[11px] text-white/40 mt-2">
          {other.online ? 'Active now' : `Last seen ${formatLastSeen(other.lastSeen)}`}
        </p>
      </div>

      {/* Shared media */}
      <div className="flex-1 overflow-y-auto scroll-thin px-6 py-4">
        <p className="text-xs uppercase tracking-wide text-white/45 mb-3">Shared media</p>
        {media.length ? (
          <div className="grid grid-cols-2 gap-2">
            {media.map((src, i) => (
              <img
                key={i}
                src={src}
                alt="shared"
                className="h-20 w-full object-cover rounded-lg border border-white/10"
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/40">No media shared yet.</p>
        )}
      </div>

      <div className="p-5">
        <button
          onClick={logout}
          className="w-full rounded-full py-2 text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 hover:brightness-110 transition"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
