# BIGB Mobile — Learning (courses)

Track this file while shipping. Web (`SSBPsychBigB-Frontend`) + backend (`SSBPsychBigB-Backend`) stay the API contract. Do not invent a second course model.

Related:

- Web learner UX: `/learn/*`
- Web creator studio: `/educator/courses`, `/institute/courses` (**web only**)
- Web admin: `/admin/courses` (**admin web only**)
- Backend: `/api/v1/courses`, `/api/v1/payments`, `/api/v1/certificates`
- Defence tests (separate from in-lesson quizzes): [`ASSESSMENTS.md`](./ASSESSMENTS.md)

Implement **one phase at a time**. Tick boxes here as you ship. Do not start Phase N until Phase N−1 is usable.

---

## Locked product (mobile)

Mobile is the **Udemy-style student app**: browse, buy/enroll, watch, track progress.

| Capability | Mobile |
|---|---|
| Explore published catalogue (search + filters) | Yes |
| Course detail + syllabus + preview lessons | Yes |
| Free enroll | Yes |
| Paid checkout (same account as web) | Yes |
| My learning (enrolled / purchased only) | Yes |
| Lesson player + progress sync | Yes |
| Wishlist, notes, in-lesson quiz | Yes (later phases) |
| Certificates list + public verify | Yes (later phases) |
| **Create course** | **No** — web studio only |
| **Edit / upload syllabus / publish** | **No** — web studio only |
| Institute enrollments / revenue | **No** — web only |
| Admin approve / reject queue | **No** — admin web only |
| Cart, refunds, subscriptions, offline DRM | **No** — not in current backend |

Enrollment is **account-level**. A course bought on web appears in mobile My learning, and a course bought on mobile appears on web `/learn/my`.

Guests may browse Explore/detail. Enroll, checkout, My learning, and player (except preview lessons) need login.

---

## Navigation

- Tab **My Course** (`myCourse`) = Learn hub with two modes:
  - **My learning** — `GET /courses/my-learning` (enrolled / purchased / free). Empty state CTA → Explore.
  - **Explore** — `GET /courses` published catalogue.
- Stack **CourseDetail** `{ slug }`.
- Stack **CourseCheckout** `{ slug }` (Phase 3).
- Stack **LessonPlayer** `{ slug, lessonId }`.
- Do **not** add studio / create-course routes.

Educator and institute accounts use the **same learner surfaces**. No mobile studio.

---

## API contract (reuse, do not fork)

Same `apiRequest` + Bearer token pattern as feed/community.

| Client | Backend |
|--------|---------|
| List catalogue | `GET /courses` (`q`, `examGoal`, `price`, `difficulty`, cursor) |
| Course detail | `GET /courses/:idOrSlug` |
| My learning | `GET /courses/my-learning` |
| Free enroll | `POST /courses/:idOrSlug/enroll` |
| Checkout | `POST /courses/:idOrSlug/checkout` |
| Order | `GET /payments/orders/:orderId` |
| Sandbox pay | `POST /payments/orders/:orderId/sandbox-confirm` |
| Razorpay verify | `POST /payments/orders/:orderId/razorpay/verify` |
| Payment mode | `GET /payments/status` |
| Coupon preview | `POST /payments/coupons/preview` |
| Lesson payload | `GET /courses/lessons/:lessonId` |
| Gated stream | `GET /courses/lessons/:lessonId/stream` |
| Progress | `POST /courses/lessons/:lessonId/progress` |
| Quiz submit | `POST /courses/lessons/:lessonId/quiz` |

Studio routes (`/courses/studio/*`) must **not** be called from mobile.

---

## Checklist

### Phase 0 — Foundation

- [x] `src/features/learn/api/course.api.ts` (learner + payment paths only)
- [x] Types aligned with web `course.types.ts` (subset: catalogue, detail, enrollment, lesson)
- [x] TanStack Query hooks (`useCourseQueries`)
- [x] Root stack: `CourseDetail`, `LessonPlayer` (checkout in Phase 3)
- [x] Nav types for `{ slug }`, `{ slug, lessonId }`
- [x] Replace `LearnScreen` placeholder with hub shell (tabs/pills: My learning · Explore)
- [x] Guest: keep `GuestUnlockPanel` on My learning; Explore may stay browsable

### Phase 1 — Explore + detail + library + free enroll

- [x] Explore list (cards: cover, title, instructor, price / Free, rating)
- [x] Search + filters that backend already supports
- [x] Course detail: description, outcomes, syllabus, price, enrolled state
- [x] Preview lesson entry (no enrollment) when `previewLessonIds` allow it
- [x] Free enroll CTA when `price <= 0` and not enrolled
- [x] Paid CTA: “Buy” → Phase 3 screen (until then, disable or deep-link later — **do not** add a fake pay button)
- [x] My learning list: progress %, continue lesson
- [x] Empty My learning → “Explore courses”
- [x] After enroll, course appears in My learning; Continue opens player (Phase 2)

### Phase 2 — Lesson player + progress

- [x] Lesson player screen (video / YouTube / text / pdf / quiz shell)
- [x] Use gated lesson + stream APIs (never hotlink `/uploads/courses/*.mp4`)
- [x] Resume `lastPositionSec`, save progress (throttled)
- [x] Speed, fullscreen, captions if payload includes them
- [x] Syllabus drawer / next lesson
- [x] Live lesson: show meeting URL only when enrolled (backend already hides it)
- [x] Reuse `react-native-video` patterns from Reels **only for playback primitives** — course UX is not Reels

### Phase 3 — Paid checkout

- [x] `CourseCheckout` screen: price, optional coupon, institute code
- [x] `GET /payments/status` → sandbox vs Razorpay
- [x] Coupon preview (`BIGB10` / `BIGB100` / `DEFENCE20` same as web)
- [x] Sandbox “Pay bypass” → enroll unlock
- [x] Razorpay: native SDK **or** checkout WebView; then `razorpay/verify`
- [x] Success screen → My learning / first lesson
- [x] Already enrolled → skip checkout, open Continue
- [x] **iOS App Store IAP** is a later compliance track — do not block Android sandbox on it

### Phase 4 — Learn extras (quiz, notes, wishlist)

- [x] In-lesson MCQ quiz submit + attempts
- [x] Lesson notes (timestamp optional)
- [x] Wishlist list + toggle on detail
- [x] Reviews list (post if enrolled / backend gate)
- [x] Course Q&A read + post (enrolled)

### Phase 5 — Certificates, assignments, paths

- [x] Certificate eligibility + issue + My certificates
- [x] Public verify (`GET /certificates/verify/:code`) — can be in-app WebView or screen
- [x] Learner assignments list + submit
- [x] Learning paths browse + detail
- [x] Daily mission (optional; same API as web)

### Phase 6 — Polish

- [x] Aspirant home “Continue learning” wired to `my-learning`
- [x] Deep links: `/learn/courses/:slug`, lesson, checkout success
- [x] Error / empty / offline states with `showToast`
- [x] Pull-to-refresh + pagination on Explore
- [x] Do not add download/offline DRM unless `allowDownload` + a real offline design

---

## Out of scope (do not build on mobile)

- Course create / edit / video upload / submit for review
- Admin review queue
- Multi-course cart
- Refunds, EMI, subscription billing
- Full offline DRM / downloaded classroom
- AI mentor (separate module; course-detail chat can wait)

---

## Acceptance (when Phases 0–3 are done)

- Student can Explore → open course → free enroll **or** pay → watch → see progress → resume in My learning.
- No Create Course control anywhere in the app.
- Web purchase and mobile purchase share the same enrollment.
- Paid video is not playable without enrollment (except configured previews).

---

## Suggested file layout

```txt
src/features/learn/
  api/course.api.ts
  hooks/useCourseQueries.ts
  types/course.types.ts
  screens/LearnScreen.tsx          // hub: My learning | Explore
  screens/CourseDetailScreen.tsx
  screens/CourseCheckoutScreen.tsx
  screens/LessonPlayerScreen.tsx
  components/                      // cards, syllabus, player chrome
```

Match web naming where it reduces drift (`myLearning`, `idOrSlug`, `enroll`, `checkout`).
