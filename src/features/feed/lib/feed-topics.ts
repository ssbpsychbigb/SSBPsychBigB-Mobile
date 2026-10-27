/**
 * Topic chips for posts and reels. Matches backend `POST_CATEGORIES`.
 * `general` is the silent default when the author skips a topic.
 */

export type FeedTopic = {
  value: string;
  label: string;
};

export const FEED_TOPIC_FALLBACK: FeedTopic[] = [
  { value: 'psychology', label: 'Psychology' },
  { value: 'gto', label: 'GTO' },
  { value: 'interview', label: 'Interview' },
  { value: 'entry_guidance', label: 'Entry guidance' },
  { value: 'motivation', label: 'Motivation' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'current_affairs', label: 'Current affairs' },
  { value: 'defence_news', label: 'Defence news' },
  { value: 'books', label: 'Books' },
  { value: 'experience', label: 'Experience' },
  { value: 'recommendation_story', label: 'Recommendation' },
  { value: 'medical', label: 'Medical' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'communication', label: 'Communication' },
  { value: 'olq', label: 'OLQ' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'english', label: 'English' },
  { value: 'general_studies', label: 'General studies' },
];

const LABEL_BY_VALUE: Record<string, string> = {
  general: 'General',
  ...Object.fromEntries(FEED_TOPIC_FALLBACK.map((topic) => [topic.value, topic.label])),
};

export function feedTopicLabel(value: string): string {
  return (
    LABEL_BY_VALUE[value] ||
    value.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase())
  );
}
