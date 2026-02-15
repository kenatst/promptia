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
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Wand2, Compass, Bookmark, ChevronRight, Sparkles } from 'lucide-react-native';
import { usePromptStore } from '@/contexts/PromptContext';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: (color: string) => React.ReactNode;
  title: string;
  subtitle: string;
  accentColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: (c) => <Wand2 size={42} color={c} strokeWidth={2.5} />,
    title: 'Craft Perfect Prompts',
    subtitle: 'Build god-tier prompts for any AI model with our intelligent builder. Quick mode for speed, Advanced for precision.',
    accentColor: '#F59E0B',
  },
  {
    id: '2',
    icon: (c) => <Compass size={42} color={c} strokeWidth={2.5} />,
    title: 'Discover Inspiration',
    subtitle: 'Explore a curated gallery of high-quality prompts. Filter by type, remix in the builder, and learn from the best.',
    accentColor: '#10B981',
  },
  {
    id: '3',
    icon: (c) => <Bookmark size={42} color={c} strokeWidth={2.5} />,
    title: 'Organize Your Library',
    subtitle: 'Save prompts to custom folders, search instantly, and build your personal prompt collection over time.',
    accentColor: '#EC4899',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = usePromptStore();
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      <View style={styles.glassCardWrapper}>
        <BlurView intensity={20} tint="light" style={styles.glassCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${item.accentColor}15` }]}>
            {item.icon(item.accentColor)}
          </View>

          <Text style={[styles.slideTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.slideSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
        </BlurView>
      </View>
    </View>
  ), [colors]);

  const isLast = currentIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: '#0F172A' }]}>
      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -50, right: -50, backgroundColor: '#3B82F620', width: 300, height: 300 }]} />
      <View style={[styles.orb, { bottom: -100, left: -100, backgroundColor: currentSlide.accentColor + '10', width: 400, height: 400 }]} />

      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <View style={styles.topBarInner}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Sparkles size={16} color="#F59E0B" />
            </View>
            <Text style={[styles.logoText, { color: '#FFF' }]}>Promptia</Text>
          </View>
          {!isLast && (
            <Pressable onPress={handleSkip} hitSlop={12}>
              <Text style={[styles.skipText, { color: 'rgba(255,255,255,0.5)' }]}>Skip</Text>
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
        keyExtractor={(item: OnboardingSlide) => item.id}
        renderItem={renderSlide}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => {
            const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.2, 1, 0.2],
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
          style={({ pressed }: { pressed: boolean }) => [
            styles.nextBtn,
            { backgroundColor: currentSlide.accentColor },
            pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
          ]}
        >
          <Text style={styles.nextBtnText}>{isLast ? 'Get Started' : 'Continue'}</Text>
          <BlurView intensity={30} tint="light" style={styles.nextBtnIcon}>
            <ChevronRight size={20} color="#FFF" />
          </BlurView>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  topBar: { paddingHorizontal: 24 },
  topBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logoText: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.5 },
  skipText: { fontSize: 16, fontWeight: '600' as const },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glassCardWrapper: {
    width: '100%',
    aspectRatio: 0.8,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  glassCard: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 16,
    lineHeight: 38,
  },
  slideSubtitle: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    opacity: 0.8,
  },
  footer: {
    paddingHorizontal: 32,
    gap: 32,
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
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 32,
    paddingRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  nextBtnIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
});

