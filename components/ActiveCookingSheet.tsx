import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Clock,
  Plus,
  Star,
  ThumbsUp,
  ThumbsDown,
  Eye,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store/useAppStore';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

import { useKeepAwake } from 'expo-keep-awake';
import { api } from '../services/api';
import { analytics } from '../services/analytics';

export const ActiveCookingSheet: React.FC = () => {
  useKeepAwake();

  const isCookingMode = useAppStore((state) => state.isCookingMode);
  const selectedRecipe = useAppStore((state) => state.selectedRecipe);
  const exitCookingMode = useAppStore((state) => state.exitCookingMode);
  const cookingStepIndex = useAppStore((state) => state.cookingStepIndex);
  const setCookingStepIndex = useAppStore((state) => state.setCookingStepIndex);
  const cookingTimerSeconds = useAppStore((state) => state.cookingTimerSeconds);
  const setCookingTimerSeconds = useAppStore(
    (state) => state.setCookingTimerSeconds
  );
  const isTimerRunning = useAppStore((state) => state.isTimerRunning);
  const setIsTimerRunning = useAppStore((state) => state.setIsTimerRunning);
  const addCookingHistory = useAppStore((state) => state.addCookingHistory);
  const setToast = useAppStore((state) => state.setToast);

  // Post-cooking review state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [difficultyFeedback, setDifficultyFeedback] = useState<'Easy' | 'Just Right' | 'Challenging'>('Just Right');
  const [wouldCookAgain, setWouldCookAgain] = useState<boolean>(true);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  if (!isCookingMode || !selectedRecipe) return null;

  const totalSteps = selectedRecipe.instructions.length;
  const currentStepText = selectedRecipe.instructions[cookingStepIndex] || '';

  // Timing cue detection
  const minutesMatch = currentStepText.match(/(\d+)\s*(?:minutes|mins|min)/i);
  const detectedMinutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 5;

  const chefTip =
    selectedRecipe.tips && selectedRecipe.tips.length > 0
      ? selectedRecipe.tips[cookingStepIndex % selectedRecipe.tips.length]
      : null;

  // Countdown interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && cookingTimerSeconds > 0) {
      interval = setInterval(() => {
        setCookingTimerSeconds(cookingTimerSeconds - 1);
      }, 1000);
    } else if (cookingTimerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setToast('🔔 Step timer finished! Ready for the next stage.');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, cookingTimerSeconds]);

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  const handleToggleTimer = () => {
    triggerHaptic();
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    triggerHaptic();
    setIsTimerRunning(false);
    setCookingTimerSeconds(detectedMinutes * 60);
  };

  const handleAddMinute = () => {
    triggerHaptic();
    setCookingTimerSeconds(cookingTimerSeconds + 60);
  };

  const handlePrev = () => {
    if (cookingStepIndex > 0) {
      triggerHaptic();
      setCookingStepIndex(cookingStepIndex - 1);
    }
  };

  const handleNext = () => {
    triggerHaptic();
    analytics.trackCookingStepComplete(selectedRecipe.id, cookingStepIndex + 1, totalSteps);
    if (cookingStepIndex < totalSteps - 1) {
      setCookingStepIndex(cookingStepIndex + 1);
    } else {
      // Reached final step: open optional post-cook feedback
      setShowRatingModal(true);
    }
  };

  const handleCompleteWithReview = async (skipRating = false) => {
    setIsSubmittingReview(true);
    analytics.trackCookingComplete(
      selectedRecipe.id,
      totalSteps,
      undefined,
      skipRating ? undefined : userRating
    );
    try {
      if (!skipRating && selectedRecipe.id) {
        await api.recipes.rateRecipe(
          selectedRecipe.id,
          userRating,
          reviewNote,
          difficultyFeedback,
          wouldCookAgain
        );
      }
      await addCookingHistory(selectedRecipe, skipRating ? undefined : userRating, reviewNote);
      setToast('🎉 Recipe completed! Added to your cooking history.');
    } catch {
      await addCookingHistory(selectedRecipe, skipRating ? undefined : userRating);
      setToast('🎉 Recipe completed and saved locally.');
    } finally {
      setIsSubmittingReview(false);
      setShowRatingModal(false);
      exitCookingMode();
    }
  };

  const handleExitPrompt = () => {
    Alert.alert(
      'Exit Cooking Mode?',
      'Are you sure you want to exit guided cooking?',
      [
        { text: 'Keep Cooking', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => exitCookingMode(),
        },
      ]
    );
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const progress = Math.round(((cookingStepIndex + 1) / totalSteps) * 100);

  return (
    <SafeAreaView style={styles.fullscreen}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <View style={styles.topInfo}>
            <Text style={styles.cookingTitle} numberOfLines={1}>
              {selectedRecipe.title || selectedRecipe.name}
            </Text>
            <View style={styles.topMetaRow}>
              <Text style={styles.stepProgressText}>
                Step {cookingStepIndex + 1} of {totalSteps} ({progress}%)
              </Text>
              <View style={styles.awakeBadge}>
                <Eye size={10} color="#34D399" />
                <Text style={styles.awakeBadgeText}>Screen Awake</Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.exitBtn} onPress={handleExitPrompt} hitSlop={8}>
            <X size={20} color={COLORS.textInverted} />
          </Pressable>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>

        {/* Main Step Display */}
        <View style={styles.stepCardContainer}>
          <View style={styles.stepCard}>
            <View style={styles.stepBadgeRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>
                  STEP {cookingStepIndex + 1}
                </Text>
              </View>
              <Text style={styles.stepCountTotal}>
                {cookingStepIndex + 1}/{totalSteps}
              </Text>
            </View>

            <Text style={styles.stepInstructionText}>{currentStepText}</Text>

            {chefTip ? (
              <View style={styles.tipBox}>
                <Lightbulb size={16} color="#F59E0B" style={styles.tipIcon} />
                <Text style={styles.tipText}>{chefTip}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Timer Box */}
        <View style={styles.timerCard}>
          <View style={styles.timerHeader}>
            <Clock size={16} color={COLORS.primary} />
            <Text style={styles.timerLabel}>Step Timer</Text>
          </View>

          <Text style={styles.timerDisplay}>
            {formatTimer(cookingTimerSeconds)}
          </Text>

          <View style={styles.timerControlsRow}>
            <Pressable
              style={[
                styles.timerMainBtn,
                isTimerRunning && styles.timerMainBtnRunning,
              ]}
              onPress={handleToggleTimer}
            >
              {isTimerRunning ? (
                <>
                  <Pause size={15} color={COLORS.textInverted} fill={COLORS.textInverted} />
                  <Text style={styles.timerBtnText}>Pause</Text>
                </>
              ) : (
                <>
                  <Play size={15} color={COLORS.textInverted} fill={COLORS.textInverted} />
                  <Text style={styles.timerBtnText}>Start Timer</Text>
                </>
              )}
            </Pressable>

            <Pressable style={styles.timerSecBtn} onPress={handleAddMinute}>
              <Plus size={14} color={COLORS.textPrimary} />
              <Text style={styles.timerSecText}>+1 Min</Text>
            </Pressable>

            <Pressable style={styles.timerSecBtn} onPress={handleResetTimer}>
              <RotateCcw size={14} color={COLORS.textPrimary} />
              <Text style={styles.timerSecText}>Reset</Text>
            </Pressable>
          </View>
        </View>

        {/* Large Navigation Controls */}
        <View style={styles.bottomNavRow}>
          <Pressable
            style={[
              styles.navBtn,
              styles.prevBtn,
              cookingStepIndex === 0 && styles.navBtnDisabled,
            ]}
            onPress={handlePrev}
            disabled={cookingStepIndex === 0}
          >
            <ChevronLeft
              size={20}
              color={cookingStepIndex === 0 ? COLORS.textLight : COLORS.textPrimary}
            />
            <Text
              style={[
                styles.navBtnText,
                cookingStepIndex === 0 && styles.navBtnTextDisabled,
              ]}
            >
              Previous
            </Text>
          </Pressable>

          <Pressable
            style={[styles.navBtn, styles.nextBtn]}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>
              {cookingStepIndex === totalSteps - 1 ? 'Finish Cooking 🎉' : 'Next Step'}
            </Text>
            {cookingStepIndex < totalSteps - 1 ? (
              <ChevronRight size={20} color={COLORS.textInverted} />
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* Post Cooking Rating & Completion Modal */}
      <Modal
        visible={showRatingModal}
        transparent
        animationType="fade"
        onRequestClose={() => handleCompleteWithReview(true)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Dish Complete!</Text>
            <Text style={styles.modalSubtitle}>
              How was cooking {selectedRecipe.title || selectedRecipe.name}?
            </Text>

            {/* 1 - 5 Stars */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setUserRating(star)}
                  hitSlop={8}
                >
                  <Star
                    size={32}
                    color={star <= userRating ? '#FBBF24' : '#4B5563'}
                    fill={star <= userRating ? '#FBBF24' : 'transparent'}
                  />
                </Pressable>
              ))}
            </View>

            {/* Difficulty feedback */}
            <Text style={styles.feedbackLabel}>Recipe Difficulty</Text>
            <View style={styles.difficultyRow}>
              {(['Easy', 'Just Right', 'Challenging'] as const).map((diff) => (
                <Pressable
                  key={diff}
                  style={[
                    styles.diffBtn,
                    difficultyFeedback === diff && styles.diffBtnSelected,
                  ]}
                  onPress={() => setDifficultyFeedback(diff)}
                >
                  <Text
                    style={[
                      styles.diffBtnText,
                      difficultyFeedback === diff && styles.diffBtnTextSelected,
                    ]}
                  >
                    {diff}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Would Cook Again */}
            <Text style={styles.feedbackLabel}>Would you cook this again?</Text>
            <View style={styles.wouldCookRow}>
              <Pressable
                style={[
                  styles.wouldCookBtn,
                  wouldCookAgain && styles.wouldCookBtnSelected,
                ]}
                onPress={() => setWouldCookAgain(true)}
              >
                <ThumbsUp size={14} color={wouldCookAgain ? COLORS.textInverted : COLORS.textPrimary} />
                <Text
                  style={[
                    styles.wouldCookBtnText,
                    wouldCookAgain && styles.wouldCookBtnTextSelected,
                  ]}
                >
                  Yes
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.wouldCookBtn,
                  !wouldCookAgain && styles.wouldCookBtnSelected,
                ]}
                onPress={() => setWouldCookAgain(false)}
              >
                <ThumbsDown size={14} color={!wouldCookAgain ? COLORS.textInverted : COLORS.textPrimary} />
                <Text
                  style={[
                    styles.wouldCookBtnText,
                    !wouldCookAgain && styles.wouldCookBtnTextSelected,
                  ]}
                >
                  No
                </Text>
              </Pressable>
            </View>

            {/* Optional note */}
            <TextInput
              style={styles.reviewInput}
              placeholder="Chef's notes (optional tweaks, salt adjustments)..."
              placeholderTextColor="#6B7280"
              value={reviewNote}
              onChangeText={setReviewNote}
            />

            {/* Submit / Skip buttons */}
            <View style={styles.modalActionRow}>
              <Pressable
                style={styles.skipBtn}
                onPress={() => handleCompleteWithReview(true)}
                disabled={isSubmittingReview}
              >
                <Text style={styles.skipBtnText}>Skip</Text>
              </Pressable>

              <Pressable
                style={styles.saveReviewBtn}
                onPress={() => handleCompleteWithReview(false)}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? (
                  <ActivityIndicator size="small" color={COLORS.textInverted} />
                ) : (
                  <Text style={styles.saveReviewBtnText}>Save & Finish</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#141414',
    zIndex: 9999,
  },
  container: {
    flex: 1,
    backgroundColor: '#141414',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  topInfo: {
    flex: 1,
    marginRight: 10,
  },
  cookingTitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textInverted,
  },
  stepProgressText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginTop: 2,
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: '#262626',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  stepCardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  stepCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#333333',
  },
  stepBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stepBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  stepBadgeText: {
    color: COLORS.textInverted,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 0.8,
  },
  stepCountTotal: {
    color: '#737373',
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  stepInstructionText: {
    fontSize: 19,
    color: COLORS.textInverted,
    lineHeight: 28,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: '#2E2719',
    padding: 12,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: '#4A3B18',
    gap: 8,
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#FDE68A',
    lineHeight: 18,
  },
  timerCard: {
    backgroundColor: '#1F1F1F',
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  timerLabel: {
    color: COLORS.textLight,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.bold,
    textTransform: 'uppercase',
  },
  timerDisplay: {
    fontSize: 40,
    fontFamily: 'monospace',
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textInverted,
    letterSpacing: 1,
    marginVertical: 4,
  },
  timerControlsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    width: '100%',
  },
  timerMainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  timerMainBtnRunning: {
    backgroundColor: COLORS.warning,
  },
  timerBtnText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  timerSecBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E2E2E',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  timerSecText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  bottomNavRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    backgroundColor: '#141414',
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  navBtn: {
    height: 52,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  prevBtn: {
    flex: 1,
    backgroundColor: '#262626',
  },
  nextBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  navBtnTextDisabled: {
    color: COLORS.textLight,
  },
  nextBtnText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  awakeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  awakeBadgeText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#34D399',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#333333',
    gap: 12,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textInverted,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  feedbackLabel: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#D1D5DB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  diffBtnSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  diffBtnText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#D1D5DB',
  },
  diffBtnTextSelected: {
    color: COLORS.textInverted,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  wouldCookRow: {
    flexDirection: 'row',
    gap: 10,
  },
  wouldCookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  wouldCookBtnSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  wouldCookBtnText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#D1D5DB',
  },
  wouldCookBtnTextSelected: {
    color: COLORS.textInverted,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  reviewInput: {
    backgroundColor: '#262626',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#3D3D3D',
    padding: 10,
    color: COLORS.textInverted,
    fontSize: 12,
    minHeight: 44,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  saveReviewBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveReviewBtnText: {
    fontSize: 13,
    color: COLORS.textInverted,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
