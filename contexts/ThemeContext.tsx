import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { translations, Language, LANGUAGE_LABELS } from '@/i18n/translations';

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  bgWarm: string;
  card: string;
  cardBorder: string;
  cardPink: string;
  cardPeach: string;
  cardMint: string;
  cardLavender: string;
  cardSky: string;
  cardLemon: string;
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
  searchBg: string;
  overlay: string;
  coral: string;
  coralDim: string;
}

const lightColors: ThemeColors = {
  bg: '#FFFAF6',
  bgSecondary: '#FFF5EE',
  bgTertiary: '#FEEEE5',
  bgWarm: '#FEF7F0',
  card: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.04)',
  cardPink: '#FFF0ED',
  cardPeach: '#FFF3E8',
  cardMint: '#F0FAF6',
  cardLavender: '#F4F0FF',
  cardSky: '#EFF6FF',
  cardLemon: '#FFFBE8',
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#A3A3A3',
  textInverse: '#FFFFFF',
  separator: '#F5EDE8',
  inputBg: '#FFFFFF',
  chipBg: '#FFF5EE',
  tabBar: 'rgba(255, 255, 255, 0.92)',
  tabBarBorder: 'rgba(0,0,0,0.06)',
  statusBar: 'dark',
  searchBg: '#FFF5EE',
  overlay: 'rgba(26, 26, 26, 0.3)',
  coral: '#E8795A',
  coralDim: 'rgba(232, 121, 90, 0.12)',
};

const darkColors: ThemeColors = {
  bg: '#141414',
  bgSecondary: '#1E1E1E',
  bgTertiary: '#2A2A2A',
  bgWarm: '#1A1714',
  card: '#1E1E1E',
  cardBorder: 'rgba(255,255,255,0.06)',
  cardPink: '#2A1D1B',
  cardPeach: '#2A221B',
  cardMint: '#1A2A24',
  cardLavender: '#221E2E',
  cardSky: '#1A2230',
  cardLemon: '#2A2618',
  text: '#F5F0EB',
  textSecondary: '#A39890',
  textTertiary: '#6B6360',
  textInverse: '#1A1A1A',
  separator: 'rgba(255,255,255,0.06)',
  inputBg: '#1E1E1E',
  chipBg: 'rgba(255,255,255,0.06)',
  tabBar: 'rgba(20, 20, 20, 0.92)',
  tabBarBorder: 'rgba(255,255,255,0.08)',
  statusBar: 'light',
  searchBg: 'rgba(255,255,255,0.06)',
  overlay: 'rgba(0,0,0,0.6)',
  coral: '#E8795A',
  coralDim: 'rgba(232, 121, 90, 0.15)',
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
