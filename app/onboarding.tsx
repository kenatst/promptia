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
import {
  ChevronRight,
  Sparkles,
  Star,
  Zap,
  Image as ImageIcon,
  ScanSearch,
  Folder,
  Bookmark,
  Search,
} from 'lucide-react-native';
import { usePromptStore } from '@/contexts/PromptContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ORANGE = '#E8795A';
const ORANGE_BTN = '#E8795A';

// ─── Slide illustrations ───────────────────────────────────────────────────────

function Slide1Image() {
  return (
    <LinearGradient
      colors={['#FFE0A8', '#FFCF70', '#FFB830']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.imageCard}
    >
      {/* Decorative blobs */}
      <View style={[styles.blob, { width: 130, height: 130, top: -30, left: -30, backgroundColor: 'rgba(255,200,60,0.35)' }]} />
      <View style={[styles.blob, { width: 90, height: 90, bottom: -20, right: -10, backgroundColor: 'rgba(255,160,30,0.3)' }]} />

      {/* Trophy pedestal */}
      <View style={styles.trophyWrap}>
        {/* Crown part */}
        <View style={styles.trophyCrown}>
          <View style={[styles.crownArm, { left: 0, transform: [{ rotate: '-15deg' }] }]} />
          <View style={styles.crownTop} />
          <View style={[styles.crownArm, { right: 0, transform: [{ rotate: '15deg' }] }]} />
          {/* Star on top */}
          <View style={styles.crownStar}>
            <Star size={20} color="#FFF" fill="#FFF" />
          </View>
        </View>

        {/* Cup body */}
        <View style={styles.trophyCup}>
          <Sparkles size={32} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
        </View>

        {/* Base */}
        <View style={styles.trophyBase} />
        <View style={styles.trophyFoot} />
      </View>

      {/* Floating sparkles */}
      <View style={[styles.floatBadge, { top: 32, right: 28 }]}>
        <Zap size={14} color="#FF9500" fill="#FF9500" />
        <Text style={styles.floatBadgeText}>Unfair edge</Text>
      </View>
      <View style={[styles.floatBadge, { bottom: 36, left: 24 }]}>
        <Star size={12} color="#FF9500" fill="#FF9500" />
        <Text style={styles.floatBadgeText}>AI-powered</Text>
      </View>
    </LinearGradient>
  );
}

function Slide2Image() {
  return (
    <LinearGradient
      colors={['#C9E8D8', '#A8D5C0', '#80C0A4']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.imageCard}
    >
      <View style={[styles.blob, { width: 120, height: 120, top: -25, right: -25, backgroundColor: 'rgba(100,190,140,0.35)' }]} />
      <View style={[styles.blob, { width: 80, height: 80, bottom: -15, left: -15, backgroundColor: 'rgba(80,170,120,0.3)' }]} />

      {/* Photo frame */}
      <View style={styles.photoFrame}>
        {/* Cat illustration */}
        <LinearGradient colors={['#F9E4C0', '#F2CEA0']} style={styles.photoInner}>
          {/* Cat face using simple shapes */}
          <View style={styles.catHead}>
            <View style={[styles.catEar, { left: 8 }]} />
            <View style={[styles.catEar, { right: 8 }]} />
            <View style={styles.catFace}>
              <View style={styles.catEyeRow}>
                <View style={styles.catEye} />
                <View style={styles.catEye} />
              </View>
              <View style={styles.catNose} />
              <View style={styles.catMouthRow}>
                <View style={[styles.catMouthLine, { transform: [{ rotate: '-15deg' }] }]} />
                <View style={[styles.catMouthLine, { transform: [{ rotate: '15deg' }] }]} />
              </View>
            </View>
          </View>
          <Text style={styles.catLabel}>Drop any image</Text>
        </LinearGradient>

        {/* Prompt overlay */}
        <View style={styles.promptOverlay}>
          <View style={styles.promptOverlayHeader}>
            <ScanSearch size={10} color="#E8795A" />
            <Text style={styles.promptOverlayTitle}>Prompt generated</Text>
          </View>
          <Text style={styles.promptOverlayText} numberOfLines={2}>
            A cute tabby cat with big round eyes, soft fur, studio lighting...
          </Text>
        </View>
      </View>

      <View style={[styles.floatBadge, { top: 32, left: 24 }]}>
        <ImageIcon size={12} color="#2E8B57" />
        <Text style={[styles.floatBadgeText, { color: '#2E8B57' }]}>Image → Prompt</Text>
      </View>
    </LinearGradient>
  );
}

function Slide3Image() {
  const categories = [
    { label: 'Writing', count: '12', color: '#FFE0B2' },
    { label: 'Images', count: '8', color: '#E1F5FE' },
    { label: 'Code', count: '15', color: '#E8F5E9' },
    { label: 'Business', count: '6', color: '#FCE4EC' },
  ];
  const prompts = [
    { title: 'Blog post intro', tag: 'Writing' },
    { title: 'Product photo', tag: 'Images' },
    { title: 'Refactor code', tag: 'Code' },
  ];

  return (
    <LinearGradient
      colors={['#E8E4F8', '#D4CCF0', '#C0B6E8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.imageCard}
    >
      <View style={[styles.blob, { width: 110, height: 110, top: -20, left: -20, backgroundColor: 'rgba(150,130,220,0.3)' }]} />
      <View style={[styles.blob, { width: 80, height: 80, bottom: -10, right: -10, backgroundColor: 'rgba(130,110,200,0.25)' }]} />

      {/* App mockup */}
      <View style={styles.appMockup}>
        {/* Search bar */}
        <View style={styles.mockupSearch}>
          <Search size={11} color="#999" />
          <Text style={styles.mockupSearchText}>Search prompts...</Text>
        </View>

        {/* Category chips */}
        <View style={styles.mockupCategories}>
          {categories.map((c, i) => (
            <View key={i} style={[styles.mockupChip, { backgroundColor: c.color }]}>
              <Folder size={10} color="#666" />
              <Text style={styles.mockupChipText}>{c.label}</Text>
              <View style={styles.mockupChipBadge}>
                <Text style={styles.mockupChipBadgeText}>{c.count}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Prompt list */}
        {prompts.map((p, i) => (
          <View key={i} style={styles.mockupCard}>
            <View style={styles.mockupCardLeft}>
              <Bookmark size={12} color={ORANGE} />
              <Text style={styles.mockupCardTitle}>{p.title}</Text>
            </View>
            <View style={styles.mockupCardTag}>
              <Text style={styles.mockupCardTagText}>{p.tag}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.floatBadge, { bottom: 30, right: 24, backgroundColor: 'rgba(255,255,255,0.92)' }]}>
        <Bookmark size={12} color="#8B6FC0" />
        <Text style={[styles.floatBadgeText, { color: '#8B6FC0' }]}>Never lose an idea</Text>
      </View>
    </LinearGradient>
  );
}

// ─── Slide data ────────────────────────────────────────────────────────────────

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  Image: React.FC;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    title: 'Your unfair\nadvantage in AI.',
    subtitle: 'Create prompts so powerful, so precise, they feel like you cheated.',
    Image: Slide1Image,
  },
  {
    id: '2',
    title: 'Turn images\ninto prompts.',
    subtitle: 'Drop any image and reverse-engineer the perfect prompt in seconds.',
    Image: Slide2Image,
  },
  {
    id: '3',
    title: 'Build your\nprompt library.',
    subtitle: 'Save and organize all your prompts, so a great idea is never lost.',
    Image: Slide3Image,
  },
];

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = usePromptStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

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

  const renderSlide = useCallback(
    ({ item }: { item: Slide }) => (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <item.Image />
        <Text style={[styles.title, { fontFamily: 'Inter_800ExtraBold' }]}>
          {item.title}
        </Text>
        <Text style={[styles.subtitle, { fontFamily: 'Inter_400Regular' }]}>
          {item.subtitle}
        </Text>
      </View>
    ),
    [],
  );

  return (
    <LinearGradient
      colors={['#FFF0E0', '#FFF6EE', '#FFFAF6']}
      locations={[0, 0.45, 1]}
      style={styles.container}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [
              (i - 1) * SCREEN_WIDTH,
              i * SCREEN_WIDTH,
              (i + 1) * SCREEN_WIDTH,
            ];
            const dotScale = scrollX.interpolate({
              inputRange,
              outputRange: [1, 1.4, 1],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { transform: [{ scale: dotScale }], opacity: dotOpacity },
                  i === currentIndex && styles.dotActive,
                ]}
              />
            );
          })}
        </View>

        {/* Skip */}
        {!isLast && (
          <Pressable onPress={handleSkip} hitSlop={16} accessibilityLabel="Skip">
            <Text style={[styles.skipText, { fontFamily: 'Inter_500Medium' }]}>
              Skip
            </Text>
          </Pressable>
        )}
      </View>

      {/* ── Slides ─────────────────────────────────────────────────────────── */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: Slide) => item.id}
        renderItem={renderSlide}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }: { pressed: boolean }) => [
            styles.nextBtn,
            pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
          ]}
          accessibilityLabel={isLast ? 'Get started' : 'Next slide'}
          accessibilityRole="button"
        >
          <Text style={[styles.nextBtnText, { fontFamily: 'Inter_700Bold' }]}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
          <View style={styles.nextBtnArrow}>
            <ChevronRight size={20} color={ORANGE_BTN} strokeWidth={2.5} />
          </View>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const IMAGE_HEIGHT = Math.round(SCREEN_HEIGHT * 0.42);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: 12,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ORANGE,
    opacity: 0.3,
  },
  dotActive: {
    opacity: 1,
    width: 22,
    borderRadius: 4,
  },
  skipText: {
    fontSize: 15,
    color: '#C0A898',
    letterSpacing: 0.1,
  },

  // Slides
  flatList: {
    flexGrow: 0,
  },
  slide: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },

  // Image card
  imageCard: {
    width: '100%',
    height: IMAGE_HEIGHT,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },

  // Floating badge inside image
  floatBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  floatBadgeText: {
    fontSize: 12,
    color: '#555',
    fontFamily: 'Inter_600SemiBold',
  },

  // Slide text
  title: {
    fontSize: 36,
    lineHeight: 43,
    letterSpacing: -1,
    color: ORANGE,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#9C7B6B',
    letterSpacing: 0.1,
  },

  // Footer / CTA
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  nextBtn: {
    height: 58,
    backgroundColor: '#FFFFFF',
    borderRadius: 29,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 28,
    paddingRight: 8,
    shadowColor: '#E8795A',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(232,121,90,0.2)',
  },
  nextBtnText: {
    color: ORANGE,
    fontSize: 17,
    letterSpacing: 0.2,
  },
  nextBtnArrow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Slide 1: Trophy ────────────────────────────────────────────────────────
  trophyWrap: {
    alignItems: 'center',
    gap: 0,
  },
  trophyCrown: {
    width: 110,
    height: 50,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    position: 'relative',
  },
  crownTop: {
    width: 60,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  crownArm: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  crownStar: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
  },
  trophyCup: {
    width: 90,
    height: 90,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9500',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  trophyBase: {
    width: 70,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 4,
    marginTop: 6,
  },
  trophyFoot: {
    width: 90,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 5,
    marginTop: 4,
  },

  // ── Slide 2: Photo + Prompt overlay ────────────────────────────────────────
  photoFrame: {
    width: '78%',
    height: IMAGE_HEIGHT * 0.72,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    position: 'relative',
  },
  photoInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  catHead: {
    width: 100,
    height: 88,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  catEar: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 28,
    backgroundColor: '#D4A876',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    transform: [{ scaleX: 0.7 }],
  },
  catFace: {
    width: 80,
    height: 72,
    backgroundColor: '#C89A6A',
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  catEyeRow: {
    flexDirection: 'row',
    gap: 18,
  },
  catEye: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2D1B00',
  },
  catNose: {
    width: 10,
    height: 7,
    backgroundColor: '#E8795A',
    borderRadius: 5,
  },
  catMouthRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: -2,
  },
  catMouthLine: {
    width: 12,
    height: 3,
    backgroundColor: '#8B5E3C',
    borderRadius: 2,
  },
  catLabel: {
    fontSize: 12,
    color: '#8B6040',
    fontFamily: 'Inter_500Medium',
  },
  promptOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  promptOverlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  promptOverlayTitle: {
    fontSize: 10,
    color: ORANGE,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptOverlayText: {
    fontSize: 11,
    color: '#555',
    lineHeight: 16,
    fontFamily: 'Inter_400Regular',
  },

  // ── Slide 3: App mockup ────────────────────────────────────────────────────
  appMockup: {
    width: '82%',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  mockupSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F5F0EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mockupSearchText: {
    fontSize: 11,
    color: '#AAA',
    fontFamily: 'Inter_400Regular',
  },
  mockupCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  mockupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  mockupChipText: {
    fontSize: 10,
    color: '#555',
    fontFamily: 'Inter_500Medium',
  },
  mockupChipBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  mockupChipBadgeText: {
    fontSize: 9,
    color: '#666',
    fontFamily: 'Inter_600SemiBold',
  },
  mockupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#F0EAE4',
  },
  mockupCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mockupCardTitle: {
    fontSize: 11,
    color: '#333',
    fontFamily: 'Inter_500Medium',
  },
  mockupCardTag: {
    backgroundColor: '#FFF0EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mockupCardTagText: {
    fontSize: 9,
    color: ORANGE,
    fontFamily: 'Inter_600SemiBold',
  },
});
