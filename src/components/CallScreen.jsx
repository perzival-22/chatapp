import { useEffect, useRef, useState } from 'react'
import { useCall } from '../context/CallContext.jsx'
import Avatar from './Avatar.jsx'
import {
  PhoneIcon, VideoIcon, PhoneOffIcon, MicIcon, MicOffIcon, VideoOffIcon,
  SpeakerIcon, MessageIcon,
} from './icons.jsx'

const END = '#ff5b6a'           // soft red (spec danger/end-call)
const RING = '#b9a6ff'          // violet presence ring
const ACCENT = '#8b7bff'

function useElapsed(active) {
  const [sec, setSec] = useState(0)
  useEffect(() => {
    if (!active) { setSec(0); return }
    const id = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [active])
  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')
  return `${mm}.${ss} mins`
}

export default function CallScreen() {
  const {
    status, callType, peer, incoming, muted, cameraOff,
    localStream, remoteStream, acceptCall, declineCall, endCall, toggleMute, toggleCamera,
  } = useCall()

  // Speaker routing isn't reliably controllable on the web — this toggles the
  // control's visual state only. (See notes handed back with this redesign.)
  const [speakerOn, setSpeakerOn] = useState(true)

  const localVid = useRef(null)
  const remoteVid = useRef(null)

  const connected = status === 'connected'
  const elapsed = useElapsed(connected)

  useEffect(() => {
    if (localVid.current) localVid.current.srcObject = localStream
    if (remoteVid.current) remoteVid.current.srcObject = remoteStream
  }, [status, callType, localStream, remoteStream])

  // Incoming call (ringing)
  if (incoming && status === 'idle') {
    const isVideo = incoming.data.type === 'video'
    return (
      <Backdrop>
        <RingAvatar name={incoming.data.callerName} src={incoming.data.callerAvatar} uid={incoming.data.callerId} />
        <p className="font-display font-semibold text-xl mt-6">{incoming.data.callerName}</p>
        <p className="text-[13px] mt-1.5" style={{ color: ACCENT }}>
          Incoming {isVideo ? 'video' : 'voice'} call…
        </p>
        <div className="flex gap-10 mt-10">
          <Control label="Decline" color={END} onClick={declineCall}>
            <PhoneOffIcon width={24} height={24} />
          </Control>
          <Control label="Accept" color="#34c759" onClick={acceptCall}>
            {isVideo ? <VideoIcon width={24} height={24} /> : <PhoneIcon width={24} height={24} />}
          </Control>
        </div>
      </Backdrop>
    )
  }

  if (status === 'idle') return null

  const isVideo = callType === 'video'

  if (isVideo) {
    return (
      <div className="fixed inset-0 z-50 text-white" style={{ background: '#06060a' }}>
        <video ref={remoteVid} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />

        {!connected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <RingAvatar name={peer?.name} src={peer?.avatar} uid={peer?.uid} />
            <p className="font-display font-semibold text-2xl mt-6">{peer?.name}</p>
            <p className="text-[13px] mt-2" style={{ color: ACCENT }}>Ringing on QuickChat</p>
          </div>
        )}

        <video
          ref={localVid} autoPlay playsInline muted
          className="absolute top-6 right-5 w-28 sm:w-32 aspect-[3/4] rounded-[18px] object-cover border-2"
          style={{ borderColor: 'rgba(255,255,255,.5)', boxShadow: '0 4px 14px rgba(0,0,0,.45)' }}
        />

        <div className="absolute bottom-28 left-5 flex items-center gap-3">
          <div>
            <p className="font-display font-semibold text-[17px] drop-shadow">{peer?.name}</p>
            {connected && (
              <p className="text-[12px] flex items-center gap-1.5 text-white/85">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: END }} />
                {elapsed}
              </p>
            )}
          </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
          <SquareBtn glass active={muted} onClick={toggleMute} label={muted ? 'Unmute' : 'Mute'}>
            {muted ? <MicOffIcon width={22} height={22} /> : <MicIcon width={22} height={22} />}
          </SquareBtn>
          <SquareBtn glass active={cameraOff} onClick={toggleCamera} label={cameraOff ? 'Camera on' : 'Camera off'}>
            {cameraOff ? <VideoOffIcon width={22} height={22} /> : <VideoIcon width={22} height={22} />}
          </SquareBtn>
          <Control label="End call" color={END} onClick={endCall}>
            <PhoneOffIcon width={24} height={24} />
          </Control>
          <SquareBtn glass active={speakerOn} onClick={() => setSpeakerOn((v) => !v)} label="Speaker">
            <SpeakerIcon width={22} height={22} />
          </SquareBtn>
          <SquareBtn glass onClick={endCall} label="Message">
            <MessageIcon width={22} height={22} />
          </SquareBtn>
        </div>
      </div>
    )
  }

  return (
    <Backdrop full>
      <video ref={remoteVid} autoPlay playsInline className="hidden" />

      <p className="text-[12px] uppercase tracking-[.2em] mb-5" style={{ color: '#7c7c92' }}>
        {connected ? 'In call' : 'Calling…'}
      </p>

      <RingAvatar name={peer?.name} src={peer?.avatar} uid={peer?.uid} large />
      <p className="font-display font-semibold text-2xl mt-6">{peer?.name}</p>
      <p className="text-[13px] mt-2" style={{ color: ACCENT }}>
        {connected ? elapsed : 'Ringing on QuickChat'}
      </p>

      {cameraOff === false && muted && (
        <p className="text-[12px] mt-3" style={{ color: '#52526a' }}>Microphone muted</p>
      )}

      <div className="absolute bottom-12 flex items-center justify-center gap-5">
        <SquareBtn active={muted} onClick={toggleMute} label={muted ? 'Unmute' : 'Mute'}>
          {muted ? <MicOffIcon width={22} height={22} /> : <MicIcon width={22} height={22} />}
        </SquareBtn>
        <Control label="End call" color={END} onClick={endCall}>
          <PhoneOffIcon width={24} height={24} />
        </Control>
        <SquareBtn active={speakerOn} onClick={() => setSpeakerOn((v) => !v)} label="Speaker">
          <SpeakerIcon width={22} height={22} />
        </SquareBtn>
      </div>
    </Backdrop>
  )
}

function Backdrop({ children, full }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white"
      style={{
        background: full ? '#06060a' : 'rgba(6,6,10,.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </div>
  )
}

function RingAvatar({ name, src, uid, large }) {
  const size = large ? 132 : 116
  return (
    <div
      className="rounded-full grid place-items-center"
      style={{ padding: 6, background: `conic-gradient(${RING}, #6d5cff, ${RING})`, boxShadow: '0 0 40px rgba(139,123,255,.35)' }}
    >
      <div className="rounded-full p-[3px]" style={{ background: '#06060a' }}>
        <Avatar name={name} src={src} uid={uid} size={size} radius={999} />
      </div>
    </div>
  )
}

function Control({ children, color, onClick, label }) {
  return (
    <button
      onClick={onClick} title={label} aria-label={label}
      className="press w-16 h-16 rounded-full grid place-items-center text-white"
      style={{ background: color, boxShadow: `0 10px 26px ${color}55` }}
    >
      {children}
    </button>
  )
}

function SquareBtn({ children, onClick, label, active, glass }) {
  const bg = glass
    ? active ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.12)'
    : active ? '#6d5cff' : 'rgba(139,123,255,.16)'
  return (
    <button
      onClick={onClick} title={label} aria-label={label}
      className="press w-14 h-14 rounded-[18px] grid place-items-center text-white transition"
      style={{ background: bg }}
    >
      {children}
    </button>
  )
}
