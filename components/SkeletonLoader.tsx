import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const { isDark } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
  const bg = isDark ? '#2E2A27' : '#EAE6E1';

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: bg, opacity }, style]}
    />
  );
}

export function SkeletonCard() {
  const { isDark } = useTheme();
  const bg = isDark ? '#1E1E1E' : '#FFFFFF';

  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <SkeletonBox width={42} height={42} borderRadius={16} />
          <View style={styles.cardTopText}>
            <SkeletonBox width="80%" height={15} borderRadius={7} />
            <SkeletonBox width="45%" height={12} borderRadius={6} />
          </View>
          <SkeletonBox width={20} height={20} borderRadius={10} />
        </View>
        <SkeletonBox width="100%" height={12} borderRadius={6} />
        <SkeletonBox width="75%" height={12} borderRadius={6} />
        <View style={styles.tagsRow}>
          <SkeletonBox width={64} height={22} borderRadius={10} />
          <SkeletonBox width={80} height={22} borderRadius={10} />
          <SkeletonBox width={56} height={22} borderRadius={10} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24 },
  cardBody: { padding: 18, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardTopText: { flex: 1, gap: 8 },
  tagsRow: { flexDirection: 'row', gap: 6 },
  list: { paddingHorizontal: 24, gap: 14 },
});
