import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import Colors from '@/constants/colors';

interface GlowButtonProps {
    onPress: () => void;
    title: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'destructive' | 'glass';
    size?: 'default' | 'large' | 'small';
    style?: ViewStyle;
    disabled?: boolean;
    loading?: boolean;
}

export function GlowButton({
    onPress,
    title,
    icon,
    variant = 'primary',
    size = 'default',
    style,
    disabled,
    loading,
}: GlowButtonProps) {
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withSpring(0.96);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    // Light Mode Colors
    let bgColors: [string, string] = ['#111827', '#374151'];
    let textColor = '#FFFFFF';
    let border = 'transparent';

    if (variant === 'secondary') {
        bgColors = ['#FFFFFF', '#F3F4F6'];
        textColor = '#111827';
        border = 'rgba(0,0,0,0.05)';
    } else if (variant === 'destructive') {
        bgColors = ['#EF4444', '#DC2626'] as [string, string];
        textColor = '#FFFFFF';
    } else if (variant === 'glass') {
        bgColors = ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.4)'] as [string, string];
        textColor = '#1F2937';
        border = 'rgba(0,0,0,0.05)';
    }

    // Size logic
    const height = size === 'large' ? 56 : size === 'small' ? 36 : 48;
    const paddingH = size === 'small' ? 16 : 24;
    const fontSize = size === 'large' ? 18 : size === 'small' ? 13 : 16;
    const borderRadius = height / 2;

    return (
        <Animated.View style={[animatedStyle, style]}>
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                style={[
                    styles.container,
                    { height, borderRadius, borderColor: border, borderWidth: border !== 'transparent' ? 1 : 0 },
                    disabled && styles.disabled,
                ]}
            >
                <LinearGradient
                    colors={bgColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.gradient, { paddingHorizontal: paddingH }]}
                >
                    {loading ? (
                        <Text style={[styles.text, { color: textColor, fontSize }]}>Loading...</Text>
                    ) : (
                        <>
                            {icon && <View style={{ marginRight: title ? 8 : 0 }}>{icon}</View>}
                            {title ? (
                                <Text style={[styles.text, { color: textColor, fontSize, fontWeight: '700' }]}>{title}</Text>
                            ) : null}
                        </>
                    )}
                </LinearGradient>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        // Strong Shadow for 3D Pop
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    gradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        letterSpacing: -0.3,
    },
    disabled: {
        opacity: 0.5,
    },
});
