/**
 * Club news — moderator announcements.
 */

import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { useAnnounceMutation } from '@/features/community/hooks/useCommunityQueries';
import type { Community } from '@/features/community/types/community.types';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export type ClubNewsPaneProps = {
  community: Community;
  canPreview: boolean;
};

/**
 * House news. Compose is moderator-only; the feed also carries announcements.
 */
export function ClubNewsPane({ community, canPreview }: ClubNewsPaneProps) {
  const theme = useTheme();
  const announce = useAnnounceMutation(community.slug);
  const [content, setContent] = useState('');

  const publish = async () => {
    if (!content.trim()) {
      return;
    }
    try {
      await announce.mutateAsync(content.trim());
      setContent('');
      showToast.success('Announcement posted');
    } catch (error) {
      showErrorToast(error, 'Could not post news.', 'Community');
    }
  };

  if (!canPreview) {
    return (
      <AppText color="muted" variant="caption">
        News is locked for this private club.
      </AppText>
    );
  }

  return (
    <View style={styles.stack}>
      {community.canModerate ? (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}>
          <AppText variant="label" weight="bold">
            Announce
          </AppText>
          <TextInput
            multiline
            onChangeText={setContent}
            placeholder="A short house note."
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                borderColor: theme.colors.border,
                fontFamily: resolveFontFamily('regular'),
              },
            ]}
            value={content}
          />
          <Button loading={announce.isPending} onPress={() => void publish()} size="sm">
            Post news
          </Button>
        </View>
      ) : (
        <AppText color="muted" variant="caption">
          House notes from admins appear here and in Feed.
        </AppText>
      )}
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
    minHeight: vs(80),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    textAlignVertical: 'top',
  },
});
