# BIGB Mobile — Community (full club)

Track this file while shipping. Web (`SSBPsychBigB-Frontend`) + backend stay the API contract. Do not invent a second community model.

Related: web spec `SSBPsychBigB-Frontend/docs/19-community-v2-master-spec.md`.

---

## Locked product (mobile-first)

Creators (officer, freelancer educator, institute, permitted educator) run the club **on the phone**. Aspirants browse and request on the phone.

| Capability | Mobile |
|---|---|
| Discover + search + My clubs | Yes |
| Create club (name, access, goals, brand) | Yes |
| Public preview without join | Yes — view only |
| Request to join / leave | Yes |
| Approve / reject join requests | Yes (Primary + Co-Admin with members right) |
| Club feed, Q&A, Files, Events, News, About | Yes |
| Post / like / comment (approved members) | Yes |
| Club chat | Yes — reuse `ChatThread` |
| Members list, mute/remove | Yes (admins) |
| Visibility, rules, invite link | Yes (rights) |
| Archive / delete (dual-key) | Yes |
| Super Admin institute quota / create queue | **No** — admin web only |

Join is **never** automatic. Public clubs are readable; likes and posts need an approved membership.

---

## Navigation

- Tab **Community** = discover hub.
- Stack **CreateCommunity**.
- Stack **ClubHome** `{ slug, invite? }` with in-screen pills: Feed · Q&A · Files · Events · News · About · Members · Requests · Settings.

---

## Checklist

### Phase 0 — Foundation

- [x] `api/community.api.ts` (same paths as web)
- [x] types + React Query hooks
- [x] `canCreateCommunity` / public preview helpers
- [x] Root routes `ClubHome`, `CreateCommunity`

### Phase 1 — Discover + Create

- [x] Live discover (replace static preview list)
- [x] My clubs + pending requests
- [x] Create wizard (identity → access → review)
- [x] Institute quota message when full

### Phase 2 — Club home

- [x] Hero + join / requested / leave
- [x] Public preview vs private lock
- [x] Feed + compose (`communityId`)
- [x] Interaction lock until approved member
- [x] Rules accept gate

### Phase 3 — Rooms

- [x] Q&A
- [x] Files (list + add link / upload)
- [x] Events + RSVP + create
- [x] News + announce (mods)

### Phase 4 — Admin

- [x] Members
- [x] Join requests approve / reject
- [x] Club chat
- [x] Pin / remove posts
- [x] Settings: visibility, invite, archive, delete (dual-key)

### Phase 5 — Polish

- [x] `yarn typecheck` (passes)
- [ ] `yarn lint` (repo still has pre-existing errors outside community)
- [ ] Device pass (discover → create → join → approve → post → delete)

---

## How to implement

1. Same `/api/v1/communities…` paths as web.
2. Map API → card view-models (`to-community-card.ts`). No raw DTO in JSX.
3. Reuse `FeedPostCard`, `FeedCommentsSheet`, `FeedComposeSheet`, `ChatThread`, `ConfirmModal`, `JoinToContinueSheet`.
4. Guests: browse public clubs; join/like open `JoinToContinueSheet`.
5. No fake clubs on live screens.

---

## How to test

Two accounts: **Creator** (officer/educator/institute) and **Aspirant**.

1. Creator: Community tab → **Create** → public club → lands in ClubHome as Primary.
2. Guest / other user: open that club → **see feed**, like → join prompt.
3. Aspirant: Request to join → Creator **Requests** → Approve → Aspirant can post/like.
4. Creator: Settings → request **Delete** → needs Co-Admin second key (or appoint Co-Admin first). Archive same dual-key.
5. Private club without invite: non-eligible user cannot browse the feed.
