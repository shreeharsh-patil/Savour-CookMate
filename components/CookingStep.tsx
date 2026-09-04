import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Clock, Lightbulb } from 'lucide-react-native';
import { InstructionStep } from '../types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface CookingStepProps {
  step: InstructionStep;
  totalSteps: number;
  onStartTimer?: (minutes: number) => void;
}

export const CookingStep: React.FC<CookingStepProps> = ({
  step,
  totalSteps,
  onStartTimer,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            Step {step.stepNumber} of {totalSteps}
          </Text>
        </View>

        {step.timeMinutes && onStartTimer && (
          <Pressable
            style={styles.timerBtn}
            onPress={() => onStartTimer(step.timeMinutes || 5)}
          >
            <Clock size={12} color={COLORS.primary} />
            <Text style={styles.timerBtnText}>{step.timeMinutes}m timer</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.stepText}>{step.text}</Text>

      {step.tip ? (
        <View style={styles.tipBox}>
          <Lightbulb size={14} color="#D97706" style={styles.tipIcon} />
          <Text style={styles.tipText}>{step.tip}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  stepBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  timerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timerBtnText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  stepText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 6,
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.caption,
    color: '#92400E',
    lineHeight: 16,
  },
});
