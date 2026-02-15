import React, { ReactNode, useCallback, useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import Colors from '@/constants/colors';

interface AnimatedChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accentColor?: string;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AnimatedChipComponent({ label, selected, onPress, accentColor = Colors.accent, icon, style }: AnimatedChipProps) {
  const selection = useSharedValue(selected ? 1 : 0);

  const syncSelection = useCallback(
    (value: boolean) => {
      selection.value = withSpring(value ? 1 : 0, {
        damping: 18,
        stiffness: 280,
      });
    },
    [selection]
  );

  React.useEffect(() => {
    syncSelection(selected);
  }, [selected, syncSelection]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(selection.value, [0, 1], [0.96, 1.02]) }],
    backgroundColor: interpolateColor(selection.value, [0, 1], ['rgba(130, 90, 255, 0.08)', `${accentColor}30`]),
    borderColor: interpolateColor(selection.value, [0, 1], ['rgba(130, 90, 255, 0.18)', accentColor]),
  }));

  const textColor = useMemo(() => (selected ? '#FFFFFF' : 'rgba(255,255,255,0.55)'), [selected]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[styles.base, animatedStyle, style]}
    >
      <View style={styles.row}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
}

export const AnimatedChip = React.memo(AnimatedChipComponent);

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    borderWidth: 1.2,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
