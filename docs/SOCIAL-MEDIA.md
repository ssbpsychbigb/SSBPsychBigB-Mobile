# BIGB Mobile — Social Media Remaining Work

Follow this file for the next social slices. Do not invent parallel product models. Web (`SSBPsychBigB-Frontend`) + backend (`SSBPsychBigB-Backend`) stay the contract source.

Related app: React Native repo root `README.md`.

---

## Product rules (locked)

- **Feed** = lasting text / photo posts.
- **Day Briefs** = 24h Stories. Do **not** merge with Reels.
- **Reels** = lasting vertical video.
- **Chat** = Instagram-style DMs: anyone can be messaged. If the recipient follows the sender → **Primary** (`folder: focused`). Else → **Requests** (`folder: other`). Accept or reply moves it to Primary.
- **No fake / static fallback data** on live screens. Preview types are view-models mapped from API.
- **Same API paths** as web (`/api/v1/...`).
- Message `status` is `sent | deleted` only. There is **no delivered** state. Ticks: **✓ sent**, **✓✓ seen** (`peerLastReadAt >= sentAt`).
- Message delete is **for everyone** (`DELETE /chat/conversations/:id/messages/:messageId`). Conversation delete is **for me**.

---

## Already shipped (do not rebuild)

### Feed

- Live timeline tabs, compose (text/image), like, comment, follow, share, bookmark.
- Day Brief strip + viewer + compose.
- Author name / avatar on **posts** and **comments** → `MemberProfile`.
- Post ⋯ : report (others), pin / delete (owner).

Key files: `src/features/feed/**`, `src/app/navigation/useRootNavigate.ts`.

### Reels

- Explore grid, full-screen player, compose, like/save/follow chrome.
- Author avatar / name → `MemberProfile`.

Key files: `src/features/reels/**`.

### Network

- People list + follow. Avatar + name → `MemberProfile`. Follow stays a separate CTA.

Key files: `src/features/network/**`.

### Chat

- Inbox Primary / Requests / **Starred**, people picker, live socket, thread canvas.
- Inbox **star** on the row (`PATCH` `{ starred }`). Header star still works.
- Header: name → profile, star, overflow (folder, Mentors label, unread, archive, mute, report/block, delete conversation).
- Ticks, long-press **selection bar** (Copy / Edit / Delete), then **Delete for everyone** sheet.
- Edit own text (`PATCH` message). Peer **typing…** in the header subtitle.
- `VIBRATE` permission in `android/app/src/main/AndroidManifest.xml`.

Key files: `src/features/message/**`.

### Profile

- `MemberProfile` — `GET /profile/:username` public portfolio: cover, badges, follow/Message/Share, Followers/Following/Mutual. Hero shows `@user · city · education`. Full stacked sections: **About** (education, languages, hobbies), **Defence**, **Journey**, **Achievements**, **Activity**.
- Privacy-locked sections use the API `sectionVisible` flags (same copy as web).
- Journey `GET /profile/:username/timeline`, achievements `GET /profile/:username/achievements`.
- Network hub counts open the signed-in member’s graph.
- Profile tab **View public profile** opens the same screen.

Key files: `src/features/profile/**`, `RootNavigator`.

---

## Remaining work (ops only)

- Native clipboard / `VIBRATE`: **rebuild** (`yarn android`) if Copy still opens Share or haptics crash. Not a code gap.
- Cover crop + profile **edit** stay on web `/profile/edit` (mobile Profile tab is account chrome). Public **view** is complete.
- Admin moderation queues stay on admin web (`README.md` role × channel).

---

## POV — what else should exist (and what should not)

**Should not (this phase)**

- Merging Stories and Reels.
- Dumping the entire user table into New Message (picker already uses `/chat/people`).
- Cover crop / photo upload / milestone **editors** on mobile (view-only public portfolio).
- Admin moderation queues on mobile (`README.md` role × channel policy).
- WhatsApp “delete for me” on a single message (backend is delete-for-everyone).
- Extra confirm modals on long-press. Selection bar + delete sheet is the pattern. Keep it.

---

## How to implement (follow this)

1. Read this file + the matching **web** component/API before coding.
2. Add API methods next to existing clients (`feed.api.ts`, `chat.api.ts`). No duplicate clients.
3. Map API → existing preview types (`to-*.ts`). Do not render raw DTO fields in screens.
4. Navigate with `useRootNavigate('MemberProfile', { username, name })` from tabs.
5. Match existing UI: `Screen` / `ScreenHeader` / `AppText` / `s` `vs` `ms` / `showToast`.
6. Guest paths: `requireMember` / `JoinToContinueSheet`.
7. `yarn lint && yarn typecheck` (Jest preset may be missing locally — do not add throwaway scripts).
8. Verify on device with the examples in **How to test** below.

---

## Definition of done (social P0+P1)

- [x] Name/avatar on feed, comments, network, reels, day-brief viewer, chat all open the same profile when `username` exists.
- [x] Post ⋯ no longer shows a “lands next” toast; report/pin/delete hit real APIs.
- [x] Own chat messages can be edited; peer typing is visible.
- [x] Member profile can open a conversation and list that member’s posts.
- [x] No new static demo people/posts on those screens.
- [x] Android vibrate / clipboard changes documented if they need a native rebuild. (`VIBRATE` in the manifest; `@react-native-clipboard/clipboard` — **rebuild** after this slice.)

---

## How to test (device examples)

Use two real members (A and B). Backend + Metro running. Sign in as A unless noted.

### 1. One profile graph

| Step | Expected |
|------|----------|
| Feed → tap author name or avatar on a post | Opens `MemberProfile` for that username. Handle `@username` matches web. |
| Feed comments sheet → tap commenter name | Same profile screen, not a second UI. |
| Network → tap avatar/name (not Follow) | Same profile. Follow button still follows. |
| Reels player → tap author | Same profile. |
| Day Brief strip → open a story → tap creator name | Profile opens; story should not swallow the tap. Close still works on the dimmed area. |
| Chat thread → tap peer name | Same profile. Overflow **View profile** does the same. |
| Member with no username | Toast: “Profile unavailable”. Screen does not open with a fake handle. |

**Fail if:** any tap invents `@user` or lands on your own Profile tab by accident.

### 2. Feed ⋯ menu

Sign in as **owner** of a post:

1. Tap ⋯ → **Pin to profile** → success toast; ⋯ then shows Unpin. Profile posts list can show the pin later on web.
2. Tap ⋯ → **Delete post** → confirm modal → post leaves the timeline.

Sign in as **someone else**:

1. Tap ⋯ → only **Report post**.
2. Pick a reason → Report → toast. Body may hide if the backend marks it hidden.

**Fail if:** you still see “lands next”, or owner sees Report instead of Pin/Delete.

### 3. Chat ticks, edit, delete, typing

Two phones or two accounts.

1. A sends “hello”. Bubble shows **✓** (sent).
2. B opens the thread. A’s bubble becomes **✓✓** (seen). Never a third “delivered” tick.
3. A long-presses own text → selection bar: Copy, pencil **Edit**, trash.
4. Edit → composer shows **Editing message** + check. Save → bubble shows **· Edited**. B’s thread updates live.
5. Long-press → Delete → **Delete for everyone** sheet (not a generic confirm on the bubble). Both sides show deleted copy.
6. B types in the composer. A’s header subtitle shows **typing…** then clears ~2s after B stops.
7. Conversation ⋯ → Delete conversation → **Delete for me** only. B still has the thread.

**Fail if:** long-press opens a floating Copy/Delete card, or edit is offered on the peer’s messages.

### 4. Member profile Message + posts

1. Open B’s profile from feed.
2. **Follow** / **Message** row. Message opens (or creates) a DM and lands in `ChatThread`.
3. **Posts** under **Activity**. **About / Defence / Journey / Awards** use live APIs; private sections show the lock copy, not fake data.
4. Header **Share** opens the system sheet with `@username`.
5. Own Profile tab → **View public profile** (needs `username` on `/auth/me`).

**Fail if:** Message requires you to follow first (DMs are open). Guest must hit join sheet, not a 401 crash.

### 5. Requests folder

A messages B while B does **not** follow A. B inbox **Requests**. Accept or reply → **Primary**. Unchanged from previous slice.

### 6. Android rebuild (vibrate + clipboard)

After adding `VIBRATE` or `@react-native-clipboard/clipboard`, **rebuild** (`yarn android`). Metro reload is not enough.

1. Long-press a bubble: haptic, no permission crash.
2. Selection bar **Copy** → toast **Copied**. Paste in Notes. Share sheet must **not** open.

### 7. Reels comments + guest gates

1. Guest: open a reel → comment icon → sheet lists comments (same post id as feed). Composer shows **Join to add a comment**, not a 401.
2. Member: Send a comment → count updates after close.
3. Comments sheet open → reel video **pauses**. Close → playback resumes.
4. Guest on `MemberProfile` → Follow / Message → join sheet, not a hidden row and not a mutation.
5. Guest feed ⋯ → join sheet (“Manage this post”), not report/pin APIs.

### 8. Inbox star + profile network

1. Messages → Primary row → tap **star** (not the name). Toast Starred. Starred tab lists that chat. Tap star again → Unstarred; it leaves Starred.
2. Thread header star still matches the inbox star.
3. Member profile → tap **Followers** → list from API. Tap a person → their `MemberProfile`. Follow stays separate. Guest Follow → join sheet.
4. **Following** / **Mutual** tabs switch `kind` without leaving.
5. Network hub Followers / Following / Mutual counts open your graph. Guest → join sheet.

**Fail if:** tapping the star opens the thread, or followers list is fake people.

---

## Web / backend pointers

| Need | Look here |
|------|-----------|
| Post report / pin / delete | `SSBPsychBigB-Frontend/src/features/feed/api/feed.api.ts`, `PostCard.tsx` |
| Public profile | `GET /profile/:username`, posts, timeline, achievements, network `?kind=` |
| Chat edit / typing / receipts | `ThreadPane.tsx`, `useChatQueries.ts`, `chat.socket.ts` |
| Chat REST | `SSBPsychBigB-Backend/src/modules/chat/` |
| Day briefs | `day-brief` module — `creator.username` on list DTO |

---

## Out of date on purpose

Root `README.md` “Planned Mobile Modules” still lists Feed / Chat as future. Treat **this file** as the social source of truth until that section is rewritten.
