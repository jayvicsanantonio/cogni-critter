import { AppColors } from '@assets/index'
import { UI_CONFIG } from '@utils/constants'
import type React from 'react'
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native'

interface ProgressIndicatorProps {
  // Support both old interface and new interface for backward compatibility
  current?: number
  minimum?: number
  maximum?: number
  showLabels?: boolean
  showPercentage?: boolean
  animated?: boolean

  // New interface for testing phase
  progress?: number // 0-1 progress value
  total?: number // Total number of items
  label?: string // Custom label text
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
  animated: _animated = true,
  progress,
  total,
  label,
}) => {
  // Support both old and new interfaces
  const isNewInterface = progress !== undefined && total !== undefined

  let progressValue: number
  let currentValue: number
  let totalValue: number
  let isMinimumReached: boolean
  let isMaximumReached: boolean

  if (isNewInterface) {
    // New interface for testing phase
    const safeProgress = progress ?? 0
    const safeTotal = total ?? 1
    progressValue = Math.min(Math.max(safeProgress, 0), 1)
    currentValue = Math.round(progressValue * safeTotal)
    totalValue = safeTotal
    isMinimumReached = true // No minimum concept in new interface
    isMaximumReached = progressValue >= 1
  } else {
    // Old interface for teaching phase
    const safeCurrent = current ?? 0
    const safeMinimum = minimum ?? 1
    const safeMaximum = maximum ?? 1
    progressValue = Math.min(safeCurrent / safeMinimum, 1)
    currentValue = safeCurrent
    totalValue = safeMaximum
    isMinimumReached = safeCurrent >= safeMinimum
    isMaximumReached = safeCurrent >= safeMaximum
  }

  const getProgressColor = () => {
    if (isMaximumReached) return AppColors.primary
    if (isMinimumReached) return AppColors.secondary
    return AppColors.surface
  }

  const getStatusText = () => {
    if (isNewInterface) {
      if (isMaximumReached) {
        return 'Complete!'
      }
      return `${totalValue - currentValue} remaining`
    } else {
      if (isMaximumReached) {
        return 'Maximum reached!'
      }
      if (isMinimumReached) {
        return 'Ready to test!'
      }
      return `${(minimum ?? 1) - (current ?? 0)} more needed`
    }
  }

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
                width: `${Math.min(progressValue * 100, 100)}%`,
                backgroundColor: getProgressColor(),
              },
            ]}
          />

          {/* Threshold markers - only show for old interface */}
          {!isNewInterface && (
            <>
              <View
                style={[
                  styles.thresholdMarker,
                  styles.minimumMarker,
                  {
                    left: `${((minimum ?? 1) / (maximum ?? 1)) * 100}%`,
                  },
                ]}
              />
              <View
                style={[
                  styles.thresholdMarker,
                  styles.maximumMarker,
                  { left: '100%' },
                ]}
              />
            </>
          )}
        </View>

        {/* Progress dots for individual items */}
        <View style={styles.dotsContainer}>
          {Array.from({ length: totalValue }, (_, index) => (
            <View
              key={`progress-dot-${totalValue}-${Date.now()}-${index}`}
              style={[
                styles.progressDot,
                index < currentValue && styles.completedDot,
                !isNewInterface &&
                  index === (minimum ?? 1) - 1 &&
                  styles.minimumDot,
                !isNewInterface &&
                  index === (maximum ?? 1) - 1 &&
                  styles.maximumDot,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Labels and status */}
      {showLabels && (
        <View style={styles.labelsContainer}>
          <Text style={styles.currentText}>
            {isNewInterface
              ? `${currentValue} / ${totalValue} ${label || 'items'}`
              : `${current} / ${minimum} examples`}
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
          {Math.round(progressValue * 100)}%
        </Text>
      )}

      {/* Milestone indicators - only show for old interface */}
      {!isNewInterface && (
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
      )}
    </View>
  )
}

const { width: _width } = Dimensions.get('window')

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
})
