import { useEffect, useRef, useState } from 'react'
import { useCall } from '../context/CallContext.jsx'
import Avatar from './Avatar.jsx'
import {
  PhoneIcon, VideoIcon, PhoneOffIcon, MicIcon, MicOffIcon, VideoOffIcon,
  SpeakerIcon, MessageIcon,
} from './icons.jsx'

const END = '#ff5b6a'        // danger/end-call (soft red)
const VIOLET = '#7c5cfc'

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
  // control's visual state only.
  const [speakerOn, setSpeakerOn] = useState(true)

  const localVid = useRef(null)
  const remoteVid = useRef(null)

  const connected = status === 'connected'
  const elapsed = useElapsed(connected)

  useEffect(() => {
    if (localVid.current) localVid.current.srcObject = localStream
    if (remoteVid.current) remoteVid.current.srcObject = remoteStream
  }, [status, callType, localStream, remoteStream])

  // ---- Incoming call (ringing) -----------------------------------------
  if (incoming && status === 'idle') {
    const isVideo = incoming.data.type === 'video'
    return (
      <Frame light>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <RingAvatar name={incoming.data.callerName} src={incoming.data.callerAvatar} uid={incoming.data.callerId} />
          <p className="font-semibold text-[22px] mt-7" style={{ color: 'var(--text-primary)' }}>
            {incoming.data.callerName}
          </p>
          <p className="text-[13px] mt-2" style={{ color: VIOLET }}>
            Incoming {isVideo ? 'video' : 'voice'} call…
          </p>
        </div>
        <div className="flex justify-center gap-14 pb-16">
          <Control label="Decline" color={END} onClick={declineCall}>
            <PhoneOffIcon width={26} height={26} />
          </Control>
          <Control label="Accept" color="#34d17a" onClick={acceptCall}>
            {isVideo ? <VideoIcon width={26} height={26} /> : <PhoneIcon width={26} height={26} />}
          </Control>
        </div>
      </Frame>
    )
  }

  if (status === 'idle') return null

  const isVideo = callType === 'video'

  // ---- Full-screen video call ------------------------------------------
  if (isVideo) {
    return (
      <Frame>
        <video ref={remoteVid} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" style={{ background: '#06060a' }} />

        {!connected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <RingAvatar name={peer?.name} src={peer?.avatar} uid={peer?.uid} dark />
            <p className="font-semibold text-[22px] mt-7">{peer?.name}</p>
            <p className="text-[13px] mt-2 text-white/75">Ringing on QuickChat</p>
          </div>
        )}

        {/* Picture-in-picture self view */}
        <video
          ref={localVid} autoPlay playsInline muted
          className="absolute top-6 right-5 w-28 aspect-[3/4] rounded-[20px] object-cover"
          style={{ boxShadow: '0 4px 14px rgba(0,0,0,.25)', background: '#1c1b2e' }}
        />

        {/* Caller chip */}
        <div className="absolute left-5 bottom-32 flex items-center gap-2 px-3 py-2 rounded-[16px]"
          style={{ background: 'rgba(10,10,18,.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
          <div className="text-white">
            <p className="font-semibold text-[15px] leading-tight">{peer?.name}</p>
            <p className="text-[12px] flex items-center gap-1.5 text-white/85">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: END }} />
              {connected ? elapsed : 'Connecting…'}
            </p>
          </div>
          <span className="ml-1 text-white/80"><VideoIcon width={18} height={18} /></span>
        </div>

        {/* Controls */}
        <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-4">
          <GlassBtn active={muted} onClick={toggleMute} label={muted ? 'Unmute' : 'Mute'}>
            {muted ? <MicOffIcon width={22} height={22} /> : <MicIcon width={22} height={22} />}
          </GlassBtn>
          <GlassBtn active={cameraOff} onClick={toggleCamera} label={cameraOff ? 'Camera on' : 'Camera off'}>
            {cameraOff ? <VideoOffIcon width={22} height={22} /> : <VideoIcon width={22} height={22} />}
          </GlassBtn>
          <Control label="End call" color={END} onClick={endCall}>
            <PhoneOffIcon width={26} height={26} />
          </Control>
          <GlassBtn active={speakerOn} onClick={() => setSpeakerOn((v) => !v)} label="Speaker">
            <SpeakerIcon width={22} height={22} />
          </GlassBtn>
          <GlassBtn onClick={endCall} label="Message">
            <MessageIcon width={22} height={22} />
          </GlassBtn>
        </div>
      </Frame>
    )
  }

  // ---- Audio call (camera off) -----------------------------------------
  return (
    <Frame light>
      <video ref={remoteVid} autoPlay playsInline className="hidden" />

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <RingAvatar name={peer?.name} src={peer?.avatar} uid={peer?.uid} />
        <p className="font-semibold text-[22px] mt-7" style={{ color: 'var(--text-primary)' }}>{peer?.name}</p>
        <p className="text-[14px] mt-2 font-medium" style={{ color: VIOLET }}>
          {connected ? elapsed : 'Ringing on QuickChat'}
        </p>

        {/* Camera-off indicator */}
        <div className="mt-7 flex items-center gap-2 px-3.5 py-2 rounded-full"
          style={{ background: '#eceaf2', color: '#9a99ad' }}>
          <VideoOffIcon width={18} height={18} />
          <span className="text-[12.5px] font-medium">Camera off</span>
        </div>
      </div>

      {/* Controls — Message / Mute / End / Speaker */}
      <div className="flex items-center justify-center gap-4 pb-16">
        <TintBtn onClick={endCall} label="Message">
          <MessageIcon width={22} height={22} />
        </TintBtn>
        <TintBtn active={muted} onClick={toggleMute} label={muted ? 'Unmute' : 'Mute'}>
          {muted ? <MicOffIcon width={22} height={22} /> : <MicIcon width={22} height={22} />}
        </TintBtn>
        <Control label="End call" color={END} onClick={endCall}>
          <PhoneOffIcon width={26} height={26} />
        </Control>
        <TintBtn active={speakerOn} onClick={() => setSpeakerOn((v) => !v)} label="Speaker">
          <SpeakerIcon width={22} height={22} />
        </TintBtn>
      </div>
    </Frame>
  )
}

/* Centered phone frame matching the rest of the app. `light` = white surface
   (audio / incoming), default = dark full-bleed (video). */
function Frame({ children, light }) {
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-6"
      style={{ background: 'rgba(28,27,46,.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
      <div
        className="qc-frame relative w-full h-full overflow-hidden sm:w-[400px] sm:h-[860px] sm:max-h-[94vh] sm:rounded-[34px] flex flex-col"
        style={{ background: light ? '#fff' : '#06060a' }}
      >
        {children}
      </div>
    </div>
  )
}

function RingAvatar({ name, src, uid, dark }) {
  return (
    <div
      className="rounded-full grid place-items-center"
      style={{ padding: 5, background: 'conic-gradient(var(--violet-ring), #7c5cfc, var(--violet-ring))' }}
    >
      <div className="rounded-full p-[5px]" style={{ background: dark ? '#06060a' : '#fff' }}>
        <Avatar name={name} src={src} uid={uid} size={150} radius={999} />
      </div>
    </div>
  )
}

function Control({ children, color, onClick, label }) {
  return (
    <button
      onClick={onClick} aria-label={label}
      className="press w-16 h-16 rounded-full grid place-items-center text-white"
      style={{ background: color, boxShadow: `0 12px 30px ${color}55` }}
    >
      {children}
    </button>
  )
}

// Violet-tinted square control for the light audio surface.
function TintBtn({ children, onClick, label, active }) {
  return (
    <button
      onClick={onClick} aria-label={label}
      className="press rounded-[20px] grid place-items-center transition"
      style={{
        width: 58, height: 58,
        background: active ? 'var(--violet)' : 'var(--violet-soft)',
        color: active ? '#fff' : 'var(--violet)',
      }}
    >
      {children}
    </button>
  )
}

// Dark glassy square control for the video backdrop.
function GlassBtn({ children, onClick, label, active }) {
  return (
    <button
      onClick={onClick} aria-label={label}
      className="press rounded-[18px] grid place-items-center text-white transition"
      style={{ width: 54, height: 54, background: active ? 'rgba(255,255,255,.32)' : 'rgba(255,255,255,.14)' }}
    >
      {children}
    </button>
  )
}
