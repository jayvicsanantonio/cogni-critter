import type { ImageCardProps } from '@/types/uiTypes'
import { UI_CONFIG } from '@utils/constants'
import type React from 'react'
import { useState } from 'react'
import { Image, Text, View, StyleSheet } from 'react-native'
import {
  PanGestureHandler,
  type PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

/**
 * ImageCard Component
 *
 * Displays an image that can be dragged and dropped into sorting bins.
 * Provides visual feedback during drag operations and handles gesture events.
 *
 * Features:
 * - Drag and drop functionality with smooth animations
 * - Visual feedback during drag operations
 * - Automatic return to original position if not dropped in valid zone
 * - Disabled state support
 */
interface ExtendedImageCardProps extends ImageCardProps {
  onDragStateChange?: (isDragging: boolean, targetBin?: string) => void
}

export const ImageCard: React.FC<ExtendedImageCardProps> = ({
  imageUri,
  onSort,
  disabled = false,
  onDragStateChange,
}) => {
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const rotation = useSharedValue(0)
  const [isDragging, setIsDragging] = useState(false)
  const [targetBin, setTargetBin] = useState<string | undefined>()
  const [_isAnimatingSort, setIsAnimatingSort] = useState(false)

  const gestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: () => {
        if (disabled) return

        scale.value = withSpring(1.1, { damping: 15 })
        runOnJS(setIsDragging)(true)
      },
      onActive: (event) => {
        if (disabled) return

        translateX.value = event.translationX
        translateY.value = event.translationY

        // Determine which bin is being targeted for visual feedback
        const dropThreshold = 80
        let currentTarget: string | undefined

        if (Math.abs(event.translationX) > dropThreshold) {
          currentTarget = event.translationX > 0 ? 'apple' : 'not_apple'
        }

        runOnJS(setTargetBin)(currentTarget)
        if (onDragStateChange) {
          runOnJS(onDragStateChange)(true, currentTarget)
        }
      },
      onEnd: (event) => {
        if (disabled) return

        // Reset scale and dragging state
        scale.value = withSpring(1, { damping: 15 })
        runOnJS(setIsDragging)(false)
        runOnJS(setTargetBin)(undefined)
        if (onDragStateChange) {
          runOnJS(onDragStateChange)(false, undefined)
        }

        // Enhanced drop zone detection
        const dropThreshold = 120 // Minimum distance to trigger drop
        const dropZoneDetected = Math.abs(event.translationX) > dropThreshold

        if (dropZoneDetected) {
          // Determine which bin based on horizontal direction
          // Left side = "not_apple", Right side = "apple"
          const binId = event.translationX > 0 ? 'apple' : 'not_apple'

          // Animate to the target bin before calling onSort
          runOnJS(setIsAnimatingSort)(true)

          // Calculate target position for animation
          const targetX = event.translationX > 0 ? 200 : -200
          const targetY = -150 // Move up towards bins

          // Animate to target position
          translateX.value = withSpring(targetX, {
            damping: 12,
            stiffness: 100,
          })
          translateY.value = withSpring(targetY, {
            damping: 12,
            stiffness: 100,
          })
          scale.value = withSpring(0.8, { damping: 12 })
          opacity.value = withSpring(0.7, { damping: 12 })
          rotation.value = withSpring(event.translationX > 0 ? 15 : -15, {
            damping: 12,
          })

          // After animation, call onSort and reset
          setTimeout(() => {
            runOnJS(onSort)(binId)
            runOnJS(setIsAnimatingSort)(false)

            // Reset all values
            translateX.value = withSpring(0, {
              damping: 15,
              stiffness: 150,
            })
            translateY.value = withSpring(0, {
              damping: 15,
              stiffness: 150,
            })
            scale.value = withSpring(1, { damping: 15 })
            opacity.value = withSpring(1, { damping: 15 })
            rotation.value = withSpring(0, { damping: 15 })
          }, 400) // Animation duration
        } else {
          // Return to original position with smooth animation
          translateX.value = withSpring(0, {
            damping: 15,
            stiffness: 150,
          })
          translateY.value = withSpring(0, {
            damping: 15,
            stiffness: 150,
          })
        }
      },
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }))

  const containerStyle = useAnimatedStyle(() => ({
    opacity: disabled ? 0.5 : 1,
    elevation: isDragging ? 8 : 4,
    shadowOpacity: isDragging ? 0.3 : 0.15,
  }))

  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler} enabled={!disabled}>
        <Animated.View style={[styles.card, containerStyle, animatedStyle]}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
          {isDragging && (
            <View style={styles.dragOverlay}>
              <View
                style={[
                  styles.dragIndicator,
                  targetBin ? styles.dragIndicatorActive : undefined,
                ]}
              />
              {targetBin && (
                <Text style={styles.targetBinText}>
                  {targetBin === 'apple' ? '🍎 Apple' : '❌ Not Apple'}
                </Text>
              )}
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: UI_CONFIG.SPACING.MD,
  },
  card: {
    width: 200,
    height: 200,
    borderRadius: UI_CONFIG.BORDER_RADIUS.LARGE,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dragOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(162, 232, 91, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#A2E85B',
    opacity: 0.8,
  },
  dragIndicatorActive: {
    backgroundColor: '#4D96FF',
    transform: [{ scale: 1.2 }],
  },
  targetBinText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Nunito-ExtraBold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
})
