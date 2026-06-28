import assets from '../../assets/assets.js'

// ---------------------------------------------------------------------------
// DUMMY DATA
// Shapes here intentionally mirror the Firestore documents we'll use later so
// swapping the data source is a drop-in change. See README "Firestore schema".
//
//   users/{uid}      -> { uid, name, email, bio, avatar, lastSeen }
//   chats/{chatId}   -> { id, participants:[uid], messages:[Message] }
//   Message          -> { id, senderId, text, image, createdAt }
// ---------------------------------------------------------------------------

// The logged-in user (later: Firebase Auth currentUser + users/{uid} doc)
export const currentUser = {
  uid: 'u_richard',
  name: 'Richard Sanford',
  email: 'richard@quickchat.dev',
  bio: 'Hi, I am using QuickChat. Coffee, code, and good music.',
  avatar: assets.profile_img,
  lastSeen: Date.now(),
}

// Other people you can chat with (later: users collection)
export const dummyUsers = [
  {
    uid: 'u_alison',
    name: 'Alison Walters',
    email: 'alison@quickchat.dev',
    bio: 'Designer. Probably rearranging pixels right now.',
    avatar: assets.avatar_icon,
    online: true,
    lastSeen: Date.now() - 1000 * 60 * 2,
  },
  {
    uid: 'u_enrique',
    name: 'Enrique Mendoza',
    email: 'enrique@quickchat.dev',
    bio: 'Frontend dev & weekend cyclist.',
    avatar: assets.avatar_icon,
    online: true,
    lastSeen: Date.now() - 1000 * 60 * 5,
  },
  {
    uid: 'u_marco',
    name: 'Marco Rossi',
    email: 'marco@quickchat.dev',
    bio: 'Pasta, photography, and product.',
    avatar: assets.avatar_icon,
    online: false,
    lastSeen: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    uid: 'u_martin',
    name: 'Martin Cole',
    email: 'martin@quickchat.dev',
    bio: 'Building things on the internet.',
    avatar: assets.avatar_icon,
    online: false,
    lastSeen: Date.now() - 1000 * 60 * 60 * 26,
  },
]

const now = Date.now()
const mins = (n) => now - n * 60 * 1000

// One conversation per user (later: chats collection filtered by participants)
export const dummyChats = [
  {
    id: 'c_alison',
    participantId: 'u_alison',
    unread: 2,
    messages: [
      { id: 'm1', senderId: 'u_alison', text: 'Hey! Did you get a chance to look at the mockups?', image: null, createdAt: mins(48) },
      { id: 'm2', senderId: 'u_richard', text: 'Yes, opening them now 👀', image: null, createdAt: mins(46) },
      { id: 'm3', senderId: 'u_alison', text: 'The new chat layout', image: assets.pic1, createdAt: mins(44) },
      { id: 'm4', senderId: 'u_richard', text: 'This looks clean. Love the right panel.', image: null, createdAt: mins(43) },
      { id: 'm5', senderId: 'u_alison', text: 'Want me to send the spacing specs?', image: null, createdAt: mins(6) },
    ],
  },
  {
    id: 'c_enrique',
    participantId: 'u_enrique',
    unread: 0,
    messages: [
      { id: 'm1', senderId: 'u_richard', text: 'Pushed the auth branch, can you review?', image: null, createdAt: mins(120) },
      { id: 'm2', senderId: 'u_enrique', text: 'On it. Firebase config looks good.', image: null, createdAt: mins(118) },
      { id: 'm3', senderId: 'u_enrique', text: 'Ship it 🚀', image: null, createdAt: mins(115) },
    ],
  },
  {
    id: 'c_marco',
    participantId: 'u_marco',
    unread: 0,
    messages: [
      { id: 'm1', senderId: 'u_marco', text: 'Lunch tomorrow?', image: null, createdAt: mins(60 * 5) },
      { id: 'm2', senderId: 'u_richard', text: 'For sure. 12:30?', image: null, createdAt: mins(60 * 4) },
    ],
  },
  {
    id: 'c_martin',
    participantId: 'u_martin',
    unread: 0,
    messages: [
      { id: 'm1', senderId: 'u_martin', text: 'Thanks for the help earlier!', image: null, createdAt: mins(60 * 27) },
    ],
  },
]

export const findUser = (uid) =>
  uid === currentUser.uid
    ? currentUser
    : dummyUsers.find((u) => u.uid === uid) || { name: 'Unknown', avatar: assets.avatar_icon }
