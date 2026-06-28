import { useEffect, useRef } from 'react'
import { useCall } from '../context/CallContext.jsx'
import Avatar from './Avatar.jsx'
import {
  PhoneIcon, VideoIcon, PhoneOffIcon, MicIcon, MicOffIcon, VideoOffIcon,
} from './icons.jsx'

export default function CallScreen() {
  const {
    status, callType, peer, incoming, muted, cameraOff,
    localStream, remoteStream, acceptCall, declineCall, endCall, toggleMute, toggleCamera,
  } = useCall()

  const localVid = useRef(null)
  const remoteVid = useRef(null)

  // attach streams to <video> elements once we're connected
  useEffect(() => {
    if (localVid.current && localStream.current) localVid.current.srcObject = localStream.current
    if (remoteVid.current && remoteStream.current) remoteVid.current.srcObject = remoteStream.current
  }, [status, callType, localStream, remoteStream])

  // ---- incoming call (ringing) ----
  if (incoming && status === 'idle') {
    return (
      <Backdrop>
        <Avatar name={incoming.data.callerName} src={incoming.data.callerAvatar} uid={incoming.data.callerId} size={104} radius={28} />
        <p className="font-display font-semibold text-xl mt-4">{incoming.data.callerName}</p>
        <p className="text-[13px] mt-1" style={{ color: '#7c7c92' }}>
          Incoming {incoming.data.type === 'video' ? 'video' : 'voice'} call…
        </p>
        <div className="flex gap-8 mt-9">
          <div className="flex flex-col items-center gap-2">
            <RoundBtn color="#e0457e" onClick={declineCall} label="Decline"><PhoneOffIcon width={22} height={22} /></RoundBtn>
            <span className="text-[11px]" style={{ color: '#7c7c92' }}>Decline</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <RoundBtn color="#34c759" onClick={acceptCall} label="Accept">
              {incoming.data.type === 'video' ? <VideoIcon width={22} height={22} /> : <PhoneIcon width={22} height={22} />}
            </RoundBtn>
            <span className="text-[11px]" style={{ color: '#7c7c92' }}>Accept</span>
          </div>
        </div>
      </Backdrop>
    )
  }

  if (status === 'idle') return null

  const isVideo = callType === 'video'
  return (
    <Backdrop full>
      {isVideo ? (
        <div className="relative w-full h-full">
          <video ref={remoteVid} autoPlay playsInline className="w-full h-full object-cover" />
          {/* show the peer's identity until their video arrives */}
          {status === 'calling' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Avatar name={peer?.name} src={peer?.avatar} uid={peer?.uid} size={120} radius={32} />
              <p className="font-display font-semibold text-2xl mt-5">{peer?.name}</p>
            </div>
          )}
          <video ref={localVid} autoPlay playsInline muted
            className="absolute bottom-28 right-5 w-32 sm:w-36 rounded-2xl border-2 object-cover"
            style={{ borderColor: '#6d5cff' }} />
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* voice call: audio still needs to play, hidden video element carries it */}
          <video ref={remoteVid} autoPlay playsInline className="hidden" />
          <Avatar name={peer?.name} src={peer?.avatar} uid={peer?.uid} size={120} radius={32} />
          <p className="font-display font-semibold text-2xl mt-5">{peer?.name}</p>
        </div>
      )}

      <p className="absolute top-6 text-[13px] tracking-wide" style={{ color: '#cfcfe0' }}>
        {status === 'calling' ? 'Calling…' : 'Connected'}
      </p>

      {/* controls */}
      <div className="absolute bottom-8 flex items-center gap-4">
        <RoundBtn color={muted ? '#6d5cff' : '#1c1c28'} onClick={toggleMute} label={muted ? 'Unmute' : 'Mute'}>
          {muted ? <MicOffIcon width={22} height={22} /> : <MicIcon width={22} height={22} />}
        </RoundBtn>
        {isVideo && (
          <RoundBtn color={cameraOff ? '#6d5cff' : '#1c1c28'} onClick={toggleCamera} label={cameraOff ? 'Camera on' : 'Camera off'}>
            {cameraOff ? <VideoOffIcon width={22} height={22} /> : <VideoIcon width={22} height={22} />}
          </RoundBtn>
        )}
        <RoundBtn color="#e0457e" onClick={endCall} label="End call"><PhoneOffIcon width={22} height={22} /></RoundBtn>
      </div>
    </Backdrop>
  )
}

function Backdrop({ children, full }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white"
      style={{
        background: full ? '#06060a' : 'rgba(6,6,10,.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}>
      {children}
    </div>
  )
}

function RoundBtn({ children, color, onClick, label }) {
  return (
    <button onClick={onClick} title={label} aria-label={label}
      className="press w-14 h-14 rounded-full grid place-items-center text-white"
      style={{ background: color }}>
      {children}
    </button>
  )
}
