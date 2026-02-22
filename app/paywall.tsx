import React, { useState, useEffect, useCallback } from 'react';
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
  useAnimatedProps,
} from 'react-native-reanimated';
import { Check, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';
import Svg, { Circle, Line } from 'react-native-svg';

import { usePurchases } from '@/contexts/PurchasesContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Network Animation Node configuration ──────────────────────────────────────
const NUM_NODES = 15;
const CONN_DISTANCE = 140;

const createNodes = () => {
  return Array.from({ length: NUM_NODES }).map(() => ({
    x: Math.random() * SCREEN_W,
    y: Math.random() * SCREEN_H * 0.6,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
  }));
};

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function NeuronsBackground() {
  const [nodes, setNodes] = useState(createNodes);

  // We use requestAnimationFrame to gently move nodes and update the lines
  const animFrame = React.useRef<number>(0);

  useEffect(() => {
    let active = true;
    const update = () => {
      if (!active) return;
      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          let newX = n.x + n.vx;
          let newY = n.y + n.vy;

          if (newX < 0 || newX > SCREEN_W) n.vx *= -1;
          if (newY < 0 || newY > SCREEN_H * 0.7) n.vy *= -1;

          return { ...n, x: newX, y: newY };
        })
      );
      animFrame.current = requestAnimationFrame(update);
    };
    update();
    return () => {
      active = false;
      cancelAnimationFrame(animFrame.current);
    };
  }, []);

  const renderConnections = useCallback(() => {
    const lines = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONN_DISTANCE) {
          const opacity = 1 - dist / CONN_DISTANCE;
          lines.push(
            <Line
              key={`line-${i}-${j}`}
              x1={nodes[i].x}
              y1={nodes[i].y}
              x2={nodes[j].x}
              y2={nodes[j].y}
              stroke="rgba(224, 80, 36, 1)"
              strokeWidth={1.5}
              strokeOpacity={opacity * 0.4}
            />
          );
        }
      }
    }
    return lines;
  }, [nodes]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#FFFFFF', '#FFF5F0', '#FFE6DB']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <Svg style={StyleSheet.absoluteFill}>
        {renderConnections()}
        {nodes.map((n, i) => (
          <Circle
            key={`node-${i}`}
            cx={n.x}
            cy={n.y}
            r={3}
            fill="#E05024"
            opacity={0.6}
          />
        ))}
      </Svg>
    </View>
  );
}

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
      trialText: '1-day free trial',
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

  useEffect(() => {
    if (isPro) router.replace('/(tabs)/(builder)' as any);
  }, [isPro, router]);

  const plans: PlanInfo[] = packages
    .map((pkg: PurchasesPackage) => getPlanInfo(pkg))
    .filter((p: PlanInfo | null): p is PlanInfo => p !== null)
    .sort((a: PlanInfo, b: PlanInfo) => {
      const order: Record<PlanKey, number> = { weekly: 0, monthly: 1, annual: 2 };
      return order[a.key] - order[b.key];
    });

  const displayPlans: PlanInfo[] = plans.length > 0 ? plans : [
    { key: 'weekly', label: 'Weekly', priceLabel: '$3.99', period: '/wk' },
    { key: 'monthly', label: 'Monthly', priceLabel: '$9.99', period: '/mo', trialText: '1-day free trial' },
    { key: 'annual', label: 'Yearly', priceLabel: '$99.99', period: '/yr', savings: 'BEST VALUE', popular: true, perWeek: '$1.92/wk' },
  ];

  const handlePurchase = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const pkg = packages.find((p: PurchasesPackage) => {
      const info = getPlanInfo(p);
      return info?.key === selectedPlan;
    });
    if (pkg) await purchasePackage(pkg);
    else router.replace('/(tabs)/(builder)' as any);
  };

  const selectedPlanInfo = displayPlans.find((p: PlanInfo) => p.key === selectedPlan);

  return (
    <View style={styles.container}>
      <NeuronsBackground />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
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

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.hero}>
          <View style={styles.logoOuter}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>
            Promptia <Text style={{ color: '#E05024' }}>Pro</Text>
          </Text>
          <Text style={styles.subtitle}>
            Activate god-mode AI. Generate limitless prompts, reverse-engineer images, and unlock your true potential.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.plansContainer}>
          <Text style={styles.plansTitle}>Choose your plan</Text>
          {isLoading ? (
            <ActivityIndicator color="#E05024" style={{ marginVertical: 30 }} />
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
                        colors={['#FF6B4A', '#E05024']}
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
                      <Text style={[styles.planLabel, isSelected && { color: '#E05024' }]}>
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
                      <Text style={[styles.planPrice, isSelected && { color: '#E05024' }]}>{plan.priceLabel}</Text>
                      <Text style={styles.planPeriod}>{plan.period}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.footer}>
          <Pressable
            onPress={handlePurchase}
            disabled={isPurchasing}
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
          >
            <LinearGradient
              colors={['#FF6B4A', '#E05024']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.ctaText}>
                    {selectedPlanInfo?.trialText ? selectedPlanInfo.trialText : 'Continue'}
                  </Text>
                  <Animated.View
                    style={[
                      {
                        position: 'absolute', top: 0, bottom: 0, width: 50,
                        backgroundColor: 'rgba(255,255,255,0.4)', transform: [{ skewX: '-20deg' }],
                      },
                      shimmerStyle,
                    ]}
                  />
                </>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.secureRow}>
            <Lock size={12} color="#9CA3AF" />
            <Text style={styles.secureText}>Secured by the App Store. Cancel anytime.</Text>
          </View>

          <View style={styles.legalRow}>
            <Text onPress={() => Linking.openURL('https://promptia.app/terms')} style={styles.legalLink}>Terms</Text>
            <Text style={styles.legalDot}>·</Text>
            <Text onPress={() => Linking.openURL('https://promptia.app/privacy')} style={styles.legalLink}>Privacy</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { paddingHorizontal: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 44, marginBottom: 8 },
  restoreText: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_600SemiBold' },

  hero: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  logoOuter: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  logoImage: { width: 80, height: 80, borderRadius: 20 },
  title: { fontSize: 32, color: '#1A1A1A', fontFamily: 'Inter_900Black', letterSpacing: -0.5, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#4B5563', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20, fontFamily: 'Inter_400Regular' },

  plansContainer: { gap: 12, marginBottom: 40 },
  plansTitle: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  planCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(255,255,255,0.85)', minHeight: 88, justifyContent: 'center', shadowColor: '#E05024', shadowOpacity: 0.04, shadowRadius: 15, shadowOffset: { width: 0, height: 5 } },
  planSelected: { borderColor: '#E05024', backgroundColor: '#FFF', shadowOpacity: 0.08, shadowRadius: 20 },
  planContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18 },
  planCheck: { marginRight: 16 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB' },
  checkCircleSelected: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E05024', alignItems: 'center', justifyContent: 'center' },
  planText: { flex: 1 },
  planLabel: { fontSize: 18, color: '#1A1A1A', fontFamily: 'Inter_800ExtraBold', marginBottom: 2 },
  planTrial: { fontSize: 13, color: '#E05024', fontFamily: 'Inter_600SemiBold' },
  planPerWeek: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_500Medium' },
  planPriceInfo: { alignItems: 'flex-end', justifyContent: 'center' },
  planPrice: { fontSize: 20, color: '#1A1A1A', fontFamily: 'Inter_800ExtraBold' },
  planPeriod: { fontSize: 12, color: '#9CA3AF', marginTop: 2, fontFamily: 'Inter_600SemiBold' },

  badge: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 12, paddingVertical: 6, borderBottomLeftRadius: 16, overflow: 'hidden' },
  badgeText: { fontSize: 10, color: '#FFF', fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.5 },

  footer: { gap: 16, alignItems: 'center', paddingHorizontal: 16 },
  ctaButton: { width: '100%', borderRadius: 32, overflow: 'hidden', height: 64, shadowColor: '#E05024', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  ctaGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFF', fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secureText: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_500Medium' },
  legalRow: { flexDirection: 'row', gap: 12, opacity: 0.8 },
  legalLink: { fontSize: 13, color: '#9CA3AF', textDecorationLine: 'underline' },
  legalDot: { fontSize: 13, color: '#9CA3AF' },
});
