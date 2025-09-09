/**
 * Animation Helpers
 * Utilities for managing smooth animations with performance monitoring
 */

import { Animated, Easing } from 'react-native'

/**
 * Animation configuration constants
 */
export const ANIMATION_CONFIG = {
  CROSSFADE_DURATION: 250, // 250ms as per requirements
  SPRING_TENSION: 100,
  SPRING_FRICTION: 8,
  EASING: Easing.out(Easing.cubic),
} as const

/**
 * Create a crossfade animation between two animated values
 * @param fromValue Animated value to fade out
 * @param toValue Animated value to fade in
 * @param duration Animation duration in milliseconds
 * @param onComplete Callback when animation completes
 * @returns Animation instance
 */
export function createCrossfade(
  fromValue: Animated.Value,
  toValue: Animated.Value,
  duration: number = ANIMATION_CONFIG.CROSSFADE_DURATION,
  _onComplete?: () => void
): Animated.CompositeAnimation {
  return Animated.parallel([
    Animated.timing(fromValue, {
      toValue: 0,
      duration,
      easing: ANIMATION_CONFIG.EASING,
      useNativeDriver: true,
    }),
    Animated.timing(toValue, {
      toValue: 1,
      duration,
      easing: ANIMATION_CONFIG.EASING,
      useNativeDriver: true,
    }),
  ])
}

/**
 * Create a spring animation for bouncy effects
 * @param animatedValue The animated value to animate
 * @param toValue Target value
 * @param tension Spring tension (higher = more bouncy)
 * @param friction Spring friction (higher = less bouncy)
 * @returns Animation instance
 */
export function createSpring(
  animatedValue: Animated.Value,
  toValue: number,
  tension: number = ANIMATION_CONFIG.SPRING_TENSION,
  friction: number = ANIMATION_CONFIG.SPRING_FRICTION
): Animated.CompositeAnimation {
  return Animated.spring(animatedValue, {
    toValue,
    tension,
    friction,
    useNativeDriver: true,
  })
}

/**
 * Create a sequence of animations
 * @param animations Array of animations to run in sequence
 * @returns Sequence animation
 */
export function createSequence(
  animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation {
  return Animated.sequence(animations)
}

/**
 * Create a staggered animation (animations start with delays)
 * @param animations Array of animations
 * @param staggerDelay Delay between each animation start
 * @returns Staggered animation
 */
export function createStagger(
  animations: Animated.CompositeAnimation[],
  staggerDelay: number = 100
): Animated.CompositeAnimation {
  return Animated.stagger(staggerDelay, animations)
}

/**
 * Performance monitoring for animations
 * Tracks frame drops and animation performance
 */
export const animationPerformanceMonitor = {
  frameDrops: 0,
  animationCount: 0,

  /**
   * Start monitoring an animation
   * @param animationName Name for debugging
   */
  startMonitoring(animationName: string): void {
    this.animationCount++
    if (__DEV__) {
      console.log(
        `[Animation] Starting: ${animationName} (Total active: ${this.animationCount})`
      )
    }
  },

  /**
   * End monitoring an animation
   * @param animationName Name for debugging
   * @param duration Actual duration taken
   */
  endMonitoring(animationName: string, duration: number): void {
    this.animationCount = Math.max(0, this.animationCount - 1)
    if (__DEV__) {
      console.log(
        `[Animation] Completed: ${animationName} in ${duration}ms (Active: ${this.animationCount})`
      )
    }
  },

  /**
   * Report frame drop
   */
  reportFrameDrop(): void {
    this.frameDrops++
    if (__DEV__ && this.frameDrops % 10 === 0) {
      console.warn(`[Animation] Frame drops detected: ${this.frameDrops}`)
    }
  },

  /**
   * Get performance stats
   */
  getStats(): { frameDrops: number; activeAnimations: number } {
    return {
      frameDrops: this.frameDrops,
      activeAnimations: this.animationCount,
    }
  },

  /**
   * Reset performance counters
   */
  reset(): void {
    this.frameDrops = 0
    this.animationCount = 0
  },
}

/**
 * Hook for managing animation lifecycle with performance monitoring
 */
export const useAnimationMonitoring = (animationName: string) => {
  const startAnimation = () => {
    animationPerformanceMonitor.startMonitoring(animationName)
  }

  const endAnimation = (duration: number) => {
    animationPerformanceMonitor.endMonitoring(animationName, duration)
  }

  return { startAnimation, endAnimation }
}

/**
 * Animation helpers service
 * Provides all animation utility functions
 */
export const animationHelpers = {
  createCrossfade,
  createSpring,
  createSequence,
  createStagger,
  monitor: animationPerformanceMonitor,
}
