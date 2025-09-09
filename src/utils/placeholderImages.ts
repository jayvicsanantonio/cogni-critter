import type { ImageItem } from '@types/mlTypes'

/**
 * Placeholder Image Generator
 *
 * Generates placeholder images for development and offline testing.
 * Uses data URIs with simple colored rectangles and emoji icons.
 *
 * This is a fallback for when network images are unavailable.
 */

/**
 * Generate a simple colored rectangle as a data URI
 */
const generatePlaceholderDataUri = (
  color: string,
  emoji: string,
  width: number = 224,
  height: number = 224
): string => {
  // Create a simple SVG with background color and emoji
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
      <text x="50%" y="50%" font-size="60" text-anchor="middle" dy="0.3em">${emoji}</text>
    </svg>
  `

  // Convert to data URI
  const encodedSvg = encodeURIComponent(svg)
  return `data:image/svg+xml,${encodedSvg}`
}

/**
 * Placeholder apple images
 */
export const placeholderApples: ImageItem[] = [
  {
    id: 'placeholder_apple_1',
    uri: generatePlaceholderDataUri('#FF6B6B', '🍎'),
    label: 'apple',
    metadata: {
      variety: 'Red Apple',
      color: 'red',
      source: 'placeholder',
    },
  },
  {
    id: 'placeholder_apple_2',
    uri: generatePlaceholderDataUri('#4ECDC4', '🍏'),
    label: 'apple',
    metadata: {
      variety: 'Green Apple',
      color: 'green',
      source: 'placeholder',
    },
  },
  {
    id: 'placeholder_apple_3',
    uri: generatePlaceholderDataUri('#FFE66D', '🍎'),
    label: 'apple',
    metadata: {
      variety: 'Yellow Apple',
      color: 'yellow',
      source: 'placeholder',
    },
  },
  {
    id: 'placeholder_apple_4',
    uri: generatePlaceholderDataUri('#FF8B94', '🍎'),
    label: 'apple',
    metadata: {
      variety: 'Pink Apple',
      color: 'pink',
      source: 'placeholder',
    },
  },
  {
    id: 'placeholder_apple_5',
    uri: generatePlaceholderDataUri('#A8E6CF', '🍏'),
    label: 'apple',
    metadata: {
      variety: 'Light Green Apple',
      color: 'light-green',
      source: 'placeholder',
    },
  },
]

/**
 * Placeholder non-apple images
 */
export const placeholderNotApples: ImageItem[] = [
  {
    id: 'placeholder_orange_1',
    uri: generatePlaceholderDataUri('#FFA726', '🍊'),
    label: 'not_apple',
    metadata: {
      variety: 'Orange',
      color: 'orange',
      source: 'placeholder',
    },
  },
  {
    id: 'placeholder_banana_1',
    uri: generatePlaceholderDataUri('#FFEB3B', '🍌'),
    label: 'not_apple',
    metadata: {
      variety: 'Banana',
      color: 'yellow',
      source: 'placeholder',
    },
  },
  {
    id: 'placeholder_grape_1',
    uri: generatePlaceholderDataUri('#9C27B0', '🍇'),
    label: 'not_apple',
    metadata: {
      variety: 'Grapes',
      color: 'purple',
      source: 'placeholder',
    },
  },
  {
    id: 'placeholder_strawberry_1',
    uri: generatePlaceholderDataUri('#E91E63', '🍓'),
    label: 'not_apple',
    metadata: {
      variety: 'Strawberry',
      color: 'red',
      source: 'placeholder',
    },
  },
  {
    id: 'placeholder_lemon_1',
    uri: generatePlaceholderDataUri('#CDDC39', '🍋'),
    label: 'not_apple',
    metadata: {
      variety: 'Lemon',
      color: 'yellow',
      source: 'placeholder',
    },
  },
  {
    id: 'placeholder_peach_1',
    uri: generatePlaceholderDataUri('#FFAB91', '🍑'),
    label: 'not_apple',
    metadata: {
      variety: 'Peach',
      color: 'peach',
      source: 'placeholder',
    },
  },
]

/**
 * Get all placeholder images
 */
export const getAllPlaceholderImages = (): ImageItem[] => [
  ...placeholderApples,
  ...placeholderNotApples,
]

/**
 * Get placeholder images by label
 */
export const getPlaceholderImagesByLabel = (
  label: 'apple' | 'not_apple'
): ImageItem[] => {
  return label === 'apple' ? placeholderApples : placeholderNotApples
}

/**
 * Shuffle array utility
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Get a balanced teaching set using placeholder images
 */
export const getPlaceholderTeachingSet = (count: number = 6): ImageItem[] => {
  const halfCount = Math.floor(count / 2)
  const apples = shuffleArray(placeholderApples).slice(0, halfCount)
  const notApples = shuffleArray(placeholderNotApples).slice(0, halfCount)

  return shuffleArray([...apples, ...notApples])
}

/**
 * Get a balanced testing set using placeholder images
 */
export const getPlaceholderTestingSet = (
  count: number = 4,
  excludeIds: string[] = []
): ImageItem[] => {
  const availableApples = placeholderApples.filter(
    (img) => !excludeIds.includes(img.id)
  )
  const availableNotApples = placeholderNotApples.filter(
    (img) => !excludeIds.includes(img.id)
  )

  const halfCount = Math.floor(count / 2)
  const apples = shuffleArray(availableApples).slice(0, halfCount)
  const notApples = shuffleArray(availableNotApples).slice(0, halfCount)

  return shuffleArray([...apples, ...notApples])
}
