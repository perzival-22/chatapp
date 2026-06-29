import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Chat from './pages/Chat.jsx'
import Profile from './pages/Profile.jsx'
import CallScreen from './components/CallScreen.jsx'
import { useApp } from './context/AppContext.jsx'

export default function App() {
  const { isAuthed, authReady } = useApp()
  if (!authReady) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: 'var(--bg-shell)', color: 'var(--violet)' }}>
        Loading…
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={isAuthed ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={isAuthed ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthed ? <Profile /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {/* Call overlay lives above all authed surfaces (incoming + active calls) */}
      {isAuthed && <CallScreen />}
    </>
  )
}
