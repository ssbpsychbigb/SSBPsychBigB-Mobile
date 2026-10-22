/**
 * One question body. Keys and explanations are never rendered here.
 */

import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Check } from 'lucide-react-native';

import type { AnswerDraft } from '@/features/assessments/lib/assessment-player';
import type { AttemptItem } from '@/features/assessments/types/assessment.types';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { ms, s, vs } from '@/shared/lib/responsive';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

const LETTERS = 'ABCDEFGH';

export type AttemptQuestionProps = {
  item: AttemptItem;
  draft: AnswerDraft;
  position: number;
  total: number;
  onChange: (partial: AnswerDraft) => void;
};

/**
 * MCQ, WAT, SRT, PPDT, and TAT. Unknown types take a written response.
 */
export function AttemptQuestion({
  item,
  draft,
  position,
  total,
  onChange,
}: AttemptQuestionProps) {
  const theme = useTheme();
  const type = item.type || 'mcq';
  const media = resolveUploadUrl(item.mediaUrl);
  const topic = item.topic?.trim();
  const fieldStyle = [
    styles.field,
    {
      color: theme.colors.text,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      fontFamily: resolveFontFamily('regular'),
    },
  ];

  return (
    <View style={styles.block}>
      <View
        style={[
          styles.stem,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}>
        <View style={styles.stemMeta}>
          <AppText color="brand" variant="caption" weight="bold">
            {type === 'mcq' ? 'CHOOSE ONE' : type.toUpperCase()}
          </AppText>
          <AppText color="muted" variant="caption">
            {`${position} of ${total}`}
          </AppText>
        </View>
        {topic ? (
          <View
            style={[
              styles.topic,
              { backgroundColor: theme.colors.background },
            ]}>
            <AppText color="secondary" numberOfLines={1} variant="caption" weight="semibold">
              {topic}
            </AppText>
          </View>
        ) : null}
        {media ? (
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={{ uri: media }}
            style={[styles.media, { backgroundColor: theme.colors.background }]}
          />
        ) : null}
        <AppText variant="subtitle" weight="semibold">
          {item.prompt}
        </AppText>
      </View>

      {type === 'mcq' ? (
        <View style={styles.options}>
          {item.options.map((option, index) => {
            const selected = draft.selectedIndex === index;
            const letter = LETTERS[index] || String(index + 1);
            return (
              <Pressable
                accessibilityLabel={`Option ${letter}. ${option}`}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                key={`${item.id}-${index}`}
                onPress={() => onChange({ selectedIndex: index })}
                style={({ pressed }) => [
                  styles.option,
                  {
                    borderColor: selected
                      ? theme.colors.primary
                      : theme.colors.border,
                    backgroundColor: selected
                      ? theme.colors.primaryMuted
                      : theme.colors.background,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                <View
                  style={[
                    styles.letter,
                    {
                      backgroundColor: selected
                        ? theme.colors.primary
                        : theme.colors.surface,
                    },
                  ]}>
                  <AppText
                    color={selected ? 'inverse' : 'primary'}
                    variant="label"
                    weight="bold">
                    {letter}
                  </AppText>
                </View>
                <AppText
                  style={styles.optionText}
                  variant="body"
                  weight={selected ? 'semibold' : 'regular'}>
                  {option}
                </AppText>
                <View style={styles.checkSlot}>
                  {selected ? (
                    <Check
                      color={theme.colors.primary}
                      size={ms(18)}
                      strokeWidth={2.4}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {type === 'wat' ? (
        <TextInput
          autoFocus
          onChangeText={(text) => onChange({ text })}
          placeholder="One word"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="done"
          style={fieldStyle}
          value={draft.text || ''}
        />
      ) : null}

      {type === 'srt' ? (
        <TextInput
          autoFocus
          multiline
          onChangeText={(text) => onChange({ text })}
          placeholder="Your response"
          placeholderTextColor={theme.colors.textMuted}
          style={[fieldStyle, styles.story]}
          textAlignVertical="top"
          value={draft.text || ''}
        />
      ) : null}

      {type === 'ppdt' || type === 'tat' ? (
        <View style={styles.stack}>
          {type === 'ppdt' ? (
            <>
              <FieldLabel label="Characters" />
              <TextInput
                onChangeText={(characters) => onChange({ characters })}
                placeholder="Who is in the picture"
                placeholderTextColor={theme.colors.textMuted}
                style={fieldStyle}
                value={draft.characters || ''}
              />
              <FieldLabel label="Theme" />
              <TextInput
                onChangeText={(themeText) => onChange({ theme: themeText })}
                placeholder="What is happening"
                placeholderTextColor={theme.colors.textMuted}
                style={fieldStyle}
                value={draft.theme || ''}
              />
            </>
          ) : null}
          <FieldLabel label="Story" />
          <TextInput
            multiline
            onChangeText={(story) => onChange({ story })}
            placeholder="Write the story"
            placeholderTextColor={theme.colors.textMuted}
            style={[fieldStyle, styles.story]}
            textAlignVertical="top"
            value={draft.story || ''}
          />
        </View>
      ) : null}

      {type !== 'mcq' &&
      type !== 'wat' &&
      type !== 'srt' &&
      type !== 'ppdt' &&
      type !== 'tat' ? (
        <TextInput
          multiline
          onChangeText={(text) => onChange({ text })}
          placeholder="Your response"
          placeholderTextColor={theme.colors.textMuted}
          style={[fieldStyle, styles.story]}
          textAlignVertical="top"
          value={draft.text || ''}
        />
      ) : null}
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <AppText color="muted" variant="caption" weight="semibold">
      {label}
    </AppText>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: vs(16),
  },
  stem: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(20),
    paddingHorizontal: s(16),
    paddingVertical: vs(16),
    gap: vs(12),
  },
  stemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(8),
  },
  topic: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: ms(999),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
  },
  media: {
    width: '100%',
    height: vs(200),
    borderRadius: ms(14),
  },
  options: {
    gap: s(10),
  },
  option: {
    minHeight: ms(60),
    borderWidth: 1.5,
    borderRadius: ms(16),
    paddingLeft: s(10),
    paddingRight: s(12),
    paddingVertical: vs(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
  },
  letter: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    minWidth: 0,
  },
  checkSlot: {
    width: ms(18),
    alignItems: 'center',
  },
  field: {
    minHeight: ms(48),
    borderWidth: 1,
    borderRadius: ms(14),
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    fontSize: 16,
  },
  story: {
    minHeight: vs(160),
  },
  stack: {
    gap: vs(8),
  },
});
