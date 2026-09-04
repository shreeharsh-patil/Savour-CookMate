import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Play, ExternalLink } from 'lucide-react-native';
import { YouTubeVideo } from '../types';
import { FoodImage } from './FoodImage';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { youtubeService } from '../services/youtubeService';

interface VideoCardProps {
  video: YouTubeVideo;
  onPress?: (video: YouTubeVideo) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(video);
    } else {
      youtubeService.openVideoInNativeApp(video);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        SHADOWS.card,
        pressed && styles.cardPressed,
      ]}
      onPress={handlePress}
    >
      <View style={styles.thumbnailWrapper}>
        <FoodImage
          source={{ uri: video.thumbnailUrl }}
          style={styles.thumbnail}
        />
        <View style={styles.playOverlay}>
          <View style={styles.playIconCircle}>
            <Play size={16} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
          </View>
        </View>
        {video.duration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{video.duration}</Text>
          </View>
        ) : null}
        {video.language ? (
          <View style={styles.languageBadge}>
            <Text style={styles.languageText}>{video.language}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.channelText} numberOfLines={1}>
            {video.channelTitle}
          </Text>
          {video.views ? (
            <>
              <Text style={styles.metaDivider}>•</Text>
              <Text style={styles.viewsText}>{video.views}</Text>
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.md,
  },
  cardPressed: {
    opacity: 0.95,
  },
  thumbnailWrapper: {
    width: '100%',
    height: 160,
    backgroundColor: '#000000',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  languageBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(23, 23, 23, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  languageText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  content: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  channelText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  metaDivider: {
    fontSize: 11,
    color: COLORS.border,
  },
  viewsText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
