/**
 * CelebratoryEffects Component
 * Visual effects for celebrating high accuracy achievements and milestones
 */

import { AppColors } from '@assets/index'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native'

interface CelebratoryEffectsProps {
  trigger: boolean
  accuracy: number
  streak?: number
  milestone?: string
  onComplete?: () => void
}

interface Particle {
  id: string
  x: Animated.Value
  y: Animated.Value
  scale: Animated.Value
  rotation: Animated.Value
  opacity: Animated.Value
  color: string
  emoji: string
}

/**
 * CelebratoryEffects Component
 *
 * Creates animated visual effects for celebrating achievements:
 * - Confetti particles for high accuracy
 * - Streak celebrations
 * - Milestone achievements
 * - Animated text overlays
 *
 * Requirements: 5.5 - Celebratory visual effects for high accuracy achievements
 */
export const CelebratoryEffects: React.FC<CelebratoryEffectsProps> = ({
  trigger,
  accuracy,
  streak = 0,
  milestone,
  onComplete,
}) => {
  const [particles, setParticles] = useState<Particle[]>([])
  const [showText, setShowText] = useState(false)

  // Animation values for text effects
  const textScale = useRef(new Animated.Value(0)).current
  const textOpacity = useRef(new Animated.Value(0)).current
  const textRotation = useRef(new Animated.Value(0)).current

  // Screen dimensions
  const { height } = Dimensions.get('window')

  // Determine celebration type and intensity
  const getCelebrationType = () => {
    if (milestone) return 'milestone'
    if (streak >= 5) return 'mega_streak'
    if (streak >= 3) return 'streak'
    if (accuracy >= 0.9) return 'perfect'
    if (accuracy >= 0.8) return 'excellent'
    return 'good'
  }

  const celebrationType = getCelebrationType()

  // Create particle with random properties
  const createParticle = useCallback(
    (index: number): Particle => {
      const colors = [
        AppColors.primary, // Cogni Green
        AppColors.secondary, // Spark Blue
        AppColors.accent, // Glow Yellow or Action Pink
        '#FFD644', // Glow Yellow
        '#F037A5', // Action Pink
      ]

      const emojis = ['⭐', '🎉', '✨', '🔥', '💫', '🌟', '🎊']

      return {
        id: `particle_${index}_${Date.now()}`,
        x: new Animated.Value(Math.random() * width),
        y: new Animated.Value(height + 50),
        scale: new Animated.Value(0),
        rotation: new Animated.Value(0),
        opacity: new Animated.Value(1),
        color: colors[Math.floor(Math.random() * colors.length)],
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      }
    },
    [height]
  )

  // Get celebration text based on type
  const getCelebrationText = () => {
    switch (celebrationType) {
      case 'milestone':
        return milestone || 'Milestone Reached!'
      case 'mega_streak':
        return `🔥 ${streak} STREAK! 🔥`
      case 'streak':
        return `${streak} in a row!`
      case 'perfect':
        return 'PERFECT! 🌟'
      case 'excellent':
        return 'EXCELLENT! ⭐'
      case 'good':
        return 'Great job! 🎉'
      default:
        return 'Well done!'
    }
  }

  // Get particle count based on celebration intensity
  const getParticleCount = useCallback(() => {
    switch (celebrationType) {
      case 'milestone':
      case 'mega_streak':
        return 20
      case 'perfect':
        return 15
      case 'streak':
      case 'excellent':
        return 10
      default:
        return 6
    }
  }, [celebrationType])

  // Animate particles
  const animateParticles = useCallback((particleList: Particle[]) => {
    const animations = particleList.map((particle, index) => {
      const delay = index * 50 // Stagger particle animations
      const duration = 2000 + Math.random() * 1000 // Random duration

      return Animated.parallel([
        // Scale in
        Animated.timing(particle.scale, {
          toValue: 0.8 + Math.random() * 0.4,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
        // Move up and sideways
        Animated.timing(particle.y, {
          toValue: -100 - Math.random() * 200,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(particle.x, {
          toValue: particle.x._value + (Math.random() - 0.5) * 200,
          duration,
          delay,
          useNativeDriver: true,
        }),
        // Rotate
        Animated.timing(particle.rotation, {
          toValue: (Math.random() - 0.5) * 720, // Random rotation
          duration,
          delay,
          useNativeDriver: true,
        }),
        // Fade out
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 500,
          delay: delay + duration - 500,
          useNativeDriver: true,
        }),
      ])
    })

    return Animated.parallel(animations)
  }, [])

  // Animate celebration text
  const animateText = useCallback(() => {
    return Animated.sequence([
      // Scale in with bounce
      Animated.parallel([
        Animated.spring(textScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Slight rotation wiggle for extra celebration
      Animated.sequence([
        Animated.timing(textRotation, {
          toValue: 5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(textRotation, {
          toValue: -5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(textRotation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      // Hold for a moment
      Animated.delay(1500),
      // Scale out
      Animated.parallel([
        Animated.timing(textScale, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ])
  }, [textScale, textOpacity, textRotation])

  // Trigger celebration effect
  useEffect(() => {
    if (trigger && celebrationType !== 'good') {
      // Only celebrate for significant achievements
      // Create particles
      const particleCount = getParticleCount()
      const newParticles = Array.from({ length: particleCount }, (_, i) =>
        createParticle(i)
      )

      setParticles(newParticles)
      setShowText(true)

      // Start animations
      const particleAnimation = animateParticles(newParticles)
      const textAnimation = animateText()

      // Run animations
      Animated.parallel([particleAnimation, textAnimation]).start(() => {
        // Cleanup
        setParticles([])
        setShowText(false)

        // Reset animation values
        textScale.setValue(0)
        textOpacity.setValue(0)
        textRotation.setValue(0)

        onComplete?.()
      })
    }
  }, [
    trigger,
    celebrationType,
    onComplete,
    animateParticles,
    animateText,
    createParticle,
    getParticleCount,
    textOpacity.setValue,
    textRotation.setValue, // Reset animation values
    textScale.setValue,
  ])

  if (!trigger || celebrationType === 'good') {
    return null
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Particles */}
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.x,
              top: particle.y,
              transform: [
                { scale: particle.scale },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          <Text style={[styles.particleText, { color: particle.color }]}>
            {particle.emoji}
          </Text>
        </Animated.View>
      ))}

      {/* Celebration Text */}
      {showText && (
        <Animated.View
          style={[
            styles.textContainer,
            {
              transform: [
                { scale: textScale },
                {
                  rotate: textRotation.interpolate({
                    inputRange: [-10, 10],
                    outputRange: ['-10deg', '10deg'],
                  }),
                },
              ],
              opacity: textOpacity,
            },
          ]}
        >
          <Text
            style={[
              styles.celebrationText,
              celebrationType === 'milestone' && styles.milestoneText,
              celebrationType === 'mega_streak' && styles.megaStreakText,
              celebrationType === 'perfect' && styles.perfectText,
            ]}
          >
            {getCelebrationText()}
          </Text>
        </Animated.View>
      )}
    </View>
  )
}

const { width, height } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  textContainer: {
    position: 'absolute',
    top: height * 0.3,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationText: {
    fontSize: 32,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  milestoneText: {
    fontSize: 36,
    color: AppColors.accent,
  },
  megaStreakText: {
    fontSize: 38,
    color: '#F037A5', // Action Pink
  },
  perfectText: {
    fontSize: 40,
    color: '#FFD644', // Glow Yellow
  },
})
