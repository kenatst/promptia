import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

// Reference Colors
const CIRCLE_COLORS = [
    '#D1FAE5', // Green
    '#FFEDD5', // Orange
    '#FEF3C7', // Yellow
    '#EDE9FE', // Purple
    '#FCE7F3', // Pink
    '#DBEAFE', // Blue
];

interface VisualCategoryProps {
    label: string;
    emoji: string;
    selected: boolean;
    onPress: () => void;
    index: number;
}

export function VisualCategory({ label, emoji, selected, onPress, index }: VisualCategoryProps) {
    const scale = useSharedValue(1);
    const bgColor = CIRCLE_COLORS[index % CIRCLE_COLORS.length];

    useEffect(() => {
        scale.value = withSpring(selected ? 1.15 : 1, { damping: 12, stiffness: 200 });
    }, [selected]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable onPress={onPress} style={styles.container}>
            <Animated.View style={[styles.circle, { backgroundColor: bgColor }, animatedStyle]}>
                <Text style={styles.emoji}>{emoji}</Text>
                {selected && <View style={styles.ring} />}
            </Animated.View>
            <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: 8,
        width: 72,
    },
    circle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        // 3D Shadow for the "pop"
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    emoji: {
        fontSize: 28,
    },
    label: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        fontWeight: '500',
    },
    labelSelected: {
        color: '#FFF',
        fontWeight: '700',
    },
    ring: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#FFF',
        opacity: 0.5,
    }
});
