/**
 * ColorPicker Component
 * Provides predefined color options for critter personalization
 */

import { AppColors } from '@assets/index'
import type { ColorPickerProps } from '@/types/uiTypes'
import { getAllCritterColors } from '@utils/colorTinting'
import type React from 'react'
import {
  StyleSheet,
  Text,
  type TextStyle,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'

/**
 * ColorPicker Component
 *
 * Features:
 * - Displays predefined color options (Cogni Green, Spark Blue, Glow Yellow, Action Pink, White)
 * - Shows selected state with visual feedback
 * - Rounded corners and soft shadows for child-friendly design
 * - Accessible touch targets (minimum 44px)
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorSelect,
}) => {
  const availableColors = getAllCritterColors()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Critter's Color</Text>
      <View style={styles.colorGrid}>
        {availableColors.map(({ name, hex }) => (
          <TouchableOpacity
            key={name}
            style={[
              styles.colorOption,
              {
                backgroundColor: hex,
                borderColor:
                  selectedColor === name
                    ? AppColors.brightCloud
                    : 'transparent',
                borderWidth: selectedColor === name ? 3 : 0,
              },
            ]}
            onPress={() => onColorSelect(name)}
            accessibilityRole="button"
            accessibilityLabel={`Select ${name} color`}
            accessibilityHint="Tap to choose this color for your critter"
            accessibilityState={{ selected: selectedColor === name }}
          >
            <View style={styles.colorInner}>
              {selectedColor === name && (
                <View style={styles.selectedIndicator} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.selectedText}>Selected: {selectedColor}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  } as ViewStyle,
  title: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.text,
    marginBottom: 20,
    textAlign: 'center',
  } as TextStyle,
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 15,
  } as ViewStyle,
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    // Soft shadow for tactile feel
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  } as ViewStyle,
  colorInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.deepSpaceNavy,
    borderWidth: 2,
    borderColor: AppColors.brightCloud,
  } as ViewStyle,
  selectedText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    textAlign: 'center',
  } as TextStyle,
})
