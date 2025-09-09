/**
 * UI Component Types
 */

import type { NavigationProp } from '@react-navigation/native'
import type { CritterColor } from './coreTypes'

export interface GameScreenProps {
  route: {
    params: {
      critterColor?: string
    }
  }
  navigation: NavigationProp<Record<string, object | undefined>>
}

export interface HatchingScreenProps {
  navigation: NavigationProp<Record<string, object | undefined>>
}

export interface ColorPickerProps {
  selectedColor: CritterColor
  onColorSelect: (color: CritterColor) => void
}

export interface ImageCardProps {
  imageUri: string
  onSort: (binId: string) => void
  disabled: boolean
}

export interface SortingBinProps {
  id: string
  label: string
  onDrop: (imageId: string) => void
  highlighted: boolean
  showSuccess?: boolean
}
