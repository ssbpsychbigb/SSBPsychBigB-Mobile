# BIGB Mobile — Stories (Day Brief) Roadmap

Product name in the UI: **Story**. Code / API name: **Day Brief** (`/day-briefs`).

Client ask (meeting 3–4 Nov 2026): Stories must work after create, and match Instagram-style story features end-to-end.

This file is the single plan for **High → Medium → Later polish**. Update status after each slice.

---

## Current baseline (before this work)

| Area | State |
|------|--------|
| Create (camera + gallery, multi file) | Exists |
| List strip on Home | Exists (portrait tiles, **one tile per brief**) |
| Viewer | Minimal (tap closes; no progress / own story open) |
| Delete | Backend only — not on mobile |
| Mentions / reply / privacy / highlights / stickers | Missing |

---

## Phase 1 — High (core Instagram parity) · ✅ coded (device QA next)

**Goal:** Created stories show and play like Instagram rings/segments.

| # | Item | Status |
|---|------|--------|
| H1 | Group strip by **person** (one ring/tile per user) | ✅ |
| H2 | Open **own** stories from “Your story” (not only Create) | ✅ |
| H3 | Plus badge / empty self → **Create**; filled self → **Viewer** | ✅ |
| H4 | Viewer: progress bars, auto-advance, tap left/right, hold pause | ✅ |
| H5 | Advance to **next person’s** tray after last segment | ✅ |
| H6 | Mute / unmute video | ✅ |
| H7 | Delete own segment (wire `DELETE /day-briefs/:id`) | ✅ |
| H8 | Invalidate / refresh strip on Home focus + after create | ✅ |
| H9 | Use API `durationSec` for segment length | ✅ |

**Done when:** Create 2 photos → Your story shows poster → tap opens both segments with progress → others see one tile for you → delete works → next person advances.

---

## Phase 2 — Medium (engagement + privacy) · ✅ coded (device QA next)

| # | Item | Status | Notes |
|---|------|--------|--------|
| M1 | Viewers list (“Seen by”) | ✅ | `GET /day-briefs/:id/viewers` + sheet |
| M2 | Reply to story (DM thread) | ✅ | Opens chat with draft |
| M3 | React (emoji) on story | ✅ | `POST/DELETE .../react` |
| M4 | Share story to DM | ✅ | People picker → chat draft |
| M5 | Close friends / visibility | ✅ | public / followers / close_friends |
| M6 | Hide story from specific people | ✅ | Backend `excludeUserIds` (API ready; compose UI Phase 3 polish) |
| M7 | @mentions in caption + notify | ✅ | Parses `@user` on create → mention notifications |
| M8 | Pre-publish preview | ✅ | Next → Preview → Share (trim still Phase 3) |
| M9 | Align caption limit UI ↔ backend (280) | ✅ | |

---

## Phase 3 — Later polish (Instagram extras) · ✅ coded (device QA next)

| # | Item | Status | Notes |
|---|------|--------|--------|
| L1 | Stickers (location, hashtag, mention sticker) | ✅ | Compose + viewer chips |
| L2 | Polls / questions / quizzes | ✅ | Poll sticker + `POST .../poll-vote` |
| L3 | Link sticker | ✅ | |
| L4 | Drawing / text overlays | ✅ | Overlay text (drawing deferred) |
| L5 | Text-only story (no media) | ✅ | `mediaType: text` |
| L6 | Music / audio library | ✅ | Label picker (metadata; no streamed audio yet) |
| L7 | Highlights (permanent collections on profile) | ✅ | CRUD + profile strip + viewer save |
| L8 | Circular ring UI (optional visual pass) | ✅ | Home strip rings |
| L9 | Add to story from post / reel | ✅ | Own post menu → create from media/text; hide-from picker in compose |

---

## API map

| Method | Path | Phase |
|--------|------|--------|
| GET | `/day-briefs` | Exists |
| POST | `/day-briefs/media` | Exists |
| POST | `/day-briefs` | Exists |
| POST | `/day-briefs/:id/view` | Exists |
| DELETE | `/day-briefs/:id` | ✅ |
| GET | `/day-briefs/:id/viewers` | ✅ |
| POST | `/day-briefs/:id/react` | ✅ |
| DELETE | `/day-briefs/:id/react` | ✅ |
| POST body | visibility / audience / exclude | ✅ |
| POST body | stickers / overlay / music / text | ✅ |
| POST | `/day-briefs/:id/poll-vote` | ✅ |
| GET | `/day-briefs/highlights/:userId` | ✅ |
| POST | `/day-briefs/highlights` | ✅ |
| POST | `/day-briefs/highlights/:id/items` | ✅ |
| DELETE | `/day-briefs/highlights/:id` | ✅ |

---

## Mobile files (primary)

- `src/features/feed/components/DayBriefStrip.tsx`
- `src/features/feed/components/DayBriefViewer.tsx`
- `src/features/feed/components/DayBriefComposeSheet.tsx`
- `src/features/feed/components/DayBriefHighlightsStrip.tsx`
- `src/features/feed/lib/build-day-brief-strip.ts`
- `src/features/feed/lib/group-day-briefs.ts`
- `src/features/feed/api/feed.api.ts` (`dayBriefApi`)
- `src/features/feed/screens/FeedScreen.tsx`
- Backend: `SSBPsychBigB-Backend/src/modules/day-brief/*`

---

## Progress log

| Date | Slice | Notes |
|------|-------|--------|
| 4 Nov 2026 | README + Phase 1 | Grouping, own viewer, IG viewer controls, delete, post-create open |
| 4 Nov 2026 | Phase 2 | Viewers, react, reply/share DM, visibility, mentions, preview, caption 280 |
| 4 Nov 2026 | Phase 3 | Rings, text stories, stickers/polls, music labels, highlights, add-from-post, hide-from UI |

---

## How we will test Phase 1

1. Log in as A → create 2 photos as stories → Home “Your story” shows latest poster.
2. Tap Your story → viewer opens segment 1 → auto or tap → segment 2 → closes or next.
3. Plus on Your story → compose opens.
4. As B → one tile for A → open → both segments → progress bars.
5. Hold → pauses; release → continues. Mute toggle works on video.
6. As A in viewer → Delete → segment gone; strip updates.
7. Pull to refresh / leave and return Home → strip still correct.
