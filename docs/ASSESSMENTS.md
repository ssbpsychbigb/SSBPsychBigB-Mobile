# BIGB Mobile — Assessments

Track this file while shipping. Web (`SSBPsychBigB-Frontend`) + backend (`SSBPsychBigB-Backend`) stay the API contract. Do not invent a second assessment model.

Related:

- Web learner UX: `/assessments`, `/assessments/:slug`, attempt, result, history, bookmarks, weak topics, leaderboard
- Web creator studio: `/educator/assessments`, `/institute/assessments` (**web only**)
- Web admin moderation: `/admin` assessments (**admin web only**)
- Backend: `/api/v1/assessments`
- Course learning (separate product): [`LEARNING.md`](./LEARNING.md)

This module is the defence test engine (practice, mock, OIR, WAT, SRT, PPDT, TAT). In-lesson MCQ quizzes stay inside `LessonPlayer` and are already shipped under Learning. Do not merge the two.

Implement **one phase at a time**. Tick boxes here as you ship. Do not start Phase N until Phase N−1 is usable.

---

## Locked product (mobile)

Mobile is the **student test app**: browse published tests, start, answer, submit, read the result.

| Capability | Mobile |
|---|---|
| Browse published catalogue (search) | Yes |
| Test detail (time, pass %, price, attempts, rules) | Yes |
| Start / resume an in-progress attempt | Yes |
| MCQ + WAT + SRT + PPDT + TAT in one player | Yes |
| Server timer, autosave, auto-submit | Yes |
| Result (score, pass, pending grade, topic bars) | Yes |
| Review, bookmark, challenge a question | Yes |
| History, bookmarks list, weak topics | Yes |
| Leaderboard | Yes |
| Tests linked from a course detail | Yes |
| Standalone paid checkout | Yes — shared order with `assessmentId`, sandbox or Razorpay. iOS IAP is later |
| **Create / edit / publish a test** | **No** — web studio only |
| **Grade inbox / manual marking** | **No** — web studio only |
| **Studio analytics** | **No** — web only |
| Admin approve / official mocks | **No** — admin web only |
| Webcam proctoring, AI score | **No** — not in this module |

A test started on web resumes on mobile, and a test submitted on mobile shows on web history. Same account, same attempt.

Guests may open the catalogue and a public detail. Start, save, submit, history, bookmarks, and leaderboard need a logged-in active user.

Educator and institute accounts use the **same learner surfaces**. No mobile studio.

---

## Navigation

Do **not** add a sixth bottom tab. Tests live on the existing **My Course** tab.

- Tab **My Course** (`myCourse`) gains a third hub mode beside Explore and My learning:
  - **Tests** — `GET /assessments` (search). Guests can browse.
- Stack screens (same pattern as `CourseDetail` / `LessonPlayer` — they sit on the root stack, so the floating tab bar is already gone):
  - **AssessmentDetail** `{ slug }`
  - **AssessmentAttempt** `{ slug, attemptId }`
  - **AssessmentResult** `{ slug, attemptId }`
  - **AssessmentHistory** (Phase 4)
  - **AssessmentBookmarks** (Phase 4)
  - **AssessmentWeakTopics** (Phase 4)
  - **AssessmentLeaderboard** `{ slug }` (Phase 5)
- Attempt is a committed screen. Hardware back asks to leave. Leaving does not pause the server deadline.
- After submit, replace the attempt route with the result route so Back does not reopen the paper.
- Do **not** add studio / create-test / grade routes.

---

## API contract (reuse, do not fork)

Same `apiRequest` + Bearer token pattern as Learn. Paths below are under `/api/v1`.

| Client | Backend | Auth |
|--------|---------|------|
| List catalogue | `GET /assessments` (`q`, `kind`, `examGoal`) | Optional |
| Detail | `GET /assessments/:idOrSlug` | Optional |
| Tests on a course | `GET /assessments/course/:idOrSlug` | Optional |
| Start or resume | `POST /assessments/:idOrSlug/start` | Required |
| Load attempt | `GET /assessments/attempts/:attemptId` | Required |
| Save answers | `POST /assessments/attempts/:attemptId/save` | Required |
| Submit | `POST /assessments/attempts/:attemptId/submit` | Required |
| Leave event | `POST /assessments/attempts/:attemptId/event` `{ type: "tab_leave", itemId? }` | Required |
| History | `GET /assessments/me/history` | Required |
| Weak topics | `GET /assessments/me/weak-topics` | Required |
| Ranking privacy | `PATCH /assessments/me/ranking-privacy` `{ hideRanking }` | Required |
| Bookmarks | `GET /assessments/me/bookmarks` | Required |
| Bookmark | `POST /assessments/items/:itemId/bookmark` `{ folder, attemptId }` | Required |
| Remove bookmark | `DELETE /assessments/items/:itemId/bookmark` | Required |
| Challenge | `POST /assessments/items/:itemId/report` `{ attemptId, reason, note? }` | Required |
| Leaderboard | `GET /assessments/:idOrSlug/leaderboard?scope=` | Required |

Studio routes (`/assessments/studio/*`) must **not** be called from mobile.

### Answer payload

Save and submit send `{ answers: [...] }`. Each row:

```txt
{ itemId, selectedIndex?, text?, story?, characters?, theme? }
```

| Item `type` | Fields the player writes |
|---|---|
| `mcq` (default) | `selectedIndex` |
| `wat` | `text` (one word) |
| `srt` | `text` |
| `ppdt` | `characters`, `theme`, `story` |
| `tat` | `story` |

Attempt items never include the answer key. `correctIndex` arrives only on the result `review` array, and only when the server’s `revealAnswers` rule allows it. Do not render a key during the attempt.

### Kinds (card label only — player follows item `type`)

`practice` · `subject` · `mock` · `oir` · `wat` · `srt` · `ppdt` · `tat`

### Start can fail — show the server message

| Code | What the student should see |
|---|---|
| `ASSESSMENT_PAYMENT_REQUIRED` | Price, and Buy on this test |
| `ASSESSMENT_ENROLL_REQUIRED` | Open the linked course (`details.courseSlug`) |
| `ASSESSMENT_COURSE_PROGRESS` | Required course % vs current % |
| `ASSESSMENT_PREREQ` | Pass the earlier tests first |
| `ASSESSMENT_WINDOW` | Not started yet, or the window has ended |
| `ASSESSMENT_NOT_OPEN` | Test is not published |
| `ASSESSMENT_INSTITUTE_ONLY` | Institute members only |
| `ASSESSMENT_COURSE_REQUIRED` | Course link missing on the test |

Free tests (`priceInr === 0`) start with no payment. A priced test also starts when the student is enrolled in its linked course (`hasPaidAccess` treats that enrollment as access).

### Payment

Standalone tests use `POST /payments/checkout` with `{ productType: "assessment", idOrSlug }`. The order stores `assessmentId` (course orders still store `courseId`). Sandbox confirm and Razorpay verify mark that order paid, and `hasPaidAccess` unlocks Start.

A priced test also starts when the student is enrolled in its linked course. Course checkout stays `POST /courses/:slug/checkout`. iOS App Store IAP is not part of this flow.

---

## Player rules (Phase 2)

Match the web attempt page. The server is the clock.

1. `GET` the attempt. If `status !== "in_progress"`, replace with the result screen.
2. Seed drafts from `answers` already saved.
3. If `serverNow` is present, shift the local clock by `Date.now() - serverNow` so the deadline matches the server.
4. Paper countdown uses `deadlineAt`. At zero, submit with the current drafts (auto-submit). Show “Time expired” only from `status === "auto_submitted"` on the result.
5. Per-question countdown uses `timeLimitSec` (WAT / SRT). At zero, advance. On the last item, submit.
6. Every option tap or text change calls `save` immediately. Also save on a 10s interval. If a save returns a status other than `in_progress`, replace with the result screen.
7. App background (`AppState` → `background` / `inactive`) calls `event` with `tab_leave` once per attempt, then a short toast: the timer keeps running.
8. One question on screen. Previous / Next. Last step is Submit.
9. Show `mediaUrl` above the prompt when present (OIR figures, PPDT / TAT pictures).
10. Keys, explanations, and bookmarks stay off this screen.

---

## Checklist

### Phase 0 — Foundation

- [x] `src/features/assessments/api/assessment.api.ts` — learner paths only (table above, no studio, no checkout)
- [x] Types aligned with web `assessment.api.ts` (subset: card, attempt item, answer, attempt state, analysis)
- [x] TanStack Query hooks for list, detail, start, attempt, submit
- [x] `LearnHubMode` includes `tests`; `LearnModeSwitch` shows **Tests**
- [x] Root stack screens registered: Detail, Attempt, Result (History and the rest wait for their phase)
- [x] Nav params: `{ slug }`, `{ slug, attemptId }`
- [x] Tests mode shell on `LearnScreen` (search field + empty/loading). Explore and My learning stay as they are
- [x] Guest can open Tests. Start sends them through the existing auth gate

### Phase 1 — Catalogue + detail

- [x] Catalogue cards: cover (or placeholder), kind label, title, question count, duration or Untimed, price or Free, last score when `my` is present
- [x] Search via `q` (kind / exam goal filters only if the list API is already used — do not invent filters)
- [x] Pull-to-refresh. Empty copy when nothing is published
- [x] Detail: cover, kind, title, description, question count, duration, pass %, negative mark, price, max attempts, attempts used, reveal rule, certificate / course-only notes
- [x] Free (or already purchased / author preview): **Start** → `POST start` → Attempt
- [x] Priced and not purchased: price on the detail, **Buy** opens checkout (Phase 6)
- [x] Start errors use the code table (toast + a line on the detail when the code is stable)
- [x] `ASSESSMENT_ENROLL_REQUIRED` can open `CourseDetail` with `details.courseSlug`
- [x] Loading and “not available” states

### Phase 2 — Player + basic result

- [x] Attempt screen follows Player rules
- [x] MCQ options, WAT single field, SRT multiline, PPDT characters + theme + story, TAT story
- [x] Image when `mediaUrl` is set
- [x] Paper clock and per-question clock
- [x] Autosave + 10s save + background `tab_leave`
- [x] Auto-submit at `deadlineAt`
- [x] Confirm before leaving the attempt
- [x] Submit replaces with Result
- [x] Result: `pending_grade` → “Under evaluation”; otherwise `scorePct`, Passed / Not passed, `correct / total`
- [x] `auto_submitted` and `isPreview` called out in the subtitle
- [x] Result loading and missing states
- [x] No answer key on this phase

### Phase 3 — Result depth

- [x] Analysis tiles: accuracy, attempt rate, time per question, duration
- [x] Topic rows with weak / ok / strong
- [x] Suggested revision lines when the API sends them
- [x] Review list only when `review` is present (respect `revealAnswers`)
- [x] Bookmark into folders: Difficult, Revise later, Favourite, Incorrect
- [x] Challenge sheet: wrong key, typo, explanation, duplicate, plus an optional note
- [x] Rank / percentile line when the attempt includes them

### Phase 4 — History, bookmarks, weak topics

- [x] History screen from the Tests header: summary (attempts, best, average, passed, time) + attempt rows
- [x] A submitted row opens Result (`slug` + `attemptId`)
- [x] Bookmarks screen: folder chips + rows (prompt, topic, test title) opening that test’s detail
- [x] Weak topics screen: roadmap status, weak list, suggestions
- [x] Empty states for each list

### Phase 5 — Course link, leaderboard, deep links

- [x] Course detail section from `GET /assessments/course/:slug` (locked copy when `locked` is true)
- [x] Row opens AssessmentDetail
- [x] Leaderboard from detail when `leaderboardEnabled` (scopes the API returns; hide the student’s rank when `hideRanking`)
- [x] Deep links in `src/app/navigation/linking.ts`:
  - `assessments` → My Course Tests mode (or Detail if a slug is present)
  - `assessments/:slug`
  - `assessments/:slug/attempt/:attemptId`
  - `assessments/:slug/attempt/:attemptId/result`
- [x] Notifications empty copy can stay; do not build a new inbox

### Phase 6 — Paid test checkout

- [x] Backend: order with `assessmentId`, checkout create, sandbox confirm, Razorpay verify
- [x] Detail **Buy** opens a checkout screen that reuses Learn’s coupon + sandbox + Razorpay WebView
- [x] Success returns to Detail with `my.purchased` true and Start enabled
- [x] Already purchased skips checkout
- [x] iOS App Store IAP stays a later compliance track

---

## Out of scope (do not build on mobile)

- Test create / edit / question bank / publish
- Grade inbox and manual marks
- Studio analytics
- Admin official-mock queue
- AI evaluation
- Webcam or screenshot proctoring
- A separate payment provider besides the shared order and Razorpay path
- iOS App Store in-app purchase
- Folding assessment items into `LessonQuizStage`

---

## Acceptance (when Phases 0–2 are done)

- Student opens My Course → Tests → a free published test → Start → answers → Submit → sees score or “Under evaluation”.
- Killing the app mid-test and opening the same test again resumes the saved answers. The deadline did not reset on the client.
- A priced test with no purchase shows the price and does not start.
- No Create Test, Grade, or Analytics control anywhere in the app.
- Lesson quizzes in the course player still behave as they do today.

---

## Suggested file layout

```txt
src/features/assessments/
  api/assessment.api.ts
  hooks/useAssessmentQueries.ts
  types/assessment.types.ts
  lib/assessment-format.ts          // kind labels only
  screens/AssessmentDetailScreen.tsx
  screens/AssessmentAttemptScreen.tsx
  screens/AssessmentResultScreen.tsx
  screens/AssessmentHistoryScreen.tsx
  screens/AssessmentBookmarksScreen.tsx
  screens/AssessmentWeakTopicsScreen.tsx
  screens/AssessmentLeaderboardScreen.tsx
  components/                         // catalogue card, clocks, question body

src/features/learn/
  components/LearnModeSwitch.tsx      // add Tests
  screens/LearnScreen.tsx             // Tests mode renders the catalogue
  screens/CourseDetailScreen.tsx      // Phase 5 section only
```

Wire screens through `src/features/assessments/index.ts` and `RootNavigator`, the same way Learn screens are exported.

Match web field names (`idOrSlug`, `deadlineAt`, `selectedIndex`, `pending_grade`, `revealAnswers`).
