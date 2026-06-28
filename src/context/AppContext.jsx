import { createContext, useContext, useMemo, useState } from 'react'
import { currentUser as seedUser, dummyChats } from '../data/dummyData.js'

/**
 * AppContext holds all app state in memory for the DRAFT.
 *
 * When Firebase is wired in, this is the ONLY file that changes much:
 *   - `user` comes from onAuthStateChanged + users/{uid} doc
 *   - `chats` comes from an onSnapshot listener on the chats collection
 *   - `sendMessage` writes to chats/{id}/messages via addDoc
 *   - `login` / `logout` call Firebase Auth
 * The components consuming this context stay the same.
 */
const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(seedUser)
  const [isAuthed, setIsAuthed] = useState(false) // draft: starts logged out
  const [chats, setChats] = useState(dummyChats)
  const [selectedChatId, setSelectedChatId] = useState(dummyChats[0].id)

  // --- Auth (fake) -------------------------------------------------------
  const login = () => setIsAuthed(true)
  const logout = () => setIsAuthed(false)

  // --- Profile -----------------------------------------------------------
  const updateProfile = (patch) => setUser((u) => ({ ...u, ...patch }))

  // --- Messaging ---------------------------------------------------------
  const sendMessage = ({ text, image }) => {
    if (!text?.trim() && !image) return
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChatId
          ? {
              ...c,
              unread: 0,
              messages: [
                ...c.messages,
                {
                  id: `m_${Date.now()}`,
                  senderId: user.uid,
                  text: text?.trim() || '',
                  image: image || null,
                  createdAt: Date.now(),
                },
              ],
            }
          : c
      )
    )
  }

  const selectChat = (chatId) => {
    setSelectedChatId(chatId)
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)))
  }

  const value = useMemo(
    () => ({
      user,
      isAuthed,
      chats,
      selectedChatId,
      selectedChat: chats.find((c) => c.id === selectedChatId) || null,
      login,
      logout,
      updateProfile,
      sendMessage,
      selectChat,
    }),
    [user, isAuthed, chats, selectedChatId]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
