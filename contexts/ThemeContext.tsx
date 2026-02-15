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
  bg: '#FAFAFA',
  bgSecondary: '#F3F4F6',
  bgTertiary: '#E5E7EB',
  card: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.03)',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  separator: 'rgba(0,0,0,0.04)',
  inputBg: '#FFFFFF',
  chipBg: '#F3F4F6',
  tabBar: '#FFFFFF',
  tabBarBorder: 'rgba(0,0,0,0.03)',
  statusBar: 'dark',
  gradientStart: '#FAFAFA',
  gradientMid: '#FFF8EE',
  gradientEnd: '#FEF5F0',
  searchBg: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.4)',
};

const darkColors: ThemeColors = {
  bg: '#0F0F14',
  bgSecondary: '#1A1A24',
  bgTertiary: '#252530',
  card: '#1A1A24',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#F1F1F4',
  textSecondary: '#9CA3B0',
  textTertiary: '#6B7280',
  textInverse: '#111827',
  separator: 'rgba(255,255,255,0.06)',
  inputBg: '#1A1A24',
  chipBg: '#252530',
  tabBar: '#161620',
  tabBarBorder: 'rgba(255,255,255,0.06)',
  statusBar: 'light',
  gradientStart: '#0F0F14',
  gradientMid: '#14131A',
  gradientEnd: '#181520',
  searchBg: '#1A1A24',
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
