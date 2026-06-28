import Sidebar from '../components/Sidebar.jsx'
import ChatBox from '../components/ChatBox.jsx'
import RightSidebar from '../components/RightSidebar.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function Chat() {
  const { selectedChat } = useApp()

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-0 sm:p-6"
      style={{ background: '#0a0a0f' }}
    >
      <div
        className="w-full max-w-6xl h-full sm:h-[88vh] overflow-hidden grid
                   grid-cols-1 md:grid-cols-[340px_minmax(0,1fr)]
                   xl:grid-cols-[340px_minmax(0,1fr)_300px]
                   sm:rounded-[18px] border"
        style={{ borderColor: '#181826', boxShadow: '0 30px 80px rgba(0,0,0,.55)' }}
      >
        <Sidebar />
        <ChatBox />
        {/* Right detail panel only when a chat is open and the screen is wide */}
        {selectedChat && <RightSidebar />}
      </div>
    </div>
  )
}
