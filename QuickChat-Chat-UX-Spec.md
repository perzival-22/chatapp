# QuickChat — Chat Section UI/UX Spec

A developer handoff describing the QuickChat chat screen so it can be rebuilt in code. Source design: `QuickChat Chat.dc.html`.

---

## 1. Overview

The chat section is a **two-pane desktop messaging interface**: a fixed conversation **sidebar** on the left and an active **conversation pane** on the right. It follows the QuickChat dark visual language established by the login screen.

- **Frame size:** 1280 × 820 px (desktop). Sidebar is fixed-width; conversation pane is fluid.
- **Theme:** dark, indigo accent, glassy headers.
- **Primary actions requested:** New chat, Emoji, Voice call, Video call.

---

## 2. Design tokens

### Color

| Token | Hex | Usage |
|---|---|---|
| `bg/app` | `#0a0a0f` | App background |
| `bg/sidebar` | `#0c0c14` | Sidebar surface |
| `bg/surface` | `#13131c` | Inputs, popovers, hover rows |
| `bg/surface-2` | `#14141f` / `#16161f` | Header chips, incoming bubbles |
| `border/hairline` | `#181826` / `#20202e` | Dividers, input borders |
| `accent/indigo` | gradient `#8b7bff → #6d5cff` | Primary buttons, outgoing bubbles, accents |
| `accent/indigo-solid` | `#6d5cff` | Unread badge |
| `status/online` | `#34e0a1` | Presence dots, "Active now" |
| `text/primary` | `#ffffff` / `#ececf4` | Names, message text |
| `text/secondary` | `#7c7c92` | Previews, placeholders |
| `text/muted` | `#52526a` / `#5a5a6e` | Timestamps, section labels |

Avatar gradients (per contact): orange `#f0883e→#e0653e`, indigo, emerald `#34e0a1→#16b67d`, pink `#ff6ba8→#e0457e`, blue `#4ec0f0→#3d8ae0`, violet `#b07bff→#8b5cff`.

### Typography

- **Display / names / brand:** `Space Grotesk` (600–700).
- **Body / UI / messages:** `Plus Jakarta Sans` (400–600).
- Scale: brand 18px, contact name 16px, message 14.5px/1.5, conversation name 14.5px, preview 13px, timestamps 11–11.5px, section labels 11px uppercase `letter-spacing:.1em`.

### Shape & elevation

- Radius: buttons `10–12px`, avatars `13–14px`, bubbles `18px` (with one corner tightened to `5px` toward the sender), popover/cards `16px`, frame `18px`.
- Shadows: indigo buttons `0 8–10px 20–26px rgba(109,92,255,.4)`; popovers/cards `0 20px 50px rgba(0,0,0,.5)`.

---

## 3. Layout

```
┌─────────────┬──────────────────────────────────────┐
│  SIDEBAR    │  HEADER  (contact · call · video · …) │
│  340px      ├──────────────────────────────────────┤
│             │                                      │
│  brand +    │           MESSAGE THREAD             │
│  new chat   │      (incoming left / outgoing right)│
│  search     │                                      │
│  convo list ├──────────────────────────────────────┤
│             │  COMPOSER (attach · input · emoji ·  │
│             │            send)  + emoji popover     │
└─────────────┴──────────────────────────────────────┘
```

---

## 4. Components & behavior

### 4.1 Sidebar

- **Header:** QuickChat logo + **New chat icon button** (36–38px, indigo gradient, `+` glyph).
- **New chat (full button):** full-width indigo gradient pill, `+ New chat`. Primary entry point for starting a conversation.
- **Search field:** non-functional placeholder in design (`Search conversations`); wire to filter the list.
- **Conversation list:** scrollable rows, each with avatar + presence dot, name, timestamp, last-message preview, and optional unread badge (indigo pill). Active row uses `bg/surface`; hover `#13131c`.

### 4.2 Conversation header

- Left: contact avatar with presence dot, name (`Space Grotesk`), `● Active now` status in green.
- Right action cluster (icon buttons, 42px, `#14141f` resting, hover `#1c1c28`):
  - **Voice call** — phone icon.
  - **Video call** — camera icon.
  - Divider, then **More** (kebab) on transparent ground.
- Header is glassy: `rgba(10,10,15,.55)` + `backdrop-filter: blur(10px)`.

### 4.3 Message thread

- Day separator chip (`Today`) centered.
- **Incoming bubbles:** left-aligned, `#16161f`, radius tight at bottom-left.
- **Outgoing bubbles:** right-aligned, indigo gradient, white text, radius tight at bottom-right, soft indigo shadow.
- Max bubble width 60%. Timestamp under each bubble in muted text.
- **Typing indicator:** three indigo dots, lead dot bounces (`qcb` keyframe, 1.2s).

### 4.4 Composer

Rounded bar (`#13131c`, 1px `#20202e` border) containing, left → right:

1. **Attach** — paperclip, ghost icon button.
2. **Text input** — placeholder `Message Maya…`; shows typed draft in primary text color.
3. **Emoji** — face icon button. Toggles the emoji popover; active state tints icon indigo and ground `#1c1c28`.
4. **Send** — indigo gradient button with paper-plane icon.

### 4.5 Emoji popover

- Anchored above the composer, left-aligned, 300px, `#13131c` card with `#232334` border.
- Section label `Smileys & people`, then an **8-column grid** of emoji.
- Open/close animates opacity + `translateY(8px) scale(.96)` over 160ms.
- **Interaction:** clicking an emoji appends it to the message draft; the picker stays open for multi-select. Toggle button opens/closes.

---

## 5. Interaction states summary

| Element | Resting | Hover | Active / Pressed |
|---|---|---|---|
| Icon buttons | transparent or `#14141f` | bg `#1c1c28`, text `#fff` | `scale(.93)` |
| Conversation row | transparent / active `#13131c` | bg `#13131c` | — |
| Emoji cell | transparent | bg `#1c1c28`, `scale(1.12)` | — |
| Emoji toggle | ghost | tint | open → indigo icon + `#1c1c28` bg |
| Primary buttons | indigo gradient + shadow | — | `scale(.93)` |

---

## 6. State model (for implementation)

```ts
type ChatState = {
  activeConversationId: string;
  conversations: Conversation[];
  messages: Message[];
  draft: string;          // composer text
  emojiOpen: boolean;     // popover visibility
};
```

Wired behaviors to build:
- **New chat** → create/open a new conversation, focus composer.
- **Emoji** → `toggleEmoji()`; selecting appends to `draft`.
- **Voice call / Video call** → launch the respective call surface for `activeConversation`.
- **Send** → push `draft` as an outgoing message, clear draft.
- **Search** → filter `conversations` by name/preview.

---

## 7. Accessibility

- All icon-only buttons carry `title`/`aria-label` (New chat, Voice call, Video call, Emoji, Attach, Send, More).
- Hit targets ≥ 38px (call/video/send are 42px).
- Presence is conveyed by both color **and** the `Active now` text label, not color alone.
- Maintain visible focus rings on inputs and buttons when implementing for keyboard users.

---

## 8. Assets

- Fonts: Google Fonts — `Space Grotesk`, `Plus Jakarta Sans`.
- Icons: inline SVG, 2px stroke, round caps/joins (plus, search, phone, video, paperclip, smiley, paper-plane, kebab).
- No raster assets; avatars are gradient initials.
