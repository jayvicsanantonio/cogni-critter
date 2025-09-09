/**
 * Application Constants
 * Central location for all configuration values and constants
 */

import type { GameConfig } from '@/types/gameTypes'

/**
 * Default game configuration
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  teachingPhase: {
    minImages: 5,
    maxImages: 10,
    currentCount: 0, // Will be set dynamically
  },
  testingPhaseImageCount: 5,
  targetFrameRate: 60,
  maxPredictionTime: 1000, // 1 second
  animationDuration: 250, // 250ms
}

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  MIN_FRAME_RATE: 45,
  MAX_MODEL_LOAD_TIME: 10000, // 10 seconds
  MAX_PREDICTION_TIME: 1000, // 1 second
  MAX_MEMORY_USAGE: 150 * 1024 * 1024, // 150MB in bytes
} as const

/**
 * Animation constants
 */
export const ANIMATION_CONFIG = {
  CROSSFADE_DURATION: 250,
  USE_NATIVE_DRIVER: true,
  EASING: 'ease-in-out',
} as const

/**
 * ML Model constants
 */
export const ML_CONFIG = {
  MODEL_URL:
    'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1',
  INPUT_SIZE: 224,
  CHANNELS: 3,
  NORMALIZATION_OFFSET: 127.5,
  NORMALIZATION_SCALE: 127.5,
} as const

/**
 * UI Layout constants
 */
export const UI_CONFIG = {
  BORDER_RADIUS: {
    SMALL: 8,
    MEDIUM: 16,
    LARGE: 24,
    EXTRA_LARGE: 30,
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
  },
  TOUCH_TARGET_SIZE: 44,
} as const
