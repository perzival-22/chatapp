import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore'

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import {auth, db, storage } from '../lib/firebase.js'
import assets from '../../assets/assets.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady ] = useState(false)
  const [allUsers, setAllUsers] = useState([])   // everyone (to start new chats)
  const [chats, setChats] = useState([])
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [messages, setMessages] = useState([])
  
  const isAuthed = !!user

  //------Auth: Keep the profile in sync with firebase auth-------
  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const snap = await getDoc(doc(db, 'users', fbUser.uid))
        setUser(snap.exists() ? snap.data() : null)
      } else {
        setUser(null)
      }
      setAuthReady(true)
    })
  }, [])
// --- Load all users (for the "start new chat" search) -------------------
  useEffect(() => {
    if (!user) return
    return onSnapshot(collection(db, 'users'), (qs) => {
      setAllUsers(qs.docs.map((d) => d.data()).filter((u) => u.uid !== user.uid))
    })
  }, [user])

  // --- Live conversation list for the current user ------------------------
  useEffect(() => {
    if (!user) { setChats([]); return }
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    )
    return onSnapshot(q, (qs) => {
      setChats(qs.docs.map((d) => {
        const data = d.data()
        const otherId = data.participants.find((id) => id !== user.uid)
        return {
          id: d.id,
          participantId: otherId,
          lastMessage: data.lastMessage || '',
          lastMessageAt: data.lastMessageAt?.toMillis?.() ?? 0,
          messages: [], // filled by the message listener when selected
        }
      }))
    })
  }, [user])

  // --- Live messages for the selected chat --------------------------------
  useEffect(() => {
    if (!selectedChatId) { setMessages([]); return }
    const q = query(
      collection(db, 'chats', selectedChatId, 'messages'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, (qs) => {
      setMessages(qs.docs.map((d) => {
        const m = d.data()
        return { id: d.id, ...m, createdAt: m.createdAt?.toMillis?.() ?? Date.now() }
      }))
    })
  }, [selectedChatId])

  // --- Actions ------------------------------------------------------------
  const signup = async (name, email, password) => {
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password)
    const profile = {
      uid: fbUser.uid, name, email,
      bio: 'Hi, I am using QuickChat.',
      avatar: assets.avatar_icon, lastSeen: Date.now(),
    }
    await setDoc(doc(db, 'users', fbUser.uid), profile)
    setUser(profile)
  }

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const logout = () => signOut(auth)

  const updateProfile = async ({ avatarFile, ...fields } = {}) => {
    // Persist text fields (name/bio) FIRST so they aren't lost if the avatar
    // upload later fails (Storage disabled, rules, CORS, offline, etc.).
    if (Object.keys(fields).length) {
      await updateDoc(doc(db, 'users', user.uid), fields)
      setUser((u) => ({ ...u, ...fields }))
    }
    if (avatarFile) {
      const r = ref(storage, `avatars/${user.uid}`)
      await uploadBytes(r, avatarFile)
      const avatar = await getDownloadURL(r)
      await updateDoc(doc(db, 'users', user.uid), { avatar })
      setUser((u) => ({ ...u, avatar }))
    }
  }

  // Deterministic id so two people always share ONE chat doc
  const chatIdFor = (a, b) => [a, b].sort().join('_')

  const startChat = async (other) => {
    const id = chatIdFor(user.uid, other.uid)
    await setDoc(
      doc(db, 'chats', id),
      {
        participants: [user.uid, other.uid],
        participantInfo: {
          [user.uid]: { name: user.name, avatar: user.avatar },
          [other.uid]: { name: other.name, avatar: other.avatar },
        },
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
      },
      { merge: true }
    )
    setSelectedChatId(id)
  }

  const sendMessage = async ({ text, imageFile }) => {
    if (!selectedChatId || (!text?.trim() && !imageFile)) return
    let image = null
    if (imageFile) {
      const r = ref(storage, `chats/${selectedChatId}/${Date.now()}`)
      await uploadBytes(r, imageFile)
      image = await getDownloadURL(r)
    }
    await addDoc(collection(db, 'chats', selectedChatId, 'messages'), {
      senderId: user.uid, text: text?.trim() || '', image, createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'chats', selectedChatId), {
      lastMessage: image ? '📷 Photo' : text.trim(),
      lastMessageAt: serverTimestamp(),
    })
  }

  const selectChat = (id) => setSelectedChatId(id)

  const findUser = (uid) => {
    if (user && uid === user.uid) return user
    return allUsers.find((u) => u.uid === uid) || { name: 'Unknown', avatar: assets.avatar_icon }
  }

  const value = useMemo(() => ({
    user, isAuthed, authReady, allUsers, chats, selectedChatId,
    selectedChat: selectedChatId
      ? { id: selectedChatId, participantId: chats.find((c) => c.id === selectedChatId)?.participantId, messages }
      : null,
    login, signup, logout, updateProfile, sendMessage, selectChat, startChat, findUser,
  }), [user, isAuthed, authReady, allUsers, chats, selectedChatId, messages])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
