import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
} from 'react-native-purchases';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';

function getRCToken(): string {
  if (__DEV__ || Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || '';
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '',
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || '',
  }) as string;
}

const rcKey = getRCToken();
if (rcKey) {
  Purchases.configure({ apiKey: rcKey });
}

const PRO_ENTITLEMENT = 'pro';

export const [PurchasesProvider, usePurchases] = createContextHook(() => {
  const queryClient = useQueryClient();

  const customerInfoQuery = useQuery({
    queryKey: ['customerInfo'],
    queryFn: async () => {
      try {
        return await Purchases.getCustomerInfo();
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    retry: 2,
  });

  const offeringsQuery = useQuery({
    queryKey: ['offerings'],
    queryFn: async () => {
      try {
        return await Purchases.getOfferings();
      } catch {
        return null;
      }
    },
    staleTime: 300_000,
    retry: 2,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      const result = await Purchases.purchasePackage(pkg);
      return result;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['customerInfo'] });
    },
    onError: (error: any) => {
      if (!error.userCancelled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Purchase Error', error.message || 'Something went wrong. Please try again.');
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      const info = await Purchases.restorePurchases();
      return info;
    },
    onSuccess: (info) => {
      queryClient.invalidateQueries({ queryKey: ['customerInfo'] });
      const hasPro = info.entitlements.active[PRO_ENTITLEMENT] !== undefined;
      Haptics.notificationAsync(
        hasPro ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
      );
      if (hasPro) {
        Alert.alert('Restored', 'Your Pro subscription has been restored.');
      } else {
        Alert.alert('No Subscription Found', 'No active subscription was found to restore.');
      }
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Restore Error', error.message || 'Failed to restore purchases.');
    },
  });

  const isPro = useMemo(() => {
    const info = customerInfoQuery.data;
    if (!info) return false;
    return info.entitlements.active[PRO_ENTITLEMENT] !== undefined;
  }, [customerInfoQuery.data]);

  const currentOffering = useMemo(() => {
    return offeringsQuery.data?.current ?? null;
  }, [offeringsQuery.data]);

  const packages = useMemo(() => {
    return currentOffering?.availablePackages ?? [];
  }, [currentOffering]);

  const purchasePackage = useCallback((pkg: PurchasesPackage) => {
    purchaseMutation.mutate(pkg);
  }, [purchaseMutation]);

  const restorePurchases = useCallback(() => {
    restoreMutation.mutate();
  }, [restoreMutation]);

  return {
    isPro,
    packages,
    currentOffering,
    purchasePackage,
    restorePurchases,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    customerInfo: customerInfoQuery.data ?? null,
  };
});
