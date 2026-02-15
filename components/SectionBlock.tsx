import React, { useCallback } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Copy } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { PromptSection } from '@/types/prompt';
import { GlassCard } from './GlassCard';

interface SectionBlockProps {
  section: PromptSection;
  onCopied?: (section: PromptSection) => void;
}

function SectionBlockComponent({ section, onCopied }: SectionBlockProps) {
  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(section.content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (onCopied) {
      onCopied(section);
      return;
    }

    Alert.alert('Copied!', `${section.header} copied.`);
  }, [onCopied, section]);

  return (
    <GlassCard variant="interactive" onPress={handleCopy}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={[styles.emojiWrap, { backgroundColor: `${section.color}20`, borderColor: `${section.color}35` }]}>
            <Text style={styles.emoji}>{section.emoji}</Text>
          </View>
          <Text style={[styles.title, { color: section.color }]}>{section.header}</Text>
        </View>
        <Copy size={14} color="rgba(130, 90, 255, 0.45)" />
      </View>
      <Text style={styles.content}>{section.content}</Text>
    </GlassCard>
  );
}

export const SectionBlock = React.memo(SectionBlockComponent);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emojiWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  content: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
});
