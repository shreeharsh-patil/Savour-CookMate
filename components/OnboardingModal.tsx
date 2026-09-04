import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Utensils, ArrowRight, Check } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { PreferenceSelector } from './PreferenceSelector';
import { BRAND } from '../constants/brand';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import {
  DietType,
  CookingLevelType,
  SpiceLevelType,
  VideoLanguageType,
} from '../types';

export const OnboardingModal: React.FC = () => {
  const isOnboardingOpen = useAppStore((state) => state.isOnboardingOpen);
  const setOnboardingOpen = useAppStore((state) => state.setOnboardingOpen);
  const userPreferences = useAppStore((state) => state.userPreferences);
  const updateUserPreferences = useAppStore(
    (state) => state.updateUserPreferences
  );

  const [diet, setDiet] = useState<DietType>(userPreferences.diet as DietType);
  const [skillLevel, setSkillLevel] = useState<CookingLevelType>(
    (userPreferences.skillLevel || 'Beginner') as CookingLevelType
  );
  const [spiceTolerance, setSpiceTolerance] = useState<SpiceLevelType>(
    (userPreferences.spiceTolerance || 'Medium') as SpiceLevelType
  );
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>(
    userPreferences.favoriteCuisines || []
  );
  const [videoLanguages, setVideoLanguages] = useState<VideoLanguageType[]>(
    (userPreferences.videoLanguages || ['English']) as VideoLanguageType[]
  );

  if (!isOnboardingOpen) return null;

  const handleToggleCuisine = (cuisine: string) => {
    if (favoriteCuisines.includes(cuisine)) {
      if (favoriteCuisines.length > 1) {
        setFavoriteCuisines(favoriteCuisines.filter((c) => c !== cuisine));
      }
    } else {
      setFavoriteCuisines([...favoriteCuisines, cuisine]);
    }
  };

  const handleToggleLanguage = (lang: VideoLanguageType) => {
    if (videoLanguages.includes(lang)) {
      if (videoLanguages.length > 1) {
        setVideoLanguages(videoLanguages.filter((l) => l !== lang));
      }
    } else {
      setVideoLanguages([...videoLanguages, lang]);
    }
  };

  const handleComplete = async () => {
    await updateUserPreferences({
      diet,
      skillLevel,
      spiceTolerance,
      favoriteCuisines,
      videoLanguages,
      onboardingCompleted: true,
    });
    setOnboardingOpen(false);
  };

  return (
    <Modal
      visible={isOnboardingOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setOnboardingOpen(false)}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Utensils size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.brandTitle}>{BRAND.NAME}</Text>
              <Text style={styles.headline}>Personalize Your Kitchen</Text>
              <Text style={styles.subtext}>
                We personalize your recipe recommendations, pantry matches, and video tutorials to your exact taste.
              </Text>
            </View>

            <PreferenceSelector
              diet={diet}
              skillLevel={skillLevel}
              spiceTolerance={spiceTolerance}
              favoriteCuisines={favoriteCuisines}
              videoLanguages={videoLanguages}
              onChangeDiet={setDiet}
              onChangeSkillLevel={setSkillLevel}
              onChangeSpiceTolerance={setSpiceTolerance}
              onToggleCuisine={handleToggleCuisine}
              onToggleLanguage={handleToggleLanguage}
            />

            <Pressable
              style={({ pressed }) => [
                styles.continueBtn,
                pressed && styles.continueBtnPressed,
              ]}
              onPress={handleComplete}
            >
              <Text style={styles.continueBtnText}>Start Exploring</Text>
              <ArrowRight size={16} color={COLORS.textInverted} />
            </Pressable>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    gap: SPACING.lg,
  },
  header: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  brandTitle: {
    fontSize: 26,
    fontFamily: TYPOGRAPHY.fontSerif,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  headline: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtext: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    gap: 8,
    marginTop: SPACING.md,
  },
  continueBtnPressed: {
    backgroundColor: COLORS.primaryDark,
  },
  continueBtnText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
