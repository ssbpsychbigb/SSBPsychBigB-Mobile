/**
 * Club events + RSVP + create.
 */

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import {
  useCancelEventMutation,
  useCommunityEventsQuery,
  useCreateEventMutation,
  useEventRsvpMutation,
} from '@/features/community/hooks/useCommunityQueries';
import type { Community } from '@/features/community/types/community.types';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppDateField, AppText, Button, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export type ClubEventsPaneProps = {
  community: Community;
  canPreview: boolean;
  canAct: boolean;
  onNeedJoin: () => void;
};

/**
 * Upcoming events for the club. RSVP needs membership.
 */
export function ClubEventsPane({
  community,
  canPreview,
  canAct,
  onNeedJoin,
}: ClubEventsPaneProps) {
  const theme = useTheme();
  const listQuery = useCommunityEventsQuery(community.slug, canPreview, 'upcoming');
  const createMutation = useCreateEventMutation(community.slug);
  const rsvpMutation = useEventRsvpMutation(community.slug);
  const cancelMutation = useCancelEventMutation(community.slug);
  const [title, setTitle] = useState('');
  const [day, setDay] = useState('');
  const [locationText, setLocationText] = useState('');

  const items = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data],
  );

  const create = async () => {
    if (!title.trim() || !day) {
      return;
    }
    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        startsAt: new Date(`${day}T10:00:00`).toISOString(),
        locationType: 'tbd',
        locationText: locationText.trim() || undefined,
      });
      setTitle('');
      setLocationText('');
      showToast.success('Event scheduled');
    } catch (error) {
      showErrorToast(error, 'Could not create this event.', 'Community');
    }
  };

  if (!canPreview) {
    return (
      <AppText color="muted" variant="caption">
        Events stay hidden until you join this private club.
      </AppText>
    );
  }

  if (listQuery.isLoading && !listQuery.data) {
    return <Spinner />;
  }

  const inputStyle = [
    styles.input,
    {
      color: theme.colors.text,
      borderColor: theme.colors.border,
      fontFamily: resolveFontFamily('regular'),
    },
  ];

  return (
    <View style={styles.stack}>
      {community.canModerate ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <AppText variant="label" weight="bold">
            Schedule
          </AppText>
          <TextInput
            onChangeText={setTitle}
            placeholder="Event title"
            placeholderTextColor={theme.colors.textMuted}
            style={inputStyle}
            value={title}
          />
          <AppDateField label="Date" onChange={setDay} value={day} />
          <TextInput
            onChangeText={setLocationText}
            placeholder="Place or Meet link"
            placeholderTextColor={theme.colors.textMuted}
            style={inputStyle}
            value={locationText}
          />
          <Button loading={createMutation.isPending} onPress={() => void create()} size="sm">
            Publish event
          </Button>
        </View>
      ) : null}

      {items.length === 0 ? (
        <AppText color="muted" variant="caption">
          No upcoming events.
        </AppText>
      ) : null}

      {items.map((event) => (
        <View
          key={event.id}
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <AppText variant="label" weight="bold">
            {event.title}
          </AppText>
          <AppText color="muted" variant="caption">
            {new Date(event.startsAt).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
            {event.locationText ? ` · ${event.locationText}` : ''}
          </AppText>
          <AppText color="secondary" variant="caption">
            {event.goingCount} going · {event.interestedCount} interested
          </AppText>
          <View style={styles.row}>
            <Pressable
              onPress={() => {
                if (!canAct) {
                  onNeedJoin();
                  return;
                }
                rsvpMutation.mutate({
                  eventId: event.id,
                  status: event.myRsvp === 'going' ? null : 'going',
                });
              }}
              style={[
                styles.rsvp,
                {
                  backgroundColor:
                    event.myRsvp === 'going' ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}>
              <AppText
                color={event.myRsvp === 'going' ? 'inverse' : 'primary'}
                variant="caption"
                weight="semibold">
                Going
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!canAct) {
                  onNeedJoin();
                  return;
                }
                rsvpMutation.mutate({
                  eventId: event.id,
                  status: event.myRsvp === 'interested' ? null : 'interested',
                });
              }}
              style={[
                styles.rsvp,
                {
                  backgroundColor:
                    event.myRsvp === 'interested'
                      ? theme.colors.primary
                      : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}>
              <AppText
                color={event.myRsvp === 'interested' ? 'inverse' : 'primary'}
                variant="caption"
                weight="semibold">
                Interested
              </AppText>
            </Pressable>
          </View>
          {community.canModerate && event.status !== 'cancelled' ? (
            <Pressable onPress={() => cancelMutation.mutate(event.id)}>
              <AppText color="danger" variant="caption" weight="semibold">
                Cancel event
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: vs(10),
  },
  card: {
    borderWidth: 1,
    borderRadius: ms(16),
    padding: s(14),
    gap: vs(8),
  },
  input: {
    height: ms(44),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
  },
  row: {
    flexDirection: 'row',
    gap: s(8),
  },
  rsvp: {
    height: ms(34),
    paddingHorizontal: s(14),
    borderRadius: ms(17),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
