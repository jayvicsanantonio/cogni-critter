/**
 * AnimatedCritter Component
 * Displays the personalized critter with smooth state transitions and animations
 */

import React, { useEffect, useRef, useState } from "react";
import { View, Image, Animated, StyleSheet, ViewStyle } from "react-native";
import { CritterState } from "../types/coreTypes";
import { AnimatedCritterProps } from "../types/critterTypes";
import { getSpriteForState } from "@assets/index";
import { ColorTintingManager } from "@utils/colorTinting";
import {
  AnimationHelper,
  useAnimationMonitoring,
} from "@utils/animationHelpers";

/**
 * AnimatedCritter Component
 *
 * Features:
 * - Crossfade animations between critter states (250ms duration)
 * - Color tinting applied to grayscale sprites
 * - Native driver optimization for 60fps performance
 * - Self-contained state management for smooth transitions
 */
export const AnimatedCritter: React.FC<AnimatedCritterProps> = ({
  state,
  critterColor,
  animationDuration = 250,
}) => {
  // Animation values for crossfade effect
  const currentOpacity = useRef(new Animated.Value(1)).current;
  const nextOpacity = useRef(new Animated.Value(0)).current;

  // Track previous and current states for crossfade
  const [currentState, setCurrentState] = useState<CritterState>(state);
  const [nextState, setNextState] = useState<CritterState>(state);
  const [isAnimating, setIsAnimating] = useState(false);

  // Performance monitoring
  const { startAnimation, endAnimation } = useAnimationMonitoring(
    "CritterStateTransition"
  );

  // Get the color value using the enhanced color tinting system
  const tintColor = ColorTintingManager.getColorValue(critterColor);

  // Handle state changes with crossfade animation
  useEffect(() => {
    if (state !== currentState && !isAnimating) {
      setIsAnimating(true);
      setNextState(state);

      // Start performance monitoring
      const animationStartTime = Date.now();
      startAnimation();

      // Create crossfade animation using helper
      const crossfadeAnimation = AnimationHelper.createCrossfade(
        currentOpacity,
        nextOpacity,
        animationDuration
      );

      crossfadeAnimation.start(() => {
        // Animation complete - swap states and reset opacities
        setCurrentState(state);
        setNextState(state);
        currentOpacity.setValue(1);
        nextOpacity.setValue(0);
        setIsAnimating(false);

        // End performance monitoring
        const animationDuration = Date.now() - animationStartTime;
        endAnimation(animationDuration);
      });
    }
  }, [
    state,
    currentState,
    isAnimating,
    animationDuration,
    currentOpacity,
    nextOpacity,
    startAnimation,
    endAnimation,
  ]);

  return (
    <View style={styles.container}>
      {/* Current sprite */}
      <Animated.View
        style={[
          styles.spriteContainer,
          {
            opacity: currentOpacity,
          },
        ]}
      >
        <Image
          source={getSpriteForState(currentState)}
          style={[
            styles.sprite,
            {
              tintColor,
            },
          ]}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Next sprite (for crossfade transition) */}
      {isAnimating && (
        <Animated.View
          style={[
            styles.spriteContainer,
            styles.overlaySprite,
            {
              opacity: nextOpacity,
            },
          ]}
        >
          <Image
            source={getSpriteForState(nextState)}
            style={[
              styles.sprite,
              {
                tintColor,
              },
            ]}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  spriteContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  overlaySprite: {
    position: "absolute",
    top: 0,
    left: 0,
  } as ViewStyle,
  sprite: {
    width: "100%",
    height: "100%",
  } as ViewStyle,
});
