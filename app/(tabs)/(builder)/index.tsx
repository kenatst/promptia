import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Clock,
} from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { CREATION_CATEGORIES, CreationCategory } from '@/data/gallerySeed';
import { usePromptStore, HistoryEntry } from '@/contexts/PromptContext';
import { assemblePrompt } from '@/engine/promptEngine';
import { PromptResult } from '@/types/prompt';
import { generateWithGemini, isGeminiConfigured } from '@/services/gemini';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/components/Toast';

const TONE_OPTIONS = [
  { label: 'Professional', value: 'professional' },
  { label: 'Casual', value: 'casual' },
  { label: 'Creative', value: 'creative' },
  { label: 'Technical', value: 'technical' },
  { label: 'Persuasive', value: 'persuasive' },
  { label: 'Academic', value: 'academic' },
];

const OUTPUT_FORMATS = ['Text', 'Markdown', 'JSON', 'HTML', 'CSV', 'Code', 'List', 'Table'];

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

const CAT_CARD_COLORS = [
  '#FFF0ED', '#F0FAF6', '#EFF6FF', '#FDEDF2', '#FFF5E0',
  '#F4F0FF', '#FFF0ED', '#E6F7F6', '#FDEDF2', '#FFF5E0',
  '#F0FAF6', '#EFF6FF', '#FFF5E0', '#F0FAF6', '#FFF0ED', '#E6F7F6',
];

type BuilderMode = 'simple' | 'advanced';

function BuilderContent() {
  const insets = useSafeAreaInsets();
  const { colors, t, isDark } = useTheme();
  const { currentInputs, setCurrentInputs, resetInputs, savePrompt, addToHistory, history } = usePromptStore();
  const toast = useToast();

  const [mode, setMode] = useState<BuilderMode>('simple');
  const [selectedCategoryId, setSelectedCategoryId] = useState('chat');
  const [wizardStep, setWizardStep] = useState(0);
  const [generatedResult, setGeneratedResult] = useState<PromptResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const isGeneratingRef = useRef(false);

  const WIZARD_STEPS = [t.create.category, t.create.details, t.create.options, t.create.result];

  const selectedCategory = useMemo(() =>
    CREATION_CATEGORIES.find(c => c.id === selectedCategoryId) || CREATION_CATEGORIES[0],
    [selectedCategoryId]
  );

  const accentColor = selectedCategory.color;
  const isImageOrVideo = selectedCategory.type === 'image' || selectedCategory.type === 'video';

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const cat = CREATION_CATEGORIES.find(c => c.id === categoryId);
    if (cat) setCurrentInputs({ model: cat.model, tone: cat.defaultTone });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [setCurrentInputs]);

  const handleGenerate = useCallback(async () => {
    if (currentInputs.objective.trim().length === 0) {
      toast.warning(t.create.emptyPromptMsg);
      return;
    }
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);

    try {
      let result: PromptResult;
      if (isGeminiConfigured()) {
        result = await generateWithGemini(currentInputs);
      } else {
        result = assemblePrompt(currentInputs);
      }
      setGeneratedResult(result);
      addToHistory(result, currentInputs);
      if (mode === 'advanced') setWizardStep(3);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        toast.error('Request timed out. Please try again.');
      } else {
        const result = assemblePrompt(currentInputs);
        setGeneratedResult(result);
        addToHistory(result, currentInputs);
        if (mode === 'advanced') setWizardStep(3);
      }
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  }, [currentInputs, mode, t, toast, addToHistory]);

  const handleCopy = useCallback(async () => {
    if (!generatedResult) return;
    await Clipboard.setStringAsync(generatedResult.finalPrompt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    toast.success(t.create.copied || 'Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [generatedResult, toast, t]);

  const handleShare = useCallback(async () => {
    if (!generatedResult) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({ message: generatedResult.finalPrompt, title: 'Prompt from Promptia' });
    } catch {
      // User cancelled share sheet
    }
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
    toast.success(t.create.saved || 'Saved to Library!');
  }, [generatedResult, currentInputs, selectedCategory, savePrompt, toast, t]);

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetInputs();
    setGeneratedResult(null);
    setWizardStep(0);
    setSelectedCategoryId('chat');
  }, [resetInputs]);

  const handleHistorySelect = useCallback((text: string) => {
    setGeneratedResult({
      finalPrompt: text,
      templatePrompt: text,
      metadata: { checklist: [], warnings: [], questions: [], assumptions: [] },
    });
    setShowHistory(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

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

  const renderCategoryCard = useCallback(({ item, index }: { item: CreationCategory; index: number }) => {
    const isSelected = selectedCategoryId === item.id;
    const iconFn = CATEGORY_ICONS[item.id];
    const cardBg = isDark ? colors.card : CAT_CARD_COLORS[index % CAT_CARD_COLORS.length];
    return (
      <Pressable
        onPress={() => handleCategorySelect(item.id)}
        accessibilityLabel={`Select ${item.label} category`}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.catCard,
          { backgroundColor: cardBg },
          isSelected && { borderColor: item.color, borderWidth: 2 },
          !isSelected && isDark && { borderColor: colors.cardBorder, borderWidth: 1 },
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <View style={[styles.catIconWrap, { backgroundColor: isDark ? colors.bgTertiary : '#FFFFFF' }]}>
          {iconFn ? iconFn(item.color) : <Wand2 size={20} color={item.color} />}
        </View>
        <Text style={[styles.catLabel, { color: colors.textSecondary }, isSelected && { color: item.color, fontFamily: 'Inter_700Bold' }]}>
          {item.label}
        </Text>
      </Pressable>
    );
  }, [selectedCategoryId, handleCategorySelect, colors, isDark]);

  const renderModeToggle = () => (
    <View style={styles.modeToggleContainer}>
      <View style={[styles.modeToggle, { backgroundColor: colors.chipBg }]}>
        {([['simple', Zap, t.create.quick], ['advanced', Sliders, t.create.advanced]] as const).map(([m, Icon, label]) => (
          <Pressable
            key={m}
            style={[styles.modeBtn, mode === m && { backgroundColor: isDark ? '#E8795A' : '#1A1A1A' }]}
            onPress={() => { setMode(m as BuilderMode); setGeneratedResult(null); if (m === 'advanced') setWizardStep(0); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            accessibilityLabel={`${label} mode`}
          >
            <Icon size={14} color={mode === m ? '#FFF' : colors.textTertiary} />
            <Text style={[styles.modeBtnText, { color: mode === m ? '#FFF' : colors.textTertiary }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderWizardProgress = () => (
    <View style={styles.wizardProgress}>
      {WIZARD_STEPS.map((step, i) => (
        <View key={step} style={styles.wizardStepRow}>
          <View style={[
            styles.wizardDot,
            { backgroundColor: colors.chipBg },
            i <= wizardStep && { backgroundColor: '#E8795A' },
            i < wizardStep && { backgroundColor: '#34A77B' },
          ]}>
            {i < wizardStep ? (
              <Check size={10} color="#FFF" />
            ) : (
              <Text style={[styles.wizardDotText, { color: colors.textTertiary }, i <= wizardStep && { color: '#FFF' }]}>{i + 1}</Text>
            )}
          </View>
          <Text style={[styles.wizardStepLabel, { color: colors.textTertiary }, i === wizardStep && { color: '#E8795A', fontFamily: 'Inter_700Bold' }]}>
            {step}
          </Text>
          {i < WIZARD_STEPS.length - 1 && (
            <View style={[styles.wizardLine, { backgroundColor: colors.chipBg }, i < wizardStep && { backgroundColor: '#34A77B' }]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderHistory = () => {
    if (history.length === 0) return null;
    return (
      <View style={[styles.historyPanel, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.cardBorder }]}>
        <View style={styles.historyHeader}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={[styles.historyTitle, { color: colors.text }]}>Recent Generations</Text>
          <Pressable onPress={() => setShowHistory(false)} hitSlop={8}>
            <Text style={[styles.historyClose, { color: colors.textTertiary }]}>Done</Text>
          </Pressable>
        </View>
        {history.map((entry: HistoryEntry) => (
          <Pressable
            key={entry.id}
            onPress={() => handleHistorySelect(entry.finalPrompt)}
            style={[styles.historyItem, { borderTopColor: colors.separator }]}
          >
            <View style={[styles.historyBadge, { backgroundColor: isDark ? colors.bgTertiary : '#F5F0EB' }]}>
              <Text style={[styles.historyModel, { color: '#E8795A' }]}>{entry.model.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.historyObjective, { color: colors.text }]} numberOfLines={1}>{entry.objective}</Text>
              <Text style={[styles.historyPreview, { color: colors.textTertiary }]} numberOfLines={1}>{entry.finalPrompt}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    );
  };

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

      <View style={[styles.mainCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.cardBorder }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: isDark ? colors.bgTertiary : `${accentColor}12` }]}>
            {CATEGORY_ICONS[selectedCategoryId]
              ? CATEGORY_ICONS[selectedCategoryId](accentColor)
              : <Wand2 size={20} color={accentColor} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{selectedCategory.label}</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textTertiary }]}>{t.create.describeWhat}</Text>
          </View>
          {history.length > 0 && (
            <Pressable
              onPress={() => setShowHistory(v => !v)}
              style={[styles.historyBtn, { backgroundColor: colors.chipBg }]}
              accessibilityLabel="View recent generations"
            >
              <Clock size={15} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {showHistory && renderHistory()}

        <TextInput
          value={currentInputs.objective}
          onChangeText={(text) => setCurrentInputs({ objective: text })}
          placeholder={t.create.describeIdea}
          placeholderTextColor={colors.textTertiary}
          multiline
          style={[styles.mainInput, { color: colors.text, backgroundColor: colors.bgSecondary, fontFamily: 'Inter_400Regular' }]}
          textAlignVertical="top"
          testID="builder-objective-input"
          accessibilityLabel="Describe your prompt objective"
        />

        <Pressable
          onPress={handleGenerate}
          disabled={isGenerating}
          style={({ pressed }) => [styles.generateBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          testID="builder-generate-btn"
          accessibilityLabel="Generate prompt"
          accessibilityRole="button"
        >
          <View style={[styles.generateInner, { backgroundColor: isDark ? '#E8795A' : '#1A1A1A' }]}>
            {isGenerating ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Wand2 size={18} color="#FFF" />
            )}
            <Text style={[styles.generateBtnText, { fontFamily: 'Inter_700Bold' }]}>
              {isGenerating ? t.create.generating || 'Generating…' : t.create.generatePrompt}
            </Text>
          </View>
        </Pressable>
      </View>

      {generatedResult && renderResult()}
    </>
  );

  const renderAdvancedStep0 = () => (
    <>
      <Text style={[styles.stepTitle, { color: colors.text, fontFamily: 'Inter_800ExtraBold' }]}>{t.create.whatCreating}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textTertiary }]}>{t.create.chooseCategory}</Text>
      <View style={styles.categoryGrid}>
        {CREATION_CATEGORIES.map((cat, index) => {
          const isSelected = selectedCategoryId === cat.id;
          const iconFn = CATEGORY_ICONS[cat.id];
          const gridBg = isDark ? colors.card : CAT_CARD_COLORS[index % CAT_CARD_COLORS.length];
          return (
            <Pressable
              key={cat.id}
              onPress={() => handleCategorySelect(cat.id)}
              style={[
                styles.gridItem,
                { backgroundColor: gridBg },
                isSelected && { borderColor: cat.color, borderWidth: 2 },
                !isSelected && isDark && { borderColor: colors.cardBorder, borderWidth: 1 },
              ]}
            >
              <View style={[styles.gridItemIcon, { backgroundColor: isDark ? colors.bgTertiary : '#FFFFFF' }]}>
                {iconFn ? iconFn(cat.color) : <Wand2 size={20} color={cat.color} />}
              </View>
              <Text style={[styles.gridItemLabel, { color: colors.textSecondary }, isSelected && { color: cat.color, fontFamily: 'Inter_700Bold' }]}>
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
      <Text style={[styles.stepTitle, { color: colors.text, fontFamily: 'Inter_800ExtraBold' }]}>{t.create.describePrompt}</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textTertiary }]}>{t.create.beSpecific}</Text>
      <TextInput
        value={currentInputs.objective}
        onChangeText={(text) => setCurrentInputs({ objective: text })}
        placeholder={t.create.whatAchieve}
        placeholderTextColor={colors.textTertiary}
        multiline
        style={[styles.wizardInput, { color: colors.text, backgroundColor: colors.bgSecondary, fontFamily: 'Inter_400Regular' }]}
        textAlignVertical="top"
      />
      {isImageOrVideo && (
        <>
          <Text style={[styles.chipSectionTitle, { color: colors.text }]}>{t.create.style}</Text>
          <TextInput
            value={currentInputs.style || ''}
            onChangeText={(text) => setCurrentInputs({ style: text })}
            placeholder="e.g. Photorealistic, Anime, Oil Painting..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.fieldInput, { color: colors.text, backgroundColor: colors.bgSecondary, fontFamily: 'Inter_400Regular' }]}
          />
        </>
      )}
    </>
  );

  const renderAdvancedStep2 = () => (
    <>
      <Text style={[styles.stepTitle, { color: colors.text, fontFamily: 'Inter_800ExtraBold' }]}>{t.create.fineTune}</Text>
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
                  style={[styles.chip, { backgroundColor: colors.chipBg }, isSelected && { backgroundColor: isDark ? 'rgba(232,121,90,0.15)' : '#FFF0ED', borderColor: '#E8795A', borderWidth: 1.5 }]}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }, isSelected && { color: '#E8795A', fontFamily: 'Inter_700Bold' }]}>
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
                  style={[styles.chip, { backgroundColor: colors.chipBg }, isSelected && { backgroundColor: isDark ? 'rgba(232,121,90,0.15)' : '#FFF0ED', borderColor: '#E8795A', borderWidth: 1.5 }]}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }, isSelected && { color: '#E8795A', fontFamily: 'Inter_700Bold' }]}>
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
                  style={[styles.chip, { backgroundColor: colors.chipBg }, isSelected && { backgroundColor: isDark ? 'rgba(232,121,90,0.15)' : '#FFF0ED', borderColor: '#E8795A', borderWidth: 1.5 }]}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }, isSelected && { color: '#E8795A', fontFamily: 'Inter_700Bold' }]}>{fmt}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {isImageOrVideo && (
        <>
          <Text style={[styles.chipSectionTitle, { color: colors.text }]}>{t.create.lighting}</Text>
          <TextInput value={currentInputs.lighting || ''} onChangeText={(text) => setCurrentInputs({ lighting: text })} placeholder="e.g. Golden hour, Studio, Neon..." placeholderTextColor={colors.textTertiary} style={[styles.fieldInput, { color: colors.text, backgroundColor: colors.bgSecondary }]} />
          <Text style={[styles.chipSectionTitle, { color: colors.text }]}>{t.create.cameraAngle}</Text>
          <TextInput value={currentInputs.cameraAngle || ''} onChangeText={(text) => setCurrentInputs({ cameraAngle: text })} placeholder="e.g. Close-up, Wide angle, Bird's eye..." placeholderTextColor={colors.textTertiary} style={[styles.fieldInput, { color: colors.text, backgroundColor: colors.bgSecondary }]} />
          <Text style={[styles.chipSectionTitle, { color: colors.text }]}>{t.create.negativePrompt}</Text>
          <TextInput value={currentInputs.negativePrompt || ''} onChangeText={(text) => setCurrentInputs({ negativePrompt: text })} placeholder="What to exclude..." placeholderTextColor={colors.textTertiary} style={[styles.fieldInput, { color: colors.text, backgroundColor: colors.bgSecondary }]} />
        </>
      )}

      <Text style={[styles.chipSectionTitle, { color: colors.text }]}>{t.create.audience}</Text>
      <TextInput value={currentInputs.audience} onChangeText={(text) => setCurrentInputs({ audience: text })} placeholder={t.create.whoIsFor} placeholderTextColor={colors.textTertiary} style={[styles.fieldInput, { color: colors.text, backgroundColor: colors.bgSecondary }]} />
      <Text style={[styles.chipSectionTitle, { color: colors.text }]}>{t.create.constraints}</Text>
      <TextInput value={currentInputs.constraints} onChangeText={(text) => setCurrentInputs({ constraints: text })} placeholder={t.create.anyRules} placeholderTextColor={colors.textTertiary} multiline style={[styles.fieldInput, { color: colors.text, minHeight: 60, backgroundColor: colors.bgSecondary }]} textAlignVertical="top" />
    </>
  );

  const renderResult = () => {
    if (!generatedResult) return null;
    const { metadata } = generatedResult;

    return (
      <View style={styles.resultSection}>
        <View style={styles.resultHeader}>
          <View style={styles.resultTitleRow}>
            <View style={[styles.resultDot, { backgroundColor: '#E8795A' }]} />
            <Text style={[styles.resultTitle, { color: colors.text, fontFamily: 'Inter_800ExtraBold' }]}>{t.create.generatedPrompt}</Text>
          </View>
          <View style={styles.resultActions}>
            <Pressable
              onPress={handleCopy}
              style={[styles.resultActionBtn, { backgroundColor: colors.chipBg }, copied && { backgroundColor: 'rgba(52,167,123,0.12)' }]}
              accessibilityLabel="Copy prompt"
            >
              {copied ? <Check size={16} color="#34A77B" /> : <Copy size={16} color={colors.textSecondary} />}
            </Pressable>
            <Pressable onPress={handleShare} style={[styles.resultActionBtn, { backgroundColor: colors.chipBg }]} accessibilityLabel="Share prompt">
              <Share2 size={16} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={handleSave} style={[styles.resultActionBtn, { backgroundColor: colors.chipBg }]} accessibilityLabel="Save prompt">
              <Save size={16} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={handleReset} style={[styles.resultActionBtn, { backgroundColor: colors.chipBg }]} accessibilityLabel="Reset">
              <RotateCcw size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.resultCard, { backgroundColor: isDark ? colors.card : '#FFF0ED', borderLeftColor: '#E8795A' }]}>
          <Text style={[styles.resultPromptText, { color: colors.text, fontFamily: 'Inter_400Regular' }]} selectable>
            {generatedResult.finalPrompt}
          </Text>
        </View>

        {metadata.assumptions.length > 0 && (
          <View style={[styles.metaBlock, { backgroundColor: isDark ? colors.card : '#EFF6FF' }]}>
            <View style={styles.metaHeader}>
              <Info size={14} color="#4A8FE7" />
              <Text style={[styles.metaTitle, { color: '#4A8FE7' }]}>{t.create.assumptions}</Text>
            </View>
            {metadata.assumptions.map((a, i) => (
              <Text key={i} style={[styles.metaItem, { color: colors.textSecondary }]}>{a}</Text>
            ))}
          </View>
        )}

        {metadata.warnings.length > 0 && (
          <View style={[styles.metaBlock, { backgroundColor: isDark ? colors.card : '#FFF5E0' }]}>
            <View style={styles.metaHeader}>
              <AlertTriangle size={14} color="#D4943A" />
              <Text style={[styles.metaTitle, { color: '#D4943A' }]}>{t.create.warnings}</Text>
            </View>
            {metadata.warnings.map((w, i) => (
              <Text key={i} style={[styles.metaItem, { color: colors.textSecondary }]}>{w}</Text>
            ))}
          </View>
        )}

        {metadata.questions.length > 0 && (
          <View style={[styles.metaBlock, { backgroundColor: isDark ? colors.card : '#F4F0FF' }]}>
            <View style={styles.metaHeader}>
              <HelpCircle size={14} color="#8B6FC0" />
              <Text style={[styles.metaTitle, { color: '#8B6FC0' }]}>{t.create.suggestions}</Text>
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
          <Pressable onPress={handleNextStep} disabled={isGenerating} style={[styles.wizardNavNext, wizardStep === 0 ? { flex: 1 } : {}]}>
            <View style={[styles.wizardNavNextInner, { backgroundColor: isDark ? '#E8795A' : '#1A1A1A' }]}>
              {isGenerating ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Text style={[styles.wizardNavNextText, { fontFamily: 'Inter_700Bold' }]}>
                    {wizardStep === 2 ? t.create.generate : t.create.next}
                  </Text>
                  {wizardStep === 2 ? <Wand2 size={18} color="#FFF" /> : <ChevronRight size={18} color="#FFF" />}
                </>
              )}
            </View>
          </Pressable>
        )}
      </View>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: 140 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_800ExtraBold' }]}>{t.create.title}</Text>
            <View style={[styles.proBadge, { backgroundColor: isDark ? 'rgba(232,121,90,0.15)' : '#FFF0ED' }]}>
              <Text style={[styles.proBadgeText, { color: '#E8795A', fontFamily: 'Inter_700Bold' }]}>{t.create.pro}</Text>
            </View>
          </View>

          {renderModeToggle()}
          {mode === 'simple' ? renderSimpleMode() : renderAdvancedMode()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function BuilderScreen() {
  return (
    <ErrorBoundary fallbackTitle="Builder Error">
      <BuilderContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 30, letterSpacing: -0.8 },
  proBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  proBadgeText: { fontSize: 13 },
  modeToggleContainer: { marginBottom: 24, alignItems: 'center' },
  modeToggle: { flexDirection: 'row', borderRadius: 16, padding: 4, width: 240 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6, borderRadius: 12 },
  modeBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  catSection: { marginHorizontal: -20, marginBottom: 24 },
  catList: { paddingHorizontal: 20, gap: 10 },
  catCard: { width: 84, paddingVertical: 14, paddingHorizontal: 6, borderRadius: 20, alignItems: 'center', gap: 8 },
  catIconWrap: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  catLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  mainCard: { borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  cardIconBox: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  cardSubtitle: { fontSize: 13, marginTop: 2 },
  historyBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  historyPanel: { borderRadius: 16, marginBottom: 16, borderWidth: 1, overflow: 'hidden' },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  historyTitle: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  historyClose: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  historyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  historyModel: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  historyObjective: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  historyPreview: { fontSize: 11 },
  mainInput: { fontSize: 16, minHeight: 100, marginBottom: 16, lineHeight: 24, textAlignVertical: 'top', borderRadius: 16, padding: 16 },
  generateBtn: { borderRadius: 26, overflow: 'hidden' },
  generateInner: { height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  generateBtnText: { color: '#FFF', fontSize: 16 },
  wizardProgress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28, paddingHorizontal: 8 },
  wizardStepRow: { flexDirection: 'row', alignItems: 'center' },
  wizardDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wizardDotText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  wizardStepLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', marginLeft: 4 },
  wizardLine: { width: 20, height: 2, marginHorizontal: 6, borderRadius: 1 },
  wizardContent: { minHeight: 300 },
  stepTitle: { fontSize: 22, marginBottom: 6 },
  stepSubtitle: { fontSize: 14, marginBottom: 24 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '30%', flexGrow: 1, flexBasis: '30%', paddingVertical: 14, paddingHorizontal: 10, borderRadius: 20, alignItems: 'center', gap: 8 },
  gridItemIcon: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  gridItemLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  wizardInput: { fontSize: 16, minHeight: 80, lineHeight: 24, textAlignVertical: 'top', borderRadius: 16, padding: 16, marginBottom: 20 },
  chipSectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 10, marginTop: 16 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  chipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  fieldInput: { fontSize: 15, padding: 14, minHeight: 44, borderRadius: 14, marginBottom: 4 },
  wizardNav: { flexDirection: 'row', gap: 12, marginTop: 24 },
  wizardNavBack: { height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 20 },
  wizardNavBackText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  wizardNavNext: { flex: 1, borderRadius: 26, overflow: 'hidden' },
  wizardNavNextInner: { height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  wizardNavNextText: { color: '#FFF', fontSize: 16 },
  resultSection: { gap: 16 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultDot: { width: 10, height: 10, borderRadius: 5 },
  resultTitle: { fontSize: 20 },
  resultActions: { flexDirection: 'row', gap: 8 },
  resultActionBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  resultCard: { borderRadius: 20, padding: 18, borderLeftWidth: 4 },
  resultPromptText: { fontSize: 14, lineHeight: 22 },
  metaBlock: { gap: 6, borderRadius: 20, padding: 16 },
  metaHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  metaItem: { fontSize: 13, paddingLeft: 20, lineHeight: 20 },
});
