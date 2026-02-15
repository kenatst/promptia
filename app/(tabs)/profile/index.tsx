import React, { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import {
  ChevronRight,
  ExternalLink,
  FileText,
  HelpCircle,
  Mail,
  Moon,
  Globe,
  Shield,
  Star,
  Trash2,
  Wand2,
  Info,
  Check,
} from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { usePromptStore } from '@/contexts/PromptContext';
import { Language, LANGUAGE_LABELS } from '@/i18n/translations';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { isGeminiConfigured } from '@/services/gemini';

const PRIVACY_POLICY_URL = 'https://example.com/privacy-policy';
const TERMS_OF_USE_URL = 'https://example.com/terms-of-use';
const SUPPORT_EMAIL = 'support@promptia.app';
const APP_VERSION = '1.0.0';

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
  isLast?: boolean;
  colors: any;
}

function SettingsRow({ icon, label, sublabel, onPress, trailing, danger, isLast, colors }: SettingsRowProps) {
  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      disabled={!onPress && !trailing}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress && { backgroundColor: colors.bgSecondary },
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.separator },
      ]}
    >
      <View style={[styles.rowIcon, danger && { backgroundColor: 'rgba(239,68,68,0.1)' }, !danger && { backgroundColor: colors.bgSecondary }]}>
        {icon}
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.text }, danger && { color: '#EF4444' }]}>{label}</Text>
        {sublabel && <Text style={[styles.rowSublabel, { color: colors.textTertiary }]}>{sublabel}</Text>}
      </View>
      {trailing || (onPress && <ChevronRight size={18} color={colors.textTertiary} />)}
    </Pressable>
  );
}

function SettingsContent() {
  const insets = useSafeAreaInsets();
  const { colors, t, isDark, toggleTheme, language, setLanguage, LANGUAGE_LABELS: langLabels } = useTheme();
  const { savedPrompts, clearAllData } = usePromptStore();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const geminiStatus = isGeminiConfigured() ? 'Configured' : 'Not configured';

  const openURL = useCallback(async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Linking.openURL(url);
    }
  }, []);

  const handleContactSupport = useCallback(() => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Promptia Support`);
  }, []);

  const handleRateApp = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/app/id0000000000?action=write-review');
    } else if (Platform.OS === 'android') {
      Linking.openURL('https://play.google.com/store/apps/details?id=com.promptia.app');
    } else {
      Alert.alert('Rate Us', 'Rating is available on mobile devices.');
    }
  }, []);

  const handleClearData = useCallback(() => {
    Alert.alert(
      t.settings.clearAllTitle,
      t.settings.clearAllMsg,
      [
        { text: t.settings.cancel, style: 'cancel' },
        {
          text: t.settings.clearAll,
          style: 'destructive',
          onPress: () => {
            clearAllData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  }, [clearAllData, t]);

  const handleSelectLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    setShowLanguageModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [setLanguage]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid]} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t.settings.title}</Text>

        <View style={[styles.appHeader, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <LinearGradient
            colors={isDark ? ['#2D2545', '#1E1B2E'] : ['#1E1B2E', '#2D2545']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.appIconWrap}
          >
            <Wand2 size={28} color="#F59E0B" />
          </LinearGradient>
          <View>
            <Text style={[styles.appName, { color: colors.text }]}>Promptia</Text>
            <Text style={[styles.appVersion, { color: colors.textTertiary }]}>{t.settings.version} {APP_VERSION}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{t.settings.appearance}</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <SettingsRow
            icon={<Moon size={18} color="#8B5CF6" />}
            label={t.settings.darkMode}
            sublabel={t.settings.darkModeSub}
            colors={colors}
            trailing={
              <Switch
                value={isDark}
                onValueChange={() => { toggleTheme(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingsRow
            icon={<Globe size={18} color="#3B82F6" />}
            label={t.settings.language}
            sublabel={langLabels[language]}
            onPress={() => setShowLanguageModal(true)}
            colors={colors}
            isLast
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>AI</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <SettingsRow
            icon={<Wand2 size={18} color="#F59E0B" />}
            label="Gemini API"
            sublabel={geminiStatus}
            colors={colors}
            isLast
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{t.settings.support}</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <SettingsRow
            icon={<Mail size={18} color="#14B8A6" />}
            label={t.settings.contactSupport}
            sublabel={SUPPORT_EMAIL}
            onPress={handleContactSupport}
            colors={colors}
          />
          <SettingsRow
            icon={<Star size={18} color="#F59E0B" />}
            label={t.settings.rateApp}
            sublabel={t.settings.rateAppSub}
            onPress={handleRateApp}
            colors={colors}
          />
          <SettingsRow
            icon={<HelpCircle size={18} color="#06B6D4" />}
            label={t.settings.faq}
            onPress={() => openURL('https://example.com/help')}
            colors={colors}
            isLast
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{t.settings.legal}</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <SettingsRow
            icon={<Shield size={18} color="#10B981" />}
            label={t.settings.privacyPolicy}
            onPress={() => openURL(PRIVACY_POLICY_URL)}
            trailing={<ExternalLink size={16} color={colors.textTertiary} />}
            colors={colors}
          />
          <SettingsRow
            icon={<FileText size={18} color="#3B82F6" />}
            label={t.settings.termsOfUse}
            onPress={() => openURL(TERMS_OF_USE_URL)}
            trailing={<ExternalLink size={16} color={colors.textTertiary} />}
            colors={colors}
            isLast
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{t.settings.data}</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <SettingsRow
            icon={<Info size={18} color={colors.textSecondary} />}
            label={t.settings.savedPrompts}
            sublabel={`${savedPrompts.length} ${t.settings.promptsStored}`}
            colors={colors}
            isLast={savedPrompts.length === 0}
          />
          {savedPrompts.length > 0 && (
            <SettingsRow
              icon={<Trash2 size={18} color="#EF4444" />}
              label={t.settings.clearAll}
              sublabel={t.settings.clearAllSub}
              onPress={handleClearData}
              danger
              colors={colors}
              isLast
            />
          )}
        </View>

        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          {t.settings.footer}
        </Text>
      </ScrollView>

      <Modal visible={showLanguageModal} transparent animationType="fade">
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} onPress={() => setShowLanguageModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t.settings.selectLanguage}</Text>
            {(Object.keys(langLabels) as Language[]).map((lang) => {
              const isActive = language === lang;
              return (
                <Pressable
                  key={lang}
                  onPress={() => handleSelectLanguage(lang)}
                  style={[styles.langOption, isActive && { backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : '#FEF3C7' }]}
                >
                  <Text style={[styles.langText, { color: colors.text }, isActive && { color: '#D97706', fontWeight: '700' as const }]}>
                    {langLabels[lang]}
                  </Text>
                  {isActive && <Check size={18} color="#D97706" />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function SettingsScreen() {
  return (
    <ErrorBoundary fallbackTitle="Settings Error">
      <SettingsContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  pageTitle: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8, marginBottom: 24 },
  appHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32,
    padding: 20, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2, borderWidth: 1,
  },
  appIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 20, fontWeight: '800' as const },
  appVersion: { fontSize: 13, marginTop: 2 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700' as const, textTransform: 'uppercase' as const,
    letterSpacing: 0.8, marginBottom: 8, marginLeft: 4,
  },
  section: {
    borderRadius: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.03,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
    borderWidth: 1, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 14,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, gap: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600' as const },
  rowSublabel: { fontSize: 12 },
  footerText: { textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 20 },
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30,
  },
  modalContent: {
    width: '100%', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: '800' as const, marginBottom: 12 },
  langOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, marginBottom: 4,
  },
  langText: { fontSize: 16, fontWeight: '500' as const },
});
