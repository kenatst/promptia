import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
  Dimensions,
  Image,
  Animated as RNAnimated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import {
  Check,
  Shield,
  Sparkles,
  Infinity as InfinityIcon,
  ScanSearch,
  Zap,
  Lock,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';
import Svg, { Circle, Line, G } from 'react-native-svg';

import { usePurchases } from '@/contexts/PurchasesContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Neuron Background ──────────────────────────────────────────────
// Statically generate neuron nodes and connections for the animated background
interface NeuronNode {
  id: number;
  x: number;
  y: number;
  r: number;
  color: string;
  pulseDelay: number;
}

interface NeuronEdge {
  from: number;
  to: number;
  color: string;
}

function generateNeurons(): { nodes: NeuronNode[]; edges: NeuronEdge[] } {
  const nodes: NeuronNode[] = [];
  const count = 28;
  const reds = ['#FF4757', '#FF6B81', '#E8795A', '#D9486E'];
  const blues = ['#4A8FE7', '#3742FA', '#70A1FF', '#5352ED'];

  for (let i = 0; i < count; i++) {
    const isRed = i % 2 === 0;
    const palette = isRed ? reds : blues;
    nodes.push({
      id: i,
      x: Math.random() * SCREEN_W,
      y: Math.random() * (SCREEN_H * 1.1),
      r: 2 + Math.random() * 4,
      color: palette[Math.floor(Math.random() * palette.length)],
      pulseDelay: Math.random() * 3000,
    });
  }

  const edges: NeuronEdge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const nearest: { dist: number; idx: number }[] = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      nearest.push({ dist: Math.sqrt(dx * dx + dy * dy), idx: j });
    }
    nearest.sort((a, b) => a.dist - b.dist);
    const connections = 1 + Math.floor(Math.random() * 2);
    for (let c = 0; c < connections && c < nearest.length; c++) {
      if (nearest[c].dist < 180) {
        const existing = edges.find(
          (e) => (e.from === i && e.to === nearest[c].idx) || (e.from === nearest[c].idx && e.to === i)
        );
        if (!existing) {
          const mixRed = nodes[i].color.startsWith('#FF') || nodes[nearest[c].idx].color.startsWith('#FF');
          edges.push({
            from: i,
            to: nearest[c].idx,
            color: mixRed ? 'rgba(232,121,90,0.12)' : 'rgba(74,143,231,0.12)',
          });
        }
      }
    }
  }

  return { nodes, edges };
}

function NeuronBackground() {
  const { nodes, edges } = useMemo(() => generateNeurons(), []);
  const pulseAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.timing(pulseAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      })
    ).start();
  }, [pulseAnim]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#0D0D1A', '#0A0A14', '#050508']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <Svg width={SCREEN_W} height={SCREEN_H * 1.1} style={StyleSheet.absoluteFill}>
        <G opacity={0.6}>
          {edges.map((edge, i) => (
            <Line
              key={`e-${i}`}
              x1={nodes[edge.from].x}
              y1={nodes[edge.from].y}
              x2={nodes[edge.to].x}
              y2={nodes[edge.to].y}
              stroke={edge.color}
              strokeWidth={1}
            />
          ))}
          {nodes.map((node) => (
            <React.Fragment key={`n-${node.id}`}>
              <Circle cx={node.x} cy={node.y} r={node.r * 3} fill={node.color} opacity={0.06} />
              <Circle cx={node.x} cy={node.y} r={node.r} fill={node.color} opacity={0.7} />
            </React.Fragment>
          ))}
        </G>
      </Svg>
    </View>
  );
}

// ─── Features ───────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 'unlimited',
    icon: InfinityIcon,
    title: 'Unlimited Prompts',
    desc: 'Generate without any limits',
    color: '#FF6B6B',
  },
  {
    id: 'reverse',
    icon: ScanSearch,
    title: 'Reverse Engineer',
    desc: 'Turn images into prompts',
    color: '#4ECDC4',
  },
  {
    id: 'godmode',
    icon: Zap,
    title: 'God-Mode AI',
    desc: 'Advanced models & logic',
    color: '#FFE66D',
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Priority Support',
    desc: 'Get help when you need it',
    color: '#70A1FF',
  },
];

// ─── Plans ──────────────────────────────────────────────────────────
type PlanKey = 'weekly' | 'monthly' | 'annual';

interface PlanInfo {
  key: PlanKey;
  label: string;
  priceLabel: string;
  perWeek?: string;
  period: string;
  savings?: string;
  popular?: boolean;
  trialText?: string;
}

function getPlanInfo(pkg: PurchasesPackage): PlanInfo | null {
  const id = pkg.identifier;
  const price = pkg.product.priceString;
  const priceValue = pkg.product.price;

  if (id.includes('weekly') || id === '$rc_weekly') {
    return { key: 'weekly', label: 'Weekly', priceLabel: price, period: '/week' };
  }
  if (id.includes('monthly') || id === '$rc_monthly') {
    const perWeek = priceValue > 0 ? `$${(priceValue / 4.33).toFixed(2)}/wk` : undefined;
    return {
      key: 'monthly',
      label: 'Monthly',
      priceLabel: price,
      period: '/month',
      perWeek,
      trialText: '3-day free trial',
    };
  }
  if (id.includes('annual') || id === '$rc_annual') {
    const perWeek = priceValue > 0 ? `$${(priceValue / 52).toFixed(2)}/wk` : undefined;
    return {
      key: 'annual',
      label: 'Yearly',
      priceLabel: price,
      period: '/year',
      savings: 'BEST VALUE',
      popular: true,
      perWeek,
    };
  }
  return null;
}

// ─── Main Screen ────────────────────────────────────────────────────
export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { packages, purchasePackage, restorePurchases, isPurchasing, isRestoring, isLoading, isPro } = usePurchases();

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('monthly');

  // Shimmer button
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.linear }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      true
    );
  }, [shimmerValue]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerValue.value * 200 - 100 }],
    opacity: 0.3,
  }));

  // If user is already pro, redirect to the app
  useEffect(() => {
    if (isPro) {
      router.replace('/(tabs)/(builder)' as any);
    }
  }, [isPro, router]);

  const plans: PlanInfo[] = packages
    .map((pkg: PurchasesPackage) => getPlanInfo(pkg))
    .filter((p: PlanInfo | null): p is PlanInfo => p !== null)
    .sort((a: PlanInfo, b: PlanInfo) => {
      const order: Record<PlanKey, number> = { weekly: 0, monthly: 1, annual: 2 };
      return order[a.key] - order[b.key];
    });

  // Fallback plans for dev/testing
  const displayPlans: PlanInfo[] = plans.length > 0 ? plans : [
    { key: 'weekly', label: 'Weekly', priceLabel: '$3.99', period: '/week' },
    { key: 'monthly', label: 'Monthly', priceLabel: '$9.99', period: '/month', trialText: '3-day free trial' },
    { key: 'annual', label: 'Yearly', priceLabel: '$99.99', period: '/year', savings: 'BEST VALUE', popular: true, perWeek: '$1.92/wk' },
  ];

  const handlePurchase = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const pkg = packages.find((p: PurchasesPackage) => {
      const info = getPlanInfo(p);
      return info?.key === selectedPlan;
    });

    if (pkg) {
      await purchasePackage(pkg);
    } else {
      // Dev fallback
      router.replace('/(tabs)/(builder)' as any);
    }
  };

  const selectedPlanInfo = displayPlans.find((p: PlanInfo) => p.key === selectedPlan);

  return (
    <View style={styles.container}>
      <NeuronBackground />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header — Restore only, no close */}
        <View style={styles.header}>
          <View />
          <Pressable
            onPress={() => {
              restorePurchases();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={styles.restoreText}>{isRestoring ? 'Restoring...' : 'Restore Purchases'}</Text>
          </Pressable>
        </View>

        {/* Hero — App Logo + Title */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.hero}>
          <View style={styles.logoOuter}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.logoGlowRed} />
            <View style={styles.logoGlowBlue} />
          </View>
          <Text style={styles.title}>
            Unlock <Text style={{ color: '#E8795A' }}>Promptia</Text>
          </Text>
          <Text style={styles.subtitle}>
            Craft perfect prompts, reverse-engineer images, and master any AI model.
          </Text>
        </Animated.View>

        {/* Features */}
        <View style={styles.featuresGrid}>
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Animated.View
                key={feature.id}
                entering={FadeInDown.delay(200 + index * 50).springify()}
                style={styles.featureCard}
              >
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}18` }]}>
                  <Icon size={18} color={feature.color} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* Plans */}
        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.plansContainer}>
          <Text style={styles.plansTitle}>Choose your plan</Text>
          {isLoading ? (
            <ActivityIndicator color="#E8795A" style={{ marginVertical: 30 }} />
          ) : (
            displayPlans.map((plan: PlanInfo) => {
              const isSelected = selectedPlan === plan.key;
              return (
                <Pressable
                  key={plan.key}
                  onPress={() => {
                    setSelectedPlan(plan.key);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.planCard,
                    isSelected && styles.planSelected,
                  ]}
                >
                  {plan.popular && (
                    <View style={styles.badge}>
                      <LinearGradient
                        colors={['#E8795A', '#D9486E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <Text style={styles.badgeText}>{plan.savings}</Text>
                    </View>
                  )}

                  <View style={styles.planContent}>
                    <View style={styles.planCheck}>
                      {isSelected ? (
                        <View style={styles.checkCircleSelected}>
                          <Check size={12} color="#FFF" strokeWidth={4} />
                        </View>
                      ) : (
                        <View style={styles.checkCircle} />
                      )}
                    </View>
                    <View style={styles.planText}>
                      <Text style={[styles.planLabel, isSelected && { color: '#E8795A' }]}>
                        {plan.label}
                      </Text>
                      {plan.trialText && (
                        <Text style={styles.planTrial}>{plan.trialText}</Text>
                      )}
                      {!plan.trialText && plan.perWeek && (
                        <Text style={styles.planPerWeek}>{plan.perWeek}</Text>
                      )}
                    </View>
                    <View style={styles.planPriceInfo}>
                      <Text style={styles.planPrice}>{plan.priceLabel}</Text>
                      <Text style={styles.planPeriod}>{plan.period}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.footer}>
          <Pressable
            onPress={handlePurchase}
            disabled={isPurchasing}
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <LinearGradient
              colors={['#E8795A', '#D9486E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Sparkles size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.ctaText}>
                    {selectedPlanInfo?.trialText ? 'Start Free Trial' : 'Continue'}
                  </Text>
                  <Animated.View
                    style={[
                      {
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: 50,
                        backgroundColor: 'rgba(255,255,255,0.4)',
                        transform: [{ skewX: '-20deg' }],
                      },
                      shimmerStyle,
                    ]}
                  />
                </>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.secureRow}>
            <Lock size={12} color="#555" />
            <Text style={styles.secureText}>Secured by the App Store. Cancel anytime.</Text>
          </View>

          <View style={styles.legalRow}>
            <Text
              onPress={() => Linking.openURL('https://promptia.app/terms')}
              style={styles.legalLink}
            >
              Terms
            </Text>
            <Text style={styles.legalDot}>·</Text>
            <Text
              onPress={() => Linking.openURL('https://promptia.app/privacy')}
              style={styles.legalLink}
            >
              Privacy
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  scrollContent: { paddingHorizontal: 24 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
    marginBottom: 16,
  },
  restoreText: { fontSize: 13, color: '#888', fontFamily: 'Inter_600SemiBold' },

  // Hero
  hero: { alignItems: 'center', marginBottom: 36 },
  logoOuter: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  logoImage: { width: 80, height: 80, borderRadius: 20, zIndex: 2 },
  logoGlowRed: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8795A',
    opacity: 0.2,
    right: -10,
    top: -5,
  },
  logoGlowBlue: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A8FE7',
    opacity: 0.15,
    left: -8,
    bottom: -5,
  },
  title: {
    fontSize: 30,
    color: '#FFF',
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    fontFamily: 'Inter_500Medium',
  },

  // Features
  featuresGrid: { gap: 10, marginBottom: 32 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureInfo: { flex: 1 },
  featureTitle: {
    fontSize: 15,
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
    marginBottom: 1,
  },
  featureDesc: { fontSize: 12, color: '#777', fontFamily: 'Inter_500Medium' },

  // Plans
  plansContainer: { gap: 12, marginBottom: 32 },
  plansTitle: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  planCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    minHeight: 72,
    justifyContent: 'center',
  },
  planSelected: { borderColor: '#E8795A' },
  planContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  planCheck: { marginRight: 14 },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#555',
  },
  checkCircleSelected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E8795A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planText: { flex: 1 },
  planLabel: {
    fontSize: 16,
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  planTrial: {
    fontSize: 12,
    color: '#4ECDC4',
    fontFamily: 'Inter_600SemiBold',
  },
  planPerWeek: { fontSize: 12, color: '#777' },
  planPriceInfo: { alignItems: 'flex-end' },
  planPrice: {
    fontSize: 18,
    color: '#FFF',
    fontFamily: 'Inter_800ExtraBold',
  },
  planPeriod: { fontSize: 11, color: '#666', marginTop: 2 },

  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    overflow: 'hidden',
  },
  badgeText: {
    fontSize: 9,
    color: '#FFF',
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: 0.5,
  },

  // Footer
  footer: { gap: 14, alignItems: 'center' },
  ctaButton: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    height: 56,
    shadowColor: '#E8795A',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  ctaGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFF',
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secureText: { fontSize: 12, color: '#555', fontFamily: 'Inter_500Medium' },
  legalRow: { flexDirection: 'row', gap: 12, opacity: 0.6 },
  legalLink: {
    fontSize: 12,
    color: '#777',
    textDecorationLine: 'underline',
  },
  legalDot: { fontSize: 12, color: '#444' },
});
