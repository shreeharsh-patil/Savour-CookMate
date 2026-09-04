import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';

export const Toast: React.FC = () => {
  const toast = useAppStore((state) => state.toast);

  if (!toast?.message) return null;

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <SafeAreaView>
        <View style={[styles.container, SHADOWS.accent]}>
          <CheckCircle size={15} color={COLORS.textInverted} style={styles.icon} />
          <Text style={styles.text}>{toast.message}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
  },
  icon: {
    marginRight: 2,
  },
  text: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    fontFamily: TYPOGRAPHY.fontSans,
    color: COLORS.textInverted,
    fontWeight: '600',
  },
});
