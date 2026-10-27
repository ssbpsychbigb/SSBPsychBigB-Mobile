/**
 * Composer and explore chips from `GET /feed/meta`, with a local fallback.
 */

import { useQuery } from '@tanstack/react-query';

import { feedApi } from '@/features/feed/api/feed.api';
import { FEED_TOPIC_FALLBACK, type FeedTopic } from '@/features/feed/lib/feed-topics';

export function useFeedTopics(): FeedTopic[] {
  const metaQuery = useQuery({
    queryKey: ['feed', 'meta'],
    queryFn: () => feedApi.getMeta(),
    staleTime: 60 * 60 * 1000,
  });
  const remote = metaQuery.data?.categories?.filter((topic) => topic.value !== 'general');
  return remote && remote.length > 0 ? remote : FEED_TOPIC_FALLBACK;
}
