import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';

export const Toast: React.FC = () => {
  const toastMessage = useAppStore((state) => state.toastMessage);

  if (!toastMessage) return null;

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <SafeAreaView>
        <View style={[styles.container, SHADOWS.accent]}>
          <CheckCircle size={15} color={COLORS.textInverted} style={styles.icon} />
          <Text style={styles.text}>{toastMessage}</Text>
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
    backgroundColor: '#1C1917',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    maxWidth: '90%',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
