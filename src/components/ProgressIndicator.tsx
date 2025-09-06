import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { AppColors } from '@assets/index';
import { UI_CONFIG } from '@utils/constants';

interface ProgressIndicatorProps {
  current: number;
  minimum: number;
  maximum: number;
  showLabels?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
}

/**
 * ProgressIndicator Component
 *
 * Visual progress tracking for teaching phase with support for
 * minimum/maximum thresholds and animated updates.
 *
 * Requirements: 2.4, 5.4
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  current,
  minimum,
  maximum,
  showLabels = true,
  showPercentage = false,
  animated = true,
}) => {
  const progressToMinimum = Math.min(current / minimum, 1);
  const progressToMaximum = current / maximum;
  const isMinimumReached = current >= minimum;
  const isMaximumReached = current >= maximum;

  const getProgressColor = () => {
    if (isMaximumReached) return AppColors.primary;
    if (isMinimumReached) return AppColors.secondary;
    return AppColors.surface;
  };

  const getStatusText = () => {
    if (isMaximumReached) {
      return 'Maximum reached!';
    }
    if (isMinimumReached) {
      return 'Ready to test!';
    }
    return `${minimum - current} more needed`;
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          {/* Background track */}
          <View style={styles.progressTrack} />

          {/* Progress fill */}
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progressToMinimum * 100, 100)}%`,
                backgroundColor: getProgressColor(),
              },
            ]}
          />

          {/* Minimum threshold marker */}
          <View
            style={[
              styles.thresholdMarker,
              styles.minimumMarker,
              {
                left: `${(minimum / maximum) * 100}%`,
              },
            ]}
          />

          {/* Maximum threshold marker */}
          <View
            style={[
              styles.thresholdMarker,
              styles.maximumMarker,
              { left: '100%' },
            ]}
          />
        </View>

        {/* Progress dots for individual items */}
        <View style={styles.dotsContainer}>
          {Array.from({ length: maximum }, (_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index < current && styles.completedDot,
                index === minimum - 1 && styles.minimumDot,
                index === maximum - 1 && styles.maximumDot,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Labels and status */}
      {showLabels && (
        <View style={styles.labelsContainer}>
          <Text style={styles.currentText}>
            {current} / {minimum} examples
          </Text>
          <Text
            style={[
              styles.statusText,
              isMinimumReached && styles.readyText,
              isMaximumReached && styles.completeText,
            ]}
          >
            {getStatusText()}
          </Text>
        </View>
      )}

      {/* Percentage display */}
      {showPercentage && (
        <Text style={styles.percentageText}>
          {Math.round(progressToMinimum * 100)}%
        </Text>
      )}

      {/* Milestone indicators */}
      <View style={styles.milestonesContainer}>
        <View style={styles.milestone}>
          <View
            style={[
              styles.milestoneIcon,
              isMinimumReached && styles.milestoneReached,
            ]}
          />
          <Text style={styles.milestoneText}>Min ({minimum})</Text>
        </View>

        <View style={styles.milestone}>
          <View
            style={[
              styles.milestoneIcon,
              isMaximumReached && styles.milestoneReached,
            ]}
          />
          <Text style={styles.milestoneText}>Max ({maximum})</Text>
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: UI_CONFIG.SPACING.MD,
  },
  progressBar: {
    width: '100%',
    height: 12,
    position: 'relative',
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: AppColors.surface,
    borderRadius: 6,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 6,
    transition: 'width 0.3s ease-in-out',
  },
  thresholdMarker: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 16,
    backgroundColor: AppColors.text,
    opacity: 0.5,
  },
  minimumMarker: {
    backgroundColor: AppColors.secondary,
  },
  maximumMarker: {
    backgroundColor: AppColors.primary,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.surface,
    marginHorizontal: 1,
  },
  completedDot: {
    backgroundColor: AppColors.primary,
  },
  minimumDot: {
    borderWidth: 1,
    borderColor: AppColors.secondary,
  },
  maximumDot: {
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  currentText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.6,
  },
  readyText: {
    color: AppColors.secondary,
    opacity: 1,
    fontWeight: '600',
  },
  completeText: {
    color: AppColors.primary,
    opacity: 1,
    fontWeight: '600',
  },
  percentageText: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.primary,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  milestonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  milestone: {
    alignItems: 'center',
  },
  milestoneIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.surface,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  milestoneReached: {
    backgroundColor: AppColors.primary,
  },
  milestoneText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.6,
  },
});
