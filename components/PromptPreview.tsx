import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { AlertTriangle, CheckCircle, HelpCircle, Lightbulb } from 'lucide-react-native';
import { GlassCard } from './GlassCard';
import Colors from '@/constants/colors';
import { PromptResult } from '@/types/prompt';

interface PromptPreviewProps {
  result: PromptResult;
}

function PromptPreviewComponent({ result }: PromptPreviewProps) {
  const hasMetadata = useMemo(() => {
    const m = result.metadata;
    return m.checklist.length > 0 || m.warnings.length > 0 || m.questions.length > 0 || m.assumptions.length > 0;
  }, [result.metadata]);

  return (
    <View style={styles.container}>
      <GlassCard accent>
        <View style={styles.header}>
          <View style={styles.dot} />
          <Text style={styles.headerText}>Live Preview</Text>
        </View>
        <ScrollView
          style={styles.promptScroll}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.promptText} selectable>
            {result.finalPrompt || 'Start building your prompt...'}
          </Text>
        </ScrollView>
      </GlassCard>

      {hasMetadata && (
        <View style={styles.metaContainer}>
          {result.metadata.warnings.length > 0 && (
            <View style={styles.metaSection}>
              <View style={styles.metaHeader}>
                <AlertTriangle size={14} color={Colors.secondary} />
                <Text style={styles.metaTitle}>Warnings</Text>
              </View>
              {result.metadata.warnings.map((w, i) => (
                <Text key={i} style={styles.metaWarning}>
                  {w}
                </Text>
              ))}
            </View>
          )}

          {result.metadata.assumptions.length > 0 && (
            <View style={styles.metaSection}>
              <View style={styles.metaHeader}>
                <Lightbulb size={14} color={Colors.accent} />
                <Text style={styles.metaTitle}>Assumptions</Text>
              </View>
              {result.metadata.assumptions.map((a, i) => (
                <Text key={i} style={styles.metaItem}>
                  {a}
                </Text>
              ))}
            </View>
          )}

          {result.metadata.questions.length > 0 && (
            <View style={styles.metaSection}>
              <View style={styles.metaHeader}>
                <HelpCircle size={14} color="#A78BFA" />
                <Text style={styles.metaTitle}>Questions</Text>
              </View>
              {result.metadata.questions.map((q, i) => (
                <Text key={i} style={styles.metaQuestion}>
                  {q}
                </Text>
              ))}
            </View>
          )}

          {result.metadata.checklist.length > 0 && (
            <View style={styles.metaSection}>
              <View style={styles.metaHeader}>
                <CheckCircle size={14} color={Colors.success} />
                <Text style={styles.metaTitle}>Checklist</Text>
              </View>
              {result.metadata.checklist.map((c, i) => (
                <Text key={i} style={styles.metaCheck}>
                  {c}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export const PromptPreview = React.memo(PromptPreviewComponent);

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  promptScroll: {
    maxHeight: 240,
  },
  promptText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  metaContainer: {
    gap: 8,
  },
  metaSection: {
    gap: 4,
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  metaTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  metaWarning: {
    fontSize: 13,
    color: Colors.secondary,
    paddingLeft: 20,
  },
  metaItem: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingLeft: 20,
  },
  metaQuestion: {
    fontSize: 13,
    color: '#A78BFA',
    paddingLeft: 20,
  },
  metaCheck: {
    fontSize: 13,
    color: Colors.success,
    paddingLeft: 20,
  },
});
