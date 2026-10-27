/**
 * Home search — people, courses, and institutes in one place.
 */

import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Building2, Search, UserRound } from 'lucide-react-native';

import { useRootNavigate } from '@/app/navigation/useRootNavigate';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { feedApi } from '@/features/feed/api/feed.api';
import type { DirectoryPerson } from '@/features/feed/types/feed.types';
import type { AuthRole } from '@/features/auth/types/auth.types';
import { getRoleLabel } from '@/features/home/lib/role-label';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { courseApi } from '@/features/learn/api/course.api';
import type { CourseCard } from '@/features/learn/types/course.types';
import { requireMemberProfileParams } from '@/features/profile/lib/require-member-profile';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText, SocialStackChrome, Spinner } from '@/shared/ui';

type Kind = 'people' | 'courses' | 'institutes';

const KINDS: { id: Kind; label: string }[] = [
  { id: 'people', label: 'People' },
  { id: 'courses', label: 'Courses' },
  { id: 'institutes', label: 'Institutes' },
];

export function SearchScreen() {
  const theme = useTheme();
  const goRoot = useRootNavigate();
  const token = useAuthStore((state) => state.accessToken);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<Kind>('people');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(draft.trim()), 300);
    return () => clearTimeout(timer);
  }, [draft]);

  const ready = query.length >= 2;
  const peopleQuery = useQuery({
    queryKey: ['directory', kind, query],
    enabled: ready && kind !== 'courses',
    queryFn: () =>
      feedApi.searchDirectory(kind === 'institutes' ? 'institutes' : 'people', query, token),
  });
  const courseQuery = useQuery({
    queryKey: ['course-search', query],
    enabled: ready && kind === 'courses',
    queryFn: () => courseApi.list({ q: query, limit: 20, token }),
  });

  const loading =
    ready && (kind === 'courses' ? courseQuery.isPending : peopleQuery.isPending);
  const failed = kind === 'courses' ? courseQuery.isError : peopleQuery.isError;
  const people = peopleQuery.data?.items ?? [];
  const courses = courseQuery.data?.items ?? [];
  const empty =
    ready &&
    !loading &&
    !failed &&
    (kind === 'courses' ? courses.length === 0 : people.length === 0);

  const openPerson = (person: DirectoryPerson) => {
    const params = requireMemberProfileParams(
      person.username,
      person.instituteName || person.fullName,
    );
    if (params) {
      goRoot('MemberProfile', params);
    }
  };

  return (
    <SocialStackChrome
      subtitle="People, courses, and institutes"
      title="Search">
      <View
        style={[
          styles.field,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}>
        <Search color={theme.colors.textMuted} size={ms(18)} strokeWidth={2} />
        <TextInput
          autoFocus
          onChangeText={setDraft}
          placeholder={
            kind === 'courses'
              ? 'Search a course'
              : kind === 'institutes'
                ? 'Search an institute'
                : 'Search a name or @username'
          }
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="search"
          style={[
            styles.input,
            { color: theme.colors.text, fontFamily: resolveFontFamily('regular') },
          ]}
          value={draft}
        />
      </View>

      <View style={styles.chips}>
        {KINDS.map((item) => {
          const active = kind === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setKind(item.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}>
              <AppText
                style={{ color: active ? '#FFFFFF' : theme.colors.text }}
                variant="caption"
                weight="semibold">
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {!ready ? (
        <AppText color="muted" style={styles.hint} variant="caption">
          Type at least two letters.
        </AppText>
      ) : null}

      {loading ? (
        <View style={styles.state}>
          <Spinner size="small" />
        </View>
      ) : null}

      {failed ? (
        <Pressable
          onPress={() =>
            void (kind === 'courses' ? courseQuery.refetch() : peopleQuery.refetch())
          }
          style={styles.state}>
          <AppText variant="caption" weight="semibold">
            Could not search. Tap to try again.
          </AppText>
        </Pressable>
      ) : null}

      {empty ? (
        <View style={styles.state}>
          <AppText color="muted" variant="caption">
            No {kind} for “{query}”
          </AppText>
        </View>
      ) : null}

      {kind === 'courses'
        ? courses.map((course) => (
            <CourseRow
              course={course}
              key={course.id}
              onPress={() => goRoot('CourseDetail', { slug: course.slug })}
            />
          ))
        : people.map((person) => (
            <PersonRow
              key={person.id}
              onPress={() => openPerson(person)}
              person={person}
              institute={kind === 'institutes'}
            />
          ))}
    </SocialStackChrome>
  );
}

function PersonRow({
  person,
  institute,
  onPress,
}: {
  person: DirectoryPerson;
  institute: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const photo = resolveUploadUrl(person.profilePhotoPath);
  const title = institute
    ? person.instituteName || person.fullName || 'Institute'
    : person.fullName || person.username;
  const detail = person.username
    ? `@${person.username} · ${getRoleLabel(person.role as AuthRole)}`
    : getRoleLabel(person.role as AuthRole);

  return (
    <Pressable onPress={onPress} style={styles.result}>
      <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} />
        ) : institute ? (
          <Building2 color="#FFFFFF" size={ms(16)} />
        ) : (
          <AppText color="inverse" variant="caption" weight="bold">
            {getUserInitials(title)}
          </AppText>
        )}
      </View>
      <View style={styles.copy}>
        <AppText numberOfLines={1} variant="body" weight="semibold">
          {title}
        </AppText>
        <AppText color="muted" numberOfLines={1} variant="caption">
          {detail}
        </AppText>
      </View>
      {institute ? (
        <Building2 color={theme.colors.textMuted} size={ms(16)} />
      ) : (
        <UserRound color={theme.colors.textMuted} size={ms(16)} />
      )}
    </Pressable>
  );
}

function CourseRow({ course, onPress }: { course: CourseCard; onPress: () => void }) {
  const theme = useTheme();
  const cover = resolveUploadUrl(course.coverPath);
  const who = course.instructor?.name || course.institute?.name || 'Course';

  return (
    <Pressable onPress={onPress} style={styles.result}>
      <View style={[styles.avatar, { backgroundColor: theme.colors.primaryMuted }]}>
        {cover ? (
          <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} />
        ) : (
          <BookOpen color={theme.colors.primary} size={ms(16)} />
        )}
      </View>
      <View style={styles.copy}>
        <AppText numberOfLines={1} variant="body" weight="semibold">
          {course.title}
        </AppText>
        <AppText color="muted" numberOfLines={1} variant="caption">
          {who}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(14),
    paddingHorizontal: s(12),
    minHeight: ms(46),
    marginBottom: vs(12),
  },
  input: {
    flex: 1,
    fontSize: ms(15),
    paddingVertical: vs(8),
  },
  chips: {
    flexDirection: 'row',
    gap: s(8),
    marginBottom: vs(8),
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(16),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
  },
  hint: {
    marginTop: vs(12),
  },
  state: {
    minHeight: vs(72),
    alignItems: 'center',
    justifyContent: 'center',
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingVertical: vs(10),
  },
  avatar: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: vs(2),
  },
});
