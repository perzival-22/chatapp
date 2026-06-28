import { Navigate, Route, Routes } from 'react-router-dom'
import bg from '../assets/background.png'
import Login from './pages/Login.jsx'
import Chat from './pages/Chat.jsx'
import Profile from './pages/Profile.jsx'
import CallScreen from './components/CallScreen.jsx'
import { useApp } from './context/AppContext.jsx'

export default function App() {
  const { isAuthed, authReady } = useApp()
if (!authReady) return <div className="min-h-screen grid place-items-center text-white">Loading…</div>

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <Routes>
        <Route path="/login" element={isAuthed ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={isAuthed ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthed ? <Profile /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {isAuthed && <CallScreen />}
    </div>
  )
}
