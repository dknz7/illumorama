# illumorama — Wave #1 Landing Page

Launch landing page for **illumorama**: hand-crafted, illuminated Pokémon dioramas built on the Central Coast NSW.

## What's in here

- `index.html` — the complete page (React + Framer Motion, inlined via CDN)
- `api/signup.js` — Vercel serverless function: stores waitlist emails in Supabase, sends a confirmation to the signer and a notification to Crouchy via Resend
- `assets/` — everything the page references:
  - `w1-0*-nobg.webp` — the six Wave #1 product cutouts (transparent backgrounds, trimmed to visible pixels)
  - `bg-*.mp4` — six looping element-scene backgrounds (fire ×2, water, ghost, fighting, dark)
  - `kling-charizard-storm.mp4` — Charizard W1-02 reveal animation (workshop cut)
  - `scene-*.jpg` — faded decorative artwork for the info section
  - `diorama-charizard-interior.jpg` — interior build shot

## Run it

Open `index.html` in a browser — no build step. Note it loads fonts (Fontshare/Google) and React/Framer Motion from CDNs, so it needs an internet connection to render.

## Deploy

Push to `main` → GitHub → Vercel. The waitlist form POSTs to `/api/signup`, which needs three env vars set in the Vercel project:

- `SUPABASE_URL` — the Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (server-side only, never in the page)
- `RESEND_API_KEY` — Resend API key (sender domain `illumorama.store` must be verified in Resend)

Signups land in the Supabase `signups` table (unique on email).

Design system: deep-night Illumorama palette, Zodiak display / Satoshi body / Pacifico wordmark, measured elemental stage palettes. Tokens live in the parent project's `colors_and_type.css`.
