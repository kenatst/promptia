import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
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
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';

import { usePurchases } from '@/contexts/PurchasesContext';
import { useTheme } from '@/contexts/ThemeContext';

const FEATURES = [
  { icon: Infinity, label: 'Unlimited prompt generation', color: '#E8795A' },
  { icon: ScanSearch, label: 'Reverse image-to-prompt AI', color: '#4A8FE7' },
  { icon: Palette, label: 'All creative categories unlocked', color: '#34A77B' },
  { icon: Zap, label: 'God-tier Gemini AI prompts', color: '#D4943A' },
  { icon: Shield, label: 'Priority support & updates', color: '#8B6FC0' },
];

type PlanKey = 'weekly' | 'monthly' | 'annual';

interface PlanInfo {
  key: PlanKey;
  label: string;
  priceLabel: string;
  period: string;
  savings?: string;
  popular?: boolean;
}

function getPlanInfo(pkg: PurchasesPackage): PlanInfo | null {
  const id = pkg.identifier;
  const price = pkg.product.priceString;

  if (id.includes('weekly') || id === '$rc_weekly') {
    return { key: 'weekly', label: 'Weekly', priceLabel: price, period: '/week' };
  }
  if (id.includes('monthly') || id === '$rc_monthly') {
    return { key: 'monthly', label: 'Monthly', priceLabel: price, period: '/month', popular: true, savings: 'Save 40%' };
  }
  if (id.includes('annual') || id === '$rc_annual') {
    return { key: 'annual', label: 'Annual', priceLabel: price, period: '/year', savings: 'Save 52%' };
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
    Animated.spring(crownAnim, {
      toValue: 1,
      friction: 6,
      tension: 50,
      useNativeDriver: true,
    }).start();

    FEATURES.forEach((_, i) => {
      Animated.timing(featureAnims[i], {
        toValue: 1,
        duration: 400,
        delay: 200 + i * 80,
        useNativeDriver: true,
      }).start();
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
      >
        <X size={20} color={colors.textSecondary} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.heroSection, { transform: [{ scale: crownAnim }] }]}>
          <View style={styles.crownContainer}>
            <LinearGradient
              colors={['#E8795A', '#D4593A', '#C04928']}
              style={styles.crownBg}
            />
            <Crown size={36} color="#FFF" fill="#FFF" />
          </View>
        </Animated.View>

        <Text style={[styles.heroTitle, { color: colors.text }]}>
          Unlock Promptia Pro
        </Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Craft perfect AI prompts with unlimited access to all features
        </Text>

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
                    transform: [{
                      translateX: featureAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    }],
                  },
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: isDark ? `${feature.color}18` : `${feature.color}12` }]}>
                  <Icon size={18} color={feature.color} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>
                  {feature.label}
                </Text>
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
                    onPress={() => {
                      setSelectedPlan(plan.key);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[
                      styles.planCard,
                      {
                        backgroundColor: isDark ? colors.card : '#FFFFFF',
                        borderColor: isSelected ? '#E8795A' : (isDark ? colors.cardBorder : '#F0EBE6'),
                        borderWidth: isSelected ? 2.5 : 1,
                      },
                    ]}
                  >
                    {plan.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>Most Popular</Text>
                      </View>
                    )}
                    {plan.savings && !plan.popular && (
                      <View style={[styles.savingsBadge, { backgroundColor: isDark ? 'rgba(52,167,123,0.15)' : '#E8F8F0' }]}>
                        <Text style={styles.savingsText}>{plan.savings}</Text>
                      </View>
                    )}
                    <View style={styles.planContent}>
                      <View style={styles.planLeft}>
                        <View style={[
                          styles.radioOuter,
                          isSelected && { borderColor: '#E8795A' },
                          !isSelected && { borderColor: isDark ? '#3A3A3A' : '#D0CCC8' },
                        ]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <View>
                          <Text style={[styles.planLabel, { color: colors.text }]}>{plan.label}</Text>
                        </View>
                      </View>
                      <View style={styles.planRight}>
                        <Text style={[styles.planPrice, { color: colors.text }]}>{plan.priceLabel}</Text>
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
                  <>
                    <Text style={styles.purchaseBtnText}>
                      Continue with {selectedPlanInfo?.label || 'Plan'}
                    </Text>
                    <Check size={18} color="#FFF" strokeWidth={3} />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.footerActions}>
              <Pressable onPress={handleRestore} disabled={isRestoring}>
                <Text style={[styles.footerLink, { color: colors.textTertiary }]}>
                  {isRestoring ? 'Restoring...' : 'Restore Purchases'}
                </Text>
              </Pressable>
              <View style={[styles.footerDot, { backgroundColor: colors.textTertiary }]} />
              <Pressable onPress={() => {
                if (Platform.OS === 'web') {
                  window.open('https://example.com/terms-of-use', '_blank');
                }
              }}>
                <Text style={[styles.footerLink, { color: colors.textTertiary }]}>Terms</Text>
              </Pressable>
              <View style={[styles.footerDot, { backgroundColor: colors.textTertiary }]} />
              <Pressable onPress={() => {
                if (Platform.OS === 'web') {
                  window.open('https://example.com/privacy-policy', '_blank');
                }
              }}>
                <Text style={[styles.footerLink, { color: colors.textTertiary }]}>Privacy</Text>
              </Pressable>
            </View>

            <Text style={[styles.legalText, { color: colors.textTertiary }]}>
              Payment will be charged to your account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  crownBg: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800' as const,
    textAlign: 'center' as const,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center' as const,
    lineHeight: 23,
    maxWidth: 300,
    alignSelf: 'center' as const,
    marginBottom: 28,
  },
  featuresSection: {
    gap: 14,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  plansSection: {
    gap: 10,
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 20,
    padding: 18,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  popularBadge: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    backgroundColor: '#E8795A',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderBottomLeftRadius: 14,
  },
  popularText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  savingsBadge: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomLeftRadius: 14,
  },
  savingsText: {
    color: '#34A77B',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  planContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  planLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8795A',
  },
  planLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  planRight: {
    alignItems: 'flex-end' as const,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  planPeriod: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  purchaseBtn: {
    borderRadius: 22,
    overflow: 'hidden' as const,
    marginBottom: 20,
  },
  purchaseBtnGradient: {
    height: 56,
    borderRadius: 22,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  purchaseBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  footerActions: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 14,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  legalText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center' as const,
    paddingHorizontal: 10,
  },
});
