import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import { usePromptStore } from '@/contexts/PromptContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  interpolateColor
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  image: any;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Your unfair\nadvantage in AI.',
    subtitle: 'Create prompts so powerful, so precise, they feel like you cheated.',
    image: require('../assets/images/onboarding_1.png'),
  },
  {
    id: '2',
    title: 'Turn images\ninto prompts.',
    subtitle: 'Drop any image and reverse-engineer the perfect prompt in seconds.',
    image: require('../assets/images/onboarding_2.png'),
  },
  {
    id: '3',
    title: 'Build your\nprompt library.',
    subtitle: 'Save and organize all your prompts, so a great idea is never lost.',
    image: require('../assets/images/onboarding_3_new.png'),
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = usePromptStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollX = useSharedValue(0);
  const flatListRef = useRef<Animated.FlatList<any>>(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      completeOnboarding();
      router.replace('/paywall' as any);
    }
  }, [currentIndex, completeOnboarding, router]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding();
    router.replace('/paywall' as any);
  }, [completeOnboarding, router]);

  const isLast = currentIndex === SLIDES.length - 1;

  const renderSlide = useCallback(({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <View style={styles.textContent}>
          <Text style={[styles.slideTitle, { fontFamily: 'Inter_800ExtraBold' }]}>{item.title}</Text>
          <Text style={[styles.slideSubtitle, { fontFamily: 'Inter_500Medium' }]}>{item.subtitle}</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.slideImage} resizeMode="cover" />

          {/* Blend Gradient to make the image fade perfectly into the background */}
          <LinearGradient
            colors={['transparent', 'rgba(255, 240, 230, 0.4)', '#FFE4D6']}
            style={StyleSheet.absoluteFillObject}
            locations={[0.5, 0.8, 1]}
          />

          {/* Slide 2 specific overlay */}
          {item.id === '2' && (
            <Animated.View style={styles.reversePromptOverlay}>
              <View style={styles.reversePromptAvatar}>
                <ChevronRight size={14} color="#FFF" />
              </View>
              <Text style={styles.reversePromptText}>
                "A photorealistic orange cat wearing stylish reflective sunglasses indoors, close-up..."
              </Text>
            </Animated.View>
          )}
        </View>
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#FFF0E6', '#FFE4D6']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topBarInner}>
          <View />
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text style={[styles.skipText, { fontFamily: 'Inter_600SemiBold' }]}>Skip</Text>
          </Pressable>
        </View>
      </View>

      <Animated.FlatList
        ref={flatListRef as any}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: OnboardingSlide) => item.id}
        renderItem={renderSlide}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 32 }]}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.96 : 1 }] }
          ]}
        >
          <LinearGradient
            colors={['#FF6B4A', '#E05024']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextBtn}
          >
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[styles.nextBtnText, { fontFamily: 'Inter_700Bold' }]}>
                {isLast ? 'Get Started' : 'Next'}
              </Text>
            </View>
            <View style={styles.nextBtnIcon}>
              <ChevronRight size={22} color="#FFF" />
            </View>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  topBar: { paddingHorizontal: 24, zIndex: 10 },
  topBarInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipText: { fontSize: 16, color: '#9CA3AF' },

  slide: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center'
  },
  textContent: {
    paddingHorizontal: 32,
    marginBottom: 16,
    width: '100%',
  },
  slideTitle: {
    fontSize: 40,
    color: '#E05024',
    letterSpacing: -1,
    marginBottom: 12,
    lineHeight: 44
  },
  slideSubtitle: {
    fontSize: 18,
    lineHeight: 28,
    color: '#7B6A58',
    paddingRight: 20
  },

  imageContainer: {
    flex: 1,
    width: '90%',
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },

  reversePromptOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#E05024',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  reversePromptAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B6FC0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reversePromptText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    fontFamily: 'Inter_500Medium',
    lineHeight: 18,
  },

  footer: { paddingHorizontal: 40, paddingTop: 10 },
  nextBtn: {
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#E05024',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  nextBtnText: { color: '#FFF', fontSize: 20, letterSpacing: 0.5 },
  nextBtnIcon: {
    position: 'absolute',
    right: 8,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
