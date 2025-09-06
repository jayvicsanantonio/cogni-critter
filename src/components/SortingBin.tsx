import React from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { SortingBinProps } from '@types/uiTypes';
import { UI_CONFIG } from '@utils/constants';

/**
 * SortingBin Component
 *
 * Represents a drop zone where images can be sorted into categories.
 * Provides visual feedback when highlighted and handles drop events.
 *
 * Features:
 * - Visual highlighting when active drop zone
 * - Smooth color transitions and scaling animations
 * - Clear labeling for accessibility
 * - Touch-friendly sizing
 */
export const SortingBin: React.FC<SortingBinProps> = ({
  id,
  label,
  onDrop,
  highlighted = false,
  showSuccess = false,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    let scale = 1;
    let backgroundColor = '#F5F5F5';
    let borderColor = '#E0E0E0';

    if (showSuccess) {
      scale = withSpring(1.15, { damping: 10, stiffness: 200 });
      backgroundColor = '#A2E85B'; // Success green
      borderColor = '#8BC34A';
    } else if (highlighted) {
      scale = withSpring(1.08, { damping: 12 });
      backgroundColor = interpolateColor(
        1,
        [0, 1],
        ['#F5F5F5', '#A2E85B']
      );
      borderColor = interpolateColor(
        1,
        [0, 1],
        ['#E0E0E0', '#4D96FF']
      );
    } else {
      scale = withSpring(1, { damping: 15 });
    }

    const shadowOpacity = highlighted || showSuccess ? 0.3 : 0.1;
    const elevation = highlighted || showSuccess ? 6 : 2;

    return {
      transform: [{ scale }],
      backgroundColor,
      borderColor,
      shadowOpacity,
      elevation,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      highlighted ? 1 : 0,
      [0, 1],
      ['#0B132B', '#FFFFFF'] // Deep Space Navy to White
    );

    return { color };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.icon,
            { backgroundColor: highlighted ? '#FFFFFF' : '#A2E85B' },
          ]}
        >
          <Text
            style={[
              styles.iconText,
              { color: highlighted ? '#4D96FF' : '#FFFFFF' },
            ]}
          >
            {id === 'apple' ? '🍎' : '❌'}
          </Text>
        </View>
      </View>
      <Animated.Text style={[styles.label, textStyle]}>
        {label}
      </Animated.Text>
      <Text style={styles.instruction}>Drop here</Text>
    </Animated.View>
  );
};

/**
 * Hook for detecting drop zones
 * Used by ImageCard to determine if it's over a valid drop zone
 */
export const useDropZoneDetection = () => {
  const isInDropZone = (
    gestureX: number,
    gestureY: number,
    dropZoneLayout: {
      x: number;
      y: number;
      width: number;
      height: number;
    }
  ): boolean => {
    return (
      gestureX >= dropZoneLayout.x &&
      gestureX <= dropZoneLayout.x + dropZoneLayout.width &&
      gestureY >= dropZoneLayout.y &&
      gestureY <= dropZoneLayout.y + dropZoneLayout.height
    );
  };

  return { isInDropZone };
};

const styles = {
  container: {
    width: 140,
    height: 160,
    borderRadius: UI_CONFIG.BORDER_RADIUS.LARGE,
    borderWidth: 3,
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: UI_CONFIG.SPACING.MD,
    margin: UI_CONFIG.SPACING.SM,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    fontFamily: 'Nunito-ExtraBold',
    textAlign: 'center' as const,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  instruction: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
    textAlign: 'center' as const,
  },
};
