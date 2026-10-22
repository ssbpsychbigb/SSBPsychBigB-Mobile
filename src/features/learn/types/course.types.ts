/**
 * Learner course types — aligned with web `course.types.ts` (subset).
 */

export type CourseType =
  | 'recorded'
  | 'live'
  | 'hybrid'
  | 'free'
  | 'paid'
  | 'workshop'
  | 'mentorship'
  | 'subscription';

export type CourseStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'archived';

export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type CoursePerson = {
  id: string;
  name: string;
  username: string;
  profilePhotoPath?: string | null;
};

export type CourseLessonSummary = {
  id: string;
  title: string;
  lessonType: string;
  durationSec: number;
  sequence: number;
  previewAvailable?: boolean;
  videoUrl?: string;
  liveStartsAt?: string | null;
};

export type CourseSection = {
  id: string;
  title: string;
  sequence: number;
  lessons: CourseLessonSummary[];
};

export type EnrollmentSummary = {
  id: string;
  courseId: string;
  source: string;
  status: string;
  progressPct: number;
  enrolledAt: string | null;
  lastLessonId: string | null;
  lastPositionSec: number;
  updatedAt: string | null;
};

export type CourseCard = {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: CourseType;
  price: number;
  currency: string;
  status: CourseStatus;
  examGoals: string[];
  entryLevels?: string[];
  services?: string[];
  subjects?: string[];
  bestseller?: boolean;
  learningOutcomes?: string[];
  wishlisted?: boolean;
  coverPath: string;
  previewVideoUrl: string;
  language: string;
  difficulty: CourseDifficulty;
  durationMinutes: number;
  ratingAvg: number;
  ratingCount: number;
  enrollmentCount: number;
  lessonCount?: number;
  instructorId: string | null;
  instituteId: string | null;
  instructor?: CoursePerson | null;
  institute?: CoursePerson | null;
  publishedAt: string | null;
  createdAt: string | null;
};

export type CourseDetails = CourseCard & {
  learningOutcomes: string[];
  settings: {
    completionPct?: number;
    allowDownload?: boolean;
  };
  sections: CourseSection[];
  lessonCount: number;
  sectionCount: number;
  enrollment?: EnrollmentSummary | null;
  canEnrollFree?: boolean;
  canReview?: boolean;
  isStaff?: boolean;
  myReview?: {
    id: string;
    rating: number;
    body: string;
    pros?: string;
    cons?: string;
  } | null;
};

export type CourseListPage = {
  items: CourseCard[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type MyLearningItem = {
  enrollment: EnrollmentSummary;
  course: CourseCard;
  continueLesson: {
    id: string;
    title: string;
    sequence: number;
  } | null;
};

export type MyLearningPage = {
  items: MyLearningItem[];
};

export type LessonProgress = {
  lessonId: string;
  watchPct: number;
  lastPositionSec: number;
  completed: boolean;
  timeSpentSec: number;
  quizScorePct?: number;
  quizPassed?: boolean;
  quizAttemptCount?: number;
};

export type LessonQuizQuestion = {
  prompt: string;
  options: string[];
};

export type LessonQuiz = {
  passPct: number;
  timeLimitSec: number;
  questionCount: number;
  questions: LessonQuizQuestion[];
};

export type LessonDetails = {
  id: string;
  title: string;
  lessonType: string;
  durationSec: number;
  sequence: number;
  videoUrl: string;
  videoPath: string;
  streamUrl?: string;
  captionUrl?: string;
  bodyHtml?: string;
  resourcePaths?: string[];
  previewAvailable: boolean;
  skipIntroSec?: number;
  skipOutroSec?: number;
  chapters?: { title: string; startSec: number }[];
  liveStartsAt?: string | null;
  quiz?: LessonQuiz | null;
  course: {
    id: string;
    title: string;
    slug: string;
    completionPct: number;
    allowDownload?: boolean;
  };
  enrollment: EnrollmentSummary | null;
  progress: LessonProgress | null;
  sections?: CourseSection[];
  prevLesson: { id: string; title: string; sequence: number } | null;
  nextLesson: { id: string; title: string; sequence: number } | null;
};

export type CourseListFilters = {
  q?: string;
  examGoal?: string;
  price?: 'all' | 'free' | 'paid';
  difficulty?: 'all' | CourseDifficulty;
  sort?: 'latest' | 'popular' | 'rated' | 'price_asc' | 'price_desc';
};

export type RazorpayCheckoutPayload = {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
};

export type CourseOrder = {
  id: string;
  courseId: string;
  amountOriginal?: number;
  discountAmount?: number;
  amountPayable: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  invoiceNo: string;
  couponCode?: string;
  course: CourseCard | null;
};

export type CheckoutResult = {
  order: CourseOrder;
  couponLabel: string | null;
  mode: string;
  message: string;
  razorpay?: RazorpayCheckoutPayload;
  enrollment?: { id: string; progressPct: number; status: string } | null;
};

export type PaymentStatus = {
  live: boolean;
  mode: string;
  sandboxAllowed: boolean;
  message: string;
};

export type CouponPreview = {
  couponCode: string;
  discountAmount: number;
  amountPayable: number;
  couponLabel: string | null;
};

export type PaidUnlockResult = {
  order: CourseOrder;
  enrollment: { id: string; progressPct: number; status: string } | null;
  alreadyPaid: boolean;
};

export type SaveProgressInput = {
  watchPct?: number;
  lastPositionSec?: number;
  completed?: boolean;
  timeSpentSec?: number;
};

export type LearnHubMode = 'mine' | 'explore' | 'tests';

export type QuizSubmitResult = {
  correct: number;
  total: number;
  scorePct: number;
  passed: boolean;
  attemptCount: number;
  remainingAttempts: number;
};

export type ReviewItem = {
  id: string;
  rating: number;
  body: string;
  pros: string;
  cons: string;
  createdAt: string | null;
  author: { id: string; name: string; username: string } | null;
  reply?: {
    body: string;
    repliedAt: string | null;
    author: { id: string; name: string; username: string } | null;
  } | null;
};

export type ReviewsPage = {
  ratingAvg: number;
  ratingCount: number;
  canReply?: boolean;
  items: ReviewItem[];
};

export type DiscussionReply = {
  id: string;
  body: string;
  upvotes: number;
  helpfulCount?: number;
  createdAt: string | null;
  author: { id: string; name: string; username: string } | null;
};

export type DiscussionItem = DiscussionReply & {
  replies: DiscussionReply[];
  helpfulCount?: number;
  helpful?: boolean;
  unanswered?: boolean;
};

export type LessonNoteItem = {
  id: string;
  body: string;
  timestampSec: number;
  createdAt: string | null;
  lessonId?: string;
  lessonTitle?: string;
};

export type WishlistPage = {
  items: Array<{
    wishlistedAt: string | null;
    course: CourseCard;
  }>;
};
