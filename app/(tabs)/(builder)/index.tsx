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
} from '@/data/gallerySeed';
import { usePromptStore } from '@/store/promptStore';
import { assemblePrompt } from '@/engine/promptEngine';
import { PromptInputs, DEFAULT_INPUTS, PromptResult } from '@/types/prompt';
import { VisualCategory } from '@/components/VisualCategory';
import { GlassCard } from '@/components/GlassCard';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  chat: <MessageSquare size={22} color="#6B7280" />,
  code: <Code size={22} color="#6B7280" />,
  writing: <PenTool size={22} color="#6B7280" />,
  marketing: <Megaphone size={22} color="#6B7280" />,
  email: <Mail size={22} color="#6B7280" />,
  data: <BarChart3 size={22} color="#6B7280" />,
  image_art: <Palette size={22} color="#6B7280" />,
  photo: <Camera size={22} color="#6B7280" />,
  video: <Film size={22} color="#6B7280" />,
  logo: <Target size={22} color="#6B7280" />,
  social: <Share2 size={22} color="#6B7280" />,
  education: <BookOpen size={22} color="#6B7280" />,
  seo: <Search size={22} color="#6B7280" />,
  translate: <Globe size={22} color="#6B7280" />,
  business: <Briefcase size={22} color="#6B7280" />,
  ui_design: <Layout size={22} color="#6B7280" />,
};

type BuilderMode = 'simple' | 'advanced';

const WIZARD_STEPS = ['Category', 'Details', 'Options', 'Result'];

export default function BuilderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    currentInputs,
    setCurrentInputs,
    resetInputs,
    savePrompt,
  } = usePromptStore();

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
      setCurrentInputs({
        model: cat.model,
        tone: cat.defaultTone,
      });
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
    if (mode === 'advanced') {
      setWizardStep(3);
    }
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

  const renderModeToggle = () => {
    const toggleBg = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '50%'],
    });

    return (
      <View style={styles.modeToggleContainer}>
        <View style={styles.modeToggle}>
          <Animated.View
            style={[
              styles.modeToggleIndicator,
              { left: toggleBg },
            ]}
          />
          <Pressable
            style={styles.modeToggleBtn}
            onPress={() => {
              setMode('simple');
              setGeneratedResult(null);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Zap size={14} color={mode === 'simple' ? '#111827' : '#9CA3AF'} />
            <Text style={[styles.modeToggleText, mode === 'simple' && styles.modeToggleTextActive]}>
              Quick
            </Text>
          </Pressable>
          <Pressable
            style={styles.modeToggleBtn}
            onPress={() => {
              setMode('advanced');
              setWizardStep(0);
              setGeneratedResult(null);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Sliders size={14} color={mode === 'advanced' ? '#111827' : '#9CA3AF'} />
            <Text style={[styles.modeToggleText, mode === 'advanced' && styles.modeToggleTextActive]}>
              Advanced
            </Text>
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
            i <= wizardStep && { backgroundColor: '#111827' },
            i < wizardStep && { backgroundColor: Colors.tertiary },
          ]}>
            {i < wizardStep ? (
              <Check size={10} color="#FFF" />
            ) : (
              <Text style={[styles.wizardDotText, i <= wizardStep && { color: '#FFF' }]}>{i + 1}</Text>
            )}
          </View>
          <Text style={[styles.wizardStepLabel, i === wizardStep && styles.wizardStepLabelActive]}>
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
      <View style={styles.categorySection}>
        <FlatList
          data={CREATION_CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item, index }) => (
            <VisualCategory
              label={item.label}
              icon={CATEGORY_ICONS[item.id]}
              selected={selectedCategoryId === item.id}
              onPress={() => handleCategorySelect(item.id)}
              index={index}
            />
          )}
        />
      </View>

      <GlassCard variant="input-container" style={styles.mainInputCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: `${selectedCategory.color}15` }]}>
            <Wand2 size={22} color={selectedCategory.color} />
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
          placeholderTextColor="#9CA3AF"
          multiline
          style={styles.input}
          textAlignVertical="top"
        />

        <Pressable
          onPress={handleGenerate}
          style={({ pressed }) => [styles.generateBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        >
          <Wand2 size={18} color="#FFF" />
          <Text style={styles.generateBtnText}>Generate Prompt</Text>
        </Pressable>
      </GlassCard>

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
          return (
            <Pressable
              key={cat.id}
              onPress={() => handleCategorySelect(cat.id)}
              style={[
                styles.categoryGridItem,
                isSelected && { backgroundColor: `${cat.color}15`, borderColor: cat.color },
              ]}
            >
              <View style={[styles.categoryGridIcon, { backgroundColor: `${cat.color}12` }]}>
                {CATEGORY_ICONS[cat.id]}
              </View>
              <Text style={[styles.categoryGridLabel, isSelected && { color: '#111827', fontWeight: '700' as const }]}>
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

      <GlassCard variant="input-container" style={styles.wizardCard}>
        <TextInput
          value={currentInputs.objective}
          onChangeText={(text) => setCurrentInputs({ objective: text })}
          placeholder="What do you want to achieve?"
          placeholderTextColor="#9CA3AF"
          multiline
          style={styles.wizardInput}
          textAlignVertical="top"
        />
      </GlassCard>

      <Text style={styles.chipSectionTitle}>Quick Tags</Text>
      <View style={styles.chipWrap}>
        {(isImageOrVideo ? STYLE_CHIPS : OBJECTIVE_CHIPS).slice(0, 12).map((chip) => {
          const isSelected = currentInputs.objectiveChips.includes(chip);
          return (
            <Pressable
              key={chip}
              onPress={() => toggleChip(chip)}
              style={[styles.chip, isSelected && { backgroundColor: `${selectedCategory.color}18`, borderColor: selectedCategory.color }]}
            >
              <Text style={[styles.chipText, isSelected && { color: selectedCategory.color, fontWeight: '700' as const }]}>
                {chip}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isImageOrVideo && (
        <>
          <Text style={styles.chipSectionTitle}>Style</Text>
          <GlassCard variant="3d-light" style={styles.optionCard}>
            <TextInput
              value={currentInputs.style || ''}
              onChangeText={(text) => setCurrentInputs({ style: text })}
              placeholder="e.g. Photorealistic, Anime, Oil Painting..."
              placeholderTextColor="#9CA3AF"
              style={styles.optionInput}
            />
          </GlassCard>
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
                  onPress={() => {
                    setCurrentInputs({ tone: opt.value as any });
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[styles.chip, isSelected && { backgroundColor: `${selectedCategory.color}18`, borderColor: selectedCategory.color }]}
                >
                  <Text style={[styles.chipText, isSelected && { color: selectedCategory.color, fontWeight: '700' as const }]}>
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
                  onPress={() => {
                    setCurrentInputs({ length: len });
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[styles.chip, isSelected && { backgroundColor: `${selectedCategory.color}18`, borderColor: selectedCategory.color }]}
                >
                  <Text style={[styles.chipText, isSelected && { color: selectedCategory.color, fontWeight: '700' as const }]}>
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
                  onPress={() => {
                    setCurrentInputs({ outputFormat: fmt.toLowerCase() });
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[styles.chip, isSelected && { backgroundColor: `${selectedCategory.color}18`, borderColor: selectedCategory.color }]}
                >
                  <Text style={[styles.chipText, isSelected && { color: selectedCategory.color, fontWeight: '700' as const }]}>
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
          <GlassCard variant="3d-light" style={styles.optionCard}>
            <TextInput
              value={currentInputs.lighting || ''}
              onChangeText={(text) => setCurrentInputs({ lighting: text })}
              placeholder="e.g. Golden hour, Studio, Neon..."
              placeholderTextColor="#9CA3AF"
              style={styles.optionInput}
            />
          </GlassCard>

          <Text style={styles.chipSectionTitle}>Camera Angle</Text>
          <GlassCard variant="3d-light" style={styles.optionCard}>
            <TextInput
              value={currentInputs.cameraAngle || ''}
              onChangeText={(text) => setCurrentInputs({ cameraAngle: text })}
              placeholder="e.g. Close-up, Wide angle, Bird's eye..."
              placeholderTextColor="#9CA3AF"
              style={styles.optionInput}
            />
          </GlassCard>

          <Text style={styles.chipSectionTitle}>Negative Prompt</Text>
          <GlassCard variant="3d-light" style={styles.optionCard}>
            <TextInput
              value={currentInputs.negativePrompt || ''}
              onChangeText={(text) => setCurrentInputs({ negativePrompt: text })}
              placeholder="What to exclude..."
              placeholderTextColor="#9CA3AF"
              style={styles.optionInput}
            />
          </GlassCard>
        </>
      )}

      <Text style={styles.chipSectionTitle}>Audience</Text>
      <GlassCard variant="3d-light" style={styles.optionCard}>
        <TextInput
          value={currentInputs.audience}
          onChangeText={(text) => setCurrentInputs({ audience: text })}
          placeholder="Who is this for?"
          placeholderTextColor="#9CA3AF"
          style={styles.optionInput}
        />
      </GlassCard>

      <Text style={styles.chipSectionTitle}>Constraints</Text>
      <GlassCard variant="3d-light" style={styles.optionCard}>
        <TextInput
          value={currentInputs.constraints}
          onChangeText={(text) => setCurrentInputs({ constraints: text })}
          placeholder="Any specific rules or limitations..."
          placeholderTextColor="#9CA3AF"
          multiline
          style={[styles.optionInput, { minHeight: 60 }]}
          textAlignVertical="top"
        />
      </GlassCard>
    </>
  );

  const renderResult = () => {
    if (!generatedResult) return null;
    const { metadata } = generatedResult;

    return (
      <View style={styles.resultSection}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>Generated Prompt</Text>
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

        <GlassCard variant="3d-light" style={styles.resultCard}>
          <Text style={styles.resultPromptText} selectable>
            {generatedResult.finalPrompt}
          </Text>
        </GlassCard>

        {metadata.assumptions.length > 0 && (
          <View style={styles.metaBlock}>
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
          <View style={styles.metaBlock}>
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
          <View style={styles.metaBlock}>
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
          <Pressable onPress={handlePrevStep} style={styles.wizardNavBtnSecondary}>
            <ChevronLeft size={18} color="#111827" />
            <Text style={styles.wizardNavBtnSecondaryText}>Back</Text>
          </Pressable>
        )}
        {wizardStep === 3 && (
          <Pressable onPress={handleReset} style={styles.wizardNavBtnSecondary}>
            <RotateCcw size={16} color="#111827" />
            <Text style={styles.wizardNavBtnSecondaryText}>New Prompt</Text>
          </Pressable>
        )}
        {wizardStep < 3 && (
          <Pressable
            onPress={handleNextStep}
            style={[styles.wizardNavBtn, wizardStep === 0 ? { flex: 1 } : {}]}
          >
            <Text style={styles.wizardNavBtnText}>
              {wizardStep === 2 ? 'Generate' : 'Next'}
            </Text>
            {wizardStep === 2 ? (
              <Wand2 size={18} color="#FFF" />
            ) : (
              <ChevronRight size={18} color="#FFF" />
            )}
          </Pressable>
        )}
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#FAFAFA', '#FFFBF2']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16, paddingBottom: 140 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create</Text>
            <View style={styles.badge}>
              <Sparkles size={14} color="#F59E0B" />
              <Text style={styles.badgeText}>Pro</Text>
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
  keyboardView: {
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: '#F59E0B',
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
  modeToggleIndicator: {
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
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    zIndex: 1,
  },
  modeToggleText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#9CA3AF',
  },
  modeToggleTextActive: {
    color: '#111827',
  },
  categorySection: {
    marginHorizontal: -20,
    marginBottom: 24,
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  mainInputCard: {
    padding: 20,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  input: {
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    marginBottom: 20,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  generateBtn: {
    backgroundColor: '#111827',
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
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
  wizardStepLabelActive: {
    color: '#111827',
    fontWeight: '700' as const,
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
  categoryGridItem: {
    width: '30%',
    flexGrow: 1,
    flexBasis: '30%',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
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
  categoryGridIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryGridLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  wizardCard: {
    padding: 16,
    marginBottom: 20,
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
  optionCard: {
    padding: 0,
    marginBottom: 4,
  },
  optionInput: {
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
  wizardNavBtn: {
    flex: 1,
    backgroundColor: '#111827',
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  wizardNavBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  wizardNavBtnSecondary: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
  },
  wizardNavBtnSecondaryText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  resultSection: {
    gap: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    padding: 16,
  },
  resultPromptText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 22,
  },
  metaBlock: {
    gap: 6,
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
