import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Copy } from 'lucide-react-native';

import { GlassCard } from './GlassCard';

interface PromptSection {
  type: string;
  header: string;
  content: string;
}

interface SectionBlockProps {
  section: PromptSection;
  onCopied?: () => void;
}

export function SectionBlock({ section, onCopied }: SectionBlockProps) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(section.content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCopied?.();
  };

  return (
    <GlassCard variant="3d-light" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{section.header}</Text>
        <Pressable onPress={handleCopy} style={styles.copyBtn}>
          <Copy size={14} color="#6B7280" />
        </Pressable>
      </View>
      <View style={styles.contentBox}>
        <Text style={styles.content}>{section.content}</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    textTransform: 'capitalize' as const,
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  content: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
});
