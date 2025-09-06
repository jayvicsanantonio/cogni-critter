import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ImageCard } from './ImageCard';
import { SortingBin } from './SortingBin';
import { UI_CONFIG } from '@utils/constants';

interface SortingInterfaceProps {
  imageUri: string;
  onSort: (binId: string) => void;
  disabled?: boolean;
}

/**
 * SortingInterface Component
 *
 * Manages the interaction between ImageCard and SortingBins,
 * providing coordinated visual feedback during drag operations.
 *
 * Features:
 * - Coordinated highlighting between image and bins
 * - Visual feedback for valid drop zones
 * - Smooth animations and transitions
 */
export const SortingInterface: React.FC<SortingInterfaceProps> = ({
  imageUri,
  onSort,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [targetBin, setTargetBin] = useState<string | undefined>();
  const [successBin, setSuccessBin] = useState<string | undefined>();

  const handleDragStateChange = (
    dragging: boolean,
    target?: string
  ) => {
    setIsDragging(dragging);
    setTargetBin(target);
  };

  const handleSort = (binId: string) => {
    // Show success animation
    setSuccessBin(binId);

    // Reset states
    setIsDragging(false);
    setTargetBin(undefined);

    // Call parent handler
    onSort(binId);

    // Clear success animation after delay
    setTimeout(() => {
      setSuccessBin(undefined);
    }, 600);
  };

  return (
    <View style={styles.container}>
      {/* Sorting Bins Row */}
      <View style={styles.binsContainer}>
        <SortingBin
          id="not_apple"
          label="Not Apple"
          onDrop={handleSort}
          highlighted={isDragging && targetBin === 'not_apple'}
          showSuccess={successBin === 'not_apple'}
        />
        <SortingBin
          id="apple"
          label="Apple"
          onDrop={handleSort}
          highlighted={isDragging && targetBin === 'apple'}
          showSuccess={successBin === 'apple'}
        />
      </View>

      {/* Image Card */}
      <View style={styles.imageContainer}>
        <ImageCard
          imageUri={imageUri}
          onSort={handleSort}
          disabled={disabled}
          onDragStateChange={handleDragStateChange}
        />
      </View>

      {/* Visual feedback overlay */}
      {isDragging && (
        <View style={styles.feedbackOverlay}>
          <View
            style={[
              styles.dropZoneIndicator,
              styles.leftDropZone,
              targetBin === 'not_apple' && styles.activeDropZone,
            ]}
          />
          <View
            style={[
              styles.dropZoneIndicator,
              styles.rightDropZone,
              targetBin === 'apple' && styles.activeDropZone,
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: UI_CONFIG.SPACING.LG,
  },
  binsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: UI_CONFIG.SPACING.MD,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: UI_CONFIG.SPACING.LG,
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  dropZoneIndicator: {
    position: 'absolute',
    top: '10%',
    width: '40%',
    height: '30%',
    borderRadius: UI_CONFIG.BORDER_RADIUS.LARGE,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  leftDropZone: {
    left: '5%',
  },
  rightDropZone: {
    right: '5%',
  },
  activeDropZone: {
    borderColor: '#4D96FF', // Spark Blue
    backgroundColor: 'rgba(77, 150, 255, 0.1)',
  },
});
