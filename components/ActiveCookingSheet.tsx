import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Alert,
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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store/useAppStore';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

export const ActiveCookingSheet: React.FC = () => {
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
    if (cookingStepIndex < totalSteps - 1) {
      setCookingStepIndex(cookingStepIndex + 1);
    } else {
      // Finished cooking!
      addCookingHistory(selectedRecipe, 5);
      setToast('🎉 Recipe finished! Added to your cooking history.');
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
            <Text style={styles.stepProgressText}>
              Step {cookingStepIndex + 1} of {totalSteps} ({progress}%)
            </Text>
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

        {/* Large Navigation Controls (Big thumb-friendly buttons for kitchen use) */}
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
});
