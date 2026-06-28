import Sidebar from '../components/Sidebar.jsx'
import ChatBox from '../components/ChatBox.jsx'
import RightSidebar from '../components/RightSidebar.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function Chat() {
  const { selectedChat } = useApp()

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8">
      <div
        className="w-full max-w-6xl h-[88vh] backdrop-blur-2xl bg-white/8 border border-white/15
                   rounded-2xl overflow-hidden grid
                   grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]
                   xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]"
      >
        <Sidebar />
        <ChatBox />
        {/* Right panel only when a chat is open and the screen is wide */}
        {selectedChat && <RightSidebar />}
      </div>
    </div>
  )
}
