/**
 * UI Component Types
 */

import { NavigationProp } from '@react-navigation/native';

export interface GameScreenProps {
  route: {
    params: {
      critterColor?: string;
    };
  };
  navigation: NavigationProp<any>;
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
}
