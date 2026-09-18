/**
 * Full public portfolio — About, Defence, Journey, Achievements, Activity.
 * Stacked like a LinkedIn profile so nothing hides behind cramped tabs.
 */

import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Award } from 'lucide-react-native';
import { Share, StyleSheet, View } from 'react-native';

import { API_BASE_URL } from '@/shared/api/client';
import { formatPostTime } from '@/features/feed/lib/to-feed-card-post';
import { profileApi } from '@/features/profile/api/profile.api';
import {
  achievementCategoryDisplay,
  examGoalDisplay,
  formatMilestoneDate,
  serviceDisplay,
  stageDisplay,
} from '@/features/profile/lib/profile-display';
import type { MemberProfile } from '@/features/profile/types/profile.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Spinner } from '@/shared/ui';
import { showErrorToast } from '@/shared/ui/toast';

export type MemberProfileTabsProps = {
  username: string;
  profile: MemberProfile;
  token: string | null;
};

/**
 * Renders every public section. Privacy still comes from `sectionVisible`.
 */
export function MemberProfileTabs({
  username,
  profile,
  token,
}: MemberProfileTabsProps) {
  const visible = profile.sectionVisible;

  return (
    <View style={styles.wrap}>
      <AboutSection locked={visible?.about === false} profile={profile} />
      <DefenceSection locked={visible?.defence === false} profile={profile} />
      <JourneySection
        locked={visible?.journey === false}
        token={token}
        username={username}
      />
      <AchievementsSection
        locked={visible?.achievements === false}
        token={token}
        username={username}
      />
      <ActivitySection token={token} username={username} />
    </View>
  );
}

export function shareMemberProfile(profile: MemberProfile, displayName: string): void {
  const origin = API_BASE_URL.replace(/\/api\/v\d+$/i, '');
  const path = profile.profileUrl || `/u/${profile.username}`;
  void Share.share({
    message: `${displayName} on BIGB · @${profile.username}\n${origin}${path}`,
  }).catch((error) => {
    showErrorToast(error, 'Could not share this profile.', 'Profile');
  });
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { borderColor: theme.colors.border }]}>
      <AppText style={styles.sectionTitle} variant="label" weight="bold">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function AboutSection({
  profile,
  locked,
}: {
  profile: MemberProfile;
  locked: boolean;
}) {
  if (locked) {
    return (
      <Section title="About">
        <Locked copy="About is visible to followers only, or kept private." />
      </Section>
    );
  }
  const rows = [
    { label: 'Education', value: profile.education },
    { label: 'City', value: profile.city },
    {
      label: 'Languages',
      value: (profile.languages || []).filter(Boolean).join(', '),
    },
    { label: 'Hobbies / sports', value: profile.hobbies },
  ].filter((row) => row.value);
  return (
    <Section title="About">
      {rows.length === 0 ? (
        <AppText color="muted" variant="caption">
          No about details yet.
        </AppText>
      ) : (
        rows.map((row) => (
          <Fact key={row.label} label={row.label} value={row.value as string} />
        ))
      )}
    </Section>
  );
}

function DefenceSection({
  profile,
  locked,
}: {
  profile: MemberProfile;
  locked: boolean;
}) {
  const theme = useTheme();
  if (locked) {
    return (
      <Section title="Defence information">
        <Locked copy="Defence prep is visible to followers only, or kept private." />
      </Section>
    );
  }
  const rows = [
    { label: 'Target exam', value: examGoalDisplay(profile.examGoal) },
    {
      label: 'Preferred service',
      value: serviceDisplay(profile.preferredService),
    },
    { label: 'Target entry', value: profile.targetEntry },
    { label: 'SSB board', value: profile.ssbBoard },
    {
      label: 'Preparation stage',
      value: stageDisplay(profile.preparationStage),
    },
    {
      label: 'Attempts',
      value: profile.attempts ? String(profile.attempts) : '',
    },
    {
      label: 'Recommendations',
      value: profile.recommendations ? String(profile.recommendations) : '',
    },
    {
      label: 'Conference outs',
      value: profile.conferenceOuts ? String(profile.conferenceOuts) : '',
    },
    { label: 'Preferred branch', value: profile.preferredBranch },
    { label: 'Medical status', value: profile.medicalStatus },
    { label: 'Expected joining', value: profile.expectedJoining },
  ].filter((row) => row.value);

  const readiness = profile.officerReadiness;
  const mentor = profile.mentorPortfolio;
  const availability = profile.mentorAvailability;

  return (
    <Section title="Defence information">
      {readiness ? (
        <View style={styles.block}>
          <AppText variant="caption" weight="semibold">
            Officer readiness
          </AppText>
          <AppText color="muted" variant="caption">
            {readiness.bandLabel} · {readiness.score}
          </AppText>
          <View style={[styles.track, { backgroundColor: theme.colors.primaryMuted }]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.max(0, Math.min(100, readiness.score))}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
        </View>
      ) : null}
      {mentor ? (
        <View style={styles.block}>
          <AppText variant="caption" weight="semibold">
            Mentor
          </AppText>
          {mentor.specialties.length ? (
            <AppText color="secondary" variant="caption">
              {mentor.specialties.map(examGoalDisplay).filter(Boolean).join(' · ')}
            </AppText>
          ) : null}
          <AppText color="muted" variant="caption">
            {[
              mentor.menteesApprox ? `${mentor.menteesApprox} mentees` : '',
              mentor.recommendations ? `${mentor.recommendations} recommended` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </AppText>
        </View>
      ) : null}
      {availability?.label ? (
        <Fact label="Availability" value={availability.label} />
      ) : null}
      {rows.length === 0 && !readiness && !mentor ? (
        <AppText color="muted" variant="caption">
          No defence details shared yet.
        </AppText>
      ) : (
        rows.map((row) => (
          <Fact key={row.label} label={row.label} value={row.value as string} />
        ))
      )}
    </Section>
  );
}

function JourneySection({
  username,
  token,
  locked,
}: {
  username: string;
  token: string | null;
  locked: boolean;
}) {
  const query = useQuery({
    queryKey: ['member-profile-timeline', username],
    enabled: !locked,
    queryFn: () => profileApi.getTimeline(username, token),
  });
  const items = query.data?.items ?? [];

  return (
    <Section title="Journey">
      {locked ? (
        <Locked copy="Journey timeline is visible to followers only, or kept private." />
      ) : query.isPending ? (
        <Spinner />
      ) : query.isError ? (
        <Locked copy="Journey timeline is visible to followers only, or kept private." />
      ) : items.length === 0 ? (
        <AppText color="muted" variant="caption">
          No journey milestones yet.
        </AppText>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.milestone}>
            <AppText color="muted" variant="caption">
              {formatMilestoneDate(item.eventDate)}
            </AppText>
            <AppText variant="label" weight="semibold">
              {item.title}
            </AppText>
            {item.description ? (
              <AppText color="secondary" variant="caption">
                {item.description}
              </AppText>
            ) : null}
          </View>
        ))
      )}
    </Section>
  );
}

function AchievementsSection({
  username,
  token,
  locked,
}: {
  username: string;
  token: string | null;
  locked: boolean;
}) {
  const theme = useTheme();
  const query = useQuery({
    queryKey: ['member-profile-achievements', username],
    enabled: !locked,
    queryFn: () => profileApi.getAchievements(username, token),
  });
  const items = query.data?.items ?? [];

  return (
    <Section title="Achievements">
      {locked ? (
        <Locked copy="Achievements are visible to followers only, or kept private." />
      ) : query.isPending ? (
        <Spinner />
      ) : query.isError ? (
        <Locked copy="Achievements are visible to followers only, or kept private." />
      ) : items.length === 0 ? (
        <AppText color="muted" variant="caption">
          No achievements yet.
        </AppText>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.milestone}>
            <View style={styles.awardRow}>
              <Award color={theme.colors.primary} size={ms(16)} strokeWidth={2} />
              <AppText style={styles.awardTitle} variant="label" weight="semibold">
                {item.title}
              </AppText>
            </View>
            {item.description ? (
              <AppText color="secondary" variant="caption">
                {item.description}
              </AppText>
            ) : null}
            <AppText color="muted" variant="caption">
              {[
                achievementCategoryDisplay(item.category),
                formatMilestoneDate(item.achievementDate || ''),
              ]
                .filter(Boolean)
                .join(' · ')}
            </AppText>
          </View>
        ))
      )}
    </Section>
  );
}

function ActivitySection({
  username,
  token,
}: {
  username: string;
  token: string | null;
}) {
  const theme = useTheme();
  const postsQuery = useQuery({
    queryKey: ['member-profile-posts', username],
    queryFn: () => profileApi.getPosts(username, token),
  });
  const items = postsQuery.data?.items ?? [];

  return (
    <Section title="Activity">
      {postsQuery.isPending ? (
        <Spinner />
      ) : items.length === 0 ? (
        <AppText color="muted" variant="caption">
          This member has not posted publicly yet.
        </AppText>
      ) : (
        items.map((post) => {
          const body = post.content?.trim() || 'Photo';
          return (
            <View
              key={post.id}
              style={[styles.postCard, { borderColor: theme.colors.border }]}>
              <AppText variant="caption">{body}</AppText>
              <AppText color="muted" variant="caption">
                {formatPostTime(post.createdAt)}
              </AppText>
            </View>
          );
        })
      )}
    </Section>
  );
}

function Locked({ copy }: { copy: string }) {
  return (
    <AppText color="muted" variant="caption">
      {copy}
    </AppText>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    width: '100%',
    marginTop: vs(16),
    paddingHorizontal: s(16),
    gap: vs(12),
    paddingBottom: vs(32),
  },
  section: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(16),
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
    gap: vs(10),
  },
  sectionTitle: {
    marginBottom: vs(2),
  },
  block: {
    gap: vs(4),
  },
  fact: {
    gap: vs(2),
  },
  milestone: {
    gap: vs(2),
    paddingBottom: vs(8),
  },
  track: {
    height: vs(6),
    borderRadius: ms(3),
    overflow: 'hidden',
    marginTop: vs(4),
  },
  fill: {
    height: '100%',
    borderRadius: ms(3),
  },
  awardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  awardTitle: {
    flex: 1,
  },
  postCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    gap: vs(4),
  },
});
