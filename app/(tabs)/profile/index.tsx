import React, { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
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
  Bell,
  ChevronRight,
  ExternalLink,
  FileText,
  HelpCircle,
  Info,
  Mail,
  Moon,
  Shield,
  Star,
  Trash2,
  Wand2,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { usePromptStore } from '@/store/promptStore';

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
}

function SettingsRow({ icon, label, sublabel, onPress, trailing, danger, isLast }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !trailing}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress && styles.rowPressed,
        !isLast && styles.rowBorder,
      ]}
    >
      <View style={[styles.rowIcon, danger && { backgroundColor: Colors.dangerDim }]}>
        {icon}
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && { color: Colors.danger }]}>{label}</Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      {trailing || (onPress && <ChevronRight size={18} color="#C7C9CE" />)}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { savedPrompts } = usePromptStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const openURL = useCallback(async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Linking.openURL(url);
    }
  }, []);

  const handleContactSupport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Promptia Support`);
  }, []);

  const handleRateApp = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/app/id0000000000?action=write-review');
    } else if (Platform.OS === 'android') {
      Linking.openURL('https://play.google.com/store/apps/details?id=com.promptia.app');
    } else {
      Alert.alert('Rate Us', 'Thank you for your interest! Rating is available on mobile devices.');
    }
  }, []);

  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      `This will permanently delete all ${savedPrompts.length} saved prompts. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            savedPrompts.forEach((p) => {
              usePromptStore.getState().deletePrompt(p.id);
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  }, [savedPrompts]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F8F9FB', '#F2F0F5']} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Settings</Text>

        <View style={styles.appHeader}>
          <LinearGradient
            colors={['#1E1B2E', '#2D2545']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.appIconWrap}
          >
            <Wand2 size={28} color="#F59E0B" />
          </LinearGradient>
          <View>
            <Text style={styles.appName}>Promptia</Text>
            <Text style={styles.appVersion}>Version {APP_VERSION}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.section}>
          <SettingsRow
            icon={<Bell size={18} color={Colors.blue} />}
            label="Notifications"
            sublabel="Get notified about new prompts"
            trailing={
              <Switch
                value={notificationsEnabled}
                onValueChange={(val) => {
                  setNotificationsEnabled(val);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{ false: '#E5E7EB', true: Colors.blue }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingsRow
            icon={<Moon size={18} color={Colors.secondary} />}
            label="Dark Mode"
            sublabel="Coming soon"
            trailing={
              <Switch
                value={darkMode}
                onValueChange={(val) => {
                  setDarkMode(val);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{ false: '#E5E7EB', true: Colors.secondary }}
                thumbColor="#FFFFFF"
                disabled
              />
            }
            isLast
          />
        </View>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.section}>
          <SettingsRow
            icon={<Mail size={18} color={Colors.teal} />}
            label="Contact Support"
            sublabel={SUPPORT_EMAIL}
            onPress={handleContactSupport}
          />
          <SettingsRow
            icon={<Star size={18} color={Colors.accent} />}
            label="Rate the App"
            sublabel="Help us improve"
            onPress={handleRateApp}
          />
          <SettingsRow
            icon={<HelpCircle size={18} color={Colors.cyan} />}
            label="FAQ & Help Center"
            onPress={() => openURL('https://example.com/help')}
            isLast
          />
        </View>

        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.section}>
          <SettingsRow
            icon={<Shield size={18} color={Colors.tertiary} />}
            label="Privacy Policy"
            onPress={() => openURL(PRIVACY_POLICY_URL)}
            trailing={<ExternalLink size={16} color="#C7C9CE" />}
          />
          <SettingsRow
            icon={<FileText size={18} color={Colors.blue} />}
            label="Terms of Use"
            onPress={() => openURL(TERMS_OF_USE_URL)}
            trailing={<ExternalLink size={16} color="#C7C9CE" />}
          />
          <SettingsRow
            icon={<Info size={18} color={Colors.secondary} />}
            label="Licenses"
            sublabel="Open source acknowledgements"
            onPress={() => openURL('https://example.com/licenses')}
            trailing={<ExternalLink size={16} color="#C7C9CE" />}
            isLast
          />
        </View>

        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.section}>
          <SettingsRow
            icon={<Info size={18} color={Colors.textSecondary} />}
            label="Saved Prompts"
            sublabel={`${savedPrompts.length} prompt${savedPrompts.length !== 1 ? 's' : ''} stored locally`}
            isLast={savedPrompts.length === 0}
          />
          {savedPrompts.length > 0 && (
            <SettingsRow
              icon={<Trash2 size={18} color={Colors.danger} />}
              label="Clear All Data"
              sublabel="Delete all saved prompts"
              onPress={handleClearData}
              danger
              isLast
            />
          )}
        </View>

        <Text style={styles.footerText}>
          Made with care for prompt engineers.{'\n'}
          All data is stored locally on your device.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#111827',
    letterSpacing: -0.8,
    marginBottom: 24,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  appIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#111827',
  },
  appVersion: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#9CA3AF',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  rowPressed: {
    backgroundColor: '#F9FAFB',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  rowSublabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#C7C9CE',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 20,
  },
});
