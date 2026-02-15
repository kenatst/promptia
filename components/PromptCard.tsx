import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Copy, Edit2, Share2, Trash2, Heart, ChefHat } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { CREATION_CATEGORIES } from '@/data/gallerySeed';
import { AnimatedChip } from './AnimatedChip';

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
    onDelete,
    onSave,
    onShare,
    onUseInBuilder,
    onRemoveTag,
}: PromptCardProps) {
    const category = CREATION_CATEGORIES.find(c => c.id === prompt.category || c.model === prompt.model) || CREATION_CATEGORIES[0];
    const accentColor = category.color || Colors.accent;

    // Light Mode: Pastel Backgrounds instead of Glass
    const cardBgColor = variant === 'gallery' ? `${accentColor}15` : '#FFFFFF';

    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress?.(prompt);
            }}
            style={({ pressed }) => [
                styles.container,
                { backgroundColor: cardBgColor, transform: [{ scale: pressed ? 0.98 : 1 }] },
                style,
            ]}
        >
            {/* 3D Bottom Lip/Border */}
            <View style={[styles.bottomBorder, { backgroundColor: accentColor }]} />

            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.catRow}>
                            <Text style={styles.emoji}>{category.emoji}</Text>
                            <Text style={[styles.catName, { color: accentColor }]}>{category.label}</Text>
                        </View>
                        <Text style={styles.title} numberOfLines={2}>{prompt.title}</Text>
                    </View>

                    {/* Action Button (Heart or Menu) */}
                    <Pressable
                        hitSlop={10}
                        onPress={() => onSave?.(prompt)}
                        style={styles.iconBtn}
                    >
                        {variant === 'gallery' ? (
                            <Heart size={20} color={accentColor} />
                        ) : (
                            <Edit2 size={18} color="#4B5563" />
                        )}
                    </Pressable>
                </View>

                {/* Preview Text */}
                <Text style={styles.preview} numberOfLines={3}>
                    {prompt.concisePrompt || prompt.fullPrompt || prompt.prompt}
                </Text>

                {/* Tags */}
                <View style={styles.tagsRow}>
                    {prompt.tags?.slice(0, 3).map((tag: string) => (
                        <View key={tag} style={styles.miniTag}>
                            <Text style={styles.miniTagText}>#{tag}</Text>
                        </View>
                    ))}
                </View>

                {/* Footer Actions */}
                <View style={styles.footer}>
                    <View style={styles.stats}>
                        <Text style={styles.statText}>5 mins ago</Text>
                        <Text style={styles.statText}>•</Text>
                        <Text style={styles.statText}>1.2k views</Text>
                    </View>

                    <View style={styles.actionsRow}>
                        {onCopy && (
                            <Pressable onPress={() => onCopy(prompt)} style={styles.actionIcon}>
                                <Copy size={16} color="#6B7280" />
                            </Pressable>
                        )}
                        {onShare && (
                            <Pressable onPress={() => onShare(prompt)} style={styles.actionIcon}>
                                <Share2 size={16} color="#6B7280" />
                            </Pressable>
                        )}
                    </View>
                </View>

            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        // Light 3D Shadow
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    bottomBorder: {
        height: 6,
        width: '100%',
        position: 'absolute',
        bottom: 0,
    },
    content: {
        padding: 20,
        paddingBottom: 24, // Space for bottom border
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    catRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    emoji: {
        fontSize: 16,
    },
    catName: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 20,
        fontWeight: '800', // Heavy font like reference
        color: '#111827',
        lineHeight: 26,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    preview: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
        marginBottom: 16,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    miniTag: {
        backgroundColor: '#FFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    miniTagText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    stats: {
        flexDirection: 'row',
        gap: 6,
    },
    statText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionIcon: {
        padding: 4,
    },
});
