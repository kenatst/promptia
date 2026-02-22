import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Copy, Edit2, Share2, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { useTheme } from '@/contexts/ThemeContext';
import { CREATION_CATEGORIES } from '@/data/gallerySeed';

interface PromptCardProps {
    prompt: any;
    variant?: 'gallery' | 'library';
    style?: ViewStyle;
    onPress?: (prompt: any) => void;
    onCopy?: (prompt: any) => void;
    onEdit?: (prompt: any) => void;
    onDelete?: (prompt: any) => void;
    onSave?: (prompt: any) => void;
    onShare?: (prompt: any) => void;
    onUseInBuilder?: (prompt: any) => void;
    onRemoveTag?: (prompt: any, tag: string) => void;
}

export function PromptCard({
    prompt,
    variant = 'gallery',
    style,
    onPress,
    onCopy,
    onEdit,
    onSave,
    onShare,
}: PromptCardProps) {
    const { colors, isDark } = useTheme();
    const category = CREATION_CATEGORIES.find(c => c.model === prompt.model) || CREATION_CATEGORIES[0];
    const accentColor = category.color || colors.coral;

    const Wrapper = variant === 'gallery' ? BlurView : View;
    const wrapperProps = variant === 'gallery' ? { intensity: isDark ? 60 : 80, tint: (isDark ? 'dark' : 'light') as 'dark' | 'light' | 'default' } : {};

    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress?.(prompt);
            }}
            style={({ pressed }) => [
                styles.container,
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
                style,
            ]}
        >
            <Wrapper {...wrapperProps} style={[styles.inner, { backgroundColor: variant === 'gallery' ? colors.glassBg : colors.card, borderColor: colors.glassBorder }]}>
                {/* Glowing Bottom Line */}
                <LinearGradient
                    colors={[accentColor, accentColor + '00']}
                    start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }}
                    style={[styles.bottomGlow, { backgroundColor: accentColor }]}
                />

                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.catRow}>
                                <Text style={[styles.catName, { color: accentColor }]}>{category.label}</Text>
                            </View>
                            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{prompt.title}</Text>
                        </View>

                        <Pressable
                            hitSlop={10}
                            onPress={() => onSave?.(prompt)}
                            style={[styles.iconBtn, { backgroundColor: colors.card }]}
                        >
                            {variant === 'gallery' ? (
                                <Heart size={20} color={accentColor} />
                            ) : (
                                <Edit2 size={18} color={colors.textSecondary} />
                            )}
                        </Pressable>
                    </View>

                    <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={3}>
                        {prompt.concisePrompt || prompt.fullPrompt || prompt.prompt}
                    </Text>

                    <View style={styles.tagsRow}>
                        {prompt.tags?.slice(0, 3).map((tag: string) => (
                            <View key={tag} style={[styles.miniTag, { backgroundColor: colors.chipBg, borderColor: colors.glassBorder }]}>
                                <Text style={[styles.miniTagText, { color: colors.textSecondary }]}>#{tag}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={[styles.footer, { borderTopColor: colors.separator }]}>
                        <View style={styles.stats}>
                            <Text style={[styles.statText, { color: colors.textTertiary }]}>5 mins</Text>
                            <Text style={[styles.statText, { color: colors.textTertiary }]}>•</Text>
                            <Text style={[styles.statText, { color: colors.textTertiary }]}>1.2k views</Text>
                        </View>

                        <View style={styles.actionsRow}>
                            {onCopy && (
                                <Pressable onPress={() => onCopy(prompt)} style={styles.actionIcon}>
                                    <Copy size={16} color={colors.textTertiary} />
                                </Pressable>
                            )}
                            {onShare && (
                                <Pressable onPress={() => onShare(prompt)} style={styles.actionIcon}>
                                    <Share2 size={16} color={colors.textTertiary} />
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>
            </Wrapper>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 28,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inner: {
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
    },
    bottomGlow: {
        height: 4,
        width: '100%',
        position: 'absolute',
        bottom: 0,
        opacity: 0.8,
    },
    content: {
        padding: 24,
        paddingBottom: 28,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    catRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    catName: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 28,
        letterSpacing: -0.5,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    preview: {
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 20,
        fontWeight: '400',
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    miniTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    miniTagText: {
        fontSize: 12,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
    },
    stats: {
        flexDirection: 'row',
        gap: 6,
    },
    statText: {
        fontSize: 12,
        fontWeight: '500',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    actionIcon: {
        padding: 4,
    },
});
