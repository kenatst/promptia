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
  Info,
  Check,
  Zap,
} from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { usePromptStore } from '@/contexts/PromptContext';
import { Language, LANGUAGE_LABELS } from '@/i18n/translations';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
  iconBg?: string;
}

function SettingsRow({ icon, label, sublabel, onPress, trailing, danger, isLast, colors, iconBg }: SettingsRowProps) {
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
      <View style={[styles.rowIcon, { backgroundColor: iconBg || colors.bgSecondary }, danger && { backgroundColor: '#FDEDF2' }]}>
        {icon}
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.text }, danger && { color: '#DC4B4B' }]}>{label}</Text>
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
    Alert.alert(t.settings.clearAllTitle, t.settings.clearAllMsg, [
      { text: t.settings.cancel, style: 'cancel' },
      { text: t.settings.clearAll, style: 'destructive', onPress: () => { clearAllData(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } },
    ]);
  }, [clearAllData, t]);

  const handleSelectLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    setShowLanguageModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [setLanguage]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>{t.settings.title}</Text>
          <View style={[styles.badge, { backgroundColor: isDark ? colors.bgSecondary : '#FFF0ED' }]}>
            <Text style={[styles.badgeText, { color: '#E8795A' }]}>v{APP_VERSION}</Text>
          </View>
        </View>

        <View style={[styles.profileCard, { backgroundColor: isDark ? colors.card : '#FFF0ED' }]}>
          <View style={[styles.profileAvatar, { backgroundColor: isDark ? colors.bgTertiary : '#FFFFFF' }]}>
            <Text style={{ fontSize: 22 }}>P</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.text }]}>Promptia User</Text>
            <Text style={[styles.profileHandle, { color: colors.textTertiary }]}>Free Tier</Text>
          </View>
          <View style={[styles.profileBadge, { backgroundColor: isDark ? colors.bgTertiary : '#FFFFFF' }]}>
            <Zap size={14} color="#E8795A" />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{t.settings.appearance}</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <SettingsRow
            icon={<Moon size={20} color="#8B6FC0" />}
            iconBg={isDark ? '#221E2E' : '#F4F0FF'}
            label={t.settings.darkMode}
            sublabel={t.settings.darkModeSub}
            colors={colors}
            trailing={
              <Switch
                value={isDark}
                onValueChange={() => { toggleTheme(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                trackColor={{ false: '#E5DDD8', true: '#E8795A' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingsRow
            icon={<Globe size={20} color="#4A8FE7" />}
            iconBg={isDark ? '#1A2230' : '#EFF6FF'}
            label={t.settings.language}
            sublabel={langLabels[language]}
            onPress={() => setShowLanguageModal(true)}
            colors={colors}
            isLast
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{t.settings.support}</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <SettingsRow
            icon={<Mail size={20} color="#2BA8A0" />}
            iconBg={isDark ? '#1A2A24' : '#E6F7F6'}
            label={t.settings.contactSupport}
            sublabel={SUPPORT_EMAIL}
            onPress={handleContactSupport}
            colors={colors}
          />
          <SettingsRow
            icon={<Star size={20} color="#D4943A" />}
            iconBg={isDark ? '#2A2618' : '#FFF5E0'}
            label={t.settings.rateApp}
            sublabel={t.settings.rateAppSub}
            onPress={handleRateApp}
            colors={colors}
          />
          <SettingsRow
            icon={<HelpCircle size={20} color="#3B9EC4" />}
            iconBg={isDark ? '#1A2230' : '#EBF5FA'}
            label={t.settings.faq}
            onPress={() => openURL('https://example.com/help')}
            colors={colors}
            isLast
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{t.settings.legal}</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <SettingsRow
            icon={<Shield size={20} color="#34A77B" />}
            iconBg={isDark ? '#1A2A24' : '#F0FAF6'}
            label={t.settings.privacyPolicy}
            onPress={() => openURL(PRIVACY_POLICY_URL)}
            trailing={<ExternalLink size={16} color={colors.textTertiary} />}
            colors={colors}
          />
          <SettingsRow
            icon={<FileText size={20} color="#4A8FE7" />}
            iconBg={isDark ? '#1A2230' : '#EFF6FF'}
            label={t.settings.termsOfUse}
            onPress={() => openURL(TERMS_OF_USE_URL)}
            trailing={<ExternalLink size={16} color={colors.textTertiary} />}
            colors={colors}
            isLast
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{t.settings.data}</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <SettingsRow
            icon={<Info size={20} color={colors.textSecondary} />}
            iconBg={colors.bgSecondary}
            label={t.settings.savedPrompts}
            sublabel={`${savedPrompts.length} ${t.settings.promptsStored}`}
            colors={colors}
            isLast={savedPrompts.length === 0}
          />
          {savedPrompts.length > 0 && (
            <SettingsRow
              icon={<Trash2 size={20} color="#DC4B4B" />}
              iconBg={isDark ? '#2A1A1A' : '#FDEDF2'}
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
          {t.settings.footer} {APP_VERSION}
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
                  style={[styles.langOption, isActive && { backgroundColor: isDark ? 'rgba(232,121,90,0.12)' : '#FFF0ED' }]}
                >
                  <Text style={[styles.langText, { color: colors.text }, isActive && { color: '#E8795A', fontWeight: '700' as const }]}>
                    {langLabels[lang]}
                  </Text>
                  {isActive && <Check size={18} color="#E8795A" />}
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
  scrollContent: { paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  pageTitle: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.8 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  badgeText: { fontSize: 13, fontWeight: '700' as const },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 32, gap: 16,
  },
  profileAvatar: {
    width: 48, height: 48, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  profileName: { fontSize: 18, fontWeight: '700' as const, marginBottom: 2 },
  profileHandle: { fontSize: 14 },
  profileBadge: {
    width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: 12, fontWeight: '700' as const, textTransform: 'uppercase' as const,
    letterSpacing: 1, marginBottom: 12, marginLeft: 4,
  },
  section: {
    borderRadius: 24, marginBottom: 28, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, gap: 16,
  },
  rowIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.2 },
  rowSublabel: { fontSize: 13 },
  footerText: { textAlign: 'center', fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 20 },
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30,
  },
  modalContent: {
    width: '100%', borderRadius: 28, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 30, elevation: 10,
  },
  modalTitle: { fontSize: 22, fontWeight: '800' as const, marginBottom: 20, letterSpacing: -0.5 },
  langOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16, marginBottom: 6,
  },
  langText: { fontSize: 16, fontWeight: '600' as const },
});
