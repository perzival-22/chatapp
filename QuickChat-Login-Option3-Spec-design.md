# QuickChat — Login Page (Option 3)

**Centered glass card · warm dark gradient · liquid-glass effect**

A self-contained design spec + code for the QuickChat sign-in screen. A single
frosted "liquid glass" card floats over a warm amber-on-charcoal gradient.
Email + password only.

---

## 1. Design tokens

| Token | Value | Use |
|---|---|---|
| `--bg-grad` | `radial-gradient(130% 80% at 50% -10%, #2a2118 0%, #100d0a 50%, #0a0807 100%)` | Page background |
| `--amber-1` | `#ffb14e` | Accent (light) |
| `--amber-2` | `#ff8a3d` | Accent (deep) |
| `--ink` | `#1a0e04` | Text on amber button |
| `--text` | `#ffffff` | Headings / input text |
| `--muted` | `#8a7f72` | Sub-copy |
| `--label` | `#bcb0a2` | Field labels |
| `--glass-bg` | `rgba(28, 23, 18, 0.55)` | Card fill |
| `--glass-stroke` | `rgba(255, 255, 255, 0.10)` | Card border |
| `--field-bg` | `rgba(28, 23, 18, 0.45)` | Input fill |
| `--field-stroke` | `rgba(255, 255, 255, 0.08)` | Input border |

**Type:** Display/headings → `Space Grotesk`. Body/UI → `Plus Jakarta Sans`.

**Card geometry:** width `400px`, padding `44px 40px`, radius `24px`.

---

## 2. The liquid-glass effect

Five layered ingredients make the card read as real glass rather than a flat
translucent box:

1. **Blur + saturation** — `backdrop-filter: blur(22px) saturate(140%)` frosts
   and color-boosts whatever sits behind the card.
2. **Translucent fill** — a semi-opaque dark tint so text stays legible over any
   background brightness.
3. **Edge highlight** — a 1px `inset` light stroke at the top + a faint dark
   stroke at the bottom simulate a refracted rim.
4. **Sheen sweep** — a soft diagonal white gradient overlay (`::before`) reads as
   a specular highlight gliding across the surface.
5. **Floating depth** — a large soft drop shadow lifts the card off the page; an
   amber glow behind it tints the frost warm.

```css
.glass {
  position: relative;
  background: rgba(28, 23, 18, 0.55);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
  backdrop-filter: blur(22px) saturate(140%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow:
    0 24px 70px rgba(0, 0, 0, 0.55),          /* float */
    inset 0 1px 0 rgba(255, 255, 255, 0.18),  /* top rim highlight */
    inset 0 -1px 0 rgba(0, 0, 0, 0.30);       /* bottom rim shadow */
  overflow: hidden;
}

/* specular sheen */
.glass::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.14) 0%,
    rgba(255, 255, 255, 0.04) 28%,
    transparent 55%
  );
  pointer-events: none;
}

/* warm glow behind the glass */
.glass-glow {
  position: absolute;
  width: 460px; height: 460px;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255, 138, 61, 0.22), transparent 62%);
  filter: blur(40px);
  pointer-events: none;
}
```

> **Browser note:** `backdrop-filter` needs the `-webkit-` prefix for Safari.
> If unsupported, the `rgba` fill still gives a usable (non-frosted) fallback.

---

## 3. Full HTML + CSS

Drop this into any `.html` file and open it.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>QuickChat — Sign in</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }

  body {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Plus Jakarta Sans", sans-serif;
    background: radial-gradient(130% 80% at 50% -10%, #2a2118 0%, #100d0a 50%, #0a0807 100%);
    color: #fff;
  }

  /* brand mark, pinned top-center */
  .brand {
    position: fixed;
    top: 34px; left: 50%;
    transform: translateX(-50%);
    display: flex; align-items: center; gap: 11px;
  }
  .brand .logo {
    width: 34px; height: 34px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #ffb14e, #ff8a3d);
    box-shadow: 0 8px 20px rgba(255, 138, 61, 0.4);
  }
  .brand .name {
    font-family: "Space Grotesk", sans-serif;
    font-weight: 700; font-size: 18px;
  }

  /* liquid glass card */
  .card {
    position: relative;
    width: 400px;
    padding: 44px 40px;
    background: rgba(28, 23, 18, 0.55);
    -webkit-backdrop-filter: blur(22px) saturate(140%);
    backdrop-filter: blur(22px) saturate(140%);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.10);
    box-shadow:
      0 24px 70px rgba(0, 0, 0, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.18),
      inset 0 -1px 0 rgba(0, 0, 0, 0.30);
    overflow: hidden;
  }
  .card::before {
    content: "";
    position: absolute; inset: 0;
    background: linear-gradient(135deg,
      rgba(255,255,255,0.14) 0%,
      rgba(255,255,255,0.04) 28%,
      transparent 55%);
    pointer-events: none;
  }
  .card > * { position: relative; }  /* keep content above the sheen */

  .card h1 {
    font-family: "Space Grotesk", sans-serif;
    font-weight: 600; font-size: 26px;
    letter-spacing: -0.02em;
    text-align: center;
    margin: 0 0 8px;
  }
  .card .sub {
    font-size: 14px; color: #8a7f72;
    text-align: center;
    margin: 0 0 30px;
  }

  label {
    display: block;
    font-weight: 600; font-size: 13px;
    color: #bcb0a2; margin: 0 0 8px;
  }
  .row {
    display: flex; align-items: center; justify-content: space-between;
    margin: 0 0 8px;
  }
  .row a { font-weight: 500; font-size: 13px; color: #ffb14e; text-decoration: none; }

  input {
    width: 100%; height: 46px;
    padding: 0 16px;
    background: rgba(28, 23, 18, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 11px;
    outline: 0;
    font: 400 15px "Plus Jakarta Sans", sans-serif;
    color: #fff;
    transition: border-color .15s, box-shadow .15s;
  }
  input:focus {
    border-color: rgba(255, 177, 78, 0.7);
    box-shadow: 0 0 0 3px rgba(255, 138, 61, 0.18);
  }
  #email { margin: 0 0 18px; }
  #pw    { margin: 0 0 26px; }

  button {
    width: 100%; height: 48px;
    border: 0; border-radius: 11px;
    cursor: pointer;
    background: linear-gradient(135deg, #ffb14e, #ff8a3d);
    color: #1a0e04;
    font: 700 15px "Plus Jakarta Sans", sans-serif;
    box-shadow: 0 10px 26px rgba(255, 138, 61, 0.35);
    transition: transform .1s, box-shadow .15s;
  }
  button:hover  { box-shadow: 0 12px 30px rgba(255, 138, 61, 0.5); }
  button:active { transform: translateY(1px); }

  .foot {
    text-align: center;
    font-size: 13px; color: #6f655a;
    margin: 24px 0 0;
  }
  .foot a { color: #ffc375; text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
  <div class="brand">
    <div class="logo">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-4 4v-4H6.5A2.5 2.5 0 0 1 4 12.5v-7Z" fill="#1a0e04"/>
      </svg>
    </div>
    <span class="name">QuickChat</span>
  </div>

  <form class="card" onsubmit="return false">
    <h1>Welcome back</h1>
    <p class="sub">Sign in to your QuickChat account</p>

    <label for="email">Email</label>
    <input id="email" type="email" value="alex@quickchat.io" />

    <div class="row">
      <label for="pw" style="margin:0">Password</label>
      <a href="#">Forgot?</a>
    </div>
    <input id="pw" type="password" value="passw0rd" />

    <button type="submit">Sign in</button>

    <p class="foot">New here? <a href="#">Create account</a></p>
  </form>
</body>
</html>
```

---

## 4. Optional: animate the sheen (true "liquid" motion)

For a moving glass highlight, drift the `::before` sheen with a slow keyframe.

```css
.card::before { animation: sheen 9s ease-in-out infinite; }

@keyframes sheen {
  0%, 100% { transform: translateX(-12%) translateY(-6%); opacity: .9; }
  50%      { transform: translateX(12%)  translateY(6%);  opacity: 1; }
}
```

Keep the amplitude small — a few percent — so it reads as light refracting, not
a sliding panel.

---

## 5. Implementation checklist

- [ ] Load both Google fonts (Space Grotesk + Plus Jakarta Sans).
- [ ] Apply `backdrop-filter` **with** the `-webkit-` prefix.
- [ ] Keep card fill translucent (not solid) so the frost is visible.
- [ ] Layer card content above `::before` (`position: relative` on children).
- [ ] Amber accent reserved for: logo, button, focus ring, "Forgot?" / links.
- [ ] Inputs prefilled for demo — clear values before shipping.
- [ ] Wire `<form>` submit to your auth endpoint.
