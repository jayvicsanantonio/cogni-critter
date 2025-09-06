/**
 * UI Component Types
 */

import { NavigationProp } from '@react-navigation/native';
import { CritterColor } from './coreTypes';

export interface GameScreenProps {
  route: {
    params: {
      critterColor?: string;
    };
  };
  navigation: NavigationProp<any>;
}

export interface HatchingScreenProps {
  navigation: NavigationProp<any>;
}

export interface ColorPickerProps {
  selectedColor: CritterColor;
  onColorSelect: (color: CritterColor) => void;
}

export interface ImageCardProps {
  imageUri: string;
  onSort: (binId: string) => void;
  disabled: boolean;
}

export interface SortingBinProps {
  id: string;
  label: string;
  onDrop: (imageId: string) => void;
  highlighted: boolean;
  showSuccess?: boolean;
}
