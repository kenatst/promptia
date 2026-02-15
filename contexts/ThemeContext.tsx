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
  bg: '#FFFFFF', // Pure white for that clean benchmark look
  bgSecondary: '#F8F9FA', // Very subtle gray for contrast
  bgTertiary: '#F1F5F9',
  card: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.04)', // Subtle border for depth
  text: '#0F172A', // Deep slate for primary text
  textSecondary: '#64748B', // Slate-500
  textTertiary: '#94A3B8', // Slate-400
  textInverse: '#FFFFFF',
  separator: '#F1F5F9',
  inputBg: 'rgba(255,255,255,0.8)', // Glassy input
  chipBg: 'rgba(0,0,0,0.03)',
  tabBar: 'rgba(255, 255, 255, 0.8)', // High blur glass
  tabBarBorder: 'rgba(0,0,0,0.05)',
  statusBar: 'dark',
  gradientStart: '#FFFFFF', // Flattened gradients
  gradientMid: '#FFFFFF',
  gradientEnd: '#FFFFFF',
  searchBg: 'rgba(0,0,0,0.03)',
  overlay: 'rgba(15, 23, 42, 0.2)',
};

const darkColors: ThemeColors = {
  bg: '#0F172A', // Deep slate background
  bgSecondary: '#1E293B', // Slate-800
  bgTertiary: '#334155',
  card: '#1E293B',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#F8FAFC', // Slate-50
  textSecondary: '#94A3B8', // Slate-400
  textTertiary: '#64748B', // Slate-500
  textInverse: '#0F172A',
  separator: 'rgba(255,255,255,0.08)',
  inputBg: 'rgba(30, 41, 59, 0.6)', // Glassy dark input
  chipBg: 'rgba(255,255,255,0.05)',
  tabBar: 'rgba(15, 23, 42, 0.8)',
  tabBarBorder: 'rgba(255,255,255,0.08)',
  statusBar: 'light',
  gradientStart: '#0F172A', // Flattened gradients
  gradientMid: '#0F172A',
  gradientEnd: '#0F172A',
  searchBg: 'rgba(255,255,255,0.05)',
  overlay: 'rgba(0,0,0,0.6)',
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
