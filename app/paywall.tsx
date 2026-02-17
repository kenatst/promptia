import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Animated,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  Crown,
  Zap,
  Infinity,
  Palette,
  ScanSearch,
  Shield,
  Check,
  Star,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';

import { usePurchases } from '@/contexts/PurchasesContext';
import { useTheme } from '@/contexts/ThemeContext';

const FEATURES = [
  { icon: Infinity, label: 'Unlimited prompt generation', color: '#E8795A' },
  { icon: ScanSearch, label: 'Reverse image-to-prompt AI', color: '#4A8FE7' },
  { icon: Palette, label: 'All 16 creative categories unlocked', color: '#34A77B' },
  { icon: Zap, label: 'God-tier Gemini AI prompts', color: '#D4943A' },
  { icon: Shield, label: 'Priority support & updates', color: '#8B6FC0' },
];

const SOCIAL_PROOF = [
  { stars: 5, text: '"Best prompt tool I\'ve ever used."', author: 'Alex M.' },
  { stars: 5, text: '"Saved me hours on AI work weekly."', author: 'Sara K.' },
];

type PlanKey = 'weekly' | 'monthly' | 'annual';

interface PlanInfo {
  key: PlanKey;
  label: string;
  priceLabel: string;
  perWeek?: string;
  period: string;
  savings?: string;
  popular?: boolean;
}

function getPlanInfo(pkg: PurchasesPackage): PlanInfo | null {
  const id = pkg.identifier;
  const price = pkg.product.priceString;
  const priceValue = pkg.product.price;

  if (id.includes('weekly') || id === '$rc_weekly') {
    return { key: 'weekly', label: 'Weekly', priceLabel: price, period: '/week' };
  }
  if (id.includes('monthly') || id === '$rc_monthly') {
    const perWeek = priceValue > 0 ? `≈ $${(priceValue / 4.33).toFixed(2)}/wk` : undefined;
    return { key: 'monthly', label: 'Monthly', priceLabel: price, period: '/month', popular: true, perWeek };
  }
  if (id.includes('annual') || id === '$rc_annual') {
    const perWeek = priceValue > 0 ? `≈ $${(priceValue / 52).toFixed(2)}/wk` : undefined;
    return { key: 'annual', label: 'Annual', priceLabel: price, period: '/year', savings: 'Best Value', perWeek };
  }
  return null;
}

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { packages, purchasePackage, restorePurchases, isPurchasing, isRestoring, isLoading } = usePurchases();

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('monthly');
  const crownAnim = useRef(new Animated.Value(0)).current;
  const featureAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.spring(crownAnim, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }).start();
    FEATURES.forEach((_, i) => {
      Animated.timing(featureAnims[i], { toValue: 1, duration: 400, delay: 200 + i * 80, useNativeDriver: true }).start();
    });
  }, []);

  const plans: PlanInfo[] = packages
    .map((pkg: PurchasesPackage) => getPlanInfo(pkg))
    .filter((p: PlanInfo | null): p is PlanInfo => p !== null)
    .sort((a: PlanInfo, b: PlanInfo) => {
      const order: Record<PlanKey, number> = { weekly: 0, monthly: 1, annual: 2 };
      return order[a.key] - order[b.key];
    });

  const handlePurchase = useCallback(() => {
    const pkg = packages.find((p: PurchasesPackage) => {
      const info = getPlanInfo(p);
      return info?.key === selectedPlan;
    });
    if (pkg) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      purchasePackage(pkg);
    }
  }, [packages, selectedPlan, purchasePackage]);

  const handleRestore = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    restorePurchases();
  }, [restorePurchases]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const openURL = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {});
  }, []);

  const selectedPlanInfo = plans.find((p) => p.key === selectedPlan);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#FFFAF6' }]}>
      <LinearGradient
        colors={isDark ? ['#2A1810', '#1A0E08', '#0A0A0A'] : ['#FFF0ED', '#FFF5EE', '#FFFAF6']}
        style={styles.headerGradient}
      />

      <Pressable
        onPress={handleClose}
        style={[styles.closeBtn, { top: insets.top + 8, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
        accessibilityLabel="Close paywall"
      >
        <X size={20} color={colors.textSecondary} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.heroSection, { transform: [{ scale: crownAnim }] }]}>
          <View style={styles.crownContainer}>
            <LinearGradient colors={['#E8795A', '#D4593A', '#C04928']} style={styles.crownBg} />
            <Crown size={36} color="#FFF" fill="#FFF" />
          </View>
        </Animated.View>

        <Text style={[styles.heroTitle, { color: colors.text, fontFamily: 'Inter_800ExtraBold' }]}>
          Unlock Promptia Pro
        </Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Join thousands of creators crafting perfect AI prompts every day
        </Text>

        <View style={styles.socialRow}>
          {SOCIAL_PROOF.map((review, i) => (
            <View
              key={i}
              style={[styles.reviewCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? colors.cardBorder : '#F0EBE6' }]}
            >
              <View style={styles.starsRow}>
                {Array.from({ length: review.stars }).map((_, s) => (
                  <Star key={s} size={11} color="#D4943A" fill="#D4943A" />
                ))}
              </View>
              <Text style={[styles.reviewText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{review.text}</Text>
              <Text style={[styles.reviewAuthor, { color: colors.textTertiary, fontFamily: 'Inter_600SemiBold' }]}>— {review.author}</Text>
            </View>
          ))}
        </View>

        <View style={styles.featuresSection}>
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.featureRow,
                  {
                    opacity: featureAnims[i],
                    transform: [{ translateX: featureAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
                  },
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: isDark ? `${feature.color}18` : `${feature.color}12` }]}>
                  <Icon size={18} color={feature.color} />
                </View>
                <Text style={[styles.featureText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                  {feature.label}
                </Text>
                <Check size={16} color="#34A77B" strokeWidth={2.5} />
              </Animated.View>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#E8795A" />
          </View>
        ) : (
          <>
            <View style={styles.plansSection}>
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.key;
                return (
                  <Pressable
                    key={plan.key}
                    onPress={() => { setSelectedPlan(plan.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[
                      styles.planCard,
                      {
                        backgroundColor: isDark ? colors.card : '#FFFFFF',
                        borderColor: isSelected ? '#E8795A' : (isDark ? colors.cardBorder : '#F0EBE6'),
                        borderWidth: isSelected ? 2.5 : 1,
                      },
                    ]}
                    accessibilityLabel={`Select ${plan.label} plan`}
                  >
                    {plan.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={[styles.popularText, { fontFamily: 'Inter_700Bold' }]}>Most Popular</Text>
                      </View>
                    )}
                    {plan.savings && !plan.popular && (
                      <View style={[styles.savingsBadge, { backgroundColor: isDark ? 'rgba(52,167,123,0.15)' : '#E8F8F0' }]}>
                        <Text style={[styles.savingsText, { fontFamily: 'Inter_700Bold' }]}>{plan.savings}</Text>
                      </View>
                    )}
                    <View style={styles.planContent}>
                      <View style={styles.planLeft}>
                        <View style={[styles.radioOuter, isSelected && { borderColor: '#E8795A' }, !isSelected && { borderColor: isDark ? '#3A3A3A' : '#D0CCC8' }]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <View>
                          <Text style={[styles.planLabel, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{plan.label}</Text>
                          {plan.perWeek && (
                            <Text style={[styles.planPerWeek, { color: colors.textTertiary }]}>{plan.perWeek}</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.planRight}>
                        <Text style={[styles.planPrice, { color: colors.text, fontFamily: 'Inter_800ExtraBold' }]}>{plan.priceLabel}</Text>
                        <Text style={[styles.planPeriod, { color: colors.textTertiary }]}>{plan.period}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handlePurchase}
              disabled={isPurchasing}
              style={({ pressed }) => [
                styles.purchaseBtn,
                pressed && !isPurchasing && { transform: [{ scale: 0.97 }], opacity: 0.9 },
              ]}
              accessibilityLabel="Purchase selected plan"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={['#E8795A', '#D4593A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.purchaseBtnGradient}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={[styles.purchaseBtnText, { fontFamily: 'Inter_700Bold' }]}>
                    Continue with {selectedPlanInfo?.label || 'Plan'}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            <Text style={[styles.cancelNote, { color: colors.textTertiary, fontFamily: 'Inter_500Medium' }]}>
              Cancel anytime · No commitment · Secure payment
            </Text>

            <View style={styles.footerActions}>
              <Pressable onPress={handleRestore} disabled={isRestoring}>
                <Text style={[styles.footerLink, { color: colors.textTertiary }]}>
                  {isRestoring ? 'Restoring...' : 'Restore Purchases'}
                </Text>
              </Pressable>
              <View style={[styles.footerDot, { backgroundColor: colors.textTertiary }]} />
              <Pressable onPress={() => openURL('https://promptia.app/terms')}>
                <Text style={[styles.footerLink, { color: colors.textTertiary }]}>Terms</Text>
              </Pressable>
              <View style={[styles.footerDot, { backgroundColor: colors.textTertiary }]} />
              <Pressable onPress={() => openURL('https://promptia.app/privacy')}>
                <Text style={[styles.footerLink, { color: colors.textTertiary }]}>Privacy</Text>
              </Pressable>
            </View>

            <Text style={[styles.legalText, { color: colors.textTertiary }]}>
              Payment charged to your account. Subscription renews automatically unless cancelled at least 24 hours before the end of the current period.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
  closeBtn: { position: 'absolute', right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 24 },
  heroSection: { alignItems: 'center', marginBottom: 20 },
  crownContainer: { width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  crownBg: { ...StyleSheet.absoluteFillObject },
  heroTitle: { fontSize: 30, textAlign: 'center', letterSpacing: -0.8, marginBottom: 8 },
  heroSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 300, alignSelf: 'center', marginBottom: 20 },
  socialRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  reviewCard: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1, gap: 5 },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewText: { fontSize: 12, lineHeight: 17 },
  reviewAuthor: { fontSize: 11 },
  featuresSection: { gap: 14, marginBottom: 28 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 15, flex: 1 },
  loadingBox: { padding: 40, alignItems: 'center' },
  plansSection: { gap: 10, marginBottom: 16 },
  planCard: { borderRadius: 20, padding: 18, position: 'relative', overflow: 'hidden' },
  popularBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#E8795A', paddingHorizontal: 14, paddingVertical: 5, borderBottomLeftRadius: 14 },
  popularText: { color: '#FFF', fontSize: 11, letterSpacing: 0.3 },
  savingsBadge: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 12, paddingVertical: 5, borderBottomLeftRadius: 14 },
  savingsText: { color: '#34A77B', fontSize: 11 },
  planContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E8795A' },
  planLabel: { fontSize: 16 },
  planPerWeek: { fontSize: 11, marginTop: 2 },
  planRight: { alignItems: 'flex-end' },
  planPrice: { fontSize: 20, letterSpacing: -0.5 },
  planPeriod: { fontSize: 12, marginTop: 1 },
  purchaseBtn: { borderRadius: 22, overflow: 'hidden', marginBottom: 12 },
  purchaseBtnGradient: { height: 56, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  purchaseBtnText: { color: '#FFF', fontSize: 17 },
  cancelNote: { fontSize: 12, textAlign: 'center', marginBottom: 16 },
  footerActions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 14 },
  footerLink: { fontSize: 13 },
  footerDot: { width: 3, height: 3, borderRadius: 1.5 },
  legalText: { fontSize: 11, lineHeight: 16, textAlign: 'center', paddingHorizontal: 10 },
});
