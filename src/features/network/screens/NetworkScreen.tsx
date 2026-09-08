/**
 * Network — follow graph hub (public browse, join to follow).
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { NetworkPersonCard } from '@/features/network/components/NetworkPersonCard';
import {
  NETWORK_FILTERS,
  NETWORK_PREVIEW,
  type NetworkFilterKey,
  type NetworkPersonPreview,
} from '@/features/network/data/network-preview';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, SocialStackChrome } from '@/shared/ui';
import { showToast } from '@/shared/ui/toast';

/**
 * Officers, educators, and institutes to follow — spotlight + filtered list.
 */
export function NetworkScreen() {
  const theme = useTheme();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [joinOpen, setJoinOpen] = useState(false);
  const [filter, setFilter] = useState<NetworkFilterKey>('all');
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  const featured = NETWORK_PREVIEW.find((person) => person.featured);
  const list = useMemo(() => {
    return NETWORK_PREVIEW.filter((person) => {
      if (person.featured) {
        return false;
      }
      if (filter === 'all') {
        return true;
      }
      return person.kind === filter;
    });
  }, [filter]);

  const showFeatured =
    featured && (filter === 'all' || featured.kind === filter);

  const onFollow = (person: NetworkPersonPreview) => {
    if (!accessToken) {
      setJoinOpen(true);
      return;
    }
    const already = followingIds.includes(person.id);
    setFollowingIds((current) =>
      already ? current.filter((id) => id !== person.id) : [...current, person.id],
    );
    showToast.info(already ? 'Unfollowed' : 'Following', person.name);
  };

  return (
    <>
      <SocialStackChrome
        subtitle="Officers, mentors, and academies that raise the quality of your prep."
        subtitleLines={2}
        title="Network">
        <View style={styles.stats}>
          <Stat
            label="People"
            value={String(NETWORK_PREVIEW.length)}
          />
          <View style={[styles.statRule, { backgroundColor: theme.colors.border }]} />
          <Stat
            label="Verified"
            value={String(NETWORK_PREVIEW.filter((row) => row.verified).length)}
          />
          <View style={[styles.statRule, { backgroundColor: theme.colors.border }]} />
          <Stat label="Following" value={String(followingIds.length)} />
        </View>

        <ScrollView
          contentContainerStyle={styles.filters}
          directionalLockEnabled
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}>
          {NETWORK_FILTERS.map((item) => {
            const selected = filter === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setFilter(item.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : theme.colors.background,
                    borderColor: selected
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}>
                <AppText
                  color={selected ? 'inverse' : 'secondary'}
                  style={styles.chipLabel}
                  variant="caption"
                  weight="semibold">
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {showFeatured && featured ? (
          <>
            <AppText color="muted" style={styles.section} variant="caption" weight="semibold">
              Featured
            </AppText>
            <NetworkPersonCard
              featured
              following={followingIds.includes(featured.id)}
              onFollow={() => onFollow(featured)}
              person={featured}
            />
          </>
        ) : null}

        <AppText color="muted" style={styles.section} variant="caption" weight="semibold">
          Suggested for you
        </AppText>

        {list.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}>
            <AppText variant="label" weight="semibold">
              Nothing in this filter
            </AppText>
            <AppText color="secondary" style={styles.emptyCopy} variant="caption">
              Switch to All to see the full network.
            </AppText>
          </View>
        ) : (
          list.map((person) => (
            <NetworkPersonCard
              key={person.id}
              following={followingIds.includes(person.id)}
              onFollow={() => onFollow(person)}
              person={person}
            />
          ))
        )}
      </SocialStackChrome>
      <JoinToContinueSheet
        message="Follow officers and mentors after you join BIGB."
        onClose={() => setJoinOpen(false)}
        title="Build your prep circle"
        visible={joinOpen}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText style={styles.statValue} weight="bold">
        {value}
      </AppText>
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(14),
    paddingVertical: vs(4),
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: vs(2),
  },
  statValue: {
    fontSize: ms(18),
  },
  statRule: {
    width: StyleSheet.hairlineWidth,
    height: vs(28),
  },
  filters: {
    flexDirection: 'row',
    gap: s(8),
    paddingRight: s(8),
    marginBottom: vs(16),
  },
  chip: {
    height: ms(34),
    paddingHorizontal: s(14),
    borderRadius: ms(17),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    includeFontPadding: false,
  },
  section: {
    marginBottom: vs(8),
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  empty: {
    borderWidth: 1,
    borderRadius: ms(18),
    paddingHorizontal: s(16),
    paddingVertical: vs(22),
    alignItems: 'center',
  },
  emptyCopy: {
    marginTop: vs(6),
    textAlign: 'center',
  },
});
