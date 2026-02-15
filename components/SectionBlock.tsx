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
          <Text style={styles.emoji}>{section.emoji}</Text>
          <Text style={[styles.title, { color: section.color }]}>{section.header}</Text>
        </View>
        <Copy size={14} color={Colors.textTertiary} />
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
    marginBottom: 10,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  content: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
});
