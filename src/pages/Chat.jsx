import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import ChatBox from '../components/ChatBox.jsx'
import ContactProfile from '../components/ContactProfile.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function Chat() {
  const { selectedChat } = useApp()
  const [showProfile, setShowProfile] = useState(false)

  // Leaving a thread (or switching to another) drops back to the message view.
  useEffect(() => {
    setShowProfile(false)
  }, [selectedChat?.id])

  const inThread = !!selectedChat

  return (
    <div
      className="fixed inset-0 flex items-stretch justify-center sm:items-center sm:p-6"
      style={{ background: '#eceaf6' }}
    >
      <div className="qc-frame relative w-full h-full overflow-hidden bg-white sm:w-[400px] sm:h-[860px] sm:max-h-[94vh] sm:rounded-[34px] flex flex-col">
        {inThread ? (
          showProfile ? (
            <ContactProfile onBack={() => setShowProfile(false)} />
          ) : (
            <ChatBox onOpenProfile={() => setShowProfile(true)} />
          )
        ) : (
          <Sidebar />
        )}
      </div>
    </div>
  )
}
