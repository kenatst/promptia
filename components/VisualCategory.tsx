import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

// New Vibrant Pastel Colors for Light Mode
const CIRCLE_COLORS = [
    '#D1FAE5', // Mint (Green)
    '#FFEDD5', // Peach (Orange)
    '#FEF3C7', // Cream (Yellow)
    '#EDE9FE', // Lavender (Purple)
    '#FCE7F3', // Rose (Pink)
    '#DBEAFE', // Sky (Blue)
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
        // Stronger Shadow for Light Mode Pop
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    emoji: {
        fontSize: 28,
    },
    label: {
        fontSize: 12,
        color: '#6B7280', // Grey for unselected
        textAlign: 'center',
        fontWeight: '500',
    },
    labelSelected: {
        color: '#111827', // Black for selected
        fontWeight: '700',
    },
    ring: {
        position: 'absolute',
        width: 68,
        height: 68,
        borderRadius: 34,
        borderWidth: 2,
        borderColor: '#111827', // Dark Ring for selection
        opacity: 0.1,
    }
});
