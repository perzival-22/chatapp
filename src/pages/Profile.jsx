import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../../assets/assets.js'
import { useApp } from '../context/AppContext.jsx'

export default function Profile() {
  const { user, updateProfile } = useApp()
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio)
  const [avatar, setAvatar] = useState(user.avatar)
  const navigate = useNavigate()

 const [avatarFile, setAvatarFile] = useState(null)
  const handleAvatar = (e) => {
    const file = e.target.files?.[0]
    if (file) { setAvatarFile(file); setAvatar(URL.createObjectURL(file)) }
  }
  const handleSave = async (e) => {
    e.preventDefault()
    await updateProfile({ name, bio, ...(avatarFile && { avatarFile }) })
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl backdrop-blur-2xl bg-white/8 border border-white/15 rounded-2xl text-white flex flex-col md:flex-row items-center overflow-hidden">
        {/* Form */}
        <form onSubmit={handleSave} className="flex-1 w-full p-8 flex flex-col gap-5">
          <h2 className="text-xl font-medium">Profile details</h2>

          <label className="flex items-center gap-3 cursor-pointer text-sm text-white/80">
            <input type="file" accept="image/*" hidden onChange={handleAvatar} />
            <img src={assets.avatar_icon} alt="" className="h-6 opacity-80" />
            Upload profile image
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-white/55">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-md bg-transparent border border-white/25 px-4 py-2.5 outline-none focus:border-violet-300"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-white/55">Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="rounded-md bg-transparent border border-white/25 px-4 py-2.5 outline-none resize-none focus:border-violet-300"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 rounded-full py-2.5 font-medium bg-gradient-to-r from-violet-500 to-purple-600 hover:brightness-110 transition"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-full px-6 py-2.5 font-medium border border-white/25 hover:bg-white/10 transition"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Live preview */}
        <div className="w-full md:w-56 shrink-0 flex flex-col items-center gap-3 p-8 md:border-l border-white/10">
          <img
            src={avatar}
            alt="preview"
            className="h-28 w-28 rounded-full object-cover border-2 border-violet-400/50"
          />
          <p className="font-medium">{name || 'Your name'}</p>
          <p className="text-xs text-white/55 text-center">{bio || 'Your bio appears here.'}</p>
        </div>
      </div>
    </div>
  )
}
