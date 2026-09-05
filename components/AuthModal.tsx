import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Mail, Lock, User, ShieldCheck } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { BRAND } from '../constants/brand';
import { BrandWordmark } from './BrandWordmark';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

export const AuthModal: React.FC = () => {
  const isAuthModalOpen = useAppStore((state) => state.isAuthModalOpen);
  const setAuthModalOpen = useAppStore((state) => state.setAuthModalOpen);
  const signInWithGoogle = useAppStore((state) => state.signInWithGoogle);
  const signInWithEmail = useAppStore((state) => state.signInWithEmail);
  const signUpWithEmail = useAppStore((state) => state.signUpWithEmail);
  const signInAsGuest = useAppStore((state) => state.signInAsGuest);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isAuthModalOpen) return null;

  const handleEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signInWithEmail(email.trim(), password.trim());
        if (res?.error) setErrorMessage(res.error);
      } else {
        const res = await signUpWithEmail(email.trim(), password.trim(), name.trim());
        if (res?.error) setErrorMessage(res.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res?.error) setErrorMessage(res.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = async () => {
    await signInAsGuest();
  };

  return (
    <Modal
      visible={isAuthModalOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setAuthModalOpen(false)}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Close Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.closeBtn}
              onPress={() => setAuthModalOpen(false)}
              hitSlop={8}
            >
              <X size={18} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <BrandWordmark size={32} style={{ alignSelf: 'center', marginBottom: SPACING.xs }} />
            <Text style={styles.subtitle}>
              {mode === 'signin'
                ? 'Sign in to sync your recipes, pantry & preferences'
                : 'Create your account to save recipes and preferences'}
            </Text>

            {/* Google Authentication Button */}
            <Pressable
              style={({ pressed }) => [
                styles.googleBtn,
                pressed && styles.googleBtnPressed,
              ]}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Text style={styles.googleIconText}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Form Fields */}
            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <User size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your Name"
                  placeholderTextColor={COLORS.textLight}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Mail size={16} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={COLORS.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Lock size={16} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.textLight}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.submitBtnPressed,
                isLoading && styles.submitBtnDisabled,
              ]}
              onPress={handleEmailSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.textInverted} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </Pressable>

            {/* Mode Switch & Guest mode */}
            <View style={styles.switchRow}>
              <Text style={styles.switchPrompt}>
                {mode === 'signin'
                  ? "Don't have an account?"
                  : 'Already have an account?'}
              </Text>
              <Pressable
                onPress={() => {
                  setErrorMessage('');
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                }}
              >
                <Text style={styles.switchLink}>
                  {mode === 'signin' ? ' Sign Up' : ' Sign In'}
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.guestBtn}
              onPress={handleGuestMode}
            >
              <Text style={styles.guestBtnText}>Continue as Guest</Text>
            </Pressable>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 26,
    fontFamily: TYPOGRAPHY.fontSerif,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    maxWidth: 280,
  },
  googleBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    gap: 10,
    marginBottom: SPACING.md,
  },
  googleBtnPressed: {
    backgroundColor: COLORS.surface,
  },
  googleIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: SPACING.sm,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  errorBox: {
    width: '100%',
    backgroundColor: COLORS.errorLight,
    padding: 10,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
  },
  submitBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: SPACING.md,
  },
  submitBtnPressed: {
    backgroundColor: COLORS.primaryDark,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  switchPrompt: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
  },
  switchLink: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  guestBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  guestBtnText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
