/**
 * Text / photo composer sheet — creates a public feed post.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Camera, ChevronLeft, FileText, Images, Trash2 } from 'lucide-react-native';

import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  ComposeAuthor,
  ComposeHeader,
  ComposeTool,
  HideKeyboardButton,
  MediaStrip,
} from '@/features/feed/components/ComposeParts';
import { usePostDrafts } from '@/features/feed/hooks/usePostDrafts';
import {
  captureFeedPhoto,
  MAX_POST_IMAGES,
  MediaPickError,
  pickFeedImages,
} from '@/features/feed/lib/pick-feed-image';
import { formatPostTime } from '@/features/feed/lib/to-feed-card-post';
import type { ComposeMediaItem } from '@/features/feed/lib/upload-post-image';
import type { FeedPost } from '@/features/feed/types/feed.types';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import {
  AppText,
  ConfirmModal,
  KeyboardSheet,
  Spinner,
  useDiscardGuard,
} from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

const MAX_LENGTH = 5000;
const COUNTER_FROM = 4500;

export type FeedComposeInput = {
  content: string;
  /** Photos in display order — new camera/gallery picks and resumed draft photos. */
  media?: ComposeMediaItem[];
  /** Set when publishing a resumed draft so the caller can remove it. */
  draftId?: string;
};

export type FeedComposeSheetProps = {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: FeedComposeInput) => void;
  heading?: string;
  placeholder?: string;
  /** Adds "Save draft" on close and a Drafts list. */
  enableDrafts?: boolean;
};

type Snapshot = { content: string; mediaKey: string };

function mediaKeyOf(list: ComposeMediaItem[]): string {
  return list.map((item) => item.uri).join('|');
}

/**
 * Bottom sheet for a public text post, optionally with one photo.
 */
export function FeedComposeSheet({
  visible,
  busy,
  onClose,
  onSubmit,
  heading = 'Create post',
  placeholder = 'Write like an officer — clear, specific, useful.',
  enableDrafts = false,
}: FeedComposeSheetProps) {
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const token = useAuthStore((state) => state.accessToken);
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<ComposeMediaItem[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Snapshot | null>(null);
  const [view, setView] = useState<'write' | 'drafts'>('write');

  const drafts = usePostDrafts(token, visible && enableDrafts);
  const draftItems = drafts.draftsQuery.data?.items ?? [];

  const reset = useCallback(() => {
    setContent('');
    setPhotos([]);
    setDraftId(null);
    setLoaded(null);
    setView('write');
  }, []);

  useEffect(() => {
    if (!visible) {
      reset();
    }
  }, [reset, visible]);

  const trimmed = content.trim();
  const hasWork = trimmed.length > 0 || photos.length > 0;
  const changedSinceLoad =
    !loaded || loaded.content !== content || loaded.mediaKey !== mediaKeyOf(photos);
  const dirty = hasWork && changedSinceLoad;
  const canPost = hasWork && content.length <= MAX_LENGTH;
  const saving = drafts.saveDraft.isPending;

  const close = useCallback(() => {
    if (!busy && !saving) {
      onClose();
    }
  }, [busy, onClose, saving]);

  const guard = useDiscardGuard(dirty && !busy, close, visible);

  const roomLeft = MAX_POST_IMAGES - photos.length;

  const addPhotos = (next: ComposeMediaItem[]) => {
    if (!next.length) {
      return;
    }
    setPhotos((current) => [...current, ...next].slice(0, MAX_POST_IMAGES));
  };

  const pickPhotos = async () => {
    if (roomLeft <= 0) {
      showToast.info('Photo limit', `A post can have up to ${MAX_POST_IMAGES} photos.`);
      return;
    }
    try {
      const picked = await pickFeedImages(roomLeft);
      addPhotos(picked.map((asset) => ({ key: asset.uri, uri: asset.uri, asset })));
    } catch (error) {
      if (error instanceof MediaPickError) {
        showToast.info('Photos', error.message);
      }
    }
  };

  const takePhoto = async () => {
    if (roomLeft <= 0) {
      showToast.info('Photo limit', `A post can have up to ${MAX_POST_IMAGES} photos.`);
      return;
    }
    try {
      const photo = await captureFeedPhoto();
      if (photo) {
        addPhotos([{ key: photo.uri, uri: photo.uri, asset: photo }]);
      }
    } catch (error) {
      if (error instanceof MediaPickError) {
        showToast.info('Camera', error.message);
      }
    }
  };

  const removePhoto = (key: string) => {
    setPhotos((current) => current.filter((item) => item.key !== key));
  };

  const submit = () => {
    onSubmit({
      content: trimmed,
      media: photos,
      draftId: draftId ?? undefined,
    });
  };

  const saveDraft = () => {
    drafts.saveDraft.mutate(
      {
        content: trimmed,
        media: photos,
        draftId,
      },
      {
        onSuccess: () => {
          guard.keepEditing();
          showToast.success('Draft saved', 'Open Drafts in the composer to finish it.');
          onClose();
        },
        onError: (error) => showErrorToast(error, 'Could not save this draft.', 'Drafts'),
      },
    );
  };

  const openDraft = (post: FeedPost) => {
    const media: ComposeMediaItem[] = post.media
      .filter((item) => item.mediaType === 'image')
      .map((item) => {
        const uri = resolveUploadUrl(item.thumbnail || item.url) || item.url;
        return {
          key: item.url,
          uri,
          remote: { url: item.url, thumbnail: item.thumbnail, mediaType: item.mediaType },
        };
      });
    setContent(post.content);
    setPhotos(media);
    setDraftId(post.id);
    setLoaded({ content: post.content, mediaKey: mediaKeyOf(media) });
    setView('write');
  };

  const deleteDraft = (id: string) => {
    drafts.deleteDraft.mutate(id, {
      onSuccess: () => {
        if (id === draftId) {
          reset();
          setView('drafts');
        }
        showToast.success('Draft deleted');
      },
      onError: (error) => showErrorToast(error, 'Could not delete this draft.', 'Drafts'),
    });
  };

  const draftsPill = enableDrafts ? (
    <Pressable
      accessibilityRole="button"
      onPress={() => setView('drafts')}
      style={({ pressed }) => [
        styles.draftsPill,
        { borderColor: theme.colors.border, opacity: pressed ? 0.75 : 1 },
      ]}>
      <FileText color={theme.colors.textSecondary} size={ms(14)} strokeWidth={2} />
      <AppText color="secondary" variant="caption" weight="semibold">
        Drafts{draftItems.length ? ` · ${draftItems.length}` : ''}
      </AppText>
    </Pressable>
  ) : null;

  return (
    <>
      <KeyboardSheet onRequestClose={view === 'drafts' ? () => setView('write') : guard.requestClose} visible={visible}>
        {view === 'drafts' ? (
          <>
            <ComposeHeader
              leading={
                <Pressable
                  accessibilityLabel="Back to composer"
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={() => setView('write')}
                  style={({ pressed }) => [
                    styles.backBtn,
                    { backgroundColor: theme.colors.surface, opacity: pressed ? 0.7 : 1 },
                  ]}>
                  <ChevronLeft color={theme.colors.text} size={ms(20)} strokeWidth={2.2} />
                </Pressable>
              }
              onClose={() => setView('write')}
              title={draftItems.length ? `Drafts · ${draftItems.length}` : 'Drafts'}
            />
            {drafts.draftsQuery.isPending ? (
              <Spinner label="Loading drafts" size="small" style={styles.draftsState} />
            ) : draftItems.length === 0 ? (
              <View style={styles.draftsState}>
                <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surface }]}>
                  <FileText color={theme.colors.textMuted} size={ms(22)} strokeWidth={1.8} />
                </View>
                <AppText variant="label" weight="semibold">
                  No drafts yet
                </AppText>
                <AppText color="muted" style={styles.centerText} variant="caption">
                  Close the composer with unsent text and pick “Save draft”.
                </AppText>
              </View>
            ) : (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: windowHeight * 0.55 }}>
                {draftItems.map((post) => (
                  <DraftRow
                    active={post.id === draftId}
                    key={post.id}
                    onDelete={() => deleteDraft(post.id)}
                    onOpen={() => openDraft(post)}
                    post={post}
                  />
                ))}
              </ScrollView>
            )}
          </>
        ) : (
          <>
            <ComposeHeader
              actionDisabled={!canPost || saving}
              actionLabel="Post"
              busy={busy}
              onAction={submit}
              onClose={guard.requestClose}
              title={draftId ? 'Finish draft' : heading}
            />
            <ComposeAuthor
              caption={draftId ? 'Editing a saved draft' : 'Posting to the BIGB community'}
              trailing={draftsPill}
            />
            <TextInput
              autoFocus
              editable={!busy}
              maxLength={MAX_LENGTH + 200}
              multiline
              onChangeText={setContent}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textMuted}
              scrollEnabled
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  fontFamily: resolveFontFamily('regular'),
                  maxHeight: windowHeight * (photos.length ? 0.22 : 0.34),
                },
              ]}
              value={content}
            />
            {photos.length ? (
              <MediaStrip
                items={photos.map((item) => ({ key: item.key, uri: item.uri }))}
                onAdd={roomLeft > 0 && !busy ? () => void pickPhotos() : undefined}
                onRemove={busy ? undefined : removePhoto}
                singleHeight={vs(170)}
              />
            ) : null}
            <View style={[styles.toolbar, { borderTopColor: theme.colors.border }]}>
              <View style={styles.tools}>
                <ComposeTool
                  Icon={Camera}
                  disabled={busy || roomLeft <= 0}
                  label="Camera"
                  onPress={() => void takePhoto()}
                  tone="accent"
                />
                <ComposeTool
                  Icon={Images}
                  disabled={busy || roomLeft <= 0}
                  label={photos.length ? 'Add photos' : 'Gallery'}
                  onPress={() => void pickPhotos()}
                />
              </View>
              <HideKeyboardButton />
              {content.length >= COUNTER_FROM ? (
                <AppText
                  color={content.length > MAX_LENGTH ? 'danger' : 'muted'}
                  variant="caption"
                  weight="semibold">
                  {content.length}/{MAX_LENGTH}
                </AppText>
              ) : null}
            </View>
          </>
        )}
      </KeyboardSheet>

      <ConfirmModal
        Icon={FileText}
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        message={
          enableDrafts
            ? 'Save it as a draft to finish later, or discard it.'
            : 'Your text and photo will be lost if you leave now.'
        }
        onCancel={guard.keepEditing}
        onConfirm={guard.discard}
        onSecondary={enableDrafts ? saveDraft : undefined}
        secondaryLabel={enableDrafts ? (draftId ? 'Update draft' : 'Save draft') : undefined}
        secondaryLoading={saving}
        title={enableDrafts ? 'Keep this post?' : 'Discard this post?'}
        tone="danger"
        visible={guard.asking}
      />
    </>
  );
}

type DraftRowProps = {
  post: FeedPost;
  active: boolean;
  onOpen: () => void;
  onDelete: () => void;
};

function DraftRow({ post, active, onOpen, onDelete }: DraftRowProps) {
  const theme = useTheme();
  const image = post.media.find((item) => item.mediaType === 'image');
  const thumb = resolveUploadUrl(image?.thumbnail || image?.url);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [
        styles.draftRow,
        {
          borderColor: active ? theme.colors.primary : theme.colors.border,
          backgroundColor: pressed ? theme.colors.surface : theme.colors.background,
        },
      ]}>
      {thumb ? <Image source={{ uri: thumb }} style={styles.draftThumb} /> : null}
      <View style={styles.draftBody}>
        <AppText numberOfLines={2} variant="body">
          {post.content || 'Photo draft'}
        </AppText>
        <AppText color="muted" variant="caption">
          Saved {formatPostTime(post.createdAt)}
        </AppText>
      </View>
      <Pressable
        accessibilityLabel="Delete draft"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onDelete}
        style={({ pressed }) => [styles.draftDelete, { opacity: pressed ? 0.6 : 1 }]}>
        <Trash2 color={theme.colors.danger} size={ms(17)} strokeWidth={2} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: vs(110),
    marginTop: vs(12),
    marginBottom: vs(10),
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlignVertical: 'top',
    fontSize: fontSize(17),
    lineHeight: lineHeight(17, 1.45),
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(10),
    marginTop: vs(12),
    paddingTop: vs(12),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tools: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },
  draftsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    height: ms(30),
    paddingHorizontal: s(10),
    borderRadius: ms(15),
    borderWidth: 1,
  },
  backBtn: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftsState: {
    alignItems: 'center',
    gap: vs(6),
    paddingVertical: vs(36),
  },
  emptyIcon: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(26),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(4),
  },
  centerText: {
    textAlign: 'center',
    maxWidth: s(260),
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    borderWidth: 1,
    borderRadius: ms(16),
    padding: ms(12),
    marginTop: vs(10),
  },
  draftThumb: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(10),
  },
  draftBody: {
    flex: 1,
    minWidth: 0,
    gap: vs(3),
  },
  draftDelete: {
    padding: ms(6),
  },
});
