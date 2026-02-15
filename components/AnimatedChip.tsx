import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    interpolateColor,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface AnimatedChipProps {
    label: string;
    selected: boolean;
    onPress: () => void;
    accentColor?: string;
    variant?: 'glass' | 'solid'; // Solid for inside the white card
}

export function AnimatedChip({ label, selected, onPress, accentColor = Colors.accent, variant = 'glass' }: AnimatedChipProps) {
    const scale = useSharedValue(1);
    const progress = useSharedValue(selected ? 1 : 0);

    useEffect(() => {
        progress.value = withTiming(selected ? 1 : 0, { duration: 200 });
    }, [selected]);

    const animatedStyle = useAnimatedStyle(() => {
        // If variant is solid (inside white card), we want grey -> paleAccent
        // If variant is glass (on dark bg), we want glass -> solidAccent

        let backgroundColor;

        if (variant === 'solid') {
            backgroundColor = interpolateColor(
                progress.value,
                [0, 1],
                ['rgba(0,0,0,0.05)', `${accentColor}25`] // Grey to Pale Tint
            );
        } else {
            backgroundColor = interpolateColor(
                progress.value,
                [0, 1],
                ['rgba(255,255,255,0.08)', accentColor] // Glass to Vibrant
            );
        }

        return {
            transform: [{ scale: scale.value }],
            backgroundColor,
        };
    });

    // Text color logic
    const textColor = variant === 'solid'
        ? (selected ? '#000' : '#4B5563')
        : (selected ? '#FFF' : 'rgba(255,255,255,0.8)');

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View style={[styles.chip, animatedStyle, variant === 'solid' && { borderWidth: 0 }]}>
                <Text style={[styles.label, { color: textColor, fontWeight: selected ? '700' : '500' }]}>{label}</Text>
                {selected && variant === 'solid' && (
                    <Text style={{ marginLeft: 6, fontSize: 10, color: '#000' }}>✕</Text>
                )}
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontSize: 13,
    },
});
