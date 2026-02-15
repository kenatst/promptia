import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Wand2, Compass, Bookmark, ChevronRight, Sparkles } from 'lucide-react-native';
import { usePromptStore } from '@/contexts/PromptContext';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: (color: string) => React.ReactNode;
  title: string;
  subtitle: string;
  gradient: [string, string];
  accentColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: (c) => <Wand2 size={48} color={c} />,
    title: 'Craft Perfect Prompts',
    subtitle: 'Build god-tier prompts for any AI model with our intelligent builder. Quick mode for speed, Advanced for precision.',
    gradient: ['#1E1B2E', '#2D2545'],
    accentColor: '#F59E0B',
  },
  {
    id: '2',
    icon: (c) => <Compass size={48} color={c} />,
    title: 'Discover Inspiration',
    subtitle: 'Explore a curated gallery of high-quality prompts. Filter by type, remix in the builder, and learn from the best.',
    gradient: ['#1B2E24', '#1E3A2F'],
    accentColor: '#10B981',
  },
  {
    id: '3',
    icon: (c) => <Bookmark size={48} color={c} />,
    title: 'Organize Your Library',
    subtitle: 'Save prompts to custom folders, search instantly, and build your personal prompt collection over time.',
    gradient: ['#2E1B28', '#3A1E32'],
    accentColor: '#EC4899',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = usePromptStore();
  const { colors, isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      completeOnboarding();
      router.replace('/(tabs)/(builder)' as any);
    }
  }, [currentIndex, completeOnboarding, router]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding();
    router.replace('/(tabs)/(builder)' as any);
  }, [completeOnboarding, router]);

  const renderSlide = useCallback(({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <LinearGradient
        colors={item.gradient}
        style={styles.iconContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.iconCircle, { backgroundColor: `${item.accentColor}20` }]}>
          {item.icon(item.accentColor)}
        </View>
        <View style={[styles.sparkle1, { backgroundColor: `${item.accentColor}30` }]} />
        <View style={[styles.sparkle2, { backgroundColor: `${item.accentColor}20` }]} />
        <View style={[styles.sparkle3, { backgroundColor: `${item.accentColor}15` }]} />
      </LinearGradient>

      <Text style={[styles.slideTitle, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.slideSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
    </View>
  ), [colors]);

  const isLast = currentIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarInner}>
          <View style={styles.logoRow}>
            <Sparkles size={20} color="#F59E0B" />
            <Text style={[styles.logoText, { color: colors.text }]}>Promptia</Text>
          </View>
          {!isLast && (
            <Pressable onPress={handleSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={[styles.skipText, { color: colors.textTertiary }]}>Skip</Text>
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => {
            const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={slide.id}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: currentSlide.accentColor,
                  },
                ]}
              />
            );
          })}
        </View>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: currentSlide.accentColor },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Text style={styles.nextBtnText}>{isLast ? 'Get Started' : 'Continue'}</Text>
          <ChevronRight size={20} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 20 },
  topBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontSize: 20, fontWeight: '800' as const },
  skipText: { fontSize: 15, fontWeight: '600' as const },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    position: 'relative',
    overflow: 'hidden',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle1: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    top: 30,
    right: 40,
  },
  sparkle2: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    bottom: 40,
    left: 35,
  },
  sparkle3: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 50,
    left: 30,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  slideSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    gap: 28,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
