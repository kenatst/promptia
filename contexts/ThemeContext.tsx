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
  primaryGradient: [string, string];
  glassBg: string;
  glassBorder: string;
  glassGlow: string;
}

const lightColors: ThemeColors = {
  bg: '#F9FAFC',
  bgSecondary: '#F0F1F5',
  bgTertiary: '#E4E6EC',
  bgWarm: '#FFF8F0',
  card: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.06)',
  cardPink: '#FFF0ED',
  cardPeach: '#FFF3E8',
  cardMint: '#F0FAF6',
  cardLavender: '#F4F0FF',
  cardSky: '#EFF6FF',
  cardLemon: '#FFFBE8',
  text: '#111111',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',
  separator: 'rgba(0,0,0,0.06)',
  inputBg: '#FFFFFF',
  chipBg: 'rgba(0,0,0,0.04)',
  tabBar: 'rgba(255, 255, 255, 0.85)',
  tabBarBorder: 'rgba(0,0,0,0.08)',
  statusBar: 'dark',
  searchBg: 'rgba(0,0,0,0.04)',
  overlay: 'rgba(0,0,0,0.4)',
  coral: '#FF4757',
  coralDim: 'rgba(255,71,87,0.12)',
  primaryGradient: ['#FF4757', '#FF7E67'],
  glassBg: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.5)',
  glassGlow: 'rgba(255, 71, 87, 0.15)',
};

const darkColors: ThemeColors = {
  bg: '#09090B',
  bgSecondary: '#121214',
  bgTertiary: '#18181B',
  bgWarm: '#120F0D',
  card: '#121214',
  cardBorder: 'rgba(255,255,255,0.08)',
  cardPink: '#2A181C',
  cardPeach: '#2A1D16',
  cardMint: '#142A21',
  cardLavender: '#1F1A2A',
  cardSky: '#161F2A',
  cardLemon: '#2A2412',
  text: '#FAFAFA',
  textSecondary: '#A1A1A1',
  textTertiary: '#71717A',
  textInverse: '#09090B',
  separator: 'rgba(255,255,255,0.1)',
  inputBg: '#18181B',
  chipBg: 'rgba(255,255,255,0.08)',
  tabBar: 'rgba(9, 9, 11, 0.85)',
  tabBarBorder: 'rgba(255,255,255,0.1)',
  statusBar: 'light',
  searchBg: 'rgba(255,255,255,0.08)',
  overlay: 'rgba(0,0,0,0.7)',
  coral: '#FF4757',
  coralDim: 'rgba(255,71,87,0.2)',
  primaryGradient: ['#FF4757', '#FF7E67'],
  glassBg: 'rgba(18, 18, 20, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassGlow: 'rgba(255, 71, 87, 0.25)',
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
