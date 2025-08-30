# Sprite Animation and Transition Implementation

This document provides the complete technical specification for the CogniCritter’s character animations, with a focus on implementing smooth, responsive, and performant 60fps transitions.

## 1. Animation Goals and Principles

All character state transitions must be fluid, engaging, and performant at a target of 60fps.

*   **Performance First:** Animations must be offloaded from the JavaScript thread to the UI thread to prevent stuttering caused by game logic.
*   **Clear Communication:** Animations should instantly and clearly communicate the critter’s state (e.g., thinking, happy, confused) to the player.
*   **Responsiveness:** Transitions should feel immediate and tightly coupled to player actions or game events.

## 2. Technical Implementation: Crossfade with `Animated` API

We will use React Native's built-in `Animated` API to implement a crossfade transition between states. This technique provides a perfect balance of visual quality and implementation speed for a hackathon.

**How it Works:** When the critter's state changes, instead of swapping the image instantly, we smoothly animate the previous state's sprite from 100% opacity to 0% opacity over ~250ms, while the new sprite is already fully visible underneath.

**The 60fps Key:** All animations must use the `useNativeDriver: true` option. This sends the animation calculations to the device's native UI thread. This allows the animation to run independently of the JavaScript thread, which may be busy processing game logic, guaranteeing a smooth animation.

## 3. `AnimatedCritter.js` Component Deep-Dive

This component encapsulates all logic related to character animation.

**Full Code**

```javascript
// src/components/AnimatedCritter.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

// Map sprite assets to an object for easy access
const spriteAssets = {
  IDLE: require('../public/assets/critter_idle_grayscale.png'),
  THINKING: require('../public/assets/critter_thinking_grayscale.png'),
  HAPPY: require('../public/assets/critter_happy_grayscale.png'),
  CONFUSED: require('../public/assets/critter_confused_grayscale.png'),
  LOADING: require('../public/assets/critter_thinking_grayscale.png'),
};

/**
 * A component that handles smooth crossfade transitions between states.
 * @param {{
 * state: 'IDLE' | 'THINKING' | 'HAPPY' | 'CONFUSED' | 'LOADING',
 * critterColor: string,
 * }} props
 */
const AnimatedCritter = ({ state, critterColor }) => {
  // `previousState` holds a reference to the old sprite for the fade-out
  const [previousState, setPreviousState] = useState(state);

  // `useRef` holds a reference to the animation value across re-renders
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // This effect triggers the animation whenever the `state` prop changes
  useEffect(() => {
    if (state !== previousState) {
      // 1. Reset the opacity of the old sprite to 1 (fully visible)
      fadeAnim.setValue(1);

      // 2. Start the fade-out animation
      Animated.timing(fadeAnim, {
        toValue: 0, // Animate to fully transparent
        duration: 250, // A quick but smooth transition
        useNativeDriver: true, // **THE KEY to 60fps performance**
      }).start(() => {
        // 3. After the animation completes, update `previousState` to the current
        // state, preparing for the next state change.
        setPreviousState(state);
      });
    }
  }, [state]);

  // Get the sprite assets
  const currentSprite = spriteAssets[state];
  const previousSprite = spriteAssets[previousState];

  return (
    <View style={styles.container}>
      {/* The current sprite is always rendered on the bottom at 100% opacity */}
      <Animated.Image
        source={currentSprite}
        style={[styles.sprite, { tintColor: critterColor }]}
      />

      {/* The previous sprite is only rendered on top during a state change, and it fades out */}
      {state !== previousState && (
        <Animated.Image
          source={previousSprite}
          style={[
            styles.sprite,
            {
              opacity: fadeAnim, // Bind opacity to our animated value
              tintColor: critterColor
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprite: {
    width: '100%',
    height: '100%',
    position: 'absolute', // This is what allows the sprites to stack
  },
});

export default AnimatedCritter;
```

## 4. State Definitions and Triggers

| State Name | Trigger                                                                              |
| ---------- | ------------------------------------------------------------------------------------ |
| `LOADING`  | The app is initializing the TensorFlow.js model.                                     |
| `IDLE`     | The game is waiting for user input or has just loaded.                               |
| `THINKING` | The critter is in the "Testing Phase" and is processing an image to make a prediction. |
| `HAPPY`    | The critter has made a correct prediction.                                           |
| `CONFUSED` | The critter has made an incorrect prediction.                                        |
