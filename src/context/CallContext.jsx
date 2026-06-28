import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, updateDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { rtcConfig } from '../lib/ice.js'
import { useApp } from './AppContext.jsx'

const CallContext = createContext(null)

export function CallProvider({ children }) {
  const { user, findUser } = useApp()

  // 'idle' | 'calling' | 'ringing' | 'connected'
  const [status, setStatus] = useState('idle')
  const [callType, setCallType] = useState('video')   // 'voice' | 'video'
  const [peer, setPeer] = useState(null)              // the other user's profile
  const [incoming, setIncoming] = useState(null)      // { callId, data } when someone rings us
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)

  // streams exposed to <CallScreen> via refs (videos read these)
  const localStream = useRef(null)
  const remoteStream = useRef(null)
  const pc = useRef(null)
  const callRef = useRef(null)       // Firestore doc ref of the active call
  const unsubs = useRef([])          // snapshot unsubscribers to clean up

  const stop = (fn) => { try { fn() } catch { /* best effort */ } }

  // ---- shared setup ------------------------------------------------------
  const buildPeer = async (type) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    })
    localStream.current = stream
    remoteStream.current = new MediaStream()

    const connection = new RTCPeerConnection(rtcConfig)
    stream.getTracks().forEach((t) => connection.addTrack(t, stream))
    connection.ontrack = (e) => {
      e.streams[0].getTracks().forEach((t) => remoteStream.current.addTrack(t))
    }
    connection.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(connection.connectionState)) endCall()
    }
    pc.current = connection
    return connection
  }

  // ---- CALLER ------------------------------------------------------------
  const startCall = async (otherUser, type = 'video') => {
    if (status !== 'idle') return
    setCallType(type); setPeer(otherUser); setStatus('calling')
    let connection
    try {
      connection = await buildPeer(type)
    } catch (err) {
      // mic/cam permission denied or unavailable — bail cleanly
      console.error('getUserMedia failed:', err)
      setStatus('idle'); setPeer(null)
      return
    }

    const ref = doc(collection(db, 'calls'))
    callRef.current = ref
    const offerCandidates = collection(ref, 'offerCandidates')
    const answerCandidates = collection(ref, 'answerCandidates')

    connection.onicecandidate = (e) => {
      if (e.candidate) addDoc(offerCandidates, e.candidate.toJSON())
    }

    const offer = await connection.createOffer()
    await connection.setLocalDescription(offer)

    await setDoc(ref, {
      callerId: user.uid,
      callerName: user.name,
      callerAvatar: user.avatar,
      calleeId: otherUser.uid,
      type,
      offer: { type: offer.type, sdp: offer.sdp },
      status: 'ringing',
      createdAt: serverTimestamp(),
    })

    // listen for the answer + status changes
    unsubs.current.push(onSnapshot(ref, (snap) => {
      const data = snap.data()
      if (!data) return
      if (data.answer && !connection.currentRemoteDescription) {
        connection.setRemoteDescription(new RTCSessionDescription(data.answer))
        setStatus('connected')
      }
      if (data.status === 'declined' || data.status === 'ended') endCall()
    }))

    // remote ICE candidates (buffered until remote description exists)
    unsubs.current.push(onSnapshot(answerCandidates, (qs) => {
      qs.docChanges().forEach((c) => {
        if (c.type === 'added' && connection.currentRemoteDescription) {
          connection.addIceCandidate(new RTCIceCandidate(c.doc.data()))
        }
      })
    }))
  }

  // ---- CALLEE ------------------------------------------------------------
  const acceptCall = async () => {
    if (!incoming) return
    const { callId, data } = incoming
    setCallType(data.type)
    setPeer(findUser(data.callerId) || { name: data.callerName, avatar: data.callerAvatar, uid: data.callerId })
    setStatus('connected')
    setIncoming(null)

    let connection
    try {
      connection = await buildPeer(data.type)
    } catch (err) {
      console.error('getUserMedia failed:', err)
      await updateDoc(doc(db, 'calls', callId), { status: 'declined' }).catch(() => {})
      setStatus('idle'); setPeer(null)
      return
    }

    const ref = doc(db, 'calls', callId)
    callRef.current = ref
    const offerCandidates = collection(ref, 'offerCandidates')
    const answerCandidates = collection(ref, 'answerCandidates')

    connection.onicecandidate = (e) => {
      if (e.candidate) addDoc(answerCandidates, e.candidate.toJSON())
    }

    await connection.setRemoteDescription(new RTCSessionDescription(data.offer))
    const answer = await connection.createAnswer()
    await connection.setLocalDescription(answer)
    await updateDoc(ref, { answer: { type: answer.type, sdp: answer.sdp }, status: 'accepted' })

    unsubs.current.push(onSnapshot(offerCandidates, (qs) => {
      qs.docChanges().forEach((c) => {
        if (c.type === 'added') connection.addIceCandidate(new RTCIceCandidate(c.doc.data()))
      })
    }))
    unsubs.current.push(onSnapshot(ref, (snap) => {
      if (snap.data()?.status === 'ended') endCall()
    }))
  }

  const declineCall = async () => {
    if (incoming) await updateDoc(doc(db, 'calls', incoming.callId), { status: 'declined' })
    setIncoming(null)
  }

  // ---- shared teardown ---------------------------------------------------
  const endCall = async () => {
    unsubs.current.forEach((u) => stop(u)); unsubs.current = []
    stop(() => localStream.current?.getTracks().forEach((t) => t.stop()))
    stop(() => pc.current?.close())
    if (callRef.current) {
      stop(() => updateDoc(callRef.current, { status: 'ended' }))
      // best-effort cleanup of the signaling doc
      const ref = callRef.current
      setTimeout(async () => {
        for (const sub of ['offerCandidates', 'answerCandidates']) {
          const qs = await getDocs(collection(ref, sub)).catch(() => null)
          qs?.forEach((d) => deleteDoc(d.ref))
        }
        deleteDoc(ref).catch(() => {})
      }, 1500)
    }
    pc.current = null; callRef.current = null
    localStream.current = null; remoteStream.current = null
    setStatus('idle'); setPeer(null); setMuted(false); setCameraOff(false)
  }

  // ---- in-call controls --------------------------------------------------
  const toggleMute = () => {
    const track = localStream.current?.getAudioTracks()[0]
    if (track) { track.enabled = !track.enabled; setMuted(!track.enabled) }
  }
  const toggleCamera = () => {
    const track = localStream.current?.getVideoTracks()[0]
    if (track) { track.enabled = !track.enabled; setCameraOff(!track.enabled) }
  }

  // ---- incoming-call listener (always on while logged in) ---------------
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'calls'), where('calleeId', '==', user.uid))
    return onSnapshot(q, (qs) => {
      // ignore while already in a call
      if (status !== 'idle') return
      const ring = qs.docs.find((d) => d.data().status === 'ringing' && !d.data().answer)
      setIncoming(ring ? { callId: ring.id, data: ring.data() } : null)
    })
  }, [user, status])

  return (
    <CallContext.Provider value={{
      status, callType, peer, incoming, muted, cameraOff,
      localStream, remoteStream,
      startCall, acceptCall, declineCall, endCall, toggleMute, toggleCamera,
    }}>
      {children}
    </CallContext.Provider>
  )
}

export const useCall = () => {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error('useCall must be used inside <CallProvider>')
  return ctx
}
