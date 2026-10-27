# BIGB Mobile — Client Bug Report Fix Plan (Day 1 + Day 2 + Day 3)

Source: client test reports **Day 1 (24 Oct 2026)** — BUG-001 to BUG-011, **Day 2 (25 Oct 2026)** — BUG-012 to BUG-022, and **Day 3 (26 Oct 2026)** — BUG-023 to BUG-029.

This file says, for every bug, **what the client asked for**, **what the app does today** (checked in code), and **what we will change**. Follow it slice by slice, and update the **Status** column and the progress log (section 0) after each slice.

---

## 0. Progress log

**Day 1 + Day 2:** 22 of 22 addressed. BUG-013 phase 2 (change email or mobile) is done in Slice 6.

**Day 3:** BUG-023 to BUG-029 are done in Slice 6. The short list below is what was wrong before that slice.

| Bug | Severity | What is actually wrong |
|-----|----------|------------------------|
| 023 | Medium | After “Request to join”, the button becomes a disabled **Requested**. There is no Cancel. The server already drops a pending request on Leave; the screen never calls it. |
| 024 | High | **Create** is hidden for aspirants. Only an officer, an institute, a freelancer educator, or an institute educator with `community.create` can open a club. A signed-in aspirant sees no button and no reason. The wizard itself exists. |
| 025 | Low | Comments have Reply only. There is no pin on a comment, in the app or on the server. |
| 026 | Medium | ⋯ on someone else’s post opens one red **Report post** row stuck at the top-right of the screen, not next to the post. |
| 027 | High | **Edit caption** was added the same day (Slice 5) on Home, the post screen, and Reels. Confirm the client’s build has it. The You-tab grid still has no ⋯, so a post opened only from the grid has no Edit until you are on the post screen. |
| 028 | Medium | Pin saves on the server and shows a toast, then nothing visible changes. The profile grid is still newest-first and has no pin mark. |
| 029 | High | Home has no search. Courses can be searched on Learn. People search exists only as mention typeahead (name, not username). Institutes have no search. |

### Slice 1 — Quick wins (26 Oct 2026) ✅

| Bug | What changed |
|-----|--------------|
| 018 | Reel player shows the caption **once** (`ReelStage.tsx` renders `synopsis` only). Empty caption shows nothing; the composer no longer sends the fake text "Shared a Prep Reel". |
| 007 | Messages badge uses the real `GET /chat/unread-count` (number, `9+` cap). Refreshes every time Home regains focus. Hardcoded `isAuthed` removed. |
| 008 | Saved screen is live (`GET /bookmarks`): **All / Posts / Reels** chips, full post cards, reels as play tiles, pull-to-refresh, infinite scroll, empty + error states. Unsave removes the card instantly. Saving from Home, Reels, **and Community** (community Save was a no-op before) now refreshes Saved. Backend: `/bookmarks` now returns the real `followingAuthor`, so Follow on a saved card can't accidentally unfollow. |
| 003 | Mock notifications deleted. Alerts screen is live (`GET /notifications`): **New / Earlier** groups, type icon on each avatar, unread highlight + dot, **Read all**, **Follow back**, pull-to-refresh, infinite scroll. Tap = mark read + open the right screen (post, comments, profile, community, course, test). Bell badge = real unread count (polls every 60 s + on Home focus). |
| F5 | New `PostDetail` screen (`posts/:postId` deep link): post card, inline video player for reels, comments (auto-opens from comment notifications), like / save / follow / share, ⋯ pin / delete / report, "not available" state. |

**Files (mobile):** `reels/components/ReelStage.tsx`, `reels/components/ReelComposeSheet.tsx`, `reels/screens/ReelsScreen.tsx`, `feed/components/FeedHeader.tsx`, `feed/components/FeedPostCard.tsx` (optional `onOpen` + `mediaSlot`, no change for Home), new `feed/components/FeedPostVideo.tsx`, `feed/screens/FeedScreen.tsx`, new `feed/screens/PostDetailScreen.tsx`, new `feed/hooks/usePostQueries.ts`, new `feed/hooks/usePostCardActions.ts`, `feed/api/feed.api.ts` (`getPost`, `listBookmarks`), `bookmark/screens/BookmarkScreen.tsx`, `community/components/ClubFeedPane.tsx`, new `notifications/{api,hooks,lib,types}/*`, `notifications/screens/NotificationsScreen.tsx`, deleted `notifications/data/notifications-preview.ts`, `app/navigation/{types,RootNavigator,linking}.ts(x)`.
**Files (backend):** `src/modules/feed/feed-engagement.service.js` (`listBookmarks` → real `followingAuthor`).
**Checks:** `yarn typecheck` ✅ · `node --check` ✅ · eslint: no new errors (one old unused-var error in `CustomFloatingTabBar.tsx`, untouched).

#### How to test Slice 1

Restart the backend (bookmarks change) and reload the app. Use two accounts, **A** and **B**.

1. **BUG-018** — Reels → camera icon → pick a video → caption `I did it` → Share. In the player the caption reads `I did it` once. Post another reel with an empty caption → no caption line at all.
2. **BUG-007** — As A with no unread chats: Home → Messages icon has **no** badge. From B, send A a message → A's badge shows `1` (pull to refresh Home or switch tabs). Open the chat, go back → badge gone.
3. **BUG-008** — As A, save a Home post, a reel, and a Community post. You → Saved: all three appear (chips filter Posts / Reels). Tap a reel tile → plays in PostDetail. Tap bookmark on a saved card → it disappears. Pull to refresh → still gone.
4. **BUG-003** — The 3 fake rows ("Capt. Vikram Rao…", "Meera Sharma…") are gone. As B: follow A, like A's post, comment on A's post. As A: bell shows `3`; Alerts lists them under **NEW**.
   - Tap the like → opens the post. Tap the comment → opens the post with comments open. Tap the follow → opens B's profile; **Follow back** works.
   - Back on Alerts the tapped rows move to **EARLIER**; **Read all** clears the rest; bell badge clears on Home.
   - New account with nothing → "No alerts yet". Pending (not yet approved) account → "Could not load your alerts" (backend requires an active account — expected).
5. **Deep link** — `adb shell am start -a android.intent.action.VIEW -d "bigb://posts/<postId>"` opens PostDetail. Deleted/private post → "This post is not available".

### Slice 1b — Notifications screen redesign (26 Oct 2026) ✅

Client feedback: the Alerts screen looked dated (boxed cards, "MI" initials, NEW / EARLIER labels). Rebuilt as a modern activity feed (Instagram / LinkedIn style). Behaviour from BUG-003 is unchanged.

| Area | What changed |
|------|--------------|
| Header | Title **Notifications**; subtitle "N new notifications" / "You're all caught up"; round ✓✓ button marks all read (hidden when nothing is unread). |
| Filters | Horizontal chips: **All · Unread (count) · Comments · Likes · Follows · Community · Updates**. Filtering is instant (client-side). |
| Sections | Grouped by **Today · Yesterday · This week · This month · Earlier** instead of NEW / EARLIER. |
| Rows | Flat full-width rows (no boxes). 52 px avatar with the **real profile photo** (falls back to coloured initials; system/course alerts get a coloured icon). Small coloured badge per type (heart, comment, follow, mention, megaphone…). Bold name + action + compact time (`5m`, `2h`, `3d`). Comment/reply/mention text shown in a quote block. Unread = soft tinted background + dot. **Follow back** button for follows. |
| Remove | Long-press a notification → confirm → removed (`DELETE /notifications/:id`, optimistic). |
| States | Shimmer skeleton while loading; illustrated empty states for guest, error, no notifications, and "nothing in this filter" (with **Show all**). |

**Files (mobile):** new `notifications/lib/group-notifications.ts`, new `notifications/components/NotificationRow.tsx`, new `notifications/components/NotificationSkeleton.tsx`, rewritten `notifications/screens/NotificationsScreen.tsx`, `notifications/types/notification.types.ts` (`actor.avatarPath`), `notifications/api/notifications.api.ts` (`remove`), `notifications/hooks/useNotificationQueries.ts` (`useRemoveNotification`).
**Files (backend):** `src/modules/notifications/notification.service.js` — each actor now includes `avatarPath` (profile photo → institute logo → officer photo).
**Checks:** `yarn typecheck` ✅ · eslint on `src/features/notifications` ✅ · `node --check` ✅.

#### How to test Slice 1b

Restart the backend (needed for avatars) and reload the app.

1. As B (with a profile photo): follow A, like A's post, comment on A's post. As A open Notifications → B's **photo** shows on each row with a small type badge; rows are under **Today**; unread rows are tinted with a dot; subtitle says "3 new notifications".
2. Tap the chips: **Comments** shows only the comment (with the quote block), **Follows** only the follow, **Unread** shows the count. A chip with no matches shows the empty state → **Show all** returns to All.
3. Tap a row → opens the right screen and the row loses its tint. Tap ✓✓ in the header → everything read, subtitle "You're all caught up", button disappears.
4. Long-press a row → **Remove** → it disappears; pull to refresh → still gone.
5. Turn off the network and reopen → loader, then the error state with **Try again**. Log out → guest state with **Join BIGB / Log in**.

### Slice 1c — BIGB loader everywhere + chat loading + Notifications v2 (26 Oct 2026) ✅

| Area | What changed |
|------|--------------|
| BIGB loader | New `shared/ui/BrandLoader.tsx`: BIGB mark in a white disc with a gentle pulse, wrapped by a thin rotating blue→orange arc (brand colours, works in dark mode). Optional label under it. `Spinner` now renders it, so **every screen that used `Spinner` (~60 places) shows the BIGB loader**. Section loaders that used a raw `ActivityIndicator` were switched too (New message sheet, Comments sheet, Email verification, Institute home, Educator collaborations). Tiny white spinners **inside buttons** stay as they are (a logo inside a button looks wrong). |
| Chat loading | Messages loading now fills the chat area: loader centred with "Loading messages", composer stays fixed at the bottom (before: a small spinner at the top and the input jumped up). Same fix for "Could not load this chat". "Load earlier messages" shows the small loader while fetching. |
| Notifications v2 | Rows rebuilt LinkedIn-style: time + **⋯ options** on the right (no wrapping dates), BIGB logo as the avatar for BIGB announcements/system alerts, comment previews shown as quoted text (no heavy green boxes), unread = tint + dot at the left edge, hairline separators. Header button is now an explicit **Mark all read** pill. Filter chips are filled pills (active = brand blue). Footer is a quiet "That's all for now" divider — the confusing centred ✓✓ icon and long-press hint are gone. ⋯ (or long-press) opens a bottom sheet with a preview + **Mark as read** / **Remove notification**. Loading uses the BIGB loader; skeleton removed. |
| Loader always centred | `BrandLoader` measures where it is rendered and sizes itself so the BIGB mark sits at the **vertical centre of the screen**, no matter what header / search / tabs are above it (label hangs under the mark, so the mark itself is centred). `fullScreen` loaders (chat body, boot) centre in their area; `size="small"` stays a compact row for "loading more" footers. Messages inbox shows "Loading conversations". Also fixed: Messages showed "Could not load messages" above a perfectly good cached list when a refresh failed — now only shown when there is nothing to show. |
| Feed order (For You / Trending) | A new post was still sitting under a day-old post. The stored score kept an old freshness bonus, so time was not what you saw. **For You** is now newest-first: a like, a matching topic, or a follow can lift a post by at most 2 hours, so a post from just now always stays above a post from yesterday. Ranking uses the live like/comment counts, not the old stored score. **Latest** is still pure newest-first. **Trending** still favours posts people react to, with age applied when the feed is read. |
| Pull to refresh | Fixed app-wide (18 screens + `Screen`). Two causes: (1) most screens didn't pass Android `colors`, so the arrow defaulted to **black**; (2) `refreshing` came from React Query `isRefetching`, which turns true a frame *after* release — Android hid the spinner, re-showed an empty circle, then hid it again. New shared hook `shared/ui/usePullToRefresh.tsx` owns the state: true the moment you release, stays up until every refetch finishes (min 0.6 s so it never blinks), brand blue on a white (dark: surface) disc. Background refetches no longer pop the spinner either. |

**Files (mobile):** new `shared/ui/usePullToRefresh.tsx`, `shared/ui/Screen.tsx`, all screens with pull-to-refresh, new `shared/ui/BrandLoader.tsx`, `shared/ui/Spinner.tsx`, `shared/ui/index.ts`, `message/screens/ChatThreadScreen.tsx`, `message/components/NewMessageSheet.tsx`, `feed/components/FeedCommentsSheet.tsx`, `auth/components/EmailVerificationSheet.tsx`, `institute/screens/InstituteHomeScreen.tsx`, `educator/screens/EducatorCollaborationsScreen.tsx`, `notifications/components/NotificationRow.tsx` (rewritten), new `notifications/components/NotificationOptionsSheet.tsx`, `notifications/screens/NotificationsScreen.tsx` (rewritten), deleted `notifications/components/NotificationSkeleton.tsx`.
**Checks:** `yarn typecheck` ✅ · eslint: no new errors (old `useMemo` dependency warnings in `NewMessageSheet` / `EducatorCollaborationsScreen` untouched). Checked on a real Android device.

#### How to test Slice 1c

1. **Loader** — open Learn, a course, Communities, a profile, Saved: every loading state shows the BIGB mark with the rotating arc (no plain grey/blue spinner). Switch to dark mode → still clear.
2. **Chat** — Messages → open a chat you haven't opened this session: loader + "Loading messages" in the middle, message box fixed at the bottom the whole time. A chat with no messages → "No messages yet" centred.
3. **Notifications** — times sit top-right (`2w`, `23 Sep`) without wrapping; BIGB announcements show the BIGB logo; comments show `“text”` under the line. Tap **⋯** → sheet with **Mark as read** (only if unread) and **Remove notification** → removed + toast. **Mark all read** pill appears only when something is unread. Scroll to the end → "That's all for now".
4. **Pull to refresh (all screens)** — pull down on Home, Reels, Notifications, Messages, Communities, Network, Learn, Saved, a post, Wishlist, Certificates, test history / leaderboard / saved questions / revision. The circle is **brand blue** (not black), keeps spinning until the data is back, then disappears once — no second empty circle.

### Slice 2 — Keyboard-safe composers, "leave without saving?", drafts, new composer UI (26 Oct 2026) ✅

Fixes **BUG-001, 005, 016, 019** and the composer half of **BUG-004** (preview before posting). Covers all four writing sheets: **Create post**, **Comments**, **New reel**, **Add a story** (and "Post in club", which reuses Create post).

| Area | What changed |
|------|--------------|
| Keyboard (001, 016, 019) | New shared `shared/ui/KeyboardSheet.tsx`. Root cause: the old sheets only handled the keyboard on iOS, and on Android a `statusBarTranslucent` Modal never gets resized — keyboard events don't even reach JS inside it. Now on Android the sheet's window is resized by the OS (`adjustResize`), on iOS it lifts by the keyboard height; the sheet measures the space that is left and never grows past it. Text boxes have a max height and **scroll inside**, so the ✕ / **Post** / **Photo** buttons are always visible above the keyboard, however long the text. |
| Leave warning (005, 016) | New `shared/ui/useDiscardGuard.ts`. ✕, tapping outside and the phone's back button now ask first when something is typed/attached: Create post → **Save draft / Keep editing / Discard**; Comments → **Keep writing / Discard**; Reel and Story → **Keep editing / Discard**. Nothing typed → closes straight away (no nagging). `ConfirmModal` got an optional third button for "Save draft" (old dialogs unchanged). |
| Drafts (005) | Uses the backend drafts that already existed (`status: 'draft'`, `GET /posts/drafts`). New `feed/hooks/usePostDrafts.ts` + `feedApi.listDrafts / updatePost`. **Drafts · N** button in the composer opens the list (text preview, photo thumbnail, "Saved 2h ago", 🗑 delete). Tap a draft → composer refills ("Finish draft"); close again → **Update draft**. Publishing a draft creates a fresh post (so it is dated *now* and ranks as new) and removes the draft. Drafts are only on the main Home composer — club posts keep the simple Discard dialog. |
| Composer UI | Shared parts in `feed/components/ComposeParts.tsx`: header with ✕, title and a pill **Post/Share** button (grey until there is something to post, spinner while sending); your real avatar + name; large borderless writing area; character counter appears near the 5 000 limit. |
| Media preview (004, composer half) | Create post shows the **actual photo** (with ✕ remove / **Change photo**) instead of the text "Photo attached". Reel shows the **video playing muted** with its length (0:42) and ✕; before choosing, two big tiles **Camera / Gallery**. Story shows the photo or playing video with ✕ and **Change**. |
| Comments UI | Header with count + ✕, real profile photos, smaller reply avatars, friendly empty state, reply chip ("Replying to Aryan ✕"), your avatar next to a rounded input that grows to ~5 lines, round ↑ send button with spinner. |

**Files (mobile):** new `shared/ui/KeyboardSheet.tsx`, `shared/ui/useDiscardGuard.ts`, `shared/ui/ConfirmModal.tsx` (optional 3rd button), `shared/ui/index.ts`, new `feed/components/ComposeParts.tsx`, `feed/components/FeedComposeSheet.tsx` (rewritten), `feed/components/FeedCommentsSheet.tsx`, `feed/components/DayBriefComposeSheet.tsx` (rewritten), `reels/components/ReelComposeSheet.tsx` (rewritten), new `feed/hooks/usePostDrafts.ts`, new `feed/lib/upload-post-image.ts`, `feed/api/feed.api.ts`, `feed/types/feed.types.ts`, `feed/screens/FeedScreen.tsx`. No backend change.
**Checks:** `yarn typecheck` ✅ · eslint on all touched files ✅. On a real Android phone: Create post sheet opens fully above the keyboard with **Post** and **Photo** visible.
**Still open from these bugs:** camera inside Reel/Story needs the permission fix (F3: 002/014/017) — the Camera tile is there but may still fail until then; full-screen viewer and mute (004 viewer part, 011, 021) are the next slices.

#### How to test Slice 2 (simple steps)

Log in first (composers are for members).

1. **Keyboard — Create post (BUG-001).** Home → tap *Share with the community…*. The keyboard opens and the whole sheet sits **above** it: ✕, **Post**, your name, **Photo** all visible. Paste a long text (e.g. 15 lines of *"Leadership at SSB means clear thinking under pressure."*) → the text scrolls inside the box; **Post** and **Photo** never go behind the keyboard.
2. **Photo preview (BUG-004).** In the same sheet tap **Photo** → pick a picture → you see the picture itself (not "Photo attached"). Tap ✕ on it → removed. Tap **Change photo** → swap it.
3. **Leave warning + Save draft (BUG-005).** Type *"My GTO tips draft"* → tap ✕ (or tap the dark area, or phone Back) → dialog **Keep this post?** with **Save draft / Keep editing / Discard**.
   - **Keep editing** → back to your text, nothing lost.
   - **Save draft** → toast "Draft saved", sheet closes. Open the composer again → **Drafts · 1** → you see *"My GTO tips draft — Saved just now"* → tap it → text comes back (title says *Finish draft*) → **Post** → it appears at the top of Home and the draft list is empty.
   - **Discard** → sheet closes, text gone. Open again → empty composer.
   - Open the composer and close it without typing → closes immediately, no dialog.
4. **Comments (BUG-016, 019).** Open comments on any post → tap the input → the input sits right above the keyboard. Type 6–7 lines → the box grows to ~5 lines then scrolls; the ↑ send button stays visible. Type *"Great point"* and tap ✕ (or Back) → **Discard comment?** → **Keep writing** keeps it, **Discard** closes. Tap **Reply** on a comment → chip "Replying to … ✕" above the input.
5. **Reel (BUG-019).** Reels → **+** → tiles **Camera / Gallery** → pick a video → it plays muted in the sheet with its length; type a caption → caption box and **Share** stay above the keyboard. Tap ✕ → **Discard this reel?**
6. **Story.** Home → *Your story* → **Choose a photo or video** → preview shows → caption → **Share**. ✕ with a photo chosen → **Discard this story?**
7. **Club post (no regressions).** Community → a club → Post → same new sheet; ✕ after typing → **Discard this post?** (no drafts here, by design).

### Slice 2b — Camera, several photos, hide keyboard (26 Oct 2026) ✅

| Area | What changed |
|------|--------------|
| Camera on a post | Create post now has **Camera** and **Gallery**. Camera asks for permission, then adds the photo you just took. Same two tiles on **Your story**. Reels already had Camera; cancelling it no longer shows a false "Video needed" message. |
| Several photos | Gallery lets you pick up to 10. One photo shows large. Several show as a swipeable strip with 1/3, 2/3. After posting, the feed card swipes the same way. |
| Hide keyboard | Keyboard icon on the right of the composer, or tap an empty part of the sheet. |

**Files:** `shared/lib/camera-permission.ts`, `feed/lib/pick-feed-image.ts`, `feed/lib/pick-feed-video.ts`, `feed/components/FeedComposeSheet.tsx`, `feed/components/DayBriefComposeSheet.tsx`, `feed/components/FeedMediaCarousel.tsx`, `feed/components/FeedPostCard.tsx`, `ios/BigB/Info.plist`.

#### How to test Slice 2b

1. Home → Create post → **Camera** → allow → take a photo → it appears in the sheet → **Post**.
2. Create post → **Gallery** → pick 3 photos → swipe the strip → **Post** → on Home, swipe the photos on that card (1/3).
3. With the keyboard open, tap the keyboard icon → keyboard closes, your text stays.

### Slice 3 — Full-screen photos and videos (26 Oct 2026) ✅

Fixes **BUG-011**. Tapping a photo used to open the post. A video on Home could show as an empty card.

| Area | What changed |
|------|--------------|
| Photos | Tap a photo on Home, a club, Saved, or the post screen. It opens on black, full screen. Several photos swipe left and right with **1 / 3**. Double-tap zooms in, double-tap again zooms out. ✕ or the phone Back closes it. The caption still opens the post. |
| Videos | A video on Home shows a dark tile with a play button only (no “Video” label). Tap it → a custom full-screen player: who posted, caption, tags, play/pause, seek, mute. Saved reels and the post screen keep the player they already had. |

**Files:** new `feed/components/FeedMediaViewer.tsx`, `feed/components/FeedPostCard.tsx`, `feed/components/FeedMediaCarousel.tsx`, `feed/lib/to-feed-card-post.ts`.
**Checks:** `yarn typecheck` ✅.

#### How to test Slice 3

1. Open a post that has a photo. Tap the **photo** (not the words) → black full screen. Double-tap → it zooms. ✕ → back to the feed. Tap the **words** → the post screen, same as before.
2. Post 3 photos. On Home, swipe them on the card, then tap one → full screen opens on that photo. Swipe to the next.
3. Find a video post on Home → dark tile with a play button (no extra “Video” word) → tap → video plays full screen, with the author’s name, caption, and tags under it.

### Slice 4 — Posts on your profile and on other profiles (26 Oct 2026) ✅

Fixes **BUG-009** and **BUG-020**. Your own You tab had no posts. Someone else’s profile had an “Activity” list that was only a line of text (or the word “Photo”) and did not open the post.

| Area | What changed |
|------|--------------|
| Your profile | You tab, under your name: a **Posts** section. Same cards as Home (photo, several photos, video play button, caption, like, comment, save). Tap the words or comment → the post screen. Tap a photo or video → the full-screen viewer. Empty: “No posts yet”. |
| Someone else’s profile | “Activity” is now **Posts**. Real cards, not plain text. Subtitle: “Public posts and reels”. Tap opens the post. **Show more** loads the next 10. If loading fails: **Try again** (it no longer looks like they simply have no posts). Signed out: like, save, or follow asks you to join. |
| Home feed | Unchanged. |

**Files:** new `profile/components/ProfilePostsSection.tsx`, `profile/components/MemberProfileTabs.tsx`, `profile/screens/ProfileScreen.tsx`, `profile/screens/MemberProfileScreen.tsx`, `profile/api/profile.api.ts`, `feed/hooks/usePostCardActions.ts` (likes on a profile card also refresh Home and Saved).
**Checks:** `yarn typecheck` ✅ · eslint on the touched files ✅.
**Still open on profiles:** the number next to “Posts” in the header can still count posts that only followers can see, so it may be higher than the list. Profile photo (012) and edit profile (013) are not in this slice.

#### How to test Slice 4

Reload the app. Use two accounts, **A** (you) and **B**.

1. **Your posts (BUG-009).** As A, post on Home: *“GTO tip: speak in short clear lines.”* with one photo. Open the **You** tab. Under your name, **Posts** shows that card with the photo and the same words. Tap the words → the post screen. Tap the photo → full screen, then ✕.
2. **Empty.** A brand-new account with no posts → You tab says **No posts yet** and “Share something from Home and it will show up here.”
3. **Someone else (BUG-020).** As B, open A’s profile (Network, or tap A’s name on the post). Scroll to **Posts**. You see the same card, not a plain text line. Tap it → the post. If A has more than 10 posts, **Show more** loads the rest.
4. **Like from the profile.** On that card, tap the heart → the count goes up. Go back to Home → the same post is liked there too.
5. **Home still works.** Home feed, create post, comments, and Saved look the same as before this change.

### Slice 5 — Profile, edit, topics, email later, mute, suggestions (26 Oct 2026) ✅

Fixes **BUG-012, 002, 006, 010, 015, 021, 022**, and **BUG-013 phase 1** (name, username, bio, city, photo). Email and mobile number stay as they are until a verified change flow exists.

| Area | What changed |
|------|--------------|
| Edit profile | You → **Edit profile**. Round photo with Camera, Gallery, and Remove. Fields: name, username, bio, city. Save updates the You tab straight away. |
| Edit a post | On your post, ⋯ → **Edit caption**. Words can change. Photos and video stay. The time line shows **Edited**. On a reel you own, ⋯ does the same, plus Delete. Someone else’s reel can be reported from ⋯. |
| Reel topic | Topic is optional. Chips are the wider list (Psychology, GTO, Fitness, Books, OLQ, and the rest), loaded from the server. Skipping a topic is allowed. Explore filters use that same list. The reel shows the topic you picked. |
| Mute | In the reel composer, **Mute original audio**. A muted reel stays silent for everyone. The unmute button is hidden on that reel. |
| Email later | The yellow banner has ✕. It stays hidden for 24 hours, then comes back. **Later** on the code sheet does the same. A new account that enters the emailed code is marked email-verified, so the banner does not appear again. The sign-up screen now says the code is in your email. |
| Suggestions | Network chips ask the server (Officers, Educators, Institutes, Aspirants), so a chip is no longer empty just because those people were not on the first page. People who share your exam or city, or who follow you, come first. Each page is a mix of roles. |

**Checks:** `yarn typecheck` ✅ · backend `node --check` on the changed files ✅.
**Not in this slice:** changing the email address or mobile number on an existing account.

#### How to test Slice 5

Reload the app. The backend restarts on its own when these files save.

1. **Photo and profile (012, 013).** You → **Edit profile**. Tap **Gallery**, pick a photo. Change the name to `Milan Test` and the city to `Delhi`. **Save profile**. Back on You, the photo and the new name show. Open the public profile: the same name is there.
2. **Edit a post (022).** On Home, open ⋯ on your own post → **Edit caption**. Change the words to `Updated caption` → **Save**. The card shows the new words and **Edited** next to the time. Photos on that post are unchanged.
3. **Reel topic and mute (002, 006, 021).** Reels → camera → pick a video. Leave every topic chip off (or pick **Fitness**). Turn on **Mute original audio** → Share. The reel plays with no sound and no unmute button. Explore chips include Fitness, Books, and Leadership. **OIR** is gone.
4. **Email later (010).** If the yellow “verify your email” bar is showing, tap ✕. It disappears. Force-close and reopen the app: it stays hidden. It comes back after 24 hours.
5. **Suggestions (015).** Network → tap **Officers**, then **Aspirants**. Each chip shows people of that role (or a clear empty state). **All** mixes roles. A person preparing for the same exam shows a reason such as “Also preparing for …”.

### You tab layout (27 Oct 2026)

The You tab is a quiet own-profile: username, photo, counts, name, then the grid. Extra actions sit in ⋯.

- Header is the **username** on the left and **⋯** on the right.
- Photo on the left. **Posts**, **Followers**, and **Following** on the right. Tap Followers or Following to open that list.
- Name, bio, and city sit under that row. Role, mobile, email, and Sign out are not on this surface.
- **Edit profile** and **Share profile** are two compact pills, then the posts.
- ⋯ opens a sheet: **Saved**, **Wishlist**, **Certificates**, **Network**, **Account** (edit name and login details), Workspace when that role has one, then **Sign out** in red.
- Under the pills sit three tabs, like Instagram: **Posts**, **Reels**, **Collaborations**. The active tab has a dark underline with space above the grid so you can see which one is on.
- **Posts** is photos and text. **Reels** is video. **Collaborations** is posts that tag this person. Empty tabs say so in one line.
- Squares sit in a 3-column grid. A photo fills the tile. A reel has a play mark. Tap a tile to open the post.
- Someone else’s profile (opened from search or a name) uses the same three tabs, then About.

#### How to check the You tab

1. Open **You**. The first screen is your username, your photo beside three counts, your name, two pills, then **Posts / Reels / Collaborations**. A photo post is only the picture, edge to edge in its square.
2. Posts tab shows photos. Reels tab shows video squares with a play mark. Collaborations is empty until someone tags you.
3. Tap a tile → the post screen. Tap **Followers** → your follower list. There is no shortcut row and no account card under the grid.
4. Tap **⋯** → **Saved**. Same for Wishlist, Certificates, and Network. **Account** opens Edit profile (email and mobile still live there). **Sign out** still asks to confirm.

### Slice 6 — Day 3 bugs + email and mobile change (27 Oct 2026) ✅

| Bug | What changed |
|-----|----------------|
| 023 | A pending club request shows **Cancel request**. Confirm withdraws it with the existing leave call. The button goes back to **Request to join**. |
| 024 | An aspirant on Community sees why they cannot create a club. Officers, institutes, and allowed educators still get **Create**. |
| 025 | The post owner sees **Pin** on a top comment (Home, Reels, and the post screen share the comments sheet). One pin. A new pin replaces the old one. The pinned comment stays on top with a **Pinned** label. |
| 026 | ⋯ opens a bottom sheet. **Report post** is the last row, in red, with its own line. Edit and Pin stay above Delete. |
| 027 | The owner row is **Edit**. The words can change. Photos and video stay. The time line still shows **Edited**. |
| 028 | A pinned post is the first tile on that profile, with a pin mark. Later pages do not repeat it. Home order does not change. Pin works from Home, the post screen, and a Reel. |
| 029 | Home has a search icon. **People**, **Courses**, and **Institutes**. Two letters minimum. Tap a person or institute to open the profile. Tap a course to open the course. |
| 013 phase 2 | Edit profile → **Login details**. Change email sends a code to the new address. Change mobile sends a code to the current email. Nothing changes until the code matches. Sign-in OTP is untouched. |

**Files (mobile):** `ClubHomeScreen.tsx`, `CommunitiesScreen.tsx`, `FeedPostMenu.tsx`, `EditPostSheet.tsx`, `FeedCommentsSheet.tsx`, `ProfilePostGrid.tsx`, `FeedHeader.tsx`, `FeedScreen.tsx`, `ReelsScreen.tsx`, new `SearchScreen.tsx`, `ChangeContactSheet.tsx`, `EditProfileScreen.tsx`, `auth.api.ts`.
**Files (backend):** profile post order in `feed.service.js`, comment `pinnedAt` + pin route, `GET /feed/directory`, account email/mobile change (`account-change.service.js`).
**Checks:** `yarn typecheck` ✅ · `node --check` on the changed backend files ✅.

#### How to test Slice 6

Reload the app. The backend restarts on its own when these files save. Use two accounts if you can: **A** (you) and **B**.

1. **Cancel a join request (023).** As A, open a club that needs approval → **Request to join**. The button becomes **Cancel request**. Tap it → **Cancel this request?** → **Cancel request**. The button is **Request to join** again.
2. **Who can create a club (024).** As an aspirant, open Community. There is no Create button. You see “Officers and educators open clubs”. As an officer, **Create** is still there. Name a club `Delhi GTO Room`, finish the steps, and you land inside it.
3. **Pin a comment (025).** As A, open your Reel → comments. On a top comment, tap **Pin**. It moves to the top and says **Pinned**. Close and open comments again: it is still on top. Pin a second comment: the first one loses **Pinned**. As B, that Pin action is not on A’s Reel.
4. **Report placement (026).** On Home, open ⋯ on **someone else’s** post. The sheet sits at the bottom. **Report post** is the last row, in red. Tap it → the reason dialog is unchanged. On your own post, the rows are **Edit**, **Pin to profile**, then **Delete** in red. Report is not on your own post.
5. **Edit (027).** On your Home post, ⋯ → **Edit**. Change the words to `Updated caption` → **Save**. The card shows those words and **Edited**. The photo is the same. Do the same from a Reel you own.
6. **Pin a post (028).** On your post, ⋯ → **Pin to profile**. Open **You**. That post is the first square, with a small pin mark. Home order is unchanged. ⋯ → **Unpin from profile**. The mark is gone and the tile sits by time again.
7. **Search (029).** Home → the search icon. Type `Mi` → nothing searches yet (needs two letters). Type a real name on **People** → tap the row → their profile. Switch to **Courses**, type a course word → tap → the course. Switch to **Institutes**, type an institute name → tap → that profile. A nonsense word shows “No people for …” (or courses / institutes).
8. **Change email (013).** You → **Edit profile** → scroll to **Login details** → **Change** on Email. Enter a new email you can open → **Send code** → enter the 6-digit code from that inbox → **Confirm**. The You tab account card shows the new email. The old email no longer receives the code.
9. **Change mobile (013).** **Change** on Mobile. Enter a 10-digit number that is not already used → **Send code**. The code arrives on your **current email**, not as an SMS. Enter it → **Confirm**. Sign out, then log in with the new mobile.

Related docs: `docs/SOCIAL-MEDIA.md` (locked social product rules), `docs/ASSESSMENTS.md`.

Paths: mobile = `g:\Upwork work\BigB`, backend = `g:\Upwork work\SSBPsychBigB-Backend`.

---

## 1. Summary table

| Bug | Area | Client severity | Root cause in one line | Backend ready? | Status |
|-----|------|-----------------|------------------------|----------------|--------|
| 001 | Create Post keyboard | High | Composer sheet has no Android keyboard handling | n/a | ✅ Fixed (Slice 2) |
| 002 | Reels camera/gallery + tag | High | Camera permission never requested; iOS permission texts missing; tag forced | Partly (tag required server-side) | ✅ Fixed (Slice 2b + 5). Topic is optional |
| 003 | Notifications | Medium | Screen shows 3 hardcoded mock rows, never calls API | Yes | ✅ Fixed (Slice 1) |
| 004 | Post media preview | High | Composer shows text "Photo attached" only; no video | Yes | ✅ Fixed (Slice 2 + 2b) |
| 005 | Leave post warning / draft | Medium | Close wipes the post silently; drafts unused | Yes (drafts exist) | ✅ Fixed (Slice 2) |
| 006 | Reels categories | Medium | 4 hardcoded SSB chips; not aligned with backend or interests | Partly | ✅ Fixed (Slice 5) |
| 007 | Messages red dot | Medium | `hasUnreadMessages={isAuthed}` hardcoded | Yes | ✅ Fixed (Slice 1) |
| 008 | Saved Items | High | Saved screen is a placeholder; never loads bookmarks | Yes | ✅ Fixed (Slice 1) |
| 009 | Profile post timeline | High | Own profile has no posts section | Yes | ✅ Fixed (Slice 4) |
| 010 | Verify email later | Medium | Sign-up code step can't be skipped; email banner can't be dismissed | Yes (nothing enforced) | ✅ Fixed (Slice 5). Sign-up code stays; the later banner can be snoozed |
| 011 | Full-screen media | Medium | Post media has no tap; no viewer; video posts show nothing | n/a | ✅ Fixed (Slice 3) |
| 012 | Profile photo | High | No avatar edit control at all | Yes | ✅ Fixed (Slice 5) |
| 013 | Edit account details | Medium | No Edit Profile screen; no email/phone change API | Yes | ✅ Fixed (Slice 5 name/photo + Slice 6 email and mobile, code by email) |
| 014 | Story camera | High | Story sheet only opens gallery | n/a | ✅ Fixed (Slice 2b) |
| 015 | Suggested connections | Medium | No relevance ranking + pagination bug | Needs backend work | ✅ Fixed (Slice 5) |
| 016 | Comment keyboard + discard | Medium | Comments sheet has iOS-only keyboard handling; draft silently cleared | n/a | ✅ Fixed (Slice 2) |
| 017 | Reel camera | High | Same as 002 (permission) | n/a | ✅ Fixed (Slice 2b) |
| 018 | Reel caption duplicated | High | Player renders `title + synopsis` (same text twice) | n/a — display bug | ✅ Fixed (Slice 1) |
| 019 | Caption/comment keyboard | Medium | Same as 001/016 | n/a | ✅ Fixed (Slice 2) |
| 020 | Activity tab on others' profiles | Medium | Plain text list, no label, no tap, no post screen | Partly | ✅ Fixed (Slice 4). Header count can still include followers-only posts |
| 021 | Reel preview + mute | Medium | No preview player; no mute flag anywhere | No (mute field missing) | ✅ Fixed (Slice 2 preview + Slice 5 mute) |
| 022 | Edit post / reel | High | No Edit in menus, no mobile API | Yes (`PATCH /posts/:postId`) | ✅ Fixed (Slice 5). Day 3 filed the same ask as BUG-027 — confirm their build |
| 023 | Cancel community request | Medium | Pending join shows a disabled “Requested” button; Leave is members-only | Yes (`DELETE /communities/:slug/leave` already removes a pending row) | ✅ Fixed (Slice 6) |
| 024 | Create a community | High | Create is hidden unless the role is allowed; aspirants get no explanation | Yes, for officer / institute / educator | ✅ Fixed (Slice 6). Aspirants see why. Create stays with officers and educators |
| 025 | Pin a Reel comment | Low | No comment menu and no pin field on a comment | Yes (`POST .../comments/:id/pin`) | ✅ Fixed (Slice 6) |
| 026 | Report button placement | Medium | Post ⋯ menu is pinned to the top-right of the screen | n/a | ✅ Fixed (Slice 6) |
| 027 | Edit after publish | High | Same ask as BUG-022. Edit caption is in Slice 5; profile grid has no menu | Yes | ✅ Fixed (Slice 5 + Slice 6). Row is **Edit**. Open the post from the grid, then ⋯ |
| 028 | Pin post | Medium | Pin is stored, but the profile list ignores `pinnedAt` and shows no mark | Yes (`POST /posts/:id/pin`) | ✅ Fixed (Slice 6) |
| 029 | Search people, courses, institutes | High | Home header is logo, bell, and messages only | Yes (`GET /feed/directory`, `GET /courses?q=`) | ✅ Fixed (Slice 6) |

---

## 2. Product decisions to confirm before coding

The client wrote "if this is intended" on several items. Proposed defaults are in **bold**; change them here if the client disagrees.

1. **Reel tag (BUG-002):** make the category optional. **Default: optional; if none is chosen, send `general`** (new backend category) — or let backend accept an empty list for reels.
2. **Drafts (BUG-005):** **Yes, offer "Save draft"** — backend already supports `status: 'draft'` and `GET /posts/drafts`. Leaving shows: *Keep editing / Save draft / Discard*.
3. **Email later (BUG-010):** **Allowed.** Backend blocks nothing today. Keep the sign-up code step (it is the login proof), but fix its wording and let the email banner be snoozed.
4. **Email / phone change (BUG-013):** **Phase 1: edit name, username, bio, city, photo.** Email/phone change needs new OTP-verified backend endpoints — **Phase 2**.
5. **Activity tab (BUG-020):** **Show the member's own posts only** (no likes), rename to **"Posts"**, render real post cards, tap opens the post. Likes stay private.
6. **Reel mute (BUG-021):** **Yes**, store `audioMuted` on the video media item; player starts muted and hides the unmute toggle for those reels.
7. **Edit after publish (BUG-022):** **Editable: caption/text, visibility, categories.** Media can't be changed after publish (delete + repost). Show "Edited" label (backend already sets `editedAt`).
8. **Categories (BUG-006):** **Use one shared list** from backend `GET /feed/meta`, broadened to match onboarding interests.
9. **Who can create a community (BUG-024):** **Keep today’s rule.** An officer, an institute, a freelancer educator, or an institute educator with `community.create` can create. An aspirant cannot. Do not open create to every member unless the client says so. What we will change is the empty hole: a signed-in member who cannot create sees a short line, not a missing button.
10. **Pin a post (BUG-028):** **Pin to the profile**, the way Instagram does. The pinned post is the first tile on that person’s grid, with a small pin mark. It does not jump to the top of Home.
11. **Pin a comment (BUG-025):** **The post owner only, one pinned comment.** It stays at the top of that post’s comments, including a Reel. Unpin replaces it. Not available on someone else’s Reel.

---

## 3. Shared foundations (build once, used by many bugs)

Do these first; most bugs depend on them.

### F1. Keyboard-safe sheets — fixes 001, 016, 019 (and helps 005)

**Today:** all four bottom sheets are a React Native `Modal` + `KeyboardAvoidingView` with `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` — **no keyboard handling on Android**. The text box has no max height and is not inside a scroll view, so long text pushes the Post button under the keyboard. `windowSoftInputMode="adjustResize"` is set in the manifest but does not reliably apply inside a `Modal` with `statusBarTranslucent`. No keyboard library is installed.

Affected files:
- `src/features/feed/components/FeedComposeSheet.tsx` (lines 65–72)
- `src/features/feed/components/FeedCommentsSheet.tsx` (lines 273–281, sheet fixed `height: '82%'`)
- `src/features/reels/components/ReelComposeSheet.tsx` (lines 78–85)
- `src/features/feed/components/DayBriefComposeSheet.tsx`

**Plan:**
- Create one shared `KeyboardSheet` in `src/shared/ui` (modal + backdrop + keyboard handling for both platforms + safe-area bottom padding).
- Option A (preferred): add `react-native-keyboard-controller` and use its `KeyboardAvoidingView` / `KeyboardAwareScrollView` (works inside modals on Android).
- Option B (no new dependency): listen to `Keyboard` show/hide events and add bottom padding equal to keyboard height on Android.
- Text inputs: `maxHeight` (about 40% of screen) with internal scrolling, so the action row always stays visible.
- Comments sheet: input docked above keyboard; list shrinks instead of being covered.

### F2. Unsaved-changes guard — fixes 005, 016 (and reel caption)

**Today:** backdrop tap, Cancel, and Android back all call `onClose` directly. A `useEffect` clears text when the sheet hides (`FeedComposeSheet.tsx` 48–53, `FeedCommentsSheet.tsx` 82–87, `ReelComposeSheet.tsx` same pattern). No confirm exists.

**Plan:**
- Small hook `useDiscardGuard(isDirty)` that wraps `onClose`: if dirty, open the existing `ConfirmModal` (`src/shared/ui/ConfirmModal.tsx`, already used in FeedScreen and ChatThread) with *Keep editing / Discard* (+ *Save draft* for posts).
- Apply to: post composer, reel composer, story composer, comments sheet.

### F3. Camera + gallery permissions — fixes 002, 014, 017 (and 012)

**Today:**
- Library is `react-native-image-picker` ^8.2.1. Reel camera already calls `launchCamera` (`src/features/feed/lib/pick-feed-video.ts` 72–79).
- **Android:** `CAMERA`, `RECORD_AUDIO`, `READ_MEDIA_*` are declared in the manifest, but **CAMERA is never requested at runtime**, so `launchCamera` fails.
- **iOS:** `ios/BigB/Info.plist` has **no** `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, or `NSPhotoLibraryUsageDescription` → camera crashes/refused.
- The only permission helper (`src/features/auth/store/permissions.store.ts` 46–85) requests image read only, for document upload.
- Picker errors are swallowed: `fromPickerAsset()` (`pick-feed-video.ts` 23–55) never reads `result.errorCode`; every failure shows the same "Video needed – Use MP4/MOV under 250 MB…" toast.
- Mime fallback: `normalizeUploadMime` (`src/features/auth/lib/upload-asset.ts` 26–51) falls back to `image/jpeg` when type is missing → valid videos get rejected.
- Mobile accepts `video/3gpp` but backend `feed.upload.js` (line 19) does not → some Android recordings fail upload with 400.

**Plan:**
- New `src/shared/lib/media-permissions.ts`: `ensureCameraPermission({ withMic })`, `ensureGalleryPermission()`; Android `PermissionsAndroid.request` for CAMERA (+ RECORD_AUDIO for video); "Open settings" prompt when permanently denied.
- Add the three iOS usage strings to `Info.plist`.
- One media helper with clear results: `{ ok, asset } | { ok: false, reason: 'cancelled' | 'permission' | 'too_large' | 'too_long' | 'unsupported' }` and a specific toast per reason. Cancel = silent.
- Fix mime detection for video (use asset type + extension; never default video to jpeg).
- Backend: add `video/3gpp` to `VIDEO_MIME` in `src/modules/feed/feed.upload.js`, or convert/reject with a clear message on mobile.

### F4. Media preview + full-screen viewer — fixes 004, 011, 021

**Today:** no reusable preview or viewer exists. `react-native-video` ^6.19.2 is installed (used only in the reel player). The 24h story viewer `src/features/feed/components/DayBriefViewer.tsx` is the closest piece to adapt.

**Plan:**
- `MediaPreviewTile` (shared): thumbnail for image, inline muted `react-native-video` for video, ✕ remove + "Replace" action.
- `MediaViewer` (shared, full-screen modal): pinch/zoom image, video with controls, swipe down / ✕ to close, swipe between multiple images.

### F5. Single post screen `PostDetail` — needed by 003, 009, 020, 022

> **Status: ✅ Built in Slice 1** (`src/features/feed/screens/PostDetailScreen.tsx`, route `PostDetail { postId, openComments? }`, deep link `posts/:postId`; also `u/:username`, `c/:slug`, `notifications`).

**Today:** no `PostDetail` route in `src/app/navigation/types.ts`; `feedApi` has no `getPost`. Backend already has `GET /posts/:postId` (`feed.routes.js` line 95).

**Plan:**
- Add `feedApi.getPost(postId)` + `usePostQuery`.
- New `PostDetail { postId, commentId? }` stack screen: one `FeedPostCard` + comments inline. Reel posts open the reel player instead.
- Register in `RootNavigator.tsx`, add deep link `posts/:postId` in `linking.ts`.

### F6. Edit post API — needed by 022

Backend `PATCH /posts/:postId` exists (`feed.routes.js` 122 → `feed.service.js` `updatePost` ~903–1090): owner-only, accepts `content`, `visibility`, `categories`, `media`, sets `editedAt`. Mobile needs `feedApi.updatePost` + mutation that patches feed, reels, profile-posts, and bookmark caches.

---

## 4. Bug-by-bug detail

### BUG-001 — Keyboard covers the writing area (Create Post) · High

- **Client said:** while typing a post, the keyboard hides the text.
- **We have now:** `FeedComposeSheet.tsx` — `KeyboardAvoidingView` is iOS-only (line 71); `TextInput` multiline with `minHeight` only, no `maxHeight`, no scroll (lines 82–97, 163–171).
- **Fix:** F1 (keyboard-safe sheet + input max height with scroll).
- **Done when:** on Android and iOS, 15+ lines of text keep the cursor line and the Post button visible.

### BUG-002 — Reels camera/gallery don't work; tag required · High

- **Client said:** can't open camera or pick from gallery; forced to pick a predefined tag.
- **We have now:**
  - Gallery/Camera buttons exist in `src/features/reels/components/ReelComposeSheet.tsx` (143–153) — but fail due to F3 issues (permission, iOS plist, mime fallback, 3gp).
  - Tag defaults to `'motivation'` with no "none" option (`ReelComposeSheet.tsx` 29–34, 55, 61).
  - Backend rejects a published post without a category: `feed.service.js` 799–806 (`CATEGORY_REQUIRED`), also on update (947–956, 1036–1044).
- **Fix:** F3; make category optional in UI (no preselection, "Add a topic (optional)"); backend: allow empty categories for `type: 'video'` **or** default to a new `general` category (decision 1).
- **Backend files:** `src/modules/feed/feed.service.js`, `src/modules/feed/feed.constants.js`.
- **Done when:** camera records, gallery picks, both on Android 13+ and iOS; reel posts with no topic.

### BUG-003 — Notifications don't open content; two items always visible · Medium

> **Status: ✅ Fixed in Slice 1.** Test steps in section 0.

- **Client said:** tapping does nothing; two irrelevant items never go away.
- **We have now:**
  - `src/features/notifications/screens/NotificationsScreen.tsx` renders **hardcoded mock data** from `src/features/notifications/data/notifications-preview.ts` (3 fake rows: "Capt. Vikram Rao followed you", "Meera Sharma commented" — both `unread: true` — and "SSB Psychology Lab"). These are the two "permanent" items.
  - Rows are plain `View`s, no `onPress`.
  - Bell badge in `src/features/feed/components/FeedHeader.tsx` (51–53) shows for any logged-in user.
  - No notifications API/hook exists on mobile. This breaks our own rule "no fake data on live screens" (`docs/SOCIAL-MEDIA.md`).
- **Backend has:** `GET /notifications` (cursor, limit, unreadOnly, returns `unreadCount`), `GET /notifications/unread-count`, `POST /notifications/read-all`, `POST /notifications/:id/read`, `DELETE /notifications/:id`. Each item has `kind, headline, detail, actors[], unread, href, createdAt`. `href` is a web path:
  - `/u/:username` → `MemberProfile`
  - `/posts/:id` (like/comment/reply/mention/share/moderation) → `PostDetail` (F5), with `meta.commentId` for comments
  - `/c/:slug` → `ClubHome`
  - `/learn`, course `meta.href` → My Course tab / `CourseDetail`
  - `/profile/edit` → Edit Profile (BUG-013)
  - `/notifications` → stay
  - Note: backend auto-creates an "attempt date" reminder when the exam date is within 7 days (`notification.service.js` 816–846) — expected, not a bug.
- **Fix:**
  - New `src/features/notifications/api/notifications.api.ts` + hooks (infinite list, unread count, mark read, mark all read).
  - Real list with avatar, headline, detail, relative time, unread dot; pull-to-refresh; empty state; "Mark all as read".
  - Tap = mark read (optimistic) + navigate via a `hrefToMobileRoute()` helper.
  - Bell badge = real `unreadCount > 0`.
  - Delete `notifications-preview.ts`.
- **Done when:** no mock rows; tapping a like/comment opens that post; read state persists after refresh; badge clears.

### BUG-004 — No preview of selected photo/video · High

- **Client said:** after choosing media there's no preview to confirm it.
- **We have now:** `FeedComposeSheet.tsx` stores the image but shows only the text "Photo attached" (98–102); no remove; only one photo; no video (the composer's video option jumps to the Reels tab). Backend accepts up to 10 images or 1 video per post.
- **Fix:** F4 `MediaPreviewTile` in the composer with remove/replace; allow multiple images (up to backend limit) in a horizontal strip.
- **Done when:** user sees exactly what will post and can remove/replace it.

### BUG-005 — No warning when leaving a post; no draft · Medium

- **Client said:** leaving the composer loses work silently; no draft option.
- **We have now:** see F2. Backend supports `status: 'draft'` on `POST /posts` (`feed.service.js` 727–734), `GET /posts/drafts` (`feed.routes.js` 92), and draft → published via `PATCH`. Mobile never uses them.
- **Fix:** F2 with *Keep editing / Save draft / Discard*. "Drafts" entry in the composer (list from `GET /posts/drafts`, tap to continue, publish via `PATCH status: 'published'`).
- **Done when:** closing a dirty composer always asks; saved draft appears in Drafts and can be published.

### BUG-006 — Reel categories too SSB-focused · Medium

- **Client said:** categories should be broader, like onboarding interests.
- **We have now:**
  - Compose chips (mobile constant, `ReelComposeSheet.tsx` 29–34): Psychology, GTO, Motivation, Interview (sent as `entry_guidance`).
  - Explore filter chips (`src/features/reels/screens/ReelsScreen.tsx` 75): All, Psychology, GTO, Interview, OIR.
  - Displayed category is **guessed by regex** in `src/features/reels/lib/to-prep-reel.ts` 30–42; anything unmatched shows as **Psychology** (so Motivation reels appear under Psychology).
  - "OIR" is a filter but not a backend category.
  - Backend `POST_CATEGORIES` (`feed.constants.js` 36–50): psychology, gto, interview, current_affairs, motivation, fitness, defence_news, books, experience, recommendation_story, medical, entry_guidance, leadership. Exposed by `GET /feed/meta` — mobile doesn't use it.
  - Onboarding interests (`src/modules/onboarding/onboarding.constants.js` 138–154): psychology, gto, interview, current_affairs, fitness, communication, olq, leadership, motivation, defence_news, strategy, books, mathematics, english, general_studies. (Mobile onboarding has no interests step; web does.)
- **Fix:**
  - Backend: add missing interest keys to `POST_CATEGORIES` (communication, olq, strategy, mathematics, english, general_studies, + `general`) so one list serves both.
  - Mobile: load categories from `GET /feed/meta` (cached), use them for compose chips and explore filters (scrollable chips); show category from `post.categories[0]` instead of regex guessing; remove "OIR" unless added on backend.
- **Done when:** compose and filter show the same broad list; a reel shows the category the author picked.

### BUG-007 — Messages red dot always on · Medium

> **Status: ✅ Fixed in Slice 1.** Test steps in section 0.

- **Client said:** red dot stays even with nothing unread.
- **We have now:** `src/features/feed/screens/FeedScreen.tsx` line 380: `hasUnreadMessages={isAuthed}`. Real data already exists: `useChatUnreadQuery` (`src/features/message/hooks/useChatQueries.ts` 72–79 → `GET /chat/unread-count`), thread marks read on open (`ChatThreadScreen.tsx` 98–105), socket invalidates on `unread:total`.
- **Fix:** `hasUnreadMessages = (useChatUnreadQuery(token).data?.unreadCount ?? 0) > 0`. Optionally show the count (9+). Optionally add the same badge on the Reels header messages icon (`ReelStage.tsx` 154–161).
- **Done when:** dot shows only with unread chats and disappears after reading.

### BUG-008 — Saved posts don't appear in Saved Items · High

> **Status: ✅ Fixed in Slice 1.** Also found and fixed: Save on **community** posts never called the API, and `/bookmarks` returned `followingAuthor: false` for everyone. Test steps in section 0.

- **Client said:** saved posts never show up.
- **We have now:** `src/features/bookmark/screens/BookmarkScreen.tsx` (58–66) is a **static placeholder** ("Nothing saved yet") — no query. Saving works on the server (`POST /posts/:postId/bookmark` from `FeedScreen.tsx` 226–257 and `ReelsScreen.tsx` 255–282) but only patches the feed cache.
- **Backend has:** `GET /bookmarks?cursor&limit&folder` (`feed.routes.js` 71) returning full posts (reels included), plus folder endpoints `GET/POST/PATCH/DELETE /bookmarks/folders`.
- **Fix:**
  - `feedApi.listBookmarks` + infinite query hook.
  - Real Saved screen: tabs/chips **All · Posts · Reels**, post cards (reels as video tiles opening the player), unsave from the list, pull-to-refresh, empty state.
  - Invalidate the bookmarks query after every save/unsave (feed, reels, community `ClubFeedPane.tsx`).
  - (Optional later) folders.
- **Done when:** save → appears immediately in Saved; unsave → disappears.

### BUG-009 — No personal timeline on profile · High

> **Status: ✅ Fixed in Slice 4.** Test steps in section 0. Header “Posts” count can still be higher than the list when some posts are followers-only.

- **Client said:** profile doesn't show my published posts.
- **We have now:** `src/features/profile/screens/ProfileScreen.tsx` has header, Discover grid, Account panel — no posts. Public profile `MemberProfileScreen.tsx` only has the bare "Activity" text list (see 020).
- **Backend has:** `GET /profile/:username/posts?cursor&limit` (owner sees all; others get visibility rules). Mobile already has `profileApi.getPosts` (no cursor) and unused `feedApi.listProfilePosts`.
- **Fix:** shared `ProfilePostsSection` with **Posts | Reels** toggle — posts as `FeedPostCard` list, reels as a 3-column video grid; infinite scroll; used on both own profile and member profile. Own profile empty state with a "Create your first post" button.
- **Done when:** own and others' profiles list published posts/reels; tap opens `PostDetail` / reel player.

### BUG-010 — No option to verify email later · Medium

- **Client said:** can't continue without verifying email.
- **We have now:**
  - Sign-up → `OtpScreen.tsx` is titled **"Verify your mobile"** and says "Code sent to <masked mobile>", but the backend **emails** the code (`auth.service.js` 500–515, 536–553, 605–622). No skip; session only created after verify. Verifying sets `isMobileVerified`, **not** `isEmailVerified`.
  - Then a second prompt: `EmailVerificationBanner.tsx` (47–72) shows on every screen with no close; `EmailVerificationSheet.tsx` has "Later" (196–199) but it isn't remembered.
  - Backend enforces nothing on `isEmailVerified` (no middleware).
- **Fix:**
  - Fix OTP screen copy to match reality ("Enter the code we emailed to a***@…").
  - Backend: when the register code (sent to email) is verified, also set `isEmailVerified = true` + `emailVerifiedAt` → no second prompt for new users.
  - Banner: add ✕ / "Later" that snoozes for 24 h (stored locally); re-show after; keep "Verify" in Profile → Account.
  - Keep the sign-up code step itself (it proves the account); "later" applies to the email prompt.
- **Done when:** new user verifies once; existing unverified user can dismiss and continue; reminder comes back later.

### BUG-011 — Photos/videos can't open full screen · Medium

- **Client said:** can't tap media to view it bigger.
- **We have now:** `src/features/feed/components/FeedPostCard.tsx` renders the `Image` (183–190) with no `Pressable`; video posts render no media at all.
- **Fix:** F4 `MediaViewer`; wrap post media in `Pressable`; render video posts with a poster + play icon (tap → viewer with controls). Same viewer for chat images if useful.
- **Done when:** tap image → full screen, pinch-zoom, close; tap video → plays full screen with controls.

### BUG-012 — Can't update profile photo · High

- **Client said:** no way to change profile photo.
- **We have now:** own avatar always shows initials (`ProfileScreen.tsx` 135–140) even though `profilePhotoPath` is on the user. No edit control, picker, or upload call anywhere.
- **Backend has:** `POST /profile/me/photo` (multipart field **`photo`**), `POST /profile/me/banner` (field `banner`); JPEG/PNG/WebP only, ≤10 MB, account must be `active`.
- **Fix:** avatar shows the real photo; camera badge on avatar → action sheet (Take photo / Choose from gallery / Remove) via F3; square crop if possible; upload; refresh auth user (`auth.store.ts`) and profile caches; success/error toast. Convert HEIC to JPEG before upload (iOS).
- **Watch:** wrong field name, HEIC rejection, `ACCOUNT_NOT_ACTIVE` for pending accounts, uploads stored on local disk (`/uploads`) may vanish on hosts like Render.
- **Done when:** new photo shows everywhere (profile, posts, comments) after save.

### BUG-013 — No option to edit account details · Medium

- **Client said:** can't edit name, email, or phone.
- **We have now:** no Edit Profile screen or route. Account panel shows mobile/email read-only (`ProfileScreen.tsx` 231–252).
- **Backend has:** `PATCH /profile/me` — fullName, username (unique, validated), bio, city, education, hobbies, languages, examGoal(s), preferredService, targetEntry, ssbBoard, preparationStage, preferredBranch, medicalStatus, expectedJoining, attemptDate, attempts/recommendations/conferenceOuts, section privacy, mentorAvailability. **Does not** accept email or mobileNumber. No change-email/phone flow for active users (only rejected-application resubmit).
- **Fix (Phase 1):** new `EditProfile` screen (route + `RootNavigator`): photo/banner (BUG-012), name, username, bio, city, education, exam goal, privacy toggles; Save via `PATCH /profile/me`; "Edit profile" button on own profile.
- **Fix (Phase 2, backend):** `POST /auth/email/change` + verify OTP to new email; `POST /auth/mobile/change` + verify OTP (mobile is the login key, unique). Email/phone rows open those flows.
- **Done when:** user edits name/bio/photo and sees it immediately; email/phone show "Change" once Phase 2 lands.

### BUG-014 — No camera when creating a story · High

- **Client said:** story creation has no camera.
- **We have now:** `DayBriefComposeSheet.tsx` (51–56, 103–107) only "Choose photo or video" → `pickStoryMedia()` (`pick-feed-video.ts` 84–111, gallery only). Failures/cancel silently ignored. Duration hardcoded 12 s video / 6 s image (`FeedScreen.tsx` 340–355).
- **Fix:** two clear buttons **Camera** (photo or video, via F3) and **Gallery**; F4 preview before sharing; error toasts. Backend already accepts images + mp4/webm/mov.
- **Done when:** user can shoot a photo/video straight into a story.

### BUG-015 — Suggested connections too narrow · Medium

- **Client said:** suggestions feel too specialised; want more variety.
- **We have now:**
  - `NetworkScreen.tsx` uses `GET /profile/me/suggestions?limit=24&cursor=`; chips All/Officers/Educators/Institutes/Aspirants filter **only already-loaded rows on device** (60–66) → filters often look empty.
  - Backend `listSuggestions` (`src/modules/profile/profile.service.js` 697–800): excludes self + already followed, `accountStatus: 'active'` only, sorted by `verificationLevel` desc then `_id` desc — **no relevance** (exam, city, institute, interests, mutuals).
  - **Pagination bug:** cursor is `_id < lastId` but sort is by verificationLevel first → page 2+ skips newer/lower-verified members (most aspirants).
- **Fix (backend):** score candidates — mutual follows (friends of friends), follows-you-back, same exam goal, shared interests, same city/institute, then verification as a tie-breaker; mix roles so each page has variety; proper score-based cursor (or offset); optional `role` query param so chips filter server-side.
- **Fix (mobile):** pass `role` with the chip; show the backend `suggestionReason` ("Also preparing for NDA", "Followed by X").
- **Done when:** first page has a mix of roles; each chip returns real results; reasons are shown.

### BUG-016 — Comment keyboard + no discard warning · Medium

- **Client said:** keyboard hides the comment; closing loses the comment silently.
- **We have now:** one shared `src/features/feed/components/FeedCommentsSheet.tsx` for posts and reels; iOS-only keyboard handling; fixed 82% height; draft cleared on hide (82–87); backdrop/Close/back close directly (275, 282, 299).
- **Fix:** F1 + F2 (*Keep writing / Discard*). Input grows to ~5 lines then scrolls.
- **Done when:** comment always visible while typing on Android; closing with text asks first.

### BUG-017 — No camera when creating a Reel · High

- **Client said:** no record option for reels.
- **We have now:** a small "Camera" text link exists (`ReelComposeSheet.tsx` 149–153) but fails for F3 reasons and only shows "Video needed".
- **Fix:** F3 + redesign the reel composer: two large tiles **Record** and **Gallery** before a video is picked; then preview (021) + caption + topic.
- **Done when:** recording works on both platforms and the option is obvious.

### BUG-018 — Reel caption duplicates after upload · High

> **Status: ✅ Fixed in Slice 1.** Test steps in section 0.

- **Client said:** "I did it" shows as "I did it I did it".
- **We have now:** data is stored once (correct). The bug is display only:
  - `to-prep-reel.ts` 81–82: `title` = first line of content, `synopsis` = full content.
  - `src/features/reels/components/ReelStage.tsx` line 86: ``const caption = `${reel.title} ${reel.synopsis}`;`` → one-line caption printed twice. Empty caption shows "Shared a Prep Reel Shared a Prep Reel".
- **Fix:** render `reel.synopsis` only (with "more" expand); keep `title` for grid tiles. Stop sending the fallback text `'Shared a Prep Reel'` as content (`ReelComposeSheet.tsx` 166–170) — allow empty caption.
- **Done when:** caption appears exactly as typed; no fake caption on empty.

### BUG-019 — Keyboard hides captions/comments (posts + reels) · Medium

- **Client said:** same keyboard problem on captions and comments.
- **We have now / Fix:** same root cause as 001/016 → F1 applied to `ReelComposeSheet`, `DayBriefComposeSheet`, `FeedComposeSheet`, `FeedCommentsSheet`.
- **Done when:** all four sheets pass the keyboard test on Android.

### BUG-020 — Activity tab unclear on others' profiles · Medium

> **Status: ✅ Fixed in Slice 4.** “Activity” is now a **Posts** section with real cards. Test steps in section 0.

- **Client said:** unclear what Activity means; items don't link anywhere.
- **We have now:** `src/features/profile/components/MemberProfileTabs.tsx` `ActivitySection` (342–381): calls `profileApi.getPosts(username)` (own posts only, 20 max, no paging), shows text snippet or the word "Photo" + time; no media, no tap, no subtitle; load errors show as "has not posted publicly yet". "Posts" count includes followers-only posts but list filters them → count and list can disagree. No likes/reshares data exists.
- **Fix:** replace Activity with the shared `ProfilePostsSection` from BUG-009 (label **"Posts"**, subtitle "Public posts and reels by <name>"), real cards with media, tap → `PostDetail` (F5), paging, error state with Retry. Make the header count match what the viewer can see (backend `profile.service.js` 114–117).
- **Done when:** every item says what it is and opens the post.

### BUG-021 — No reel preview or mute before publishing · Medium

- **Client said:** can't preview the picked video or mute it.
- **We have now:** composer shows only the file name / "Video selected" (`ReelComposeSheet.tsx` 115–117). Mute only exists as a viewer playback toggle (`ReelsPlayer.tsx` 52, `ReelStage.tsx` 162–173). Backend media schema (`post.model.js` 14–28) has no mute flag; uploaded videos get `thumbnail: ''`, `duration: null`.
- **Fix:**
  - Mobile: F4 inline preview (loop, tap to play/pause) + **Mute original audio** toggle; send `audioMuted` with the media item; player respects it.
  - Backend: add `audioMuted: Boolean` to media sub-schema, keep it in `normalizeMediaInput` (`feed.service.js` 660–724) and `serializePost` (198–206). (Optional: generate video thumbnail/duration server-side.)
- **Done when:** user previews before posting; muted reels play silent for everyone.

### BUG-022 — No edit after publishing (post + reel) · High

- **Client said:** can't fix a caption after posting.
- **We have now:** `src/features/feed/components/FeedPostMenu.tsx` (40–63) offers Pin/Delete (owner) and Report (others) — no Edit. Reel player has **no owner menu at all** (`ReelStage.tsx` side buttons are Like/Comment/Send/Save). No `updatePost` in `src/features/feed/api/feed.api.ts`.
- **Backend has:** `PATCH /posts/:postId` (owner-only, content/visibility/categories, sets `editedAt`).
- **Fix:** F6 + "Edit post" in `FeedPostMenu` for owners → composer in edit mode (prefilled, media read-only); reel player gets ⋯ for owner (Edit caption & topic, Delete) and for others (Report); show "Edited" next to time.
- **Done when:** owner edits a post/reel caption and sees it updated in feed, profile, saved, and reels.

### BUG-023 — Cannot cancel a community join request · Medium

- **Client said:** after requesting to join a club that needs approval, there is no way to take the request back.
- **Steps they used:** open a club that needs approval → Request to join → come back and try to cancel.
- **We have now:**
  - `ClubHomeScreen.tsx` (about lines 268–287): if `membershipStatus === 'pending'`, the button reads **Requested**, is `disabled`, and does nothing.
  - Tapping like/comment while pending only toasts “An admin still needs to approve you.” (`onNeedJoin`, lines 100–102).
  - Leave is shown only when `isMember` is true. A pending request is not a member, so Leave never appears.
  - The server already does the right thing. `DELETE /communities/:slug/leave` (`community.service.js` `leave`, ~668–717) deletes the membership row. It only reduces the member count when the person was already approved. Mobile already calls this from `useLeaveCommunityMutation` — only from the Leave confirm, which pending users never see.
- **Fix:** while the request is pending, the button reads **Cancel request** (not disabled). Tap asks “Cancel this request?” then calls the existing leave mutation. Success toast: “Request cancelled”. The button returns to **Request to join**. Do not change the join rules.
- **Done when:** request → button says Cancel request → confirm → request is gone and Request to join is back. An approved member still sees Joined / Leave, unchanged.

### BUG-024 — Cannot create a community · High

- **Client said:** the app does not let them create a community. Expected: people with the right access can create one, and the flow finishes.
- **We have now:**
  - The wizard exists: Community → **Create** → `CreateCommunityScreen.tsx` (“Open a club”, steps Identity / Access / Review) → `POST` create → opens the new club.
  - Who may create is locked in two places that match: mobile `canCreateCommunity` (`community-permissions.ts`) and backend `resolveCreateIntent` (`community.constants.js` 63–138). Allowed: `defence_officer`, `institute`, `institute_admin`, freelancer `educator`. An institute educator also needs permission `community.create`. Everyone else, including an **aspirant**, is refused (`COMMUNITY_CREATE_FORBIDDEN`).
  - On the Community tab, the Create pill and the “Open a club” card render only when `canCreate` is true (`CommunitiesScreen.tsx` `showCreate`). A signed-in aspirant sees **no create control and no sentence explaining why**. A guest sees Create, then the join sheet.
  - If someone who is not allowed opens the screen anyway, it says “Create not available” and lists the roles.
- **Fix (decision 9):** do not let every aspirant create a club. Do make the rule visible: under the Community title, a quiet line — “Officers and educators can open a club. You can join one below.” Officers, institutes, and allowed educators keep the Create pill, and the wizard must still finish (name of at least 3 characters → public or private → create → land on the new club). If create fails (quota full, missing permission), the toast stays specific, not a generic failure.
- **Done when:** an aspirant understands why there is no Create. An officer creates a public club named e.g. `Delhi GTO Room` and lands inside it. An institute educator without `community.create` sees the permission reason, not a dead button.

### BUG-025 — No way to pin a comment on a Reel · Low

- **Client said:** the owner of a Reel cannot pin a comment.
- **We have now:** Reels and posts share `FeedCommentsSheet.tsx`. A comment has a photo, the text, Reply, and a like. There is no ⋯ on a comment. The comment model (`comment.model.js`) has no pin field. There is no pin-comment route on the server.
- **Fix (decision 11):**
  - Backend: `pinnedAt` on the comment. Only the post owner may pin. One pinned comment per post; pinning another one unpins the first. Owner-only route, e.g. `POST /posts/:postId/comments/:commentId/pin` (toggle). Listing comments returns the pinned one first, then the rest by time.
  - Mobile: on a comment, the owner sees ⋯ → **Pin comment** / **Unpin**. The pinned comment stays at the top with a small “Pinned” label. Same sheet on Home and Reels. Someone who does not own the Reel does not see Pin.
- **Done when:** on your own Reel, pin a comment → it stays on top, labelled Pinned, after closing and reopening comments. Pin a second comment → the first one unpins. On someone else’s Reel, Pin is not there.

### BUG-026 — Report post is in the wrong place · Medium

- **Client said:** Report post is hard to find and easy to confuse with ordinary actions.
- **Steps they used:** open a post on Home → ⋯ → look at where Report sits.
- **We have now:** `FeedPostMenu.tsx` uses `ChatThreadMenu`. That menu is always drawn at the **top-right of the screen** (`ChatSafetySheet.tsx`, `top: insets.top + 44`, `right: 8`), not beside the ⋯ that was tapped. On someone else’s post the menu is a single red row, **Report post**, floating under the header. On your own post the menu is Edit caption, Pin to profile, then Delete — Report is correctly absent (you don’t report yourself). The confirm dialog (Spam / Abuse / Misinformation / Other, then Report at the bottom-right) is a separate step and is fine.
- **Fix:** open the post menu as a bottom sheet, the same pattern as notification options. Order for someone else’s post: a short label of the action, then **Report post** in red at the bottom, separated from anything else. Order for your own post stays Edit, Pin, then Delete in red at the bottom. The menu sits at the bottom of the screen, not under the bell. Do not change what reporting sends.
- **Done when:** ⋯ on a post halfway down Home opens the sheet at the bottom. Report is the last row, in red, and is not beside Edit or Pin. Tapping it still opens the reason dialog.

### BUG-027 — No edit after publishing a post or a Reel · High

- **Client said:** after publishing, they cannot edit the post, and they cannot edit a Reel’s description. Same request as BUG-022, filed again on 26 Oct.
- **We have now (Slice 5, same day):**
  - Your post on Home and on the post screen: ⋯ → **Edit caption** → words only, photos and video stay, time line shows **Edited**. `PATCH /posts/:id`.
  - Your Reel: ⋯ on the player → the same **Edit caption** sheet (`ReelsScreen.tsx` ~387–418). The description is the caption.
  - The You-tab grid and someone else’s profile grid have **no ⋯**. Tap opens the post, and Edit is on that screen’s menu, not on the tile.
  - The label says “Edit caption”, not “Edit”. A person looking for “Edit” can miss it.
- **Fix:** do not rebuild the editor. On the build they test, confirm Edit caption is on Home, the post screen, and the Reel player. Rename the row to **Edit** (subtitle can say the photos stay). From the profile grid, the post screen’s ⋯ must include Edit for the owner — that path already should. If a Reel’s ⋯ still has no Edit after reload, that is the bug to close; the sheet already exists.
- **Done when:** your Home post and your Reel both show **Edit**. Changing the words to `Updated caption` shows those words and **Edited**. The photo or video is unchanged. Someone else’s post has no Edit.

### BUG-028 — Pin post does nothing visible · Medium

- **Client said:** Pin post is in the menu, but after tapping it the post is not pinned anywhere they can see.
- **We have now:**
  - Menu row **Pin to profile** (`FeedPostMenu.tsx`). Home calls `POST /posts/:id/pin` (`FeedScreen.tsx` `pinMutation`) and toasts “Pinned to profile”.
  - The server sets `pinnedAt` (`feed-phase-c.service.js` `togglePin`). Limits: aspirant 1, educator and officer 5, institute 10 (`PIN_LIMITS`). A second pin past the limit returns an error.
  - The profile grid loads `getAuthorFeed` → `queryFeedPage`, which sorts `{ createdAt: -1 }` only (`feed.service.js` ~613–614). `pinnedAt` is ignored. `ProfilePostGrid` draws no pin mark. So the toast is the only proof the tap worked.
  - Home order is time-first and also ignores `pinnedAt`. That is correct if pin means “on my profile” (decision 10). It is why the Home feed does not rearrange.
- **Fix:**
  - Profile posts: pinned posts first, then the rest by time. The cursor must not drop or repeat a pinned post on “Show more”.
  - Grid tile: a small pin mark in the corner (keep the play mark and the layers mark; don’t stack them on top of each other).
  - After pin or unpin, refresh the profile grid, not only Home. Toast stays.
  - Unpin still works. Hitting the limit shows the server message (“You can pin at most 1 post”), not a silent failure.
- **Done when:** pin your newest-but-one post → on You it is the first tile, with a pin mark. Home order does not change. Unpin → it returns to its time slot and the mark is gone.

### BUG-029 — No search for people, courses, or institutes · High

- **Client said:** from the main feed they cannot search for a person, a course, or an institute.
- **We have now:**
  - `FeedHeader.tsx` is the logo, the bell, and messages. No search icon. No search screen on the root stack.
  - Learn already searches courses (`LearnScreen.tsx` passes `q` to the course list). Backend: `GET /courses?q=` (`course.routes.js`, `listCourses`).
  - People: `GET /feed/mentions?q=` matches **full name only**, limit 8, no username, no role (`feed.service.js` `searchMentionUsers`). It is a composer typeahead, not a directory. Mobile feed API does not call it.
  - Institutes: no public search. An institute is a user with role `institute` or `institute_admin`.
  - Community has its own club search. Network has no search box. Neither is what this bug asks for.
- **Fix:** a search icon on the Home header opens one search screen.
  - Field at the top. Three chips: **People**, **Courses**, **Institutes**. Empty field shows a short hint, not a fake list.
  - People: name or @username, photo, role. Tap → their profile. Backend: extend mention search (or a small `GET /search/people`) to match username as well as name, and return enough rows to scroll.
  - Courses: the existing `GET /courses?q=`. Tap → the course screen.
  - Institutes: same people search filtered to institute roles, shown with the institute name. Tap → that profile.
  - Do not add post search in this bug. The client did not ask for it.
- **Done when:** Home → search → type `Milan` on People → that profile opens. Type a real course word on Courses → that course opens. Type an institute name on Institutes → that institute opens. A nonsense word shows a clear empty line, not a spinner that never ends.

---

## 5. Suggested build order

1. ✅ **Quick wins (Slice 1, done):** BUG-018, BUG-007, BUG-008, BUG-003 (+ F5 PostDetail).
2. **Foundations:** F1 keyboard sheet → fixes 001/016/019; F2 discard guard → 005/016; F3 permissions + iOS plist → 002/014/017.
3. **Media:** F4 preview/viewer → 004, 011, 021 (+ backend `audioMuted`).
4. **Post screen + edit:** F5 `PostDetail`, F6 edit → 022, 020, notification links.
5. **Profile:** ✅ 009 + 020 (Slice 4). ✅ 012 photo + 013 phase 1 (Slice 5). Email/mobile change is still phase 2.
6. **Content rules:** 006 categories + optional tag (backend constants), 005 drafts.
7. **Backend logic:** 015 suggestions, 010 email flag + copy, 013 phase 2 email/phone change.
8. ✅ **Day 3 + email/mobile (Slice 6, done):** 023, 024, 025, 026, 027, 028, 029, and BUG-013 phase 2.

---

## 6. QA checklist (run before sending back to client)

Test on **one Android 13+ device** and **one iPhone**, light and dark mode.

- [ ] 001/016/019 — type 15 lines in post, comment, reel caption, story; text and buttons visible on both OS
- [ ] 002/017 — record reel with camera; pick from gallery; deny permission → clear message + Settings link; post with no topic
- [x] 003 — no mock rows; tap like/comment/follow notification → correct screen; mark all read; badge clears
- [ ] 004 — pick photo(s) → thumbnails, remove, replace
- [ ] 005 — close dirty composer → Keep / Save draft / Discard; draft reopens and publishes
- [ ] 006 — compose and explore show the same broad list; reel shows the chosen category
- [x] 007 — dot only when unread; read thread → dot gone
- [x] 008 — save post and reel → in Saved at once; unsave → removed
- [x] 009/020 — own and others' profiles list posts; tap opens the post. Header count vs followers-only posts still to check
- [ ] 010 — new user verifies once; existing unverified user can dismiss email banner
- [ ] 011 — tap image → full screen zoom; tap video → full-screen playback
- [ ] 012 — change photo from camera and gallery; shows on posts/comments
- [x] 013 — edit name/bio/username; change email and mobile with the emailed code
- [ ] 014 — story from camera (photo + video)
- [ ] 015 — suggestions mixed roles; each chip returns results; page 2 has new people
- [x] 018 — caption shown once; empty caption shows nothing
- [ ] 021 — preview before publish; muted reel plays silent
- [x] 022 / 027 — edit own post and reel caption; "Edited" label; others can't edit
- [x] 023 — pending club request → Cancel request → Request to join is back
- [x] 024 — aspirant sees why they cannot create; an officer can finish creating a club
- [x] 025 — owner pins one Reel comment; it stays on top; a second pin replaces it
- [x] 026 — Report is the last row of a bottom sheet, in red
- [x] 028 — pinned post is the first profile tile, with a pin mark; Home order unchanged
- [x] 029 — Home search finds a person, a course, and an institute
- [ ] `yarn typecheck` passes; backend `node --check` on changed files
