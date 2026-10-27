/**
 * Community hub — live discover, my clubs, create.
 */

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Plus } from 'lucide-react-native';

import { useRootNavigate } from '@/app/navigation/useRootNavigate';
import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { CommunityClubCard } from '@/features/community/components/CommunityClubCard';
import {
  useCommunitiesQuery,
  useMyCommunitiesQuery,
} from '@/features/community/hooks/useCommunityQueries';
import { canCreateCommunity } from '@/features/community/lib/community-permissions';
import { toCommunityCard } from '@/features/community/lib/to-community-card';
import type { DiscoverFilter } from '@/features/community/types/community.types';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import {
  AppText,
  SocialStackChrome,
  Spinner,
  usePullToRefresh,
} from '@/shared/ui';

const FILTERS: { id: DiscoverFilter; label: string }[] = [
  { id: 'public', label: 'Public' },
  { id: 'institute', label: 'Institute' },
  { id: 'official', label: 'Official' },
];

/**
 * Tab destination for clubs. Create and club home live on the root stack.
 */
export function CommunitiesScreen() {
  const theme = useTheme();
  const goRoot = useRootNavigate();
  const accessToken = useAuthStore(state => state.accessToken);
  const user = useAuthStore(state => state.user);
  const [joinOpen, setJoinOpen] = useState(false);
  const [filter, setFilter] = useState<DiscoverFilter>('public');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');

  const discoverQuery = useCommunitiesQuery(filter, search);
  const mineQuery = useMyCommunitiesQuery(Boolean(accessToken));
  const canCreate = canCreateCommunity(user);

  const clubs = useMemo(() => {
    const items = discoverQuery.data?.pages.flatMap(page => page.items) ?? [];
    return items.map(toCommunityCard);
  }, [discoverQuery.data]);

  const mine = useMemo(() => {
    return (mineQuery.data?.items ?? []).map(toCommunityCard);
  }, [mineQuery.data]);

  const openClub = (slug: string) => {
    goRoot('ClubHome', { slug });
  };

  const onCreate = () => {
    if (!accessToken) {
      setJoinOpen(true);
      return;
    }
    goRoot('CreateCommunity');
  };

  const loading = discoverQuery.isLoading && !discoverQuery.data;
  const showCreate = canCreate || !accessToken;
  const refreshControl = usePullToRefresh(() =>
    Promise.all([
      discoverQuery.refetch(),
      ...(accessToken ? [mineQuery.refetch()] : []),
    ]),
  );

  return (
    <>
      <SocialStackChrome
        refreshControl={refreshControl}
        rightSlot={
          showCreate ? (
            <Pressable
              accessibilityLabel="Create community"
              accessibilityRole="button"
              onPress={onCreate}
              style={[
                styles.createPill,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Plus color="#FFFFFF" size={ms(16)} strokeWidth={2.4} />
              <AppText color="inverse" variant="caption" weight="semibold">
                Create
              </AppText>
            </Pressable>
          ) : null
        }
        showBack={false}
        subtitle="Rooms for officers, educators, and serious prep"
        subtitleLines={2}
        title="Community"
      >
        {canCreate ? (
          <Pressable
            onPress={onCreate}
            style={[
              styles.hero,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.heroCopy}>
              <AppText variant="label" weight="bold">
                Open a club from your phone
              </AppText>
              <AppText color="muted" variant="caption">
                Name it, set public or private, then run members and rights
                here.
              </AppText>
            </View>
            <View
              style={[
                styles.heroCta,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Plus color="#FFFFFF" size={ms(16)} strokeWidth={2.4} />
            </View>
          </Pressable>
        ) : accessToken ? (
          <></>
        ) : null}

        <View
          style={[
            styles.search,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <TextInput
            onChangeText={setQuery}
            onSubmitEditing={() => setSearch(query.trim())}
            placeholder="Search NDA, SSB, TAT…"
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="search"
            style={[
              styles.searchInput,
              {
                color: theme.colors.text,
                fontFamily: resolveFontFamily('regular'),
              },
            ]}
            value={query}
          />
        </View>

        <View style={styles.filters}>
          {FILTERS.map(item => {
            const active = filter === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setFilter(item.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? theme.colors.primary
                      : theme.colors.background,
                    borderColor: active
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
              >
                <AppText
                  color={active ? 'inverse' : 'secondary'}
                  variant="caption"
                  weight="semibold"
                >
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {mine.length ? (
          <View style={styles.section}>
            <AppText variant="label" weight="bold">
              Your clubs
            </AppText>
            {mine.slice(0, 6).map(club => (
              <CommunityClubCard
                key={club.id}
                club={club}
                onPress={() => openClub(club.slug)}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <AppText variant="label" weight="bold">
            Discover
          </AppText>
          {loading ? <Spinner /> : null}
          {!loading && clubs.length === 0 ? (
            <View
              style={[
                styles.empty,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <AppText variant="label" weight="semibold">
                No clubs in this filter yet
              </AppText>
              <AppText color="muted" variant="caption">
                Officers, institutes, and educators can open one from the phone.
              </AppText>
              {showCreate ? (
                <Pressable
                  onPress={onCreate}
                  style={[
                    styles.emptyCta,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <AppText color="inverse" variant="caption" weight="semibold">
                    Create community
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {clubs.map(club => (
            <CommunityClubCard
              key={club.id}
              club={club}
              onPress={() => openClub(club.slug)}
            />
          ))}
          {discoverQuery.hasNextPage ? (
            <Pressable
              onPress={() => void discoverQuery.fetchNextPage()}
              style={styles.more}
            >
              <AppText color="brand" variant="caption" weight="semibold">
                {discoverQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </SocialStackChrome>
      <JoinToContinueSheet
        message="Create an account to open a club or request to join one."
        onClose={() => setJoinOpen(false)}
        title="Join BIGB first"
        visible={joinOpen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  createPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    height: ms(36),
    paddingHorizontal: s(12),
    borderRadius: ms(18),
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    borderWidth: 1,
    borderRadius: ms(18),
    padding: s(14),
    marginBottom: vs(12),
  },
  heroCopy: {
    flex: 1,
    gap: vs(4),
  },
  heroCta: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    borderWidth: 1,
    borderRadius: ms(16),
    paddingHorizontal: s(14),
    height: ms(46),
    justifyContent: 'center',
    marginBottom: vs(12),
  },
  searchInput: {
    fontSize: 15,
    padding: 0,
  },
  filters: {
    flexDirection: 'row',
    gap: s(8),
    marginBottom: vs(16),
  },
  chip: {
    height: ms(32),
    paddingHorizontal: s(14),
    borderRadius: ms(16),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: vs(10),
    marginBottom: vs(18),
  },
  empty: {
    borderWidth: 1,
    borderRadius: ms(18),
    padding: s(16),
    gap: vs(8),
  },
  emptyCta: {
    alignSelf: 'flex-start',
    height: ms(36),
    paddingHorizontal: s(14),
    borderRadius: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(4),
  },
  more: {
    alignItems: 'center',
    paddingVertical: vs(8),
  },
});
