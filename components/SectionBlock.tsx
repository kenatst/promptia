import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Copy, Sparkles } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { PromptSection } from '@/types/prompt';
import { GlowButton } from './GlowButton';
import { GlassCard } from './GlassCard';

interface SectionBlockProps {
    section: PromptSection;
    onCopied?: () => void;
}

const EMOJI_MAP: Record<string, string> = {
    role: '🎭',
    objective: '🎯',
    context: '🧠',
    constraints: '⛓️',
    format: '📝',
    tone: '🎨',
    variables: '🔢',
    default: '✨',
};

export function SectionBlock({ section, onCopied }: SectionBlockProps) {
    const emoji = EMOJI_MAP[section.type] || EMOJI_MAP.default;

    const handleCopy = async () => {
        await Clipboard.setStringAsync(section.content);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onCopied?.();
    };

    return (
        <GlassCard variant="3d-light" style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.badge}>
                    <Text style={styles.emoji}>{emoji}</Text>
                    <Text style={styles.headerTitle}>{section.header}</Text>
                </View>
                <GlowButton
                    title=""
                    icon={<Copy size={14} color="#6B7280" />}
                    variant="secondary"
                    size="small"
                    onPress={handleCopy}
                    style={styles.copyBtn}
                />
            </View>

            {/* Content */}
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
        fontWeight: '700',
        color: '#111827',
        textTransform: 'capitalize',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    emoji: {
        fontSize: 18,
    },
    copyBtn: {
        width: 32,
        height: 32,
        paddingHorizontal: 0,
        backgroundColor: '#F3F4F6', // Light Grey
        shadowOpacity: 0,
    },
    contentBox: {
        backgroundColor: '#FAFAFA', // Slightly darker than card
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
