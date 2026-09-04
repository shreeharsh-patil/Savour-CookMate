import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Check, Clock, Lightbulb } from 'lucide-react-native';
import { InstructionStep } from '../types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface CookingStepProps {
  step: InstructionStep;
  isComplete: boolean;
  onToggleComplete: () => void;
  onStartTimer?: (minutes: number) => void;
}

const detectMinutes = (step: InstructionStep): number | null => {
  if (step.timeMinutes && step.timeMinutes > 0) return step.timeMinutes;
  const match = step.text.match(/\b(?:for|about|approximately)?\s*(\d+)\s*(?:minutes?|mins?)\b/i);
  return match ? Number(match[1]) : null;
};

export const CookingStep: React.FC<CookingStepProps> = ({ step, isComplete, onToggleComplete, onStartTimer }) => {
  const minutes = detectMinutes(step);

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.checkControl, isComplete ? styles.checkControlComplete : null]}
        onPress={onToggleComplete}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isComplete }}
        accessibilityLabel={`Mark step ${step.stepNumber} as ${isComplete ? 'incomplete' : 'complete'}`}
      >
        {isComplete ? <Check size={14} color={COLORS.textInverted} strokeWidth={3} /> : null}
      </Pressable>
      <View style={styles.content}>
        <Text style={[styles.stepNumber, isComplete ? styles.stepNumberComplete : null]}>Step {step.stepNumber}</Text>
        <Text style={[styles.stepTitle, isComplete ? styles.completedText : null]}>{step.title || `Step ${step.stepNumber}`}</Text>
        <Text style={[styles.stepText, isComplete ? styles.completedText : null]}>{step.text}</Text>
        {minutes && onStartTimer ? (
          <Pressable style={styles.timerButton} onPress={() => onStartTimer(minutes)} accessibilityRole="button" accessibilityLabel={`Start ${minutes} minute timer for step ${step.stepNumber}`}>
            <Clock size={14} color={COLORS.primary} />
            <Text style={styles.timerButtonText}>Start {minutes} min timer</Text>
          </Pressable>
        ) : null}
        {step.tip ? (
          <View style={styles.tipRow}>
            <Lightbulb size={14} color="#A16207" />
            <Text style={styles.tipText}>{step.tip}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: SPACING.sm, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderSubtle },
  checkControl: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkControlComplete: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  content: { flex: 1, minWidth: 0 },
  stepNumber: { color: COLORS.primary, fontSize: TYPOGRAPHY.sizes.caption, fontWeight: TYPOGRAPHY.weights.bold, marginBottom: 2 },
  stepNumberComplete: { color: COLORS.textMuted },
  stepTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.sizes.body, fontWeight: TYPOGRAPHY.weights.bold, marginBottom: 4 },
  stepText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizes.body, lineHeight: 22 },
  completedText: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  timerButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.sm, paddingHorizontal: 10, paddingVertical: 7, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  timerButtonText: { color: COLORS.primary, fontSize: TYPOGRAPHY.sizes.caption, fontWeight: TYPOGRAPHY.weights.semibold },
  tipRow: { flexDirection: 'row', gap: 6, marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.borderSubtle },
  tipText: { flex: 1, color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizes.caption, lineHeight: 18 },
});
