import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BrandWordmark } from './BrandWordmark';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

interface HomeHeaderProps {
  onOpenProfile: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = React.memo(({
  onOpenProfile,
}) => {
  const userProfile = useAppStore((state) => state.userProfile);
  const currentUser = useAppStore((state) => state.currentUser);

  const displayName = currentUser?.name || userProfile?.name || 'Food Explorer';
  const firstName = displayName.split(' ')[0];
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftColumn}>
        <Text style={styles.greetingText}>Good food awaits, {firstName}</Text>
        <BrandWordmark size={26} />
      </View>

      <View style={styles.rightActions}>
        <Pressable
          style={styles.avatarButton}
          onPress={onOpenProfile}
          accessibilityLabel="Open user profile"
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  leftColumn: {
    flexDirection: 'column',
  },
  greetingText: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.subtext,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
