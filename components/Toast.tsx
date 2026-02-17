import React, { useCallback, useEffect, useRef, createContext, useContext, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, AlertTriangle, Info, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const TOAST_CONFIGS: Record<ToastType, { bg: string; darkBg: string; icon: React.ElementType; iconColor: string }> = {
  success: { bg: '#F0FAF6', darkBg: 'rgba(52,167,123,0.18)', icon: Check, iconColor: '#34A77B' },
  error: { bg: '#FDEDF2', darkBg: 'rgba(220,75,75,0.18)', icon: X, iconColor: '#DC4B4B' },
  info: { bg: '#EBF3FE', darkBg: 'rgba(74,143,231,0.18)', icon: Info, iconColor: '#4A8FE7' },
  warning: { bg: '#FFF5E0', darkBg: 'rgba(212,148,58,0.18)', icon: AlertTriangle, iconColor: '#D4943A' },
};

function ToastNotification({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss(item.id));
  }, [item.id, onDismiss, translateY, opacity]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    timer.current = setTimeout(dismiss, item.duration ?? 3000);
    return () => clearTimeout(timer.current);
  }, [dismiss, item.duration, opacity, translateY]);

  const cfg = TOAST_CONFIGS[item.type];
  const Icon = cfg.icon;
  const bg = isDark ? cfg.darkBg : cfg.bg;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: bg,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          top: insets.top + 12,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)' }]}>
        <Icon size={16} color={cfg.iconColor} strokeWidth={2.5} />
      </View>
      <Text style={[styles.message, { color: isDark ? '#F5F0EB' : '#1A1A1A' }]} numberOfLines={2}>
        {item.message}
      </Text>
      <Pressable onPress={dismiss} hitSlop={8}>
        <X size={14} color={isDark ? '#6B6360' : '#B5ADA8'} />
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [{ id, message, type, duration }, ...prev].slice(0, 3));
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ctx: ToastContextValue = {
    show,
    success: (msg, dur) => show(msg, 'success', dur),
    error: (msg, dur) => show(msg, 'error', dur),
    info: (msg, dur) => show(msg, 'info', dur),
    warning: (msg, dur) => show(msg, 'warning', dur),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {toasts.map(item => (
        <ToastNotification key={item.id} item={item} onDismiss={dismiss} />
      ))}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
});
