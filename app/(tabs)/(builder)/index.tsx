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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  Wand2,
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

import { useTheme } from '@/contexts/ThemeContext';
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
import { generateWithGemini, isGeminiConfigured, setGeminiApiKey } from '@/services/gemini';

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

export default function BuilderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, t, isDark } = useTheme();
  const { currentInputs, setCurrentInputs, resetInputs, savePrompt, geminiApiKey } = usePromptStore();

  const [mode, setMode] = useState<BuilderMode>('simple');
  const [selectedCategoryId, setSelectedCategoryId] = useState('chat');
  const [wizardStep, setWizardStep] = useState(0);
  const [generatedResult, setGeneratedResult] = useState<PromptResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const WIZARD_STEPS = [t.create.category, t.create.details, t.create.options, t.create.result];

  useEffect(() => {
    if (geminiApiKey) {
      setGeminiApiKey(geminiApiKey);
    }
  }, [geminiApiKey]);

  const selectedCategory = useMemo(() =>
    CREATION_CATEGORIES.find(c => c.id === selectedCategoryId) || CREATION_CATEGORIES[0],
    [selectedCategoryId]
  );

  const accentColor = selectedCategory.color;
  const isImageOrVideo = selectedCategory.type === 'image' || selectedCategory.type === 'video';

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const cat = CREATION_CATEGORIES.find(c => c.id === categoryId);
    if (cat) {
      setCurrentInputs({ model: cat.model, tone: cat.defaultTone });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [setCurrentInputs]);

  const handleGenerate = useCallback(async () => {
    if (currentInputs.objective.trim().length === 0) {
      Alert.alert(t.create.emptyPrompt, t.create.emptyPromptMsg);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isGeminiConfigured()) {
      setIsGenerating(true);
      try {
        const result = await generateWithGemini(currentInputs);
        setGeneratedResult(result);
        if (mode === 'advanced') setWizardStep(3);
      } catch (e: any) {
        console.log('[Generate] Gemini error, falling back to local:', e.message);
        const result = assemblePrompt(currentInputs);
        setGeneratedResult(result);
        if (mode === 'advanced') setWizardStep(3);
      } finally {
        setIsGenerating(false);
      }
    } else {
      const result = assemblePrompt(currentInputs);
      setGeneratedResult(result);
      if (mode === 'advanced') setWizardStep(3);
    }
  }, [currentInputs, mode, t]);

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
    Alert.alert(t.create.saved, t.create.savedAlert);
  }, [generatedResult, currentInputs, selectedCategory, savePrompt, t]);

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
          { backgroundColor: isSelected ? `${item.color}18` : colors.card, borderColor: isSelected ? item.color : colors.cardBorder },
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <View style={[styles.catIconWrap, { backgroundColor: `${item.color}15` }]}>
          {iconFn ? iconFn(item.color) : <Wand2 size={20} color={item.color} />}
        </View>
        <Text style={[styles.catLabel, { color: colors.textSecondary }, isSelected && { color: item.color, fontWeight: '700' as const }]}>
          {item.label}
        </Text>
      </Pressable>
    );
  }, [selectedCategoryId, handleCategorySelect, colors]);

  const renderModeToggle = () => (
    <View style={styles.modeToggleContainer}>
      <View style={[styles.modeToggle, { backgroundColor: colors.bgSecondary }]}>
        <Pressable
          style={[styles.modeBtn, mode === 'simple' && { backgroundColor: accentColor }]}
          onPress={() => { setMode('simple'); setGeneratedResult(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        >
          <Zap size={14} color={mode === 'simple' ? '#FFF' : colors.textTertiary} />
          <Text style={[styles.modeBtnText, { color: mode === 'simple' ? '#FFF' : colors.textTertiary }]}>{t.create.quick}</Text>
        </Pressable>
        <Pressable
          style={[styles.modeBtn, mode === 'advanced' && { backgroundColor: accentColor }]}
          onPress={() => { setMode('advanced'); setWizardStep(0); setGeneratedResult(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        >
          <Sliders size={14} color={mode === 'advanced' ? '#FFF' : colors.textTertiary} />
          <Text style={[styles.modeBtnText, { color: mode === 'advanced' ? '#FFF' : colors.textTertiary }]}>{t.create.advanced}</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderWizardProgress = () => (
    <View style={styles.wizardProgress}>
      {WIZARD_STEPS.map((step, i) => (
        <View key={step} style={styles.wizardStepRow}>
          <View style={[
            styles.wizardDot,
            { backgroundColor: colors.bgTertiary },
            i <= wizardStep && { backgroundColor: accentColor },
            i < wizardStep && { backgroundColor: '#10B981' },
          ]}>
            {i < wizardStep ? (
              <Check size={10} color="#FFF" />
            ) : (
              <Text style={[styles.wizardDotText, { color: colors.textTertiary }, i <= wizardStep && { color: '#FFF' }]}>{i + 1}</Text>
            )}
          </View>
          <Text style={[styles.wizardStepLabel, { color: colors.textTertiary }, i === wizardStep && { color: accentColor, fontWeight: '700' as const }]}>
            {step}
          </Text>
          {i < WIZARD_STEPS.length - 1 && (
            <View style={[styles.wizardLine, { backgroundColor: colors.bgTertiary }, i < wizardStep && { backgroundColor: '#10B981' }]} />
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

      <View style={[styles.mainCard, { borderTopColor: accentColor, backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: `${accentColor}15` }]}>
            {CATEGORY_ICONS[selectedCategoryId]
              ? CATEGORY_ICONS[selectedCategoryId](accentColor)
              : <Wand2 size={20} color={accentColor} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{selectedCategory.label}</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textTertiary }]}>{t.create.describeWhat}</Text>
          </View>
        </View>

        <TextInput
          value={currentInputs.objective}
          onChangeText={(text) => setCurrentInputs({ objective: text })}
          placeholder={t.create.describeIdea}
          placeholderTextColor={colors.textTertiary}
          multiline
          style={[styles.mainInput, { color: colors.text }]}
          textAlignVertical="top"
        />

        <Pressable
          onPress={handleGenerate}
          disabled={isGenerating}
          style={({ pressed }) => [styles.generateBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        >
          <LinearGradient
            colors={[accentColor, isDark ? '#1A1A24' : '#111827']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateGradient}
          >
            {isGenerating ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Wand2 size={18} color="#FFF" />
            )}
            <Text style={styles.generateBtnText}>
              {isGenerating ? 'Generating...' : t.create.generatePrompt}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {generatedResult && renderResult()}
    </>
  );

  const renderAdvancedStep0 = () => (
    <>
      <Text style={[styles.stepTitle, { color: colors.text }]}>{t.create.whatCreating}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textTertiary }]}>{t.create.chooseCategory}</Text>
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
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                isSelected && { backgroundColor: `${cat.color}15`, borderColor: cat.color },
              ]}
            >
              <View style={[styles.gridItemIcon, { backgroundColor: `${cat.color}12` }]}>
                {iconFn ? iconFn(cat.color) : <Wand2 size={20} color={cat.color} />}
              </View>
              <Text style={[styles.gridItemLabel, { color: colors.textSecondary }, isSelected && { color: cat.color, fontWeight: '700' as const }]}>
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
      <Text style={[styles.stepTitle, { color: colors.text }]}>{t.create.describePrompt}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textTertiary }]}>{t.create.beSpecific}</Text>

      <View style={[styles.wizardInputCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <TextInput
          value={currentInputs.objective}
          onChangeText={(text) => setCurrentInputs({ objective: text })}
          placeholder={t.create.whatAchieve}
          placeholderTextColor={colors.textTertiary}
          multiline
          style={[styles.wizardInput, { color: colors.text }]}
          textAlignVertical="top"
        />
      </View>

      {isImageOrVideo && (
        <>
          <Text style={[styles.chipSectionTitle, { color: colors.text }]}>{t.create.style}</Text>
          <View style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <TextInput
              value={currentInputs.style || ''}
              onChangeText={(text) => setCurrentInputs({ style: text })}
              placeholder="e.g. Photorealistic, Anime, Oil Painting..."
              placeholderTextColor={colors.textTertiary}
              style={[styles.fieldInput, { color: colors.text }]}
            />
          </View>
        </>
      )}
    </>
  );

  const renderAdvancedStep2 = () => (
    <>
      <Text style={[styles.stepTitle, { color: colors.text }]}>{t.create.fineTune}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textTertiary }]}>{t.create.customizeTone}</Text>

      {!isImageOrVideo && (
        <>
          <Text style={[styles.chipSectionTitle, { color: colors.text }]}>{t.create.tone}</Text>
          <View style={styles.chipWrap}>
            {TONE_OPTIONS.map((opt) => {
              const isSelected = currentInputs.tone === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => { setCurrentInputs({ tone: opt.value as any }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.chip, { backgroundColor: colors.chipBg, borderColor: 'transparent' }, isSelected && { backgroundColor: `${accentColor}15`, borderColor: accentColor }]}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }, isSelected && { color: accentColor, fontWeight: '700' as const }]}>
                    {(t.tones as any)[opt.value] || opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.chipSectionTitle, { color: colors.text }]}>{t.create.length}</Text>
          <View style={styles.chipWrap}>
            {(['concise', 'medium', 'detailed', 'exhaustive'] as const).map((len) => {
              const isSelected = currentInputs.length === len;
              return (
                <Pressable
                  key={len}
                  onPress={() => { setCurrentInputs({ length: len }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.chip, { backgroundColor: colors.chipBg, borderColor: 'transparent' }, isSelected && { backgroundColor: `${accentColor}15`, borderColor: accentColor }]}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }, isSelected && { color: accentColor, fontWeight: '700' as const }]}>
                    {(t.lengths as any)[len]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.chipSectionTitle, { color: colors.text }]}>{t.create.outputFormat}</Text>
          <View style={styles.chipWrap}>
            {OUTPUT_FORMATS.map((fmt) => {
              const isSelected = currentInputs.outputFormat === fmt.toLowerCase();
              return (
                <Pressable
                  key={fmt}
                  onPress={() => { setCurrentInputs({ outputFormat: fmt.toLowerCase() }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.chip, { backgroundColor: colors.chipBg, borderColor: 'transparent' }, isSelected && { backgroundColor: `${accentColor}15`, borderColor: accentColor }]}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }, isSelected && { color: accentColor, fontWeight: '700' as const }]}>
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
          <Text style={[styles.chipSectionTitle, { color: colors.text }]}>{t.create.lighting}</Text>
          <View style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <TextInput
              value={currentInputs.lighting || ''}
              onChangeText={(text) => setCurrentInputs({ lighting: text })}
              placeholder="e.g. Golden hour, Studio, Neon..."
              placeholderTextColor={colors.textTertiary}
              style={[styles.fieldInput, { color: colors.text }]}
            />
          </View>

          <Text style={[styles.chipSectionTitle, { color: colors.text }]}>{t.create.cameraAngle}</Text>
          <View style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <TextInput
              value={currentInputs.cameraAngle || ''}
              onChangeText={(text) => setCurrentInputs({ cameraAngle: text })}
              placeholder="e.g. Close-up, Wide angle, Bird's eye..."
              placeholderTextColor={colors.textTertiary}
              style={[styles.fieldInput, { color: colors.text }]}
            />
          </View>

          <Text style={[styles.chipSectionTitle, { color: colors.text }]}>{t.create.negativePrompt}</Text>
          <View style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <TextInput
              value={currentInputs.negativePrompt || ''}
              onChangeText={(text) => setCurrentInputs({ negativePrompt: text })}
              placeholder="What to exclude..."
              placeholderTextColor={colors.textTertiary}
              style={[styles.fieldInput, { color: colors.text }]}
            />
          </View>
        </>
      )}

      <Text style={[styles.chipSectionTitle, { color: colors.text }]}>{t.create.audience}</Text>
      <View style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <TextInput
          value={currentInputs.audience}
          onChangeText={(text) => setCurrentInputs({ audience: text })}
          placeholder={t.create.whoIsFor}
          placeholderTextColor={colors.textTertiary}
          style={[styles.fieldInput, { color: colors.text }]}
        />
      </View>

      <Text style={[styles.chipSectionTitle, { color: colors.text }]}>{t.create.constraints}</Text>
      <View style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <TextInput
          value={currentInputs.constraints}
          onChangeText={(text) => setCurrentInputs({ constraints: text })}
          placeholder={t.create.anyRules}
          placeholderTextColor={colors.textTertiary}
          multiline
          style={[styles.fieldInput, { color: colors.text, minHeight: 60 }]}
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
            <Text style={[styles.resultTitle, { color: colors.text }]}>{t.create.generatedPrompt}</Text>
          </View>
          <View style={styles.resultActions}>
            <Pressable
              onPress={handleCopy}
              style={[styles.resultActionBtn, { backgroundColor: colors.chipBg }, copied && { backgroundColor: 'rgba(16,185,129,0.12)' }]}
            >
              {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} color={colors.textSecondary} />}
            </Pressable>
            <Pressable onPress={handleSave} style={[styles.resultActionBtn, { backgroundColor: colors.chipBg }]}>
              <Save size={16} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={handleReset} style={[styles.resultActionBtn, { backgroundColor: colors.chipBg }]}>
              <RotateCcw size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.resultCard, { borderLeftColor: accentColor, backgroundColor: colors.card }]}>
          <Text style={[styles.resultPromptText, { color: colors.text }]} selectable>
            {generatedResult.finalPrompt}
          </Text>
        </View>

        {metadata.assumptions.length > 0 && (
          <View style={[styles.metaBlock, { backgroundColor: 'rgba(59,130,246,0.08)' }]}>
            <View style={styles.metaHeader}>
              <Info size={14} color="#3B82F6" />
              <Text style={[styles.metaTitle, { color: '#3B82F6' }]}>{t.create.assumptions}</Text>
            </View>
            {metadata.assumptions.map((a, i) => (
              <Text key={i} style={[styles.metaItem, { color: colors.textSecondary }]}>{a}</Text>
            ))}
          </View>
        )}

        {metadata.warnings.length > 0 && (
          <View style={[styles.metaBlock, { backgroundColor: 'rgba(245,158,11,0.08)' }]}>
            <View style={styles.metaHeader}>
              <AlertTriangle size={14} color="#F59E0B" />
              <Text style={[styles.metaTitle, { color: '#F59E0B' }]}>{t.create.warnings}</Text>
            </View>
            {metadata.warnings.map((w, i) => (
              <Text key={i} style={[styles.metaItem, { color: colors.textSecondary }]}>{w}</Text>
            ))}
          </View>
        )}

        {metadata.questions.length > 0 && (
          <View style={[styles.metaBlock, { backgroundColor: 'rgba(139,92,246,0.08)' }]}>
            <View style={styles.metaHeader}>
              <HelpCircle size={14} color="#8B5CF6" />
              <Text style={[styles.metaTitle, { color: '#8B5CF6' }]}>{t.create.suggestions}</Text>
            </View>
            {metadata.questions.map((q, i) => (
              <Text key={i} style={[styles.metaItem, { color: colors.textSecondary }]}>{q}</Text>
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
          <Pressable onPress={handlePrevStep} style={[styles.wizardNavBack, { backgroundColor: colors.chipBg }]}>
            <ChevronLeft size={18} color={colors.text} />
            <Text style={[styles.wizardNavBackText, { color: colors.text }]}>{t.create.back}</Text>
          </Pressable>
        )}
        {wizardStep === 3 && (
          <Pressable onPress={handleReset} style={[styles.wizardNavBack, { backgroundColor: colors.chipBg }]}>
            <RotateCcw size={16} color={colors.text} />
            <Text style={[styles.wizardNavBackText, { color: colors.text }]}>{t.create.newPrompt}</Text>
          </Pressable>
        )}
        {wizardStep < 3 && (
          <Pressable
            onPress={handleNextStep}
            disabled={isGenerating}
            style={[styles.wizardNavNext, wizardStep === 0 ? { flex: 1 } : {}]}
          >
            <LinearGradient
              colors={[accentColor, isDark ? '#1A1A24' : '#111827']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.wizardNavNextGradient}
            >
              {isGenerating ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Text style={styles.wizardNavNextText}>
                    {wizardStep === 2 ? t.create.generate : t.create.next}
                  </Text>
                  {wizardStep === 2 ? <Wand2 size={18} color="#FFF" /> : <ChevronRight size={18} color="#FFF" />}
                </>
              )}
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: 140 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t.create.title}</Text>
            <View style={[styles.proBadge, { backgroundColor: isDark ? 'rgba(217,119,6,0.15)' : '#FEF3C7', borderColor: 'rgba(217,119,6,0.15)' }]}>
              <Text style={styles.proBadgeText}>{t.create.pro}</Text>
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
  container: { flex: 1 },
  flex1: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
  },
  proBadgeText: {
    color: '#D97706',
    fontWeight: '700' as const,
    fontSize: 12,
  },
  modeToggleContainer: { marginBottom: 24, alignItems: 'center' },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    width: 240,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    zIndex: 1,
    borderRadius: 11,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  catSection: { marginHorizontal: -20, marginBottom: 24 },
  catList: { paddingHorizontal: 20, gap: 10 },
  catCard: {
    width: 82,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
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
  catLabel: { fontSize: 11, fontWeight: '600' as const, textAlign: 'center' },
  mainCard: {
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
  cardTitle: { fontSize: 18, fontWeight: '700' as const },
  cardSubtitle: { fontSize: 13, marginTop: 2 },
  mainInput: { fontSize: 16, minHeight: 100, marginBottom: 16, lineHeight: 24, textAlignVertical: 'top' },
  generateBtn: { borderRadius: 26, overflow: 'hidden' },
  generateGradient: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' as const },
  wizardProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  wizardStepRow: { flexDirection: 'row', alignItems: 'center' },
  wizardDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardDotText: { fontSize: 11, fontWeight: '700' as const },
  wizardStepLabel: { fontSize: 11, fontWeight: '500' as const, marginLeft: 4 },
  wizardLine: { width: 20, height: 2, marginHorizontal: 6 },
  wizardContent: { minHeight: 300 },
  stepTitle: { fontSize: 22, fontWeight: '800' as const, marginBottom: 6 },
  stepSubtitle: { fontSize: 14, marginBottom: 24 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: {
    width: '30%',
    flexGrow: 1,
    flexBasis: '30%',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1.5,
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
  gridItemLabel: { fontSize: 12, fontWeight: '600' as const, textAlign: 'center' },
  wizardInputCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
  },
  wizardInput: { fontSize: 16, minHeight: 80, lineHeight: 24, textAlignVertical: 'top' },
  chipSectionTitle: { fontSize: 14, fontWeight: '700' as const, marginBottom: 10, marginTop: 16 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontWeight: '500' as const },
  fieldCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    borderWidth: 1,
    marginBottom: 4,
  },
  fieldInput: { fontSize: 15, padding: 14, minHeight: 44 },
  wizardNav: { flexDirection: 'row', gap: 12, marginTop: 24 },
  wizardNavBack: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
  },
  wizardNavBackText: { fontSize: 15, fontWeight: '600' as const },
  wizardNavNext: { flex: 1, borderRadius: 26, overflow: 'hidden' },
  wizardNavNextGradient: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  wizardNavNextText: { color: '#FFF', fontSize: 16, fontWeight: '700' as const },
  resultSection: { gap: 16 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultDot: { width: 10, height: 10, borderRadius: 5 },
  resultTitle: { fontSize: 20, fontWeight: '800' as const },
  resultActions: { flexDirection: 'row', gap: 8 },
  resultActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: {
    borderRadius: 20,
    padding: 18,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  resultPromptText: { fontSize: 14, lineHeight: 22 },
  metaBlock: { gap: 6, borderRadius: 16, padding: 14 },
  metaHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaTitle: { fontSize: 13, fontWeight: '700' as const },
  metaItem: { fontSize: 13, paddingLeft: 20, lineHeight: 20 },
});
