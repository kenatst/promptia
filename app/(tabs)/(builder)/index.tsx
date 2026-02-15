import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  Wand2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Copy,
  Save,
  RotateCcw,
  Sliders,
  Zap,
  MessageSquare,
  Code,
  PenTool,
  Megaphone,
  Mail,
  BarChart3,
  Palette,
  Camera,
  Film,
  Target,
  Share2,
  BookOpen,
  Search,
  Globe,
  Briefcase,
  Layout,
  Check,
  AlertTriangle,
  HelpCircle,
  Info,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import {
  CREATION_CATEGORIES,
  OBJECTIVE_CHIPS,
  STYLE_CHIPS,
  TONE_OPTIONS,
  OUTPUT_FORMATS,
  CreationCategory,
} from '@/data/gallerySeed';
import { usePromptStore } from '@/store/promptStore';
import { assemblePrompt } from '@/engine/promptEngine';
import { PromptInputs, DEFAULT_INPUTS, PromptResult } from '@/types/prompt';

const CATEGORY_ICONS: Record<string, (color: string) => React.ReactNode> = {
  chat: (c) => <MessageSquare size={20} color={c} />,
  code: (c) => <Code size={20} color={c} />,
  writing: (c) => <PenTool size={20} color={c} />,
  marketing: (c) => <Megaphone size={20} color={c} />,
  email: (c) => <Mail size={20} color={c} />,
  data: (c) => <BarChart3 size={20} color={c} />,
  image_art: (c) => <Palette size={20} color={c} />,
  photo: (c) => <Camera size={20} color={c} />,
  video: (c) => <Film size={20} color={c} />,
  logo: (c) => <Target size={20} color={c} />,
  social: (c) => <Share2 size={20} color={c} />,
  education: (c) => <BookOpen size={20} color={c} />,
  seo: (c) => <Search size={20} color={c} />,
  translate: (c) => <Globe size={20} color={c} />,
  business: (c) => <Briefcase size={20} color={c} />,
  ui_design: (c) => <Layout size={20} color={c} />,
};

type BuilderMode = 'simple' | 'advanced';
const WIZARD_STEPS = ['Category', 'Details', 'Options', 'Result'];

export default function BuilderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentInputs, setCurrentInputs, resetInputs, savePrompt } = usePromptStore();

  const [mode, setMode] = useState<BuilderMode>('simple');
  const [selectedCategoryId, setSelectedCategoryId] = useState('chat');
  const [wizardStep, setWizardStep] = useState(0);
  const [generatedResult, setGeneratedResult] = useState<PromptResult | null>(null);
  const [copied, setCopied] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const selectedCategory = useMemo(() =>
    CREATION_CATEGORIES.find(c => c.id === selectedCategoryId) || CREATION_CATEGORIES[0],
    [selectedCategoryId]
  );

  const accentColor = selectedCategory.color;
  const isImageOrVideo = selectedCategory.type === 'image' || selectedCategory.type === 'video';

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: mode === 'simple' ? 0 : 1,
      useNativeDriver: false,
      speed: 20,
      bounciness: 0,
    }).start();
  }, [mode]);

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const cat = CREATION_CATEGORIES.find(c => c.id === categoryId);
    if (cat) {
      setCurrentInputs({ model: cat.model, tone: cat.defaultTone });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [setCurrentInputs]);

  const handleGenerate = useCallback(() => {
    if (currentInputs.objective.trim().length === 0) {
      Alert.alert('Empty Prompt', 'Please describe what you want to create.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = assemblePrompt(currentInputs);
    setGeneratedResult(result);
    if (mode === 'advanced') setWizardStep(3);
  }, [currentInputs, mode]);

  const handleCopy = useCallback(async () => {
    if (!generatedResult) return;
    await Clipboard.setStringAsync(generatedResult.finalPrompt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedResult]);

  const handleSave = useCallback(() => {
    if (!generatedResult) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    savePrompt({
      title: currentInputs.objective.slice(0, 60) || 'Untitled Prompt',
      finalPrompt: generatedResult.finalPrompt,
      templatePrompt: generatedResult.templatePrompt,
      inputs: { ...currentInputs },
      model: currentInputs.model,
      type: selectedCategory.type,
      tags: currentInputs.objectiveChips.slice(0, 5),
      isFavorite: false,
    });
    Alert.alert('Saved', 'Prompt saved to your library.');
  }, [generatedResult, currentInputs, selectedCategory, savePrompt]);

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetInputs();
    setGeneratedResult(null);
    setWizardStep(0);
    setSelectedCategoryId('chat');
  }, [resetInputs]);

  const handleNextStep = useCallback(() => {
    if (wizardStep < 3) {
      if (wizardStep === 2) {
        handleGenerate();
      } else {
        setWizardStep(w => w + 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [wizardStep, handleGenerate]);

  const handlePrevStep = useCallback(() => {
    if (wizardStep > 0) {
      setWizardStep(w => w - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [wizardStep]);

  const toggleChip = useCallback((chip: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = currentInputs.objectiveChips;
    if (current.includes(chip)) {
      setCurrentInputs({ objectiveChips: current.filter(c => c !== chip) });
    } else {
      setCurrentInputs({ objectiveChips: [...current, chip] });
    }
  }, [currentInputs.objectiveChips, setCurrentInputs]);

  const renderCategoryCard = useCallback(({ item }: { item: CreationCategory }) => {
    const isSelected = selectedCategoryId === item.id;
    const iconFn = CATEGORY_ICONS[item.id];
    return (
      <Pressable
        onPress={() => handleCategorySelect(item.id)}
        style={({ pressed }) => [
          styles.catCard,
          { backgroundColor: isSelected ? `${item.color}18` : '#FFFFFF' },
          isSelected && { borderColor: item.color },
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <View style={[styles.catIconWrap, { backgroundColor: `${item.color}15` }]}>
          {iconFn ? iconFn(item.color) : <Wand2 size={20} color={item.color} />}
        </View>
        <Text style={[styles.catLabel, isSelected && { color: item.color, fontWeight: '700' as const }]}>
          {item.label}
        </Text>
      </Pressable>
    );
  }, [selectedCategoryId, handleCategorySelect]);

  const renderModeToggle = () => {
    const toggleLeft = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '50%'],
    });

    return (
      <View style={styles.modeToggleContainer}>
        <View style={styles.modeToggle}>
          <Animated.View style={[styles.modeIndicator, { left: toggleLeft }]} />
          <Pressable
            style={styles.modeBtn}
            onPress={() => { setMode('simple'); setGeneratedResult(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Zap size={14} color={mode === 'simple' ? accentColor : '#9CA3AF'} />
            <Text style={[styles.modeBtnText, mode === 'simple' && { color: '#111827' }]}>Quick</Text>
          </Pressable>
          <Pressable
            style={styles.modeBtn}
            onPress={() => { setMode('advanced'); setWizardStep(0); setGeneratedResult(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Sliders size={14} color={mode === 'advanced' ? accentColor : '#9CA3AF'} />
            <Text style={[styles.modeBtnText, mode === 'advanced' && { color: '#111827' }]}>Advanced</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderWizardProgress = () => (
    <View style={styles.wizardProgress}>
      {WIZARD_STEPS.map((step, i) => (
        <View key={step} style={styles.wizardStepRow}>
          <View style={[
            styles.wizardDot,
            i <= wizardStep && { backgroundColor: accentColor },
            i < wizardStep && { backgroundColor: Colors.tertiary },
          ]}>
            {i < wizardStep ? (
              <Check size={10} color="#FFF" />
            ) : (
              <Text style={[styles.wizardDotText, i <= wizardStep && { color: '#FFF' }]}>{i + 1}</Text>
            )}
          </View>
          <Text style={[styles.wizardStepLabel, i === wizardStep && { color: accentColor, fontWeight: '700' as const }]}>
            {step}
          </Text>
          {i < WIZARD_STEPS.length - 1 && (
            <View style={[styles.wizardLine, i < wizardStep && { backgroundColor: Colors.tertiary }]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderSimpleMode = () => (
    <>
      <View style={styles.catSection}>
        <FlatList
          data={CREATION_CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.catList}
          renderItem={renderCategoryCard}
        />
      </View>

      <View style={[styles.mainCard, { borderTopColor: accentColor }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: `${accentColor}15` }]}>
            {CATEGORY_ICONS[selectedCategoryId]
              ? CATEGORY_ICONS[selectedCategoryId](accentColor)
              : <Wand2 size={20} color={accentColor} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{selectedCategory.label}</Text>
            <Text style={styles.cardSubtitle}>Describe what you need</Text>
          </View>
        </View>

        <TextInput
          value={currentInputs.objective}
          onChangeText={(text) => setCurrentInputs({ objective: text })}
          placeholder="Describe your idea in detail..."
          placeholderTextColor="#B0B5BE"
          multiline
          style={styles.mainInput}
          textAlignVertical="top"
        />

        {(isImageOrVideo ? STYLE_CHIPS : OBJECTIVE_CHIPS).length > 0 && (
          <View style={styles.quickChips}>
            <Text style={styles.quickChipsLabel}>Quick tags</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChipsList}>
              {(isImageOrVideo ? STYLE_CHIPS : OBJECTIVE_CHIPS).slice(0, 10).map((chip) => {
                const isSelected = currentInputs.objectiveChips.includes(chip);
                return (
                  <Pressable
                    key={chip}
                    onPress={() => toggleChip(chip)}
                    style={[
                      styles.quickChip,
                      isSelected && { backgroundColor: `${accentColor}15`, borderColor: accentColor },
                    ]}
                  >
                    <Text style={[styles.quickChipText, isSelected && { color: accentColor, fontWeight: '700' as const }]}>
                      {chip}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <Pressable
          onPress={handleGenerate}
          style={({ pressed }) => [styles.generateBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        >
          <LinearGradient
            colors={[accentColor, '#111827']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateGradient}
          >
            <Wand2 size={18} color="#FFF" />
            <Text style={styles.generateBtnText}>Generate Prompt</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {generatedResult && renderResult()}
    </>
  );

  const renderAdvancedStep0 = () => (
    <>
      <Text style={styles.stepTitle}>What are you creating?</Text>
      <Text style={styles.stepSubtitle}>Choose a category to get started</Text>
      <View style={styles.categoryGrid}>
        {CREATION_CATEGORIES.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const iconFn = CATEGORY_ICONS[cat.id];
          return (
            <Pressable
              key={cat.id}
              onPress={() => handleCategorySelect(cat.id)}
              style={[
                styles.gridItem,
                isSelected && { backgroundColor: `${cat.color}15`, borderColor: cat.color },
              ]}
            >
              <View style={[styles.gridItemIcon, { backgroundColor: `${cat.color}12` }]}>
                {iconFn ? iconFn(cat.color) : <Wand2 size={20} color={cat.color} />}
              </View>
              <Text style={[styles.gridItemLabel, isSelected && { color: cat.color, fontWeight: '700' as const }]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );

  const renderAdvancedStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Describe your prompt</Text>
      <Text style={styles.stepSubtitle}>Be as specific as possible for better results</Text>

      <View style={styles.wizardInputCard}>
        <TextInput
          value={currentInputs.objective}
          onChangeText={(text) => setCurrentInputs({ objective: text })}
          placeholder="What do you want to achieve?"
          placeholderTextColor="#B0B5BE"
          multiline
          style={styles.wizardInput}
          textAlignVertical="top"
        />
      </View>

      <Text style={styles.chipSectionTitle}>Quick Tags</Text>
      <View style={styles.chipWrap}>
        {(isImageOrVideo ? STYLE_CHIPS : OBJECTIVE_CHIPS).slice(0, 12).map((chip) => {
          const isSelected = currentInputs.objectiveChips.includes(chip);
          return (
            <Pressable
              key={chip}
              onPress={() => toggleChip(chip)}
              style={[styles.chip, isSelected && { backgroundColor: `${accentColor}15`, borderColor: accentColor }]}
            >
              <Text style={[styles.chipText, isSelected && { color: accentColor, fontWeight: '700' as const }]}>
                {chip}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isImageOrVideo && (
        <>
          <Text style={styles.chipSectionTitle}>Style</Text>
          <View style={styles.fieldCard}>
            <TextInput
              value={currentInputs.style || ''}
              onChangeText={(text) => setCurrentInputs({ style: text })}
              placeholder="e.g. Photorealistic, Anime, Oil Painting..."
              placeholderTextColor="#B0B5BE"
              style={styles.fieldInput}
            />
          </View>
        </>
      )}
    </>
  );

  const renderAdvancedStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Fine-tune options</Text>
      <Text style={styles.stepSubtitle}>Customize tone, length, and more</Text>

      {!isImageOrVideo && (
        <>
          <Text style={styles.chipSectionTitle}>Tone</Text>
          <View style={styles.chipWrap}>
            {TONE_OPTIONS.map((opt) => {
              const isSelected = currentInputs.tone === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => { setCurrentInputs({ tone: opt.value as any }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.chip, isSelected && { backgroundColor: `${accentColor}15`, borderColor: accentColor }]}
                >
                  <Text style={[styles.chipText, isSelected && { color: accentColor, fontWeight: '700' as const }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.chipSectionTitle}>Length</Text>
          <View style={styles.chipWrap}>
            {(['concise', 'medium', 'detailed', 'exhaustive'] as const).map((len) => {
              const isSelected = currentInputs.length === len;
              return (
                <Pressable
                  key={len}
                  onPress={() => { setCurrentInputs({ length: len }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.chip, isSelected && { backgroundColor: `${accentColor}15`, borderColor: accentColor }]}
                >
                  <Text style={[styles.chipText, isSelected && { color: accentColor, fontWeight: '700' as const }]}>
                    {len.charAt(0).toUpperCase() + len.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.chipSectionTitle}>Output Format</Text>
          <View style={styles.chipWrap}>
            {OUTPUT_FORMATS.map((fmt) => {
              const isSelected = currentInputs.outputFormat === fmt.toLowerCase();
              return (
                <Pressable
                  key={fmt}
                  onPress={() => { setCurrentInputs({ outputFormat: fmt.toLowerCase() }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.chip, isSelected && { backgroundColor: `${accentColor}15`, borderColor: accentColor }]}
                >
                  <Text style={[styles.chipText, isSelected && { color: accentColor, fontWeight: '700' as const }]}>
                    {fmt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {isImageOrVideo && (
        <>
          <Text style={styles.chipSectionTitle}>Lighting</Text>
          <View style={styles.fieldCard}>
            <TextInput
              value={currentInputs.lighting || ''}
              onChangeText={(text) => setCurrentInputs({ lighting: text })}
              placeholder="e.g. Golden hour, Studio, Neon..."
              placeholderTextColor="#B0B5BE"
              style={styles.fieldInput}
            />
          </View>

          <Text style={styles.chipSectionTitle}>Camera Angle</Text>
          <View style={styles.fieldCard}>
            <TextInput
              value={currentInputs.cameraAngle || ''}
              onChangeText={(text) => setCurrentInputs({ cameraAngle: text })}
              placeholder="e.g. Close-up, Wide angle, Bird's eye..."
              placeholderTextColor="#B0B5BE"
              style={styles.fieldInput}
            />
          </View>

          <Text style={styles.chipSectionTitle}>Negative Prompt</Text>
          <View style={styles.fieldCard}>
            <TextInput
              value={currentInputs.negativePrompt || ''}
              onChangeText={(text) => setCurrentInputs({ negativePrompt: text })}
              placeholder="What to exclude..."
              placeholderTextColor="#B0B5BE"
              style={styles.fieldInput}
            />
          </View>
        </>
      )}

      <Text style={styles.chipSectionTitle}>Audience</Text>
      <View style={styles.fieldCard}>
        <TextInput
          value={currentInputs.audience}
          onChangeText={(text) => setCurrentInputs({ audience: text })}
          placeholder="Who is this for?"
          placeholderTextColor="#B0B5BE"
          style={styles.fieldInput}
        />
      </View>

      <Text style={styles.chipSectionTitle}>Constraints</Text>
      <View style={styles.fieldCard}>
        <TextInput
          value={currentInputs.constraints}
          onChangeText={(text) => setCurrentInputs({ constraints: text })}
          placeholder="Any specific rules or limitations..."
          placeholderTextColor="#B0B5BE"
          multiline
          style={[styles.fieldInput, { minHeight: 60 }]}
          textAlignVertical="top"
        />
      </View>
    </>
  );

  const renderResult = () => {
    if (!generatedResult) return null;
    const { metadata } = generatedResult;

    return (
      <View style={styles.resultSection}>
        <View style={styles.resultHeader}>
          <View style={styles.resultTitleRow}>
            <View style={[styles.resultDot, { backgroundColor: accentColor }]} />
            <Text style={styles.resultTitle}>Generated Prompt</Text>
          </View>
          <View style={styles.resultActions}>
            <Pressable
              onPress={handleCopy}
              style={[styles.resultActionBtn, copied && { backgroundColor: Colors.tertiaryDim }]}
            >
              {copied ? <Check size={16} color={Colors.tertiary} /> : <Copy size={16} color="#6B7280" />}
            </Pressable>
            <Pressable onPress={handleSave} style={styles.resultActionBtn}>
              <Save size={16} color="#6B7280" />
            </Pressable>
            <Pressable onPress={handleReset} style={styles.resultActionBtn}>
              <RotateCcw size={16} color="#6B7280" />
            </Pressable>
          </View>
        </View>

        <View style={[styles.resultCard, { borderLeftColor: accentColor }]}>
          <Text style={styles.resultPromptText} selectable>
            {generatedResult.finalPrompt}
          </Text>
        </View>

        {metadata.assumptions.length > 0 && (
          <View style={[styles.metaBlock, { backgroundColor: `${Colors.blue}08` }]}>
            <View style={styles.metaHeader}>
              <Info size={14} color={Colors.blue} />
              <Text style={[styles.metaTitle, { color: Colors.blue }]}>Assumptions</Text>
            </View>
            {metadata.assumptions.map((a, i) => (
              <Text key={i} style={styles.metaItem}>{a}</Text>
            ))}
          </View>
        )}

        {metadata.warnings.length > 0 && (
          <View style={[styles.metaBlock, { backgroundColor: `${Colors.accent}08` }]}>
            <View style={styles.metaHeader}>
              <AlertTriangle size={14} color={Colors.accent} />
              <Text style={[styles.metaTitle, { color: Colors.accent }]}>Warnings</Text>
            </View>
            {metadata.warnings.map((w, i) => (
              <Text key={i} style={styles.metaItem}>{w}</Text>
            ))}
          </View>
        )}

        {metadata.questions.length > 0 && (
          <View style={[styles.metaBlock, { backgroundColor: `${Colors.secondary}08` }]}>
            <View style={styles.metaHeader}>
              <HelpCircle size={14} color={Colors.secondary} />
              <Text style={[styles.metaTitle, { color: Colors.secondary }]}>Suggestions</Text>
            </View>
            {metadata.questions.map((q, i) => (
              <Text key={i} style={styles.metaItem}>{q}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderAdvancedMode = () => (
    <>
      {renderWizardProgress()}
      <View style={styles.wizardContent}>
        {wizardStep === 0 && renderAdvancedStep0()}
        {wizardStep === 1 && renderAdvancedStep1()}
        {wizardStep === 2 && renderAdvancedStep2()}
        {wizardStep === 3 && renderResult()}
      </View>

      <View style={styles.wizardNav}>
        {wizardStep > 0 && wizardStep < 3 && (
          <Pressable onPress={handlePrevStep} style={styles.wizardNavBack}>
            <ChevronLeft size={18} color="#111827" />
            <Text style={styles.wizardNavBackText}>Back</Text>
          </Pressable>
        )}
        {wizardStep === 3 && (
          <Pressable onPress={handleReset} style={styles.wizardNavBack}>
            <RotateCcw size={16} color="#111827" />
            <Text style={styles.wizardNavBackText}>New Prompt</Text>
          </Pressable>
        )}
        {wizardStep < 3 && (
          <Pressable
            onPress={handleNextStep}
            style={[styles.wizardNavNext, wizardStep === 0 ? { flex: 1 } : {}]}
          >
            <LinearGradient
              colors={[accentColor, '#111827']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.wizardNavNextGradient}
            >
              <Text style={styles.wizardNavNextText}>
                {wizardStep === 2 ? 'Generate' : 'Next'}
              </Text>
              {wizardStep === 2 ? <Wand2 size={18} color="#FFF" /> : <ChevronRight size={18} color="#FFF" />}
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FAFAFA', '#FFF8EE', '#FEF5F0']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: 140 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create</Text>
            <View style={styles.proBadge}>
              <Sparkles size={13} color="#D97706" />
              <Text style={styles.proBadgeText}>Pro</Text>
            </View>
          </View>

          {renderModeToggle()}

          {mode === 'simple' ? renderSimpleMode() : renderAdvancedMode()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#111827',
    letterSpacing: -0.8,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.15)',
  },
  proBadgeText: {
    color: '#D97706',
    fontWeight: '700' as const,
    fontSize: 12,
  },
  modeToggleContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 4,
    position: 'relative',
    width: 240,
  },
  modeIndicator: {
    position: 'absolute',
    top: 4,
    width: '50%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    zIndex: 1,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#9CA3AF',
  },
  catSection: {
    marginHorizontal: -20,
    marginBottom: 24,
  },
  catList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  catCard: {
    width: 82,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  catIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  mainInput: {
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    marginBottom: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  quickChips: {
    marginBottom: 20,
  },
  quickChipsLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  quickChipsList: {
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  generateBtn: {
    borderRadius: 26,
    overflow: 'hidden',
  },
  generateGradient: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  wizardProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  wizardStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wizardDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardDotText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#9CA3AF',
  },
  wizardStepLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500' as const,
    marginLeft: 4,
  },
  wizardLine: {
    width: 20,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
  },
  wizardContent: {
    minHeight: 300,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#111827',
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '30%',
    flexGrow: 1,
    flexBasis: '30%',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  gridItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItemLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  wizardInputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  wizardInput: {
    fontSize: 16,
    color: '#1F2937',
    minHeight: 80,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  chipSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#374151',
    marginBottom: 10,
    marginTop: 16,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  fieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    marginBottom: 4,
  },
  fieldInput: {
    fontSize: 15,
    color: '#1F2937',
    padding: 14,
    minHeight: 44,
  },
  wizardNav: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  wizardNavBack: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
  },
  wizardNavBackText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  wizardNavNext: {
    flex: 1,
    borderRadius: 26,
    overflow: 'hidden',
  },
  wizardNavNextGradient: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  wizardNavNextText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  resultSection: {
    gap: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#111827',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resultActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  resultPromptText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 22,
  },
  metaBlock: {
    gap: 6,
    borderRadius: 16,
    padding: 14,
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  metaItem: {
    fontSize: 13,
    color: '#6B7280',
    paddingLeft: 20,
    lineHeight: 20,
  },
});
