import { useApp } from '../context/AppContext.jsx'
import Avatar from './Avatar.jsx'
import { formatLastSeen } from '../lib/time.js'

export default function RightSidebar() {
  const { selectedChat, findUser } = useApp()
  if (!selectedChat) return null

  const other = findUser(selectedChat.participantId)
  const media = selectedChat.messages.filter((m) => m.image).map((m) => m.image)

  return (
    <aside
      className="hidden xl:flex flex-col h-full border-l"
      style={{ background: '#0c0c14', borderColor: '#181826', color: '#ececf4' }}
    >
      {/* Profile */}
      <div className="flex flex-col items-center text-center px-6 pt-9 pb-6 border-b" style={{ borderColor: '#181826' }}>
        <Avatar name={other.name} src={other.avatar} uid={other.uid} size={88} radius={24} online={other.online} ringColor="#0c0c14" />
        <h3 className="mt-4 font-display font-semibold text-[17px]">{other.name}</h3>
        {other.online ? (
          <p className="text-[12px] mt-1 flex items-center gap-1.5" style={{ color: '#34e0a1' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#34e0a1' }} />
            Active now
          </p>
        ) : (
          <p className="text-[12px] mt-1" style={{ color: '#52526a' }}>
            {other.lastSeen ? `Last seen ${formatLastSeen(other.lastSeen)}` : 'Offline'}
          </p>
        )}
        {other.bio && (
          <p className="text-[13px] mt-3 leading-relaxed" style={{ color: '#7c7c92' }}>{other.bio}</p>
        )}
      </div>

      {/* Shared media */}
      <div className="flex-1 overflow-y-auto scroll-thin px-6 py-5">
        <p className="text-[11px] uppercase tracking-[.1em] mb-3" style={{ color: '#52526a' }}>
          Shared media
        </p>
        {media.length ? (
          <div className="grid grid-cols-3 gap-2">
            {media.map((src, i) => (
              <img
                key={i}
                src={src}
                alt="shared"
                className="aspect-square w-full object-cover rounded-[12px] border"
                style={{ borderColor: '#20202e' }}
              />
            ))}
          </div>
        ) : (
          <p className="text-[13px]" style={{ color: '#52526a' }}>No media shared yet.</p>
        )}
      </div>
    </aside>
  )
}
