import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import Avatar from '../components/Avatar.jsx'
import { ChevronLeftIcon } from '../components/icons.jsx'

export default function Profile() {
  const { user, updateProfile } = useApp()
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio)
  const [avatar, setAvatar] = useState(user.avatar)
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleAvatar = (e) => {
    const file = e.target.files?.[0]
    if (file) { setAvatarFile(file); setAvatar(URL.createObjectURL(file)) }
  }
  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await updateProfile({ name: name.trim(), bio, ...(avatarFile && { avatarFile }) })
      navigate('/')
    } catch (err) {
      console.error('Profile save failed:', err)
      setError(
        err?.code === 'storage/unauthorized' || err?.code === 'storage/unknown'
          ? 'Saved your details, but the photo upload was blocked. Check Firebase Storage rules.'
          : (err?.message || 'Could not save. Check your connection and try again.')
      )
    } finally {
      setSaving(false)
    }
  }

  const isUpload = typeof avatar === 'string' && /^(blob:|https?:)/.test(avatar)

  return (
    <div className="fixed inset-0 flex items-stretch justify-center sm:items-center sm:p-6" style={{ background: 'var(--bg-shell)' }}>
      <div className="qc-frame relative w-full h-full overflow-hidden bg-white sm:w-[400px] sm:h-[860px] sm:max-h-[94vh] sm:rounded-[34px] flex flex-col" style={{ color: 'var(--text-primary)' }}>
        {/* Header */}
        <div className="qc-grad px-5 pt-5 pb-7 rounded-b-[26px] text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              aria-label="Back"
              className="press w-9 h-9 rounded-[12px] grid place-items-center bg-white/15 hover:bg-white/25 transition"
            >
              <ChevronLeftIcon width={20} height={20} />
            </button>
            <p className="font-bold text-[18px]">Edit profile</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto scroll-thin px-6 flex flex-col items-center">
          {/* Avatar with upload */}
          <label className="relative -mt-12 cursor-pointer group">
            <input type="file" accept="image/*" hidden onChange={handleAvatar} />
            <div className="rounded-full p-[5px]" style={{ background: 'conic-gradient(var(--violet-ring), var(--violet), var(--violet-ring))' }}>
              <div className="rounded-full p-[4px] bg-white">
                {isUpload ? (
                  <img src={avatar} alt="preview" className="w-[112px] h-[112px] rounded-full object-cover" />
                ) : (
                  <Avatar name={name} src={avatar} uid={user.uid} size={112} radius={999} />
                )}
              </div>
            </div>
            <span
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full grid place-items-center text-white qc-grad"
              style={{ boxShadow: '0 6px 16px rgba(124,92,252,.4)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
          </label>
          <p className="text-[12px] mt-2.5" style={{ color: 'var(--text-secondary)' }}>Tap to change photo</p>

          <div className="w-full mt-7">
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-[14px] px-4 py-3 text-[14.5px] outline-none focus:ring-2"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="w-full mt-4">
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full rounded-[14px] px-4 py-3 text-[14.5px] outline-none resize-none"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
          </div>

          {error && (
            <p
              className="w-full mt-4 text-[12.5px] rounded-[12px] px-3 py-2.5"
              style={{ background: '#ffecef', color: 'var(--end-call)' }}
            >
              {error}
            </p>
          )}
        </form>

        <div className="p-5 flex gap-3 bg-white">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="press flex-1 rounded-full py-3 text-[14.5px] font-semibold"
            style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="press flex-1 rounded-full py-3 text-[14.5px] font-semibold text-white qc-grad disabled:opacity-50"
            style={{ boxShadow: '0 8px 20px rgba(124,92,252,.4)' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
