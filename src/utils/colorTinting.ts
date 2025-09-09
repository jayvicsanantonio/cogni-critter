/**
 * Color Tinting Utility
 * Handles color tinting operations for grayscale sprites
 */

import { CritterColors } from '@assets/index'
import type { CritterColor } from '@types/coreTypes'

/**
 * Get the hex color value from a critter color name
 * @param colorName The critter color name or hex value
 * @returns Hex color string
 */
export function getColorValue(colorName: string): string {
  // If it's already a hex color, return as-is
  if (colorName.startsWith('#')) {
    return colorName
  }

  // Look up the color in the predefined palette
  const color = CritterColors[colorName as keyof typeof CritterColors]
  if (color) {
    return color
  }

  // Fallback to default color if not found
  console.warn(
    `Color "${colorName}" not found in palette, using default Cogni Green`
  )
  return CritterColors['Cogni Green']
}

/**
 * Validate if a color name exists in the critter color palette
 * @param colorName The color name to validate
 * @returns True if the color exists in the palette
 */
export function isValidCritterColor(
  colorName: string
): colorName is CritterColor {
  return colorName in CritterColors
}

/**
 * Get all available critter colors
 * @returns Array of color objects with name and hex value
 */
export function getAllCritterColors(): Array<{
  name: CritterColor
  hex: string
}> {
  return Object.entries(CritterColors).map(([name, hex]) => ({
    name: name as CritterColor,
    hex,
  }))
}

/**
 * Apply opacity to a hex color
 * @param hexColor Hex color string (e.g., "#A2E85B")
 * @param opacity Opacity value between 0 and 1
 * @returns RGBA color string
 */
export function applyOpacity(hexColor: string, opacity: number): string {
  // Remove # if present
  const hex = hexColor.replace('#', '')

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Clamp opacity between 0 and 1
  const alpha = Math.max(0, Math.min(1, opacity))

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Get a lighter or darker variant of a color
 * @param hexColor Hex color string
 * @param factor Factor to lighten (positive) or darken (negative). Range: -1 to 1
 * @returns Modified hex color string
 */
export function adjustBrightness(hexColor: string, factor: number): string {
  // Remove # if present
  const hex = hexColor.replace('#', '')

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Clamp factor between -1 and 1
  const clampedFactor = Math.max(-1, Math.min(1, factor))

  // Adjust brightness
  const adjust = (value: number) => {
    if (clampedFactor > 0) {
      // Lighten
      return Math.round(value + (255 - value) * clampedFactor)
    } else {
      // Darken
      return Math.round(value * (1 + clampedFactor))
    }
  }

  const newR = adjust(r)
  const newG = adjust(g)
  const newB = adjust(b)

  // Convert back to hex
  const toHex = (value: number) => {
    const hex = Math.max(0, Math.min(255, value)).toString(16)
    return hex.length === 1 ? `0${hex}` : hex
  }

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
}

/**
 * Color tinting utility functions
 * Provides all color manipulation functions
 */
export const colorTinting = {
  getColorValue,
  isValidCritterColor,
  getAllCritterColors,
  applyOpacity,
  adjustBrightness,
}
