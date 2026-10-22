/**
 * Course reviews + Q&A — Udemy-style, enrolled write, public read.
 */

import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { MessageCircle, Star, ThumbsUp } from 'lucide-react-native';

import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  useCourseDiscussionsQuery,
  useCourseReviewsQuery,
  usePostDiscussionMutation,
  useSubmitReviewMutation,
  useUpvoteDiscussionMutation,
} from '@/features/learn/hooks/useCourseEngagementQueries';
import { formatRelativeTime } from '@/features/learn/lib/format-course';
import type { CourseDetails } from '@/features/learn/types/course.types';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type Tab = 'reviews' | 'qa';

export type CourseEngagementSectionProps = {
  course: CourseDetails;
};

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value;
        return (
          <Pressable
            key={n}
            accessibilityLabel={`${n} star`}
            hitSlop={ms(4)}
            onPress={() => onChange(n)}>
            <Star
              color={theme.colors.warning}
              fill={on ? theme.colors.warning : 'transparent'}
              size={ms(22)}
              strokeWidth={on ? 0 : 1.8}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Reviews and Q&A live under the syllabus on course detail.
 */
export function CourseEngagementSection({ course }: CourseEngagementSectionProps) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.accessToken);
  const slug = course.slug;
  const reviewsQuery = useCourseReviewsQuery(slug);
  const discussionsQuery = useCourseDiscussionsQuery(slug);
  const submitReview = useSubmitReviewMutation(slug);
  const postDiscussion = usePostDiscussionMutation(slug);
  const upvote = useUpvoteDiscussionMutation(slug);

  const [tab, setTab] = useState<Tab>('reviews');
  const [joinOpen, setJoinOpen] = useState(false);
  const [rating, setRating] = useState(course.myReview?.rating || 5);
  const [reviewBody, setReviewBody] = useState(course.myReview?.body || '');
  const [question, setQuestion] = useState('');
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');

  const reviews = reviewsQuery.data?.items ?? [];
  const threads = discussionsQuery.data?.items ?? [];
  const enrolled = Boolean(course.enrollment);
  const canStaff = Boolean(course.isStaff || discussionsQuery.data?.isStaff);

  const needAuth = (then: () => void) => {
    if (!token) {
      setJoinOpen(true);
      return;
    }
    then();
  };

  return (
    <View style={styles.block}>
      <View style={[styles.tabs, { borderBottomColor: theme.colors.border }]}>
        {(
          [
            { id: 'reviews' as const, label: 'Reviews' },
            { id: 'qa' as const, label: 'Q&A' },
          ] as const
        ).map((item) => {
          const on = tab === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              style={styles.tab}>
              <AppText
                color={on ? 'primary' : 'muted'}
                variant="label"
                weight={on ? 'bold' : 'semibold'}>
                {item.label}
              </AppText>
              <View
                style={[
                  styles.line,
                  { backgroundColor: on ? theme.colors.primary : 'transparent' },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      {tab === 'reviews' ? (
        <View style={styles.pane}>
          <View style={styles.ratingHead}>
            <Star
              color={theme.colors.warning}
              fill={theme.colors.warning}
              size={ms(18)}
              strokeWidth={0}
            />
            <AppText variant="subtitle" weight="bold">
              {(reviewsQuery.data?.ratingAvg || course.ratingAvg || 0).toFixed(1)}
            </AppText>
            <AppText color="muted" variant="caption">
              {reviewsQuery.data?.ratingCount ?? course.ratingCount} ratings
            </AppText>
          </View>

          {enrolled ? (
            course.canReview ? (
              <View
                style={[
                  styles.composer,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}>
                <AppText variant="caption" weight="semibold">
                  {course.myReview ? 'Update your review' : 'Rate this course'}
                </AppText>
                <StarPicker onChange={setRating} value={rating} />
                <TextInput
                  multiline
                  onChangeText={setReviewBody}
                  placeholder="What helped in your prep?"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      fontFamily: resolveFontFamily('regular'),
                    },
                  ]}
                  value={reviewBody}
                />
                <Button
                  loading={submitReview.isPending}
                  onPress={() =>
                    submitReview.mutate(
                      { rating, body: reviewBody.trim() },
                      {
                        onSuccess: () =>
                          showToast.success('Review saved', 'Thanks — this helps other aspirants.'),
                        onError: (error) =>
                          showErrorToast(error, 'Could not save review'),
                      },
                    )
                  }
                  size="sm">
                  {course.myReview ? 'Update review' : 'Post review'}
                </Button>
              </View>
            ) : (
              <AppText color="muted" variant="caption">
                Reach 20% progress to leave a review.
              </AppText>
            )
          ) : (
            <AppText color="muted" variant="caption">
              Enroll and start learning to leave a review.
            </AppText>
          )}

          {reviewsQuery.isLoading && !reviewsQuery.data ? <Spinner /> : null}
          {reviews.length === 0 && !reviewsQuery.isLoading ? (
            <AppText color="muted" variant="caption">
              No reviews yet. Be the first after you start.
            </AppText>
          ) : null}
          {reviews.map((review) => (
            <View
              key={review.id}
              style={[styles.card, { borderColor: theme.colors.border }]}>
              <View style={styles.cardTop}>
                <AppText variant="label" weight="semibold">
                  {review.author?.name || 'Learner'}
                </AppText>
                <View style={styles.inlineStars}>
                  <Star
                    color={theme.colors.warning}
                    fill={theme.colors.warning}
                    size={ms(11)}
                    strokeWidth={0}
                  />
                  <AppText variant="caption" weight="semibold">
                    {review.rating}.0
                  </AppText>
                </View>
              </View>
              {review.body ? (
                <AppText color="secondary" variant="body">
                  {review.body}
                </AppText>
              ) : null}
              <AppText color="muted" variant="caption">
                {formatRelativeTime(review.createdAt)}
              </AppText>
              {review.reply?.body ? (
                <View
                  style={[
                    styles.reply,
                    { backgroundColor: theme.colors.primaryMuted },
                  ]}>
                  <AppText variant="caption" weight="semibold">
                    {review.reply.author?.name || 'Educator'}
                  </AppText>
                  <AppText color="secondary" variant="caption">
                    {review.reply.body}
                  </AppText>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.pane}>
          <AppText color="muted" variant="caption">
            Ask enrolled classmates and faculty. Threads sync with web.
          </AppText>

          {enrolled || canStaff ? (
            <View
              style={[
                styles.composer,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}>
              <TextInput
                multiline
                onChangeText={setQuestion}
                placeholder="Ask a question about this course…"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    fontFamily: resolveFontFamily('regular'),
                  },
                ]}
                value={question}
              />
              <Button
                disabled={!question.trim()}
                loading={postDiscussion.isPending && !replyFor}
                onPress={() =>
                  postDiscussion.mutate(
                    { body: question.trim() },
                    {
                      onSuccess: () => {
                        setQuestion('');
                        showToast.success('Posted', 'Faculty and classmates can reply.');
                      },
                      onError: (error) =>
                        showErrorToast(error, 'Could not post question'),
                    },
                  )
                }
                size="sm">
                Ask
              </Button>
            </View>
          ) : (
            <Pressable onPress={() => needAuth(() => undefined)}>
              <AppText color="brand" variant="caption" weight="semibold">
                Enroll to ask a question
              </AppText>
            </Pressable>
          )}

          {discussionsQuery.isLoading && !discussionsQuery.data ? (
            <Spinner />
          ) : null}
          {threads.length === 0 && !discussionsQuery.isLoading ? (
            <AppText color="muted" variant="caption">
              No questions yet.
            </AppText>
          ) : null}
          {threads.map((thread) => (
            <View
              key={thread.id}
              style={[styles.card, { borderColor: theme.colors.border }]}>
              <View style={styles.cardTop}>
                <AppText variant="label" weight="semibold">
                  {thread.author?.name || 'Learner'}
                </AppText>
                {thread.unanswered ? (
                  <AppText color="brand" variant="caption" weight="semibold">
                    Unanswered
                  </AppText>
                ) : null}
              </View>
              <AppText variant="body">{thread.body}</AppText>
              <View style={styles.threadMeta}>
                <AppText color="muted" variant="caption">
                  {formatRelativeTime(thread.createdAt)}
                </AppText>
                <Pressable
                  onPress={() =>
                    needAuth(() =>
                      upvote.mutate(thread.id, {
                        onError: (error) =>
                          showErrorToast(error, 'Could not upvote'),
                      }),
                    )
                  }
                  style={styles.upvote}>
                  <ThumbsUp color={theme.colors.textMuted} size={ms(13)} />
                  <AppText color="muted" variant="caption">
                    {thread.upvotes || 0}
                  </AppText>
                </Pressable>
              </View>
              {(thread.replies || []).map((reply) => (
                <View
                  key={reply.id}
                  style={[
                    styles.reply,
                    { backgroundColor: theme.colors.surface },
                  ]}>
                  <AppText variant="caption" weight="semibold">
                    {reply.author?.name || 'Reply'}
                  </AppText>
                  <AppText color="secondary" variant="caption">
                    {reply.body}
                  </AppText>
                </View>
              ))}
              {enrolled || canStaff ? (
                replyFor === thread.id ? (
                  <View style={styles.replyRow}>
                    <TextInput
                      onChangeText={setReplyBody}
                      placeholder="Write a reply"
                      placeholderTextColor={theme.colors.textMuted}
                      style={[
                        styles.replyInput,
                        {
                          color: theme.colors.text,
                          borderColor: theme.colors.border,
                          fontFamily: resolveFontFamily('regular'),
                        },
                      ]}
                      value={replyBody}
                    />
                    <Button
                      disabled={!replyBody.trim()}
                      loading={postDiscussion.isPending}
                      onPress={() =>
                        postDiscussion.mutate(
                          { body: replyBody.trim(), parentId: thread.id },
                          {
                            onSuccess: () => {
                              setReplyBody('');
                              setReplyFor(null);
                            },
                            onError: (error) =>
                              showErrorToast(error, 'Could not reply'),
                          },
                        )
                      }
                      size="sm">
                      Send
                    </Button>
                  </View>
                ) : (
                  <Pressable onPress={() => setReplyFor(thread.id)}>
                    <View style={styles.upvote}>
                      <MessageCircle color={theme.colors.primary} size={ms(13)} />
                      <AppText color="brand" variant="caption" weight="semibold">
                        Reply
                      </AppText>
                    </View>
                  </Pressable>
                )
              ) : null}
            </View>
          ))}
        </View>
      )}

      <JoinToContinueSheet
        message="Join BIGB to save a review or ask faculty."
        onClose={() => setJoinOpen(false)}
        title="Join to continue"
        visible={joinOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: vs(18),
    gap: vs(12),
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    paddingRight: s(18),
    paddingTop: vs(4),
    minHeight: ms(36),
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: vs(8),
  },
  line: {
    height: 2,
    width: '100%',
    borderRadius: 1,
  },
  pane: {
    gap: vs(12),
  },
  ratingHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  stars: {
    flexDirection: 'row',
    gap: s(6),
  },
  composer: {
    borderWidth: 1,
    borderRadius: ms(16),
    padding: s(12),
    gap: vs(10),
  },
  input: {
    minHeight: vs(72),
    fontSize: 15,
    textAlignVertical: 'top',
    padding: 0,
  },
  card: {
    borderWidth: 1,
    borderRadius: ms(16),
    padding: s(14),
    gap: vs(6),
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: s(8),
  },
  inlineStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  reply: {
    borderRadius: ms(10),
    padding: s(10),
    gap: vs(4),
    marginTop: vs(4),
  },
  threadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upvote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  replyRow: {
    gap: vs(8),
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(8),
    fontSize: 14,
  },
});
