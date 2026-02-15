import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Copy,
  BookmarkPlus,
  RotateCcw,
  Check,
  Zap,
} from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { ChipGroup } from '@/components/ChipGroup';
import { WizardProgress } from '@/components/WizardProgress';
import { assemblePrompt } from '@/engine/promptEngine';
import { usePromptStore } from '@/store/promptStore';
import { CREATION_CATEGORIES, CreationCategory, OBJECTIVE_CHIPS, STYLE_CHIPS, TONE_OPTIONS, OUTPUT_FORMATS } from '@/data/gallerySeed';
import { ModelType, ToneType, LengthType, PromptType } from '@/types/prompt';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STEP_LABELS = ['Create', 'Describe', 'Configure', 'Generate'];

const LENGTH_OPTIONS: { label: string; value: LengthType }[] = [
  { label: '⚡ Concise', value: 'concise' },
  { label: '📝 Medium', value: 'medium' },
  { label: '📖 Detailed', value: 'detailed' },
  { label: '📚 Exhaustive', value: 'exhaustive' },
];

const MODEL_DETAILS: Record<ModelType, { emoji: string; label: string }> = {
  chatgpt: { emoji: '💬', label: 'ChatGPT / LLM' },
  midjourney: { emoji: '🎨', label: 'Midjourney' },
  sdxl: { emoji: '🖼️', label: 'Stable Diffusion' },
  video: { emoji: '🎬', label: 'Video AI' },
};

export default function BuilderScreen() {
  const insets = useSafeAreaInsets();
  const { currentInputs, setCurrentInputs, resetInputs, savePrompt } = usePromptStore();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const hasCheckedRemixRef = useRef(false);

  const result = useMemo(() => assemblePrompt(currentInputs), [currentInputs]);
  const isVisual = currentInputs.model === 'midjourney' || currentInputs.model === 'sdxl' || currentInputs.model === 'video';

  useEffect(() => {
    if (!hasCheckedRemixRef.current && currentInputs.objective) {
      hasCheckedRemixRef.current = true;
      const matchingCategory = CREATION_CATEGORIES.find(c => c.model === currentInputs.model);
      if (matchingCategory) {
        setSelectedCategory(matchingCategory.id);
      }
      setStep(1);
      animateTransition('forward');
    }
    hasCheckedRemixRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animateTransition = useCallback((direction: 'forward' | 'back') => {
    const offset = direction === 'forward' ? 40 : -40;
    fadeAnim.setValue(0);
    slideAnim.setValue(offset);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const goNext = useCallback(() => {
    if (step < 3) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStep((s) => s + 1);
      animateTransition('forward');
    }
  }, [step, animateTransition]);

  const goBack = useCallback(() => {
    if (step > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep((s) => s - 1);
      animateTransition('back');
    }
  }, [step, animateTransition]);

  const handleCategorySelect = useCallback((category: CreationCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategory(category.id);
    setCurrentInputs({
      model: category.model,
      objectiveChips: category.defaultChips,
      tone: category.defaultTone,
    });
  }, [setCurrentInputs]);

  const handleChipToggle = useCallback((chip: string) => {
    const current = currentInputs.objectiveChips;
    const updated = current.includes(chip)
      ? current.filter((c) => c !== chip)
      : [...current, chip];
    setCurrentInputs({ objectiveChips: updated });
  }, [currentInputs.objectiveChips, setCurrentInputs]);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(result.finalPrompt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Prompt copied to clipboard');
  }, [result.finalPrompt]);

  const handleSave = useCallback(() => {
    const typeMap: Record<ModelType, PromptType> = {
      chatgpt: 'text',
      midjourney: 'image',
      sdxl: 'image',
      video: 'video',
    };
    savePrompt({
      title: currentInputs.objective || `Prompt ${Date.now()}`,
      finalPrompt: result.finalPrompt,
      templatePrompt: result.templatePrompt,
      inputs: { ...currentInputs },
      model: currentInputs.model,
      type: typeMap[currentInputs.model],
      tags: [...currentInputs.objectiveChips],
      isFavorite: false,
    });
    setSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setSaved(false), 2000);
  }, [currentInputs, result, savePrompt]);

  const handleReset = useCallback(() => {
    resetInputs();
    setStep(0);
    setSelectedCategory(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [resetInputs]);

  const renderStep0 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What are you creating?</Text>
      <Text style={styles.stepDesc}>Pick a category to get started</Text>

      <View style={styles.categoryGrid}>
        {CREATION_CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            isActive={selectedCategory === cat.id}
            onPress={() => handleCategorySelect(cat)}
          />
        ))}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Describe your goal</Text>
      <Text style={styles.stepDesc}>What should the AI help you with?</Text>

      {selectedCategory && (
        <View style={styles.selectedCategoryBadge}>
          <Text style={styles.selectedCategoryEmoji}>
            {CREATION_CATEGORIES.find(c => c.id === selectedCategory)?.emoji}
          </Text>
          <Text style={styles.selectedCategoryLabel}>
            {CREATION_CATEGORIES.find(c => c.id === selectedCategory)?.label}
          </Text>
          <View style={styles.modelBadgeSmall}>
            <Text style={styles.modelBadgeText}>{MODEL_DETAILS[currentInputs.model].label}</Text>
          </View>
        </View>
      )}

      <GlassCard>
        <TextInput
          style={styles.textArea}
          placeholder={isVisual ? "Describe the scene or image you want..." : "What do you want the AI to do?"}
          placeholderTextColor={Colors.textTertiary}
          value={currentInputs.objective}
          onChangeText={(text) => setCurrentInputs({ objective: text })}
          multiline
          textAlignVertical="top"
          testID="objective-input"
        />
      </GlassCard>

      <View style={styles.chipSection}>
        <Text style={styles.fieldLabel}>Quick tags</Text>
        <ChipGroup
          chips={OBJECTIVE_CHIPS}
          selected={currentInputs.objectiveChips}
          onToggle={handleChipToggle}
          scrollable={false}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Fine-tune</Text>
      <Text style={styles.stepDesc}>Adjust for the best result</Text>

      {!isVisual && (
        <>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tone</Text>
            <ChipGroup
              chips={TONE_OPTIONS.map((t) => t.label)}
              selected={[currentInputs.tone.charAt(0).toUpperCase() + currentInputs.tone.slice(1)]}
              onToggle={(t) => setCurrentInputs({ tone: t.toLowerCase() as ToneType })}
              multiSelect={false}
              accentColor={Colors.secondary}
              accentDimColor={Colors.secondaryDim}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Length</Text>
            <ChipGroup
              chips={LENGTH_OPTIONS.map((l) => l.label)}
              selected={LENGTH_OPTIONS.filter((l) => l.value === currentInputs.length).map((l) => l.label)}
              onToggle={(l) => {
                const found = LENGTH_OPTIONS.find((o) => o.label === l);
                if (found) setCurrentInputs({ length: found.value });
              }}
              multiSelect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Output format</Text>
            <ChipGroup
              chips={OUTPUT_FORMATS}
              selected={[currentInputs.outputFormat.charAt(0).toUpperCase() + currentInputs.outputFormat.slice(1)]}
              onToggle={(f) => setCurrentInputs({ outputFormat: f.toLowerCase() })}
              multiSelect={false}
              accentColor={Colors.tertiary}
              accentDimColor={Colors.tertiaryDim}
            />
          </View>

          <GlassCard>
            <Text style={styles.innerLabel}>Audience</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g., developers, marketers, students..."
              placeholderTextColor={Colors.textTertiary}
              value={currentInputs.audience}
              onChangeText={(text) => setCurrentInputs({ audience: text })}
            />
            <View style={styles.innerSpacer} />
            <Text style={styles.innerLabel}>Constraints</Text>
            <TextInput
              style={[styles.inputField, styles.multiline]}
              placeholder="Any specific rules or limitations..."
              placeholderTextColor={Colors.textTertiary}
              value={currentInputs.constraints}
              onChangeText={(text) => setCurrentInputs({ constraints: text })}
              multiline
              textAlignVertical="top"
            />
          </GlassCard>
        </>
      )}

      {isVisual && (
        <>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Visual style</Text>
            <ChipGroup
              chips={STYLE_CHIPS}
              selected={currentInputs.style ? [currentInputs.style] : []}
              onToggle={(s) => setCurrentInputs({ style: currentInputs.style === s ? '' : s })}
              multiSelect={false}
              scrollable={false}
              accentColor={Colors.secondary}
              accentDimColor={Colors.secondaryDim}
            />
          </View>

          <GlassCard>
            <Text style={styles.innerLabel}>Lighting</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g., golden hour, studio, neon glow..."
              placeholderTextColor={Colors.textTertiary}
              value={currentInputs.lighting}
              onChangeText={(text) => setCurrentInputs({ lighting: text })}
            />

            {currentInputs.model === 'video' && (
              <>
                <View style={styles.innerSpacer} />
                <Text style={styles.innerLabel}>Camera angle</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g., aerial, close-up, tracking shot..."
                  placeholderTextColor={Colors.textTertiary}
                  value={currentInputs.cameraAngle}
                  onChangeText={(text) => setCurrentInputs({ cameraAngle: text })}
                />
              </>
            )}

            <View style={styles.innerSpacer} />
            <Text style={styles.innerLabel}>Negative prompt</Text>
            <TextInput
              style={styles.inputField}
              placeholder="What to avoid..."
              placeholderTextColor={Colors.textTertiary}
              value={currentInputs.negativePrompt}
              onChangeText={(text) => setCurrentInputs({ negativePrompt: text })}
            />
          </GlassCard>
        </>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.resultHeader}>
        <Text style={styles.stepTitle}>Ready</Text>
        <View style={styles.resultBadge}>
          <Sparkles size={14} color={Colors.accent} />
          <Text style={styles.resultBadgeText}>God-tier</Text>
        </View>
      </View>

      <GlassCard accent>
        <ScrollView style={styles.resultScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          <Text style={styles.resultText} selectable>
            {result.finalPrompt || 'Start by describing your objective...'}
          </Text>
        </ScrollView>
      </GlassCard>

      {result.metadata.assumptions.length > 0 && (
        <View style={styles.metaSection}>
          <Text style={styles.metaTitle}>💡 Assumptions</Text>
          {result.metadata.assumptions.map((a, i) => (
            <Text key={i} style={styles.metaItem}>{a}</Text>
          ))}
        </View>
      )}

      {result.metadata.questions.length > 0 && (
        <View style={styles.metaSection}>
          <Text style={styles.metaTitle}>❓ Consider adding</Text>
          {result.metadata.questions.map((q, i) => (
            <Text key={i} style={styles.metaQuestion}>{q}</Text>
          ))}
        </View>
      )}

      <View style={styles.actionGrid}>
        <GlassButton
          label="Copy Prompt"
          onPress={handleCopy}
          variant="primary"
          size="lg"
          icon={<Copy size={18} color={Colors.textInverse} />}
          fullWidth
        />
        <View style={styles.actionRow}>
          <GlassButton
            label={saved ? "Saved!" : "Save"}
            onPress={handleSave}
            variant="accent"
            size="md"
            icon={saved ? <Check size={16} color={Colors.accent} /> : <BookmarkPlus size={16} color={Colors.accent} />}
            fullWidth
          />
          <GlassButton
            label="Start over"
            onPress={handleReset}
            variant="ghost"
            size="md"
            icon={<RotateCcw size={16} color={Colors.textSecondary} />}
            fullWidth
          />
        </View>
      </View>
    </View>
  );

  const steps = [renderStep0, renderStep1, renderStep2, renderStep3];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientMid, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Zap size={16} color={Colors.accent} />
          </View>
          <Text style={styles.logoText}>PROMPTIA</Text>
        </View>
        <TouchableOpacity
          onPress={handleReset}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.resetBtn}
        >
          <RotateCcw size={16} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressWrapper}>
        <WizardProgress currentStep={step} totalSteps={4} stepLabels={STEP_LABELS} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {steps[step]()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LinearGradient
        colors={['transparent', Colors.background]}
        style={[styles.bottomGradient, { paddingBottom: Math.max(insets.bottom, 8) + 60 }]}
        pointerEvents="box-none"
      >
        <View style={styles.bottomNav}>
          {step > 0 ? (
            <GlassButton
              label="Back"
              onPress={goBack}
              variant="glass"
              size="md"
              icon={<ArrowLeft size={16} color={Colors.text} />}
            />
          ) : (
            <View />
          )}
          {step < 3 ? (
            <GlassButton
              label={step === 0 && !selectedCategory ? 'Select a category' : 'Next'}
              onPress={goNext}
              variant="primary"
              size="md"
              disabled={step === 0 && !selectedCategory}
              iconRight={<ArrowRight size={16} color={Colors.textInverse} />}
            />
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}

interface CategoryCardProps {
  category: CreationCategory;
  isActive: boolean;
  onPress: () => void;
}

const CategoryCard = React.memo(function CategoryCard({ category, isActive, onPress }: CategoryCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.categoryCardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.categoryCard,
          isActive && { borderColor: `${category.color}60`, backgroundColor: `${category.color}12` },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        {isActive && (
          <View style={[styles.categoryGlow, { backgroundColor: `${category.color}08` }]} />
        )}
        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
        <Text style={[styles.categoryLabel, isActive && { color: category.color }]} numberOfLines={1}>
          {category.label}
        </Text>
        {isActive && (
          <View style={[styles.categoryCheckDot, { backgroundColor: category.color }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: Colors.text,
    letterSpacing: 2,
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  stepContent: {
    gap: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  stepDesc: {
    fontSize: 15,
    color: Colors.textTertiary,
    marginTop: -12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCardWrapper: {
    width: (SCREEN_WIDTH - 50) / 2,
  },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  categoryGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoryCheckDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectedCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.glass,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignSelf: 'flex-start',
  },
  selectedCategoryEmoji: {
    fontSize: 18,
  },
  selectedCategoryLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modelBadgeSmall: {
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  modelBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  textArea: {
    fontSize: 16,
    color: Colors.text,
    minHeight: 110,
    lineHeight: 24,
  },
  chipSection: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  fieldGroup: {
    gap: 10,
  },
  innerLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  innerSpacer: {
    height: 16,
  },
  inputField: {
    backgroundColor: Colors.glass,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top' as const,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  resultScroll: {
    maxHeight: 260,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  metaSection: {
    gap: 6,
    backgroundColor: Colors.glass,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  metaTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  metaItem: {
    fontSize: 13,
    color: Colors.textTertiary,
    paddingLeft: 8,
  },
  metaQuestion: {
    fontSize: 13,
    color: Colors.secondary,
    paddingLeft: 8,
  },
  actionGrid: {
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 30,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});
