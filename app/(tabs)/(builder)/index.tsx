import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native';
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  FadeOut,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import Colors from '@/constants/colors';
import {
  ASPECT_RATIO_OPTIONS,
  CAMERA_MOVEMENT_OPTIONS,
  COLOR_PALETTE_OPTIONS,
  CREATION_CATEGORIES,
  LANGUAGE_OPTIONS,
  LENGTH_OPTIONS,
  MOOD_OPTIONS,
  OBJECTIVE_QUICK_TAGS,
  OUTPUT_FORMAT_OPTIONS,
  TONE_OPTIONS,
  VIDEO_DURATION_OPTIONS,
  VISUAL_QUALITY_OPTIONS,
  getCategoryById,
} from '@/data/gallerySeed';
import { getModelLabel } from '@/engine/promptEngine';
import { usePromptStore } from '@/store/promptStore';
import { PromptCategory, WizardStep } from '@/types/prompt';
import { sharePromptText } from '@/utils/sharePrompt';
import { AnimatedChip } from '@/components/AnimatedChip';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { SectionBlock } from '@/components/SectionBlock';
import { WizardProgress } from '@/components/WizardProgress';

const STEP_LABELS = ['Type', 'Objective', 'Context', 'Fine-tune', 'Generate'];

function wordsToTokens(value: string): number {
  const words = value.trim().split(/\s+/).filter(Boolean).length;
  return Math.round(words * 1.3);
}

function scoreColor(score: number): string {
  if (score < 50) {
    return '#EF4444';
  }
  if (score <= 75) {
    return '#F59E0B';
  }
  return '#22C55E';
}

function CategoryCard({
  categoryId,
  selected,
  onPress,
}: {
  categoryId: PromptCategory;
  selected: boolean;
  onPress: (category: PromptCategory) => void;
}) {
  const category = getCategoryById(categoryId);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!selected) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      return;
    }

    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }, () => {
      scale.value = withSpring(1.03, { damping: 15, stiffness: 200 }, () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      });
    });
  }, [scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(category.id);
  }, [category.id, onPress]);

  return (
    <Animated.View style={[styles.categoryWrap, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ width: '100%' }}
      >
        <GlassCard
          variant="interactive"
          accentColor={selected ? category.accentColor : undefined}
          style={[styles.categoryCard, selected && { borderColor: category.accentColor }]}
        >
          <Text style={styles.categoryEmoji}>{category.emoji}</Text>
          <Text style={styles.categoryTitle}>{category.label}</Text>
          <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

export default function BuilderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    builder,
    selectCategory,
    updateGoal,
    toggleQuickTag,
    updateContext,
    updateFineTune,
    setBuilderStep,
    generateCurrentPrompt,
    setPromptVariant,
    saveCurrentPrompt,
    resetBuilder,
  } = usePromptStore();

  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [hasSelectedCategory, setHasSelectedCategory] = useState(builder.step > 1 || builder.config.goal.trim().length > 0);

  const selectedCategory = useMemo(() => getCategoryById(builder.config.category), [builder.config.category]);
  const isTextCategory = selectedCategory.type === 'text';
  const isImageCategory = selectedCategory.type === 'image';
  const isVideoCategory = selectedCategory.type === 'video';

  const tokenEstimate = useMemo(() => wordsToTokens(builder.config.goal), [builder.config.goal]);
  const activePrompt = useMemo(() => {
    if (!builder.result) {
      return '';
    }
    return builder.promptVariant === 'full' ? builder.result.fullPrompt : builder.result.concisePrompt;
  }, [builder.promptVariant, builder.result]);

  const goToStep = useCallback(
    (step: WizardStep) => {
      setDirection(step > builder.step ? 'forward' : 'back');
      setBuilderStep(step);
    },
    [builder.step, setBuilderStep]
  );

  const nextStep = useCallback(() => {
    if (builder.step === 1) {
      if (!hasSelectedCategory) {
        return;
      }
      goToStep(2);
      return;
    }

    if (builder.step === 2) {
      if (builder.config.goal.trim().length === 0) {
        Alert.alert('Goal required', 'Describe your goal to continue.');
        return;
      }
      goToStep(3);
      return;
    }

    if (builder.step === 3) {
      goToStep(4);
      return;
    }

    if (builder.step === 4) {
      generateCurrentPrompt();
      goToStep(5);
    }
  }, [builder.config.goal, builder.step, generateCurrentPrompt, goToStep, hasSelectedCategory]);

  const prevStep = useCallback(() => {
    if (builder.step > 1) {
      goToStep((builder.step - 1) as WizardStep);
    }
  }, [builder.step, goToStep]);

  const handleCategorySelect = useCallback(
    (category: PromptCategory) => {
      selectCategory(category);
      setHasSelectedCategory(true);
    },
    [selectCategory]
  );

  const handleQuickTagToggle = useCallback(
    (tag: string) => {
      toggleQuickTag(tag, true);
    },
    [toggleQuickTag]
  );

  const handleCopyPrompt = useCallback(async () => {
    if (!activePrompt) {
      return;
    }

    await Clipboard.setStringAsync(activePrompt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowToast('Copied!');
  }, [activePrompt]);

  const handleSavePrompt = useCallback(() => {
    const saved = saveCurrentPrompt();

    if (!saved) {
      Alert.alert('Cannot save', 'Please generate a prompt first.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved to Library', 'Your prompt is now in Library.', [
      { text: 'Close', style: 'cancel' },
      {
        text: 'View in Library',
        onPress: () => router.push('/(tabs)/saved'),
      },
    ]);
  }, [router, saveCurrentPrompt]);

  const handleSharePrompt = useCallback(async () => {
    if (!activePrompt) {
      return;
    }

    await sharePromptText(activePrompt, 'Promptia Prompt');
  }, [activePrompt]);

  const handleRebuild = useCallback(() => {
    resetBuilder();
    setHasSelectedCategory(false);
    setDirection('back');
  }, [resetBuilder]);

  const handleMissingTap = useCallback(
    (stepToGoBack: 2 | 3 | 4) => {
      goToStep(stepToGoBack);
    },
    [goToStep]
  );

  useEffect(() => {
    if (!showToast) {
      return;
    }

    const timer = setTimeout(() => setShowToast(null), 1200);
    return () => clearTimeout(timer);
  }, [showToast]);

  const stepEntering = direction === 'forward' ? FadeInRight.duration(250) : FadeInLeft.duration(250);

  const renderStep1 = useCallback(() => {
    return (
      <View style={styles.stepBody}>
        <Text style={styles.heading}>What are you creating?</Text>
        <Text style={styles.subheading}>Pick a category to get started</Text>

        <FlatList
          data={CREATION_CATEGORIES.map((item) => item.id)}
          keyExtractor={(item) => item}
          numColumns={2}
          windowSize={5}
          scrollEnabled={false}
          contentContainerStyle={styles.categoryList}
          columnWrapperStyle={styles.categoryRow}
          renderItem={({ item }) => (
            <CategoryCard
              categoryId={item}
              selected={selectedCategory.id === item && hasSelectedCategory}
              onPress={handleCategorySelect}
            />
          )}
        />
      </View>
    );
  }, [handleCategorySelect, hasSelectedCategory, selectedCategory.id]);

  const renderStep2 = useCallback(() => {
    return (
      <View style={styles.stepBody}>
        <Text style={styles.heading}>Describe your goal</Text>
        <Text style={styles.subheading}>
          {selectedCategory.emoji} {selectedCategory.label} · {getModelLabel(builder.config.targetModel ?? selectedCategory.recommendedModel)}
        </Text>

        {selectedCategory.id === 'custom' ? (
          <GlassCard>
            <Text style={styles.fieldLabel}>Custom category name</Text>
            <TextInput
              value={builder.config.context.customCategoryName}
              onChangeText={(value) => updateContext({ customCategoryName: value })}
              placeholder="e.g. Podcast Script"
              placeholderTextColor={Colors.textTertiary}
              style={styles.input}
            />
          </GlassCard>
        ) : null}

        <GlassCard>
          <TextInput
            value={builder.config.goal}
            onChangeText={updateGoal}
            placeholder="What do you want the AI to do?"
            placeholderTextColor={Colors.textTertiary}
            multiline
            style={styles.textArea}
            textAlignVertical="top"
          />
          <Text style={styles.tokenCounter}>{tokenEstimate} tokens est.</Text>
        </GlassCard>

        <View style={styles.chipsWrap}>
          {OBJECTIVE_QUICK_TAGS.map((tag) => (
            <AnimatedChip
              key={tag}
              label={tag}
              selected={builder.config.quickTags.includes(tag)}
              onPress={() => handleQuickTagToggle(tag)}
              accentColor={selectedCategory.accentColor}
            />
          ))}
        </View>
      </View>
    );
  }, [
    builder.config.context.customCategoryName,
    builder.config.goal,
    builder.config.quickTags,
    builder.config.targetModel,
    handleQuickTagToggle,
    selectedCategory,
    tokenEstimate,
    updateContext,
    updateGoal,
  ]);

  const renderStep3 = useCallback(() => {
    return (
      <View style={styles.stepBody}>
        <Text style={styles.heading}>Add context</Text>
        <Text style={styles.subheading}>The more context, the better the prompt</Text>

        {isTextCategory ? (
          <View style={styles.stack}>
            <GlassCard>
              <Text style={styles.fieldLabel}>🎭 Who is the AI?</Text>
              <TextInput
                value={builder.config.context.role}
                onChangeText={(value) => updateContext({ role: value })}
                placeholder="Senior growth marketer with 10y SaaS experience"
                placeholderTextColor={Colors.textTertiary}
                style={styles.input}
              />
            </GlassCard>

            <GlassCard>
              <Text style={styles.fieldLabel}>👤 Who is the user / audience?</Text>
              <TextInput
                value={builder.config.context.audience}
                onChangeText={(value) => updateContext({ audience: value })}
                placeholder="B2B CTOs, non-technical, skeptical"
                placeholderTextColor={Colors.textTertiary}
                style={styles.input}
              />
            </GlassCard>

            <GlassCard>
              <Text style={styles.fieldLabel}>🧠 Any background info?</Text>
              <TextInput
                value={builder.config.context.background}
                onChangeText={(value) => updateContext({ background: value })}
                placeholder="Our product is X, we need to achieve Y"
                placeholderTextColor={Colors.textTertiary}
                multiline
                textAlignVertical="top"
                style={styles.textAreaCompact}
              />
            </GlassCard>

            <GlassCard>
              <View style={styles.toggleRow}>
                <Text style={styles.fieldLabel}>Add chain-of-thought guidance</Text>
                <Switch
                  value={Boolean(builder.config.context.addChainOfThought)}
                  onValueChange={(value) => updateContext({ addChainOfThought: value })}
                  trackColor={{ false: 'rgba(255,255,255,0.25)', true: `${selectedCategory.accentColor}70` }}
                  thumbColor={builder.config.context.addChainOfThought ? selectedCategory.accentColor : '#ddd'}
                />
              </View>
            </GlassCard>
          </View>
        ) : null}

        {isImageCategory ? (
          <View style={styles.stack}>
            <GlassCard>
              <Text style={styles.fieldLabel}>Style artistique</Text>
              <TextInput
                value={builder.config.context.style}
                onChangeText={(value) => updateContext({ style: value })}
                placeholder="cinematic, neon noir, hyperrealistic"
                placeholderTextColor={Colors.textTertiary}
                style={styles.input}
              />
            </GlassCard>

            <GlassCard>
              <Text style={styles.fieldLabel}>Artiste / référence</Text>
              <TextInput
                value={builder.config.context.artistReference}
                onChangeText={(value) => updateContext({ artistReference: value })}
                placeholder="Greg Rutkowski, Moebius"
                placeholderTextColor={Colors.textTertiary}
                style={styles.input}
              />
            </GlassCard>

            <View style={styles.stackSm}>
              <Text style={styles.fieldLabel}>Palette de couleurs</Text>
              <View style={styles.chipsWrap}>
                {COLOR_PALETTE_OPTIONS.map((option) => {
                  const selected = builder.config.context.colorPalettes?.includes(option) ?? false;
                  return (
                    <AnimatedChip
                      key={option}
                      label={option}
                      selected={selected}
                      onPress={() => {
                        const current = builder.config.context.colorPalettes ?? [];
                        const next = selected ? current.filter((item) => item !== option) : [...current, option];
                        updateContext({ colorPalettes: next });
                      }}
                      accentColor={selectedCategory.accentColor}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.stackSm}>
              <Text style={styles.fieldLabel}>Mood</Text>
              <View style={styles.chipsWrap}>
                {MOOD_OPTIONS.map((option) => {
                  const selected = builder.config.context.moods?.includes(option) ?? false;
                  return (
                    <AnimatedChip
                      key={option}
                      label={option}
                      selected={selected}
                      onPress={() => {
                        const current = builder.config.context.moods ?? [];
                        const next = selected ? current.filter((item) => item !== option) : [...current, option];
                        updateContext({ moods: next });
                      }}
                      accentColor={selectedCategory.accentColor}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        ) : null}

        {isVideoCategory ? (
          <View style={styles.stack}>
            <View style={styles.stackSm}>
              <Text style={styles.fieldLabel}>Camera movement</Text>
              <View style={styles.chipsWrap}>
                {CAMERA_MOVEMENT_OPTIONS.map((option) => (
                  <AnimatedChip
                    key={option}
                    label={option}
                    selected={builder.config.context.cameraMovement === option}
                    onPress={() => updateContext({ cameraMovement: option })}
                    accentColor={selectedCategory.accentColor}
                  />
                ))}
              </View>
            </View>

            <View style={styles.stackSm}>
              <Text style={styles.fieldLabel}>Duration</Text>
              <View style={styles.chipsWrap}>
                {VIDEO_DURATION_OPTIONS.map((option) => (
                  <AnimatedChip
                    key={String(option)}
                    label={`${option}s`}
                    selected={builder.config.context.durationSeconds === option}
                    onPress={() => updateContext({ durationSeconds: option })}
                    accentColor={selectedCategory.accentColor}
                  />
                ))}
              </View>
            </View>

            <GlassCard>
              <Text style={styles.fieldLabel}>Scene background</Text>
              <TextInput
                value={builder.config.context.background}
                onChangeText={(value) => updateContext({ background: value })}
                placeholder="A rainy rooftop in Tokyo with reflective puddles"
                placeholderTextColor={Colors.textTertiary}
                style={styles.input}
              />
            </GlassCard>
          </View>
        ) : null}
      </View>
    );
  }, [
    builder.config.context.addChainOfThought,
    builder.config.context.artistReference,
    builder.config.context.audience,
    builder.config.context.background,
    builder.config.context.cameraMovement,
    builder.config.context.colorPalettes,
    builder.config.context.durationSeconds,
    builder.config.context.moods,
    builder.config.context.role,
    builder.config.context.style,
    isImageCategory,
    isTextCategory,
    isVideoCategory,
    selectedCategory.accentColor,
    updateContext,
  ]);

  const renderStep4 = useCallback(() => {
    return (
      <View style={styles.stepBody}>
        <Text style={styles.heading}>Fine-tune</Text>
        <Text style={styles.subheading}>Adjust for the best result</Text>

        {(isTextCategory || isVideoCategory) && (
          <View style={styles.stackSm}>
            <Text style={styles.fieldLabel}>Tone</Text>
            <View style={styles.chipsWrap}>
              {TONE_OPTIONS.map((tone) => (
                <AnimatedChip
                  key={tone}
                  label={tone[0].toUpperCase() + tone.slice(1)}
                  selected={builder.config.finetuneOptions.tone === tone}
                  onPress={() => updateFineTune({ tone })}
                  accentColor={selectedCategory.accentColor}
                />
              ))}
            </View>
          </View>
        )}

        {(isTextCategory || isVideoCategory) && (
          <View style={styles.stackSm}>
            <Text style={styles.fieldLabel}>Length</Text>
            <View style={styles.chipsWrap}>
              {LENGTH_OPTIONS.map((option) => (
                <AnimatedChip
                  key={option.value}
                  label={option.label}
                  selected={builder.config.finetuneOptions.length === option.value}
                  onPress={() => updateFineTune({ length: option.value })}
                  accentColor={selectedCategory.accentColor}
                />
              ))}
            </View>
          </View>
        )}

        {isTextCategory && (
          <View style={styles.stackSm}>
            <Text style={styles.fieldLabel}>Output format</Text>
            <View style={styles.chipsWrap}>
              {OUTPUT_FORMAT_OPTIONS.map((option) => (
                <AnimatedChip
                  key={option}
                  label={option[0].toUpperCase() + option.slice(1)}
                  selected={builder.config.finetuneOptions.outputFormat === option}
                  onPress={() => updateFineTune({ outputFormat: option })}
                  accentColor={selectedCategory.accentColor}
                />
              ))}
            </View>
          </View>
        )}

        {isTextCategory && (
          <View style={styles.stackSm}>
            <Text style={styles.fieldLabel}>Language</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
              {LANGUAGE_OPTIONS.map((option) => (
                <AnimatedChip
                  key={option}
                  label={option}
                  selected={builder.config.finetuneOptions.language === option}
                  onPress={() => updateFineTune({ language: option })}
                  accentColor={selectedCategory.accentColor}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {(isImageCategory || isVideoCategory) && (
          <View style={styles.stackSm}>
            <Text style={styles.fieldLabel}>Aspect ratio</Text>
            <View style={styles.chipsWrap}>
              {ASPECT_RATIO_OPTIONS.map((option) => (
                <AnimatedChip
                  key={option}
                  label={option}
                  selected={builder.config.finetuneOptions.aspectRatio === option}
                  onPress={() => updateFineTune({ aspectRatio: option })}
                  accentColor={selectedCategory.accentColor}
                />
              ))}
            </View>
          </View>
        )}

        {(isImageCategory || isVideoCategory) && (
          <View style={styles.stackSm}>
            <Text style={styles.fieldLabel}>Quality</Text>
            <View style={styles.chipsWrap}>
              {VISUAL_QUALITY_OPTIONS.map((option) => (
                <AnimatedChip
                  key={option}
                  label={option}
                  selected={builder.config.finetuneOptions.quality === option}
                  onPress={() => updateFineTune({ quality: option })}
                  accentColor={selectedCategory.accentColor}
                />
              ))}
            </View>
          </View>
        )}

        {(isImageCategory || isVideoCategory) && (
          <GlassCard>
            <Text style={styles.fieldLabel}>Negative prompt</Text>
            <TextInput
              value={builder.config.finetuneOptions.negativePrompt}
              onChangeText={(value) => updateFineTune({ negativePrompt: value })}
              placeholder="Elements to exclude..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              textAlignVertical="top"
              style={styles.textAreaCompact}
            />
          </GlassCard>
        )}

        {isTextCategory && (
          <GlassCard>
            <Pressable
              onPress={() => setAdvancedOpen((prev) => !prev)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.advancedHeader}
            >
              <Text style={styles.fieldLabel}>Advanced</Text>
              {advancedOpen ? <ChevronUp size={16} color={Colors.textSecondary} /> : <ChevronDown size={16} color={Colors.textSecondary} />}
            </Pressable>

            {advancedOpen ? (
              <View style={styles.stackSm}>
                <TextInput
                  value={builder.config.finetuneOptions.audience}
                  onChangeText={(value) => updateFineTune({ audience: value })}
                  placeholder="Audience"
                  placeholderTextColor={Colors.textTertiary}
                  style={styles.input}
                />
                <TextInput
                  value={builder.config.finetuneOptions.constraints}
                  onChangeText={(value) => updateFineTune({ constraints: value })}
                  placeholder="Any specific rules or limitations..."
                  placeholderTextColor={Colors.textTertiary}
                  style={styles.textAreaCompact}
                  multiline
                  textAlignVertical="top"
                />

                <View style={styles.toggleRow}>
                  <Text style={styles.fieldLabel}>Add examples</Text>
                  <Switch
                    value={Boolean(builder.config.finetuneOptions.addExamples)}
                    onValueChange={(value) => updateFineTune({ addExamples: value })}
                    trackColor={{ false: 'rgba(255,255,255,0.25)', true: `${selectedCategory.accentColor}70` }}
                    thumbColor={builder.config.finetuneOptions.addExamples ? selectedCategory.accentColor : '#ddd'}
                  />
                </View>

                {builder.config.finetuneOptions.addExamples ? (
                  <View style={styles.stackSm}>
                    <TextInput
                      value={builder.config.finetuneOptions.examplePair?.input}
                      onChangeText={(value) =>
                        updateFineTune({
                          examplePair: {
                            input: value,
                            output: builder.config.finetuneOptions.examplePair?.output ?? '',
                          },
                        })
                      }
                      placeholder="Example input"
                      placeholderTextColor={Colors.textTertiary}
                      style={styles.input}
                    />
                    <TextInput
                      value={builder.config.finetuneOptions.examplePair?.output}
                      onChangeText={(value) =>
                        updateFineTune({
                          examplePair: {
                            input: builder.config.finetuneOptions.examplePair?.input ?? '',
                            output: value,
                          },
                        })
                      }
                      placeholder="Example output"
                      placeholderTextColor={Colors.textTertiary}
                      style={styles.textAreaCompact}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
          </GlassCard>
        )}
      </View>
    );
  }, [
    advancedOpen,
    builder.config.finetuneOptions,
    isImageCategory,
    isTextCategory,
    isVideoCategory,
    selectedCategory.accentColor,
    updateFineTune,
  ]);

  const renderStep5 = useCallback(() => {
    if (!builder.result) {
      return (
        <View style={styles.stepBody}>
          <Text style={styles.heading}>Ready</Text>
          <Text style={styles.subheading}>Generate your prompt first</Text>
        </View>
      );
    }

    return (
      <View style={styles.stepBody}> 
        <View style={styles.readyHeader}>
          <View style={styles.readyTitleWrap}>
            <Text style={styles.heading}>Ready</Text>
            <View style={styles.godBadge}>
              <Sparkles size={13} color={Colors.accent} />
              <Text style={styles.godBadgeText}>God-tier</Text>
            </View>
          </View>

          <Animated.View entering={ZoomIn.delay(400).springify()}>
            <View style={[styles.scoreBadge, { borderColor: `${scoreColor(builder.result.qualityScore)}88`, backgroundColor: `${scoreColor(builder.result.qualityScore)}22` }]}>
              <Text style={[styles.scoreText, { color: scoreColor(builder.result.qualityScore) }]}>{builder.result.qualityScore}</Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.toggleLine}>
          <AnimatedChip
            label="Full"
            selected={builder.promptVariant === 'full'}
            onPress={() => setPromptVariant('full')}
            accentColor={selectedCategory.accentColor}
          />
          <AnimatedChip
            label="Concise"
            selected={builder.promptVariant === 'concise'}
            onPress={() => setPromptVariant('concise')}
            accentColor={selectedCategory.accentColor}
          />
        </View>

        {builder.promptVariant === 'full' ? (
          <View style={styles.stack}>
            {builder.result.sections.map((section, index) => (
              <Animated.View key={`${section.id}-${index}`} entering={FadeInUp.delay(index * 80).duration(250)}>
                <SectionBlock section={section} onCopied={() => setShowToast('Copied!')} />
              </Animated.View>
            ))}
          </View>
        ) : (
          <GlassCard>
            <Text style={styles.conciseText}>{builder.result.concisePrompt}</Text>
          </GlassCard>
        )}

        {builder.result.assumptions.length > 0 ? (
          <GlassCard>
            <Text style={styles.cardTitle}>Assumptions</Text>
            {builder.result.assumptions.map((item) => (
              <Text key={item} style={styles.metaItem}>
                • {item}
              </Text>
            ))}
          </GlassCard>
        ) : null}

        {builder.result.missingInfo.length > 0 ? (
          <GlassCard>
            <Text style={styles.cardTitle}>Consider adding</Text>
            <View style={styles.chipsWrap}>
              {builder.result.missingInfo.map((item) => (
                <AnimatedChip
                  key={item.id}
                  label={item.label}
                  selected={false}
                  onPress={() => handleMissingTap(item.stepToGoBack)}
                  accentColor={selectedCategory.accentColor}
                />
              ))}
            </View>
          </GlassCard>
        ) : null}

        <GlassCard>
          <Text style={styles.cardTitle}>Improvement suggestions</Text>
          {builder.result.improvementSuggestions.map((item) => (
            <Text key={item} style={styles.metaItem}>
              • {item}
            </Text>
          ))}
        </GlassCard>
      </View>
    );
  }, [
    builder.promptVariant,
    builder.result,
    handleMissingTap,
    selectedCategory.accentColor,
    setPromptVariant,
  ]);

  const renderCurrentStep = useMemo(() => {
    switch (builder.step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
      default:
        return renderStep5();
    }
  }, [builder.step, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundGradientMid, Colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[`${selectedCategory.accentColor}14`, 'rgba(8,8,8,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.atmosphereGlow}
      />

      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.progressWrap, { paddingTop: insets.top + 8 }]}> 
          <WizardProgress
            currentStep={builder.step}
            totalSteps={5}
            stepLabels={STEP_LABELS}
            accentColor={selectedCategory.accentColor}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: builder.step === 5 ? 190 : 120 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View key={`${builder.step}-${direction}`} entering={stepEntering} exiting={FadeOut.duration(180)}>
            {renderCurrentStep}
          </Animated.View>
        </ScrollView>

        {builder.step < 5 ? (
          <View style={[styles.navBar, { paddingBottom: insets.bottom + 12 }]}> 
            <View style={styles.navRow}>
              {builder.step > 1 ? (
                <GlowButton title="Back" variant="secondary" size="medium" onPress={prevStep} style={styles.navHalf} />
              ) : (
                <View style={styles.navHalf} />
              )}
              <GlowButton
                title={builder.step === 4 ? 'Generate' : 'Next'}
                size="medium"
                onPress={nextStep}
                style={styles.navHalf}
              />
            </View>
          </View>
        ) : (
          <View style={[styles.actionBar, { paddingBottom: insets.bottom + 10 }]}> 
            <View style={styles.actionRow}>
              <GlowButton title="Copy" variant="secondary" size="medium" onPress={handleCopyPrompt} style={styles.actionHalf} />
              <GlowButton title="Save" variant="primary" size="medium" onPress={handleSavePrompt} style={styles.actionHalf} />
            </View>
            <View style={styles.actionRow}>
              <GlowButton title="Share" variant="secondary" size="medium" onPress={handleSharePrompt} style={styles.actionHalf} />
              <GlowButton title="Rebuild" variant="destructive" size="medium" onPress={handleRebuild} style={styles.actionHalf} />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {showToast ? (
        <View style={[styles.toast, { bottom: insets.bottom + (builder.step === 5 ? 160 : 92) }]}>
          <Text style={styles.toastText}>{showToast}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  atmosphereGlow: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: -100,
    height: 320,
  },
  progressWrap: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  stepBody: {
    gap: 14,
  },
  heading: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#fff',
  },
  subheading: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: -2,
  },
  categoryList: {
    gap: 10,
  },
  categoryRow: {
    gap: 10,
  },
  categoryWrap: {
    flex: 1,
    maxWidth: '50%',
  },
  categoryCard: {
    minHeight: 132,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  categorySubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  input: {
    fontSize: 15,
    color: Colors.text,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 140,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  textAreaCompact: {
    minHeight: 104,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tokenCounter: {
    alignSelf: 'flex-end',
    marginTop: 8,
    fontSize: 12,
    color: Colors.textTertiary,
  },
  fieldLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  horizontalChips: {
    gap: 8,
    paddingRight: 12,
  },
  stack: {
    gap: 12,
  },
  stackSm: {
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  advancedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  readyTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  godBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.45)',
    backgroundColor: 'rgba(245,158,11,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  godBadgeText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '700',
  },
  scoreBadge: {
    minWidth: 52,
    height: 34,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '800',
  },
  toggleLine: {
    flexDirection: 'row',
    gap: 8,
  },
  conciseText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  cardTitle: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 8,
  },
  metaItem: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  navBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(8,8,8,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
  },
  navHalf: {
    flex: 1,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    backgroundColor: 'rgba(8,8,8,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionHalf: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(18,18,18,0.95)',
    alignItems: 'center',
  },
  toastText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
