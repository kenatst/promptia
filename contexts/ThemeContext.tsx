import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { translations, Language, LANGUAGE_LABELS } from '@/i18n/translations';

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  separator: string;
  inputBg: string;
  chipBg: string;
  tabBar: string;
  tabBarBorder: string;
  statusBar: 'dark' | 'light';
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  searchBg: string;
  overlay: string;
}

const lightColors: ThemeColors = {
  bg: '#FDFDFD', // Cleaner, brighter background
  bgSecondary: '#F1F5F9', // Soft slate-gray for secondary backgrounds
  bgTertiary: '#E2E8F0',
  card: '#FFFFFF',
  cardBorder: 'transparent', // Cards defined by shadow now
  text: '#1E293B', // Slate-800 for better readability
  textSecondary: '#64748B', // Slate-500
  textTertiary: '#94A3B8', // Slate-400
  textInverse: '#FFFFFF',
  separator: '#F1F5F9',
  inputBg: '#FFFFFF',
  chipBg: '#F1F5F9',
  tabBar: 'rgba(255, 255, 255, 0.9)', // More glass-like
  tabBarBorder: 'rgba(0,0,0,0.02)',
  statusBar: 'dark',
  gradientStart: '#FFFFFF', // Keeping it clean, subtle gradients
  gradientMid: '#F8FAFC',
  gradientEnd: '#F1F5F9',
  searchBg: '#F8FAFC',
  overlay: 'rgba(15, 23, 42, 0.3)', // Slate-900 with opacity
};

const darkColors: ThemeColors = {
  bg: '#0F172A', // Slate-900 main background
  bgSecondary: '#1E293B', // Slate-800
  bgTertiary: '#334155', // Slate-700
  card: '#1E293B',
  cardBorder: 'rgba(255,255,255,0.04)',
  text: '#F8FAFC', // Slate-50
  textSecondary: '#94A3B8', // Slate-400
  textTertiary: '#64748B', // Slate-500
  textInverse: '#0F172A',
  separator: 'rgba(255,255,255,0.06)',
  inputBg: '#1E293B',
  chipBg: '#334155',
  tabBar: 'rgba(15, 23, 42, 0.9)',
  tabBarBorder: 'rgba(255,255,255,0.04)',
  statusBar: 'light',
  gradientStart: '#0F172A',
  gradientMid: '#162036',
  gradientEnd: '#1E293B',
  searchBg: '#1E293B',
  overlay: 'rgba(0,0,0,0.7)',
};

const THEME_KEY = 'promptia-theme';
const LANG_KEY = 'promptia-language';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [isDark, setIsDark] = useState(false);
  const [language, setLanguageState] = useState<Language>('en');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedTheme, storedLang] = await Promise.all([
          AsyncStorage.getItem(THEME_KEY),
          AsyncStorage.getItem(LANG_KEY),
        ]);
        if (storedTheme === 'dark') setIsDark(true);
        if (storedLang && ['en', 'fr', 'it', 'de', 'es'].includes(storedLang)) {
          setLanguageState(storedLang as Language);
        }
      } catch (e) {
        console.log('Failed to load theme/lang preferences', e);
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  const toggleTheme = useCallback(async () => {
    const newVal = !isDark;
    setIsDark(newVal);
    try {
      await AsyncStorage.setItem(THEME_KEY, newVal ? 'dark' : 'light');
    } catch (e) {
      console.log('Failed to save theme', e);
    }
  }, [isDark]);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      console.log('Failed to save language', e);
    }
  }, []);

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);
  const t = useMemo(() => translations[language], [language]);

  return {
    isDark,
    toggleTheme,
    colors,
    language,
    setLanguage,
    t,
    loaded,
    LANGUAGE_LABELS,
  };
});
