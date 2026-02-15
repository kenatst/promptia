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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Wand2, Compass, Bookmark, ChevronRight, Layers } from 'lucide-react-native';
import { usePromptStore } from '@/contexts/PromptContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: (color: string) => React.ReactNode;
  title: string;
  subtitle: string;
  accentColor: string;
  cardBg: string;
  decorColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: (c) => <Wand2 size={36} color={c} strokeWidth={2} />,
    title: 'Craft Perfect\nPrompts',
    subtitle: 'Build god-tier prompts for any AI model. Quick mode for speed, Advanced for total control.',
    accentColor: '#E8795A',
    cardBg: '#FFF0ED',
    decorColor: '#FDEAE4',
  },
  {
    id: '2',
    icon: (c) => <Compass size={36} color={c} strokeWidth={2} />,
    title: 'Discover\nInspiration',
    subtitle: 'Explore a curated gallery of high-quality prompts. Filter by type, remix, and learn from the best.',
    accentColor: '#34A77B',
    cardBg: '#F0FAF6',
    decorColor: '#E0F5EC',
  },
  {
    id: '3',
    icon: (c) => <Bookmark size={36} color={c} strokeWidth={2} />,
    title: 'Organize\nYour Library',
    subtitle: 'Save prompts to custom folders, search instantly, and build your personal collection over time.',
    accentColor: '#8B6FC0',
    cardBg: '#F4F0FF',
    decorColor: '#EBE4FF',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = usePromptStore();
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
      <View style={[styles.cardOuter, { backgroundColor: item.cardBg }]}>
        <View style={[styles.decorCircle1, { backgroundColor: item.decorColor }]} />
        <View style={[styles.decorCircle2, { backgroundColor: item.decorColor }]} />

        <View style={[styles.iconWrap, { backgroundColor: '#FFFFFF' }]}>
          {item.icon(item.accentColor)}
        </View>

        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>

        <View style={styles.featureTags}>
          <View style={[styles.featureTag, { backgroundColor: '#FFFFFF' }]}>
            <Layers size={12} color={item.accentColor} />
            <Text style={[styles.featureTagText, { color: item.accentColor }]}>AI Powered</Text>
          </View>
          <View style={[styles.featureTag, { backgroundColor: '#FFFFFF' }]}>
            <Text style={[styles.featureTagText, { color: item.accentColor }]}>Multi-model</Text>
          </View>
        </View>
      </View>
    </View>
  ), []);

  const isLast = currentIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topBarInner}>
          <View style={styles.logoRow}>
            <View style={[styles.logoDot, { backgroundColor: '#E8795A' }]} />
            <Text style={styles.logoText}>Promptia</Text>
          </View>
          {!isLast && (
            <Pressable onPress={handleSkip} hitSlop={12}>
              <Text style={styles.skipText}>Skip</Text>
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
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.25, 1, 0.25],
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
            pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] },
          ]}
        >
          <Text style={styles.nextBtnText}>{isLast ? 'Get Started' : 'Continue'}</Text>
          <View style={styles.nextBtnIcon}>
            <ChevronRight size={20} color="#FFF" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFAF6' },
  topBar: { paddingHorizontal: 24 },
  topBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  logoText: { fontSize: 22, fontWeight: '800' as const, color: '#1A1A1A', letterSpacing: -0.5 },
  skipText: { fontSize: 16, fontWeight: '600' as const, color: '#A3A3A3' },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  cardOuter: {
    width: '100%',
    borderRadius: 32,
    padding: 36,
    alignItems: 'flex-start',
    overflow: 'hidden',
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.6,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.4,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  slideTitle: {
    fontSize: 34,
    fontWeight: '800' as const,
    color: '#1A1A1A',
    letterSpacing: -1,
    marginBottom: 16,
    lineHeight: 40,
  },
  slideSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B6B6B',
    marginBottom: 24,
  },
  featureTags: {
    flexDirection: 'row',
    gap: 8,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  featureTagText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  footer: {
    paddingHorizontal: 28,
    gap: 28,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  nextBtn: {
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 28,
    paddingRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  nextBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
});
