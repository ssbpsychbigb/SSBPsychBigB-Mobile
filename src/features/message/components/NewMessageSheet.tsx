/**
 * Instagram-style new message picker — search, friends, following, followers.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { useChatPeopleQuery } from '@/features/message/hooks/useChatQueries';
import type { ChatPerson } from '@/features/message/types/chat.types';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

type PeopleTab = 'all' | 'friends' | 'following' | 'followers';

const TABS: { key: PeopleTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'friends', label: 'Friends' },
  { key: 'following', label: 'Following' },
  { key: 'followers', label: 'Followers' },
];

export type NewMessageSheetProps = {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onPickPerson: (person: ChatPerson) => void;
  onPickUsername: (username: string) => void;
};

function relationLabel(person: ChatPerson): string {
  if (person.relation === 'friend' || person.isMutual) {
    return 'Friends';
  }
  if (person.relation === 'following' || person.followingAuthor) {
    return 'Following';
  }
  if (person.relation === 'follower' || person.followsYou) {
    return 'Follows you';
  }
  if (person.relation === 'recent' || person.isRecent) {
    return 'Recent';
  }
  return 'Suggested';
}

function deliveryHint(person: ChatPerson): string {
  return person.sendsAsRequest ? 'Sends as a request' : 'Goes to Primary';
}

type Section = { title: string; data: ChatPerson[] };

/**
 * Full-screen compose picker backed by `/chat/people`.
 */
export function NewMessageSheet({
  visible,
  busy,
  onClose,
  onPickPerson,
  onPickUsername,
}: NewMessageSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const token = useAuthStore((state) => state.accessToken);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [tab, setTab] = useState<PeopleTab>('all');

  useEffect(() => {
    if (!visible) {
      setSearch('');
      setDebounced('');
      setTab('all');
    }
  }, [visible]);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 220);
    return () => clearTimeout(timer);
  }, [search]);

  const peopleQuery = useChatPeopleQuery(token, debounced, visible);
  const people = peopleQuery.data?.items ?? [];
  const searching = debounced.length > 0;

  const sections = useMemo((): Section[] => {
    const filtered = people.filter((person) => {
      if (tab === 'friends') {
        return person.isMutual || person.relation === 'friend';
      }
      if (tab === 'following') {
        return person.followingAuthor;
      }
      if (tab === 'followers') {
        return person.followsYou;
      }
      return true;
    });

    if (searching || tab !== 'all') {
      return filtered.length ? [{ title: '', data: filtered }] : [];
    }

    const recent: ChatPerson[] = [];
    const friends: ChatPerson[] = [];
    const following: ChatPerson[] = [];
    const followers: ChatPerson[] = [];
    const suggested: ChatPerson[] = [];
    const seen = new Set<string>();

    const take = (list: ChatPerson[], person: ChatPerson) => {
      if (seen.has(person.id)) {
        return;
      }
      seen.add(person.id);
      list.push(person);
    };

    for (const person of filtered) {
      if (person.isRecent) {
        take(recent, person);
      }
    }
    for (const person of filtered) {
      if (person.isMutual || person.relation === 'friend') {
        take(friends, person);
      } else if (person.followingAuthor) {
        take(following, person);
      } else if (person.followsYou) {
        take(followers, person);
      } else {
        take(suggested, person);
      }
    }

    return [
      { title: 'Recent', data: recent },
      { title: 'Friends', data: friends },
      { title: 'Following', data: following },
      { title: 'Followers', data: followers },
      { title: 'Suggested', data: suggested },
    ].filter((section) => section.data.length > 0);
  }, [people, searching, tab]);

  const handleLooksLikeUsername =
    searching &&
    !people.length &&
    !peopleQuery.isFetching &&
    /^[a-zA-Z0-9._]{2,32}$/.test(debounced.replace(/^@/, ''));

  const sheetBg = theme.colors.background;
  const searchBg =
    theme.mode === 'dark' ? theme.colors.surface : theme.palette.neutral[100];

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.flex, { backgroundColor: sheetBg, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            disabled={busy}
            hitSlop={10}
            onPress={onClose}
            style={[styles.iconBtn, { borderColor: theme.colors.border }]}>
            <X color={theme.colors.text} size={ms(18)} strokeWidth={2} />
          </Pressable>
          <AppText style={styles.headerTitle} variant="subtitle" weight="bold">
            New message
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.search, { backgroundColor: searchBg }]}>
          <Search color={theme.colors.textMuted} size={ms(16)} strokeWidth={2} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            onChangeText={setSearch}
            placeholder="Search name or username"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.searchInput,
              {
                color: theme.colors.text,
                fontFamily: resolveFontFamily('regular'),
              },
            ]}
            value={search}
          />
        </View>

        {!searching ? (
          <View style={styles.tabs}>
            {TABS.map((item) => {
              const selected = tab === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setTab(item.key)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected
                        ? theme.colors.primary
                        : searchBg,
                    },
                  ]}>
                  <AppText
                    color={selected ? 'inverse' : 'secondary'}
                    variant="caption"
                    weight="semibold">
                    {item.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {peopleQuery.isPending ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : peopleQuery.isError ? (
          <View style={styles.center}>
            <AppText variant="label" weight="semibold">
              Could not load people
            </AppText>
            <Pressable onPress={() => void peopleQuery.refetch()}>
              <AppText color="brand" variant="caption" weight="semibold">
                Retry
              </AppText>
            </Pressable>
          </View>
        ) : (
          <SectionList
            ListEmptyComponent={
              <View style={styles.empty}>
                <AppText variant="label" weight="semibold">
                  {searching ? 'No matches' : 'No people yet'}
                </AppText>
                <AppText color="secondary" style={styles.emptyCopy} variant="caption">
                  {searching
                    ? 'Try a name or username. Anyone on BIGB can be messaged — they get a request if they do not follow you.'
                    : tab === 'friends'
                      ? 'Friends are people you follow who also follow you. You can still message anyone from All or search.'
                      : 'Follow people in Network, or search anyone on BIGB to start a chat.'}
                </AppText>
                {handleLooksLikeUsername ? (
                  <Pressable
                    disabled={busy}
                    onPress={() => onPickUsername(debounced.replace(/^@/, ''))}
                    style={[styles.usernameRow, { borderColor: theme.colors.border }]}>
                    <AppText color="brand" variant="caption" weight="semibold">
                      Message @{debounced.replace(/^@/, '')}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            }
            contentContainerStyle={styles.list}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index, section }) => (
              <PersonRow
                busy={busy}
                person={item}
                showDivider={index < section.data.length - 1}
                onPress={() => onPickPerson(item)}
              />
            )}
            renderSectionHeader={({ section }) =>
              section.title ? (
                <AppText
                  color="muted"
                  style={styles.sectionTitle}
                  variant="caption"
                  weight="semibold">
                  {section.title}
                </AppText>
              ) : null
            }
            sections={sections}
            stickySectionHeadersEnabled={false}
          />
        )}
        <View style={{ height: Math.max(insets.bottom, vs(12)) }} />
      </KeyboardAvoidingView>
    </Modal>
  );
}

type PersonRowProps = {
  person: ChatPerson;
  showDivider: boolean;
  busy: boolean;
  onPress: () => void;
};

function PersonRow({ person, showDivider, busy, onPress }: PersonRowProps) {
  const theme = useTheme();
  const photo = resolveUploadUrl(person.profilePhotoPath);
  const initials = getUserInitials(person.name);

  return (
    <Pressable
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed ? { backgroundColor: theme.colors.primaryMuted } : null,
      ]}>
      <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatarImage} />
        ) : (
          <AppText color="inverse" style={styles.initials} weight="bold">
            {initials}
          </AppText>
        )}
      </View>
      <View
        style={[
          styles.body,
          showDivider ? { borderBottomColor: theme.colors.border } : styles.bodyFlush,
        ]}>
        <AppText numberOfLines={1} weight="semibold">
          {person.name}
        </AppText>
        <AppText color="muted" numberOfLines={1} variant="caption">
          {person.username ? `@${person.username}` : person.headline}
        </AppText>
        <View style={styles.meta}>
          <AppText color="brand" variant="caption" weight="semibold">
            {relationLabel(person)}
          </AppText>
          <AppText color="muted" variant="caption">
            · {deliveryHint(person)}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
  },
  iconBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: ms(36),
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginHorizontal: s(16),
    marginTop: vs(4),
    marginBottom: vs(10),
    borderRadius: ms(14),
    paddingHorizontal: s(12),
    height: ms(44),
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize(15),
    lineHeight: lineHeight(15, 1.3),
    paddingVertical: 0,
    includeFontPadding: false,
  },
  tabs: {
    flexDirection: 'row',
    gap: s(8),
    paddingHorizontal: s(16),
    marginBottom: vs(8),
  },
  chip: {
    borderRadius: ms(16),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
  },
  list: {
    paddingBottom: vs(24),
  },
  sectionTitle: {
    paddingHorizontal: s(16),
    paddingTop: vs(14),
    paddingBottom: vs(6),
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    gap: s(12),
  },
  avatar: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontSize: fontSize(14),
  },
  body: {
    flex: 1,
    minWidth: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: vs(10),
  },
  bodyFlush: {
    borderBottomWidth: 0,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    marginTop: vs(2),
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(8),
  },
  empty: {
    paddingHorizontal: s(28),
    paddingVertical: vs(36),
    alignItems: 'center',
    gap: vs(8),
  },
  emptyCopy: {
    textAlign: 'center',
  },
  usernameRow: {
    marginTop: vs(8),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
  },
});
