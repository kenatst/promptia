import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Share,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@tanstack/react-query';
import {
  ImagePlus,
  Camera,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Zap,
  ChevronDown,
  Save,
  Share2,
} from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { usePromptStore } from '@/contexts/PromptContext';
import { reversePromptFromImage, isGeminiConfigured } from '@/services/gemini';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/components/Toast';

function ReverseContent() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, t } = useTheme();
  const { savePrompt } = usePromptStore();
  const toast = useToast();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const animateResult = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!imageBase64) throw new Error('No image selected');
      return reversePromptFromImage(imageBase64, imageMime);
    },
    onSuccess: (result) => {
      setGeneratedPrompt(result);
      animateResult();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Analysis failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const pickImage = useCallback(async (fromCamera: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let result: ImagePicker.ImagePickerResult;

      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera access is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          base64: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          base64: true,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 || null);
        setImageMime(asset.mimeType || 'image/jpeg');
        setGeneratedPrompt('');
        setCopied(false);
        setSaved(false);
      }
    } catch (e) {
      console.log('[Reverse] Image pick error:', e);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!imageBase64) return;
    if (!isGeminiConfigured()) {
      Alert.alert('API Key Missing', 'Gemini API key is not configured.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    startPulse();
    analyzeMutation.mutate();
  }, [imageBase64, analyzeMutation, startPulse]);

  const handleCopy = useCallback(async () => {
    if (!generatedPrompt) return;
    await Clipboard.setStringAsync(generatedPrompt);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [generatedPrompt, toast]);

  const handleShare = useCallback(async () => {
    if (!generatedPrompt) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({ message: generatedPrompt, title: 'Reverse Prompt from Promptia' });
    } catch {
      // User cancelled
    }
  }, [generatedPrompt]);

  const handleSave = useCallback(() => {
    if (!generatedPrompt) return;
    savePrompt({
      title: 'Reverse Prompt',
      finalPrompt: generatedPrompt,
      templatePrompt: generatedPrompt,
      inputs: {
        objective: 'Reverse engineered from image',
        objectiveChips: [],
        model: 'midjourney',
        outputFormat: 'text',
        tone: 'creative',
        audience: '',
        language: 'English',
        constraints: '',
        length: 'detailed',
        variables: [],
      },
      model: 'midjourney',
      type: 'image',
      tags: ['reverse', 'image-to-prompt'],
      isFavorite: false,
    });
    setSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Saved to Library!');
    setTimeout(() => setSaved(false), 2000);
  }, [generatedPrompt, savePrompt, toast]);

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImageUri(null);
    setImageBase64(null);
    setGeneratedPrompt('');
    setCopied(false);
    setSaved(false);
  }, []);

  const isAnalyzing = analyzeMutation.isPending;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(74, 143, 231, 0.15)' : '#EBF3FE' }]}>
            <Zap size={20} color="#4A8FE7" fill="#4A8FE7" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t.reverse?.title || 'Reverse Prompt'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t.reverse?.subtitle || 'Upload an image and AI will reverse-engineer the perfect prompt to recreate it'}
          </Text>
        </View>

        {!imageUri ? (
          <View style={styles.uploadSection}>
            <Pressable
              onPress={() => pickImage(false)}
              style={({ pressed }) => [
                styles.uploadCard,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: isDark ? colors.cardBorder : 'rgba(74, 143, 231, 0.2)',
                },
                pressed && styles.uploadCardPressed,
              ]}
            >
              <View style={[styles.uploadIconWrap, { backgroundColor: isDark ? 'rgba(74, 143, 231, 0.12)' : '#EBF3FE' }]}>
                <ImagePlus size={32} color="#4A8FE7" />
              </View>
              <Text style={[styles.uploadTitle, { color: colors.text }]}>
                {t.reverse?.pickImage || 'Choose from Library'}
              </Text>
              <Text style={[styles.uploadDesc, { color: colors.textTertiary }]}>
                {t.reverse?.pickDesc || 'Select any image from your photo library'}
              </Text>
            </Pressable>

            {Platform.OS !== 'web' && (
              <Pressable
                onPress={() => pickImage(true)}
                style={({ pressed }) => [
                  styles.cameraCard,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: isDark ? colors.cardBorder : 'rgba(52, 167, 123, 0.2)',
                  },
                  pressed && styles.uploadCardPressed,
                ]}
              >
                <Camera size={20} color="#34A77B" />
                <Text style={[styles.cameraText, { color: colors.text }]}>
                  {t.reverse?.takePhoto || 'Take a Photo'}
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.imageSection}>
            <View style={[styles.imageCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                contentFit="cover"
                transition={300}
              />
              <View style={styles.imageOverlay}>
                <Pressable
                  onPress={handleReset}
                  style={[styles.resetBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                >
                  <RotateCcw size={16} color="#FFF" />
                  <Text style={styles.resetText}>{t.reverse?.changeImage || 'Change'}</Text>
                </Pressable>
              </View>
            </View>

            {!generatedPrompt && !isAnalyzing && (
              <Pressable
                onPress={handleAnalyze}
                style={({ pressed }) => [
                  styles.analyzeBtn,
                  pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
                ]}
              >
                <Sparkles size={18} color="#FFF" />
                <Text style={styles.analyzeBtnText}>
                  {t.reverse?.analyze || 'Analyze Image'}
                </Text>
              </Pressable>
            )}

            {isAnalyzing && (
              <Animated.View style={[styles.loadingCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', transform: [{ scale: pulseAnim }] }]}>
                <ActivityIndicator size="small" color="#4A8FE7" />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  {t.reverse?.analyzing || 'Analyzing your image...'}
                </Text>
                <Text style={[styles.loadingSubtext, { color: colors.textTertiary }]}>
                  {t.reverse?.analyzingSub || 'AI is studying every detail'}
                </Text>
              </Animated.View>
            )}

            {generatedPrompt.length > 0 && (
              <Animated.View
                style={[
                  styles.resultSection,
                  { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
              >
                <View style={styles.resultHeader}>
                  <View style={[styles.resultBadge, { backgroundColor: isDark ? 'rgba(52, 167, 123, 0.15)' : '#E8F8F0' }]}>
                    <Check size={14} color="#34A77B" />
                  </View>
                  <Text style={[styles.resultTitle, { color: colors.text }]}>
                    {t.reverse?.resultTitle || 'Reconstructed Prompt'}
                  </Text>
                </View>

                <View style={[styles.promptBox, { backgroundColor: isDark ? colors.bgSecondary : '#F8F6F4' }]}>
                  <Text style={[styles.promptText, { color: colors.text }]} selectable>
                    {generatedPrompt}
                  </Text>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={handleCopy}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? colors.cardBorder : '#E8E4E0' },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    {copied ? <Check size={16} color="#34A77B" /> : <Copy size={16} color={colors.textSecondary} />}
                    <Text style={[styles.actionBtnText, { color: copied ? '#34A77B' : colors.text }]}>
                      {copied ? (t.create?.copied || 'Copied!') : (t.reverse?.copy || 'Copy')}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSave}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? colors.cardBorder : '#E8E4E0' },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    {saved ? <Check size={16} color="#34A77B" /> : <Save size={16} color={colors.textSecondary} />}
                    <Text style={[styles.actionBtnText, { color: saved ? '#34A77B' : colors.text }]}>
                      {saved ? (t.create?.saved || 'Saved') : (t.reverse?.save || 'Save')}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleShare}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? colors.cardBorder : '#E8E4E0' },
                      pressed && { opacity: 0.8 },
                    ]}
                    accessibilityLabel="Share prompt"
                  >
                    <Share2 size={16} color={colors.textSecondary} />
                    <Text style={[styles.actionBtnText, { color: colors.text }]}>Share</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleAnalyze}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? colors.cardBorder : '#E8E4E0' },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <RotateCcw size={16} color={colors.textSecondary} />
                    <Text style={[styles.actionBtnText, { color: colors.text }]}>
                      {t.reverse?.retry || 'Retry'}
                    </Text>
                  </Pressable>
                </View>

                <View style={[styles.tipCard, { backgroundColor: isDark ? 'rgba(212, 148, 58, 0.1)' : '#FFF9EE' }]}>
                  <ChevronDown size={14} color="#D4943A" />
                  <Text style={[styles.tipText, { color: isDark ? '#D4943A' : '#8B6B3A' }]}>
                    {t.reverse?.tip || 'Tip: Paste this prompt into Midjourney, DALL-E, or Stable Diffusion to recreate similar results'}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default function ReverseScreen() {
  return (
    <ErrorBoundary fallbackTitle="Reverse Prompt Error">
      <ReverseContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24 },
  header: { marginBottom: 28, alignItems: 'center' },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center' as const,
    maxWidth: 300,
  },
  uploadSection: { gap: 12 },
  uploadCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
  },
  uploadCardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  uploadIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  uploadDesc: {
    fontSize: 14,
    textAlign: 'center' as const,
  },
  cameraCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    borderWidth: 1,
  },
  cameraText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  imageSection: { gap: 16 },
  imageCard: {
    borderRadius: 24,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  previewImage: {
    width: '100%',
    height: 260,
    borderRadius: 24,
  },
  imageOverlay: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
  },
  resetBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resetText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  analyzeBtn: {
    backgroundColor: '#4A8FE7',
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    shadowColor: '#4A8FE7',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  analyzeBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  loadingCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center' as const,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  loadingSubtext: {
    fontSize: 13,
  },
  resultSection: { gap: 14 },
  resultHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  resultBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  promptBox: {
    borderRadius: 18,
    padding: 18,
  },
  promptText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  actionsRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  tipCard: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    padding: 14,
    borderRadius: 14,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});
