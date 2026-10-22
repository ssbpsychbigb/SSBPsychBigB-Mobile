/**
 * Learner assessment types — subset of web `assessment.api.ts`.
 * Studio authoring types stay on the web.
 */

export type AssessmentMine = {
  attemptsUsed: number;
  lastStatus: string | null;
  lastScorePct: number | null;
  isAuthor: boolean;
  purchased?: boolean;
};

export type AssessmentCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: string;
  examGoals: string[];
  difficulty: string;
  visibility: string;
  status: string;
  priceInr: number;
  passPct: number;
  maxAttempts: number;
  durationSec: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  negativeMarkPerWrong?: number;
  revealAnswers?: string;
  itemCount: number;
  startsAt: string | null;
  endsAt: string | null;
  publishedAt: string | null;
  courseId?: string | null;
  requireCoursePct?: number;
  requireAssessmentIds?: string[];
  requiredForCertificate?: boolean;
  leaderboardEnabled?: boolean;
  coverUrl?: string;
  ownerType?: string;
  official?: boolean;
  my?: AssessmentMine | null;
};

export type AssessmentListResult = {
  items: AssessmentCard[];
};

export type CourseAssessmentList = {
  locked: boolean;
  courseId: string;
  courseSlug: string;
  items: AssessmentCard[];
  passedIds: string[];
};

export type AttemptItem = {
  id: string;
  prompt: string;
  options: string[];
  marks: number;
  topic?: string;
  subtopic?: string;
  oirSkill?: string;
  type?: string;
  timeLimitSec?: number;
  mediaUrl?: string;
  grading?: string;
};

export type AttemptAnswer = {
  itemId: string;
  selectedIndex?: number;
  text?: string;
  story?: string;
  characters?: string;
  theme?: string;
  marksAwarded?: number | null;
  graderComment?: string;
};

export type AttemptTopic = {
  topic: string;
  correct: number;
  total: number;
  attempted: number;
  accuracyPct: number;
  attemptRatePct: number;
  status: 'weak' | 'ok' | 'strong';
};

export type AttemptAnalysis = {
  attempted: number;
  unattempted: number;
  accuracyPct: number;
  attemptRatePct: number;
  timeSpentSec: number;
  timePerQuestionSec: number;
  topics: AttemptTopic[];
  weakTopics: string[];
  strongTopics: string[];
  suggestedRevision: string[];
};

export type AttemptReviewItem = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number | null;
  topic?: string;
  subtopic?: string;
  videoExplanationUrl?: string;
  oirSkill?: string;
  explanation?: string;
  references?: string;
  bookmarked?: boolean;
  bookmarkFolder?: string | null;
};

export type AttemptState = {
  id: string;
  assessmentId: string;
  status: string;
  startedAt: string;
  deadlineAt: string | null;
  submittedAt: string | null;
  scorePct: number;
  correct: number;
  total: number;
  passed: boolean;
  attemptNo: number;
  isPreview: boolean;
  timeSpentSec?: number;
  answers: AttemptAnswer[];
  items: AttemptItem[];
  serverNow?: string;
  revealAnswers?: string;
  analysis?: AttemptAnalysis | null;
  needsManual?: boolean;
  leaderboardEnabled?: boolean;
  rank?: number | null;
  percentile?: number | null;
  rankedCount?: number;
  capture?: Array<{
    id: string;
    prompt: string;
    type?: string;
    mediaUrl?: string;
    text?: string;
    story?: string;
    characters?: string;
    theme?: string;
    marksAwarded?: number | null;
    graderComment?: string;
  }>;
  review?: AttemptReviewItem[];
};

export type AssessmentHistory = {
  summary: {
    attempts: number;
    bestPct: number;
    avgPct: number;
    passed: number;
    totalTimeSec: number;
  };
  series: Array<{
    id: string;
    submittedAt: string | null;
    scorePct: number;
    title: string;
    kind?: string;
  }>;
  items: Array<{
    id: string;
    assessmentId: string;
    title: string;
    slug?: string;
    kind?: string;
    status: string;
    scorePct: number;
    passed: boolean;
    submittedAt: string | null;
    timeSpentSec?: number;
    attemptNo: number;
  }>;
};

export type WeakTopicsResult = {
  roadmap: Array<{
    id: string;
    label: string;
    accuracyPct: number | null;
    attempted: number;
    status: 'weak' | 'ok' | 'strong' | 'unknown';
    topics: string[];
    next: string;
  }>;
  weak: Array<{ id: string; label: string; next: string; topics: string[] }>;
  suggestions: string[];
  hideRanking: boolean;
};

export type LeaderboardResult = {
  title: string;
  slug: string;
  kind: string;
  scope: string;
  note: string;
  scopes: {
    national: boolean;
    course: boolean;
    institute: boolean;
    community: boolean;
  };
  hideRanking: boolean;
  me: { rank: number; scorePct: number; percentile: number | null } | null;
  items: Array<{
    rank: number;
    scorePct: number;
    timeSpentSec: number;
    isSelf: boolean;
    name: string;
  }>;
};

export type BookmarkList = {
  folders: string[];
  items: Array<{
    id: string;
    itemId: string;
    folder: string;
    prompt: string;
    topic: string;
    assessmentId: string;
    title: string;
    slug?: string;
  }>;
};

export type AssessmentCheckoutOrder = {
  id: string;
  status: string;
  amountOriginal: number;
  discountAmount: number;
  amountPayable: number;
  currency: string;
  invoiceNo: string;
  assessment?: { id: string; title: string; slug: string } | null;
};

export type AssessmentCheckoutResult = {
  order: AssessmentCheckoutOrder;
  couponLabel: string | null;
  mode: string;
  message: string;
  razorpay?: {
    keyId: string;
    orderId: string;
    amountPaise: number;
    currency: string;
    name: string;
    description: string;
    prefill?: { name?: string; email?: string; contact?: string };
  };
};

export type AssessmentPaidResult = {
  order: AssessmentCheckoutOrder;
  alreadyPaid: boolean;
};
