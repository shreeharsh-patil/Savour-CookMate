import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { X, Play, ExternalLink } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { youtubeService } from '../services/youtubeService';
import { FoodImage } from './FoodImage';

export const YouTubePlayerModal: React.FC = () => {
  const activeVideo = useAppStore((state) => state.activeVideo);
  const setActiveVideo = useAppStore((state) => state.setActiveVideo);

  if (!activeVideo) return null;

  const handleOpenExternal = () => {
    youtubeService.openVideoInNativeApp(activeVideo);
  };

  return (
    <Modal
      visible={Boolean(activeVideo)}
      transparent
      animationType="fade"
      onRequestClose={() => setActiveVideo(null)}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeContainer}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleInfo}>
                <Text style={styles.videoTitle} numberOfLines={1}>
                  {activeVideo.title}
                </Text>
                <Text style={styles.channelTitle}>
                  {activeVideo.channelTitle}
                </Text>
              </View>

              <Pressable
                style={styles.closeBtn}
                onPress={() => setActiveVideo(null)}
                hitSlop={8}
              >
                <X size={18} color={COLORS.textInverted} />
              </Pressable>
            </View>

            {/* Video Banner / Preview */}
            <Pressable style={styles.videoPreview} onPress={handleOpenExternal}>
              <FoodImage
                source={{ uri: activeVideo.thumbnailUrl }}
                style={styles.thumbnail}
              />
              <View style={styles.playOverlay}>
                <View style={styles.playIconContainer}>
                  <Play size={24} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
                </View>
                <Text style={styles.tapToPlayText}>Tap to Watch Masterclass</Text>
              </View>
            </Pressable>

            {/* Action Bar */}
            <View style={styles.footer}>
              <Text style={styles.footerDesc} numberOfLines={2}>
                {activeVideo.description || 'Authentic culinary masterclass tutorial'}
              </Text>

              <Pressable
                style={styles.openBtn}
                onPress={handleOpenExternal}
              >
                <Text style={styles.openBtnText}>Open in YouTube</Text>
                <ExternalLink size={14} color={COLORS.textInverted} />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  safeContainer: {
    width: '100%',
    maxWidth: 440,
  },
  card: {
    backgroundColor: '#1C1917',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2825',
  },
  titleInfo: {
    flex: 1,
    marginRight: 10,
  },
  videoTitle: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  channelTitle: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.sizes.caption,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2B2825',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPreview: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#000000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapToPlayText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  footer: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  footerDesc: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.sizes.caption,
    lineHeight: 16,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  openBtnText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.subtext,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
