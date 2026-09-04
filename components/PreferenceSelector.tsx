import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  DietType,
  CookingLevelType,
  SpiceLevelType,
  VideoLanguageType,
} from '../types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface PreferenceSelectorProps {
  diet: DietType;
  skillLevel: CookingLevelType;
  spiceTolerance: SpiceLevelType;
  favoriteCuisines: string[];
  videoLanguages: VideoLanguageType[];
  onChangeDiet: (diet: DietType) => void;
  onChangeSkillLevel: (level: CookingLevelType) => void;
  onChangeSpiceTolerance: (spice: SpiceLevelType) => void;
  onToggleCuisine: (cuisine: string) => void;
  onToggleLanguage: (lang: VideoLanguageType) => void;
}

const DIET_OPTIONS: { type: DietType; label: string }[] = [
  { type: 'Vegetarian', label: 'Vegetarian' },
  { type: 'Non-Vegetarian', label: 'Non-Veg' },
  { type: 'Eggetarian', label: 'Eggetarian' },
  { type: 'Vegan', label: 'Vegan' },
];

const SKILL_OPTIONS: { level: CookingLevelType; label: string }[] = [
  { level: 'Beginner', label: 'Beginner' },
  { level: 'Intermediate', label: 'Intermediate' },
  { level: 'Advanced', label: 'Master Chef' },
];

const SPICE_OPTIONS: SpiceLevelType[] = ['Mild', 'Medium', 'Hot', 'Fiery'];

const CUISINES = [
  'Indian',
  'Goan',
  'Italian',
  'Asian',
  'Mexican',
  'Mediterranean',
];

const LANGUAGES: VideoLanguageType[] = [
  'English',
  'Hindi',
  'Marathi',
  'Konkani',
  'Tamil',
  'Telugu',
];

export const PreferenceSelector: React.FC<PreferenceSelectorProps> = ({
  diet,
  skillLevel,
  spiceTolerance,
  favoriteCuisines,
  videoLanguages,
  onChangeDiet,
  onChangeSkillLevel,
  onChangeSpiceTolerance,
  onToggleCuisine,
  onToggleLanguage,
}) => {
  return (
    <View style={styles.container}>
      {/* Diet Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Dietary Preference</Text>
        <View style={styles.pillsRow}>
          {DIET_OPTIONS.map((opt) => {
            const isSelected = diet === opt.type;
            return (
              <Pressable
                key={opt.type}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => onChangeDiet(opt.type)}
              >
                <Text
                  style={[styles.pillText, isSelected && styles.pillTextSelected]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Cooking Skill */}
      <View style={styles.section}>
        <Text style={styles.label}>Culinary Experience</Text>
        <View style={styles.pillsRow}>
          {SKILL_OPTIONS.map((opt) => {
            const isSelected = skillLevel === opt.level;
            return (
              <Pressable
                key={opt.level}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => onChangeSkillLevel(opt.level)}
              >
                <Text
                  style={[styles.pillText, isSelected && styles.pillTextSelected]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Spice Tolerance */}
      <View style={styles.section}>
        <Text style={styles.label}>Spice Tolerance</Text>
        <View style={styles.pillsRow}>
          {SPICE_OPTIONS.map((opt) => {
            const isSelected = spiceTolerance === opt;
            return (
              <Pressable
                key={opt}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => onChangeSpiceTolerance(opt)}
              >
                <Text
                  style={[styles.pillText, isSelected && styles.pillTextSelected]}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Favorite Cuisines */}
      <View style={styles.section}>
        <Text style={styles.label}>Favorite Cuisines (Multiple)</Text>
        <View style={styles.pillsRow}>
          {CUISINES.map((c) => {
            const isSelected = favoriteCuisines.includes(c);
            return (
              <Pressable
                key={c}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => onToggleCuisine(c)}
              >
                <Text
                  style={[styles.pillText, isSelected && styles.pillTextSelected]}
                >
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Video Languages */}
      <View style={styles.section}>
        <Text style={styles.label}>Video Languages</Text>
        <View style={styles.pillsRow}>
          {LANGUAGES.map((lang) => {
            const isSelected = videoLanguages.includes(lang);
            return (
              <Pressable
                key={lang}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => onToggleLanguage(lang)}
              >
                <Text
                  style={[styles.pillText, isSelected && styles.pillTextSelected]}
                >
                  {lang}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  section: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  pillTextSelected: {
    color: COLORS.textInverted,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
