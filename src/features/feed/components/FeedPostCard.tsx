/**
 * Feed post card — professional community layout (LinkedIn density + IG media).
 */

import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  BadgeCheck,
  Bookmark,
  Globe,
  Heart,
  MessageCircle,
  MoreVertical,
  Send,
  Users,
} from 'lucide-react-native';

import type { FeedPreviewPost } from '@/features/feed/data/feed-preview';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

const ROLE_LABEL: Record<FeedPreviewPost['author']['role'], string> = {
  aspirant: 'Aspirant',
  educator: 'Educator',
  defence_officer: 'Officer',
  institute: 'Institute',
};

export type FeedPostCardProps = {
  post: FeedPreviewPost;
  saved: boolean;
  liked: boolean;
  onReact: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onFollow: () => void;
  onMenu: () => void;
  onAuthorPress?: () => void;
};

/**
 * Single timeline card with media, caption collapse, and four actions.
 */
export function FeedPostCard({
  post,
  saved,
  liked,
  onReact,
  onComment,
  onShare,
  onSave,
  onFollow,
  onMenu,
  onAuthorPress,
}: FeedPostCardProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const longBody = post.body.length > 140;
  const shown = expanded || !longBody ? post.body : `${post.body.slice(0, 132).trim()}…`;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={`${post.author.name} profile`}
          accessibilityRole="link"
          disabled={!onAuthorPress}
          onPress={onAuthorPress}
          style={styles.identityHit}>
          <View
            style={[styles.avatar, { backgroundColor: post.author.avatarColor }]}>
            <AppText color="inverse" variant="caption" weight="semibold">
              {post.author.initials}
            </AppText>
          </View>

          <View style={styles.identity}>
            <View style={styles.nameRow}>
              <AppText numberOfLines={1} style={styles.name} variant="label">
                {post.author.name}
              </AppText>
            {post.author.verified ? (
              <View style={styles.verified}>
                <BadgeCheck
                  color={theme.colors.primary}
                  size={ms(14)}
                  strokeWidth={2.2}
                />
              </View>
            ) : null}
          </View>
          <View style={styles.meta}>
            <AppText color="muted" numberOfLines={1} style={styles.metaText} variant="caption">
              {ROLE_LABEL[post.author.role]} · {post.createdLabel}
            </AppText>
            <View
              style={[styles.metaDot, { backgroundColor: theme.colors.textMuted }]}
            />
            <View style={styles.metaIcon}>
              {post.visibility === 'public' ? (
                <Globe
                  color={theme.colors.textMuted}
                  size={ms(12)}
                  strokeWidth={2.2}
                />
              ) : (
                <Users
                  color={theme.colors.textMuted}
                  size={ms(12)}
                  strokeWidth={2.2}
                />
              )}
            </View>
          </View>
        </View>
        </Pressable>

        <View style={styles.headerActions}>
          {!post.isOwn ? (
            <Pressable
              accessibilityLabel={post.followingAuthor ? 'Following' : 'Follow'}
              accessibilityRole="button"
              onPress={onFollow}
              style={[
                styles.follow,
                {
                  borderColor: theme.colors.primary,
                  backgroundColor: post.followingAuthor
                    ? theme.colors.primaryMuted
                    : 'transparent',
                },
              ]}>
              <AppText
                color="brand"
                style={styles.followLabel}
                variant="caption"
                weight="semibold">
                {post.followingAuthor ? 'Following' : 'Follow'}
              </AppText>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityLabel="More"
            accessibilityRole="button"
            hitSlop={ms(8)}
            onPress={onMenu}
            style={styles.moreBtn}>
            <MoreVertical color={theme.colors.textMuted} size={ms(18)} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <AppText style={styles.body} variant="body">
        {shown}
        {longBody ? (
          <AppText
            color="brand"
            onPress={() => setExpanded((value) => !value)}
            variant="body"
            weight="semibold">
            {expanded ? '  See less' : '  See more'}
          </AppText>
        ) : null}
      </AppText>

      {post.imageUri && !imageFailed ? (
        <View style={styles.mediaWrap}>
          <Image
            onError={() => setImageFailed(true)}
            source={{ uri: post.imageUri }}
            style={styles.media}
          />
        </View>
      ) : null}

      <View style={styles.stats}>
        <AppText color="muted" variant="caption">
          {post.likesLabel} reactions · {post.commentsLabel} comments
        </AppText>
      </View>

      <View style={[styles.actions, { borderTopColor: theme.colors.border }]}>
        <Action label={post.likesLabel} onPress={onReact}>
          <Heart
            color={liked ? theme.colors.danger : theme.colors.text}
            fill={liked ? theme.colors.danger : 'transparent'}
            size={ms(18)}
            strokeWidth={2}
          />
        </Action>
        <Action label={post.commentsLabel} onPress={onComment}>
          <MessageCircle color={theme.colors.text} size={ms(18)} strokeWidth={2} />
        </Action>
        <Action label={post.sharesLabel} onPress={onShare}>
          <Send color={theme.colors.text} size={ms(18)} strokeWidth={2} />
        </Action>
        <Pressable
          accessibilityLabel="Save"
          accessibilityRole="button"
          hitSlop={ms(6)}
          onPress={onSave}
          style={styles.bookmark}>
          <Bookmark
            color={saved ? theme.colors.primary : theme.colors.text}
            fill={saved ? theme.colors.primary : 'transparent'}
            size={ms(18)}
            strokeWidth={2}
          />
        </Pressable>
      </View>
    </View>
  );
}

type ActionProps = {
  children: ReactNode;
  label: string;
  onPress: () => void;
};

function Action({ children, label, onPress }: ActionProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, { opacity: pressed ? 0.7 : 1 }]}>
      {children}
      <AppText
        style={{
          color: theme.colors.text,
          fontSize: fontSize(12),
          lineHeight: lineHeight(12, 1.2),
        }}
        variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: ms(22),
    paddingTop: vs(14),
    overflow: 'hidden',
    shadowColor: '#0D1E34',
    shadowOffset: { width: 0, height: vs(8) },
    shadowOpacity: 0.07,
    shadowRadius: ms(16),
    elevation: ms(3),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(14),
  },
  identityHit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  avatar: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  identity: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: vs(18),
  },
  name: {
    flexShrink: 1,
    includeFontPadding: false,
    lineHeight: lineHeight(13, 1.2),
  },
  verified: {
    width: ms(16),
    height: ms(16),
    marginLeft: s(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(3),
    minHeight: vs(16),
  },
  metaText: {
    flexShrink: 1,
    includeFontPadding: false,
    lineHeight: lineHeight(12, 1.2),
  },
  metaDot: {
    width: ms(3),
    height: ms(3),
    borderRadius: ms(1.5),
    marginHorizontal: s(6),
  },
  metaIcon: {
    width: ms(16),
    height: ms(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: s(8),
  },
  follow: {
    height: ms(28),
    paddingHorizontal: s(12),
    borderRadius: ms(14),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followLabel: {
    includeFontPadding: false,
  },
  moreBtn: {
    width: ms(32),
    height: ms(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: s(14),
    paddingTop: vs(12),
    paddingBottom: vs(10),
  },
  mediaWrap: {
    paddingHorizontal: s(10),
  },
  media: {
    width: '100%',
    height: vs(210),
    borderRadius: ms(16),
  },
  stats: {
    paddingHorizontal: s(14),
    paddingTop: vs(10),
    paddingBottom: vs(8),
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: s(6),
    minHeight: ms(48),
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    paddingHorizontal: s(10),
    paddingVertical: vs(10),
    minHeight: ms(44),
  },
  bookmark: {
    marginLeft: 'auto',
    paddingHorizontal: s(12),
    minHeight: ms(44),
    justifyContent: 'center',
  },
});
