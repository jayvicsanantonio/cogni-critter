# Project Specification: CogniCritter

This document provides a comprehensive specification for the CogniCritter application. It is intended to be a single source of truth for development, containing the project vision, requirements, style guide, and technical design.

**This document links to detailed implementation guides for key features.**

---

## 1. Project Vision & Goal

**CogniCritter** is a gamified mobile educational app for children aged 8-12.

**The mission is to teach kids fundamental concepts of Artificial Intelligence (AI) in an intuitive, engaging, and enjoyable way.** By training a personal digital pet, children will actively shape a simple AI, fostering essential skills like critical thinking, problem-solving, and creativity.

---

## 2. Core Gameplay Loop: The "Sorter Machine"

The foundational mini-game is the "Sorter Machine," designed to teach **Supervised Learning (Classification)**.

### Gameplay Phases:

1.  **Teaching Phase**: The child is presented with a series of images (e.g., fruits, objects) and two bins ("Apple" vs. "Not Apple"). The child manually sorts 5-10 images, providing labeled data.
2.  **Testing Phase**: The CogniCritter takes over. It is presented with new, unseen images and attempts to sort them based on the "knowledge" it gained from the child's training.

### Educational Objectives:

*   **Classification**: Children learn that AI can be taught to categorize information based on patterns in data.
*   **AI Bias**: The game will gently introduce the concept of bias. If a child only trains the critter on red apples, the critter may fail to recognize a green apple, providing a tangible lesson on the importance of diverse data.

---

## 3. Character & Art Direction

The CogniCritter is the heart of the app—a curious, energetic, and friendly learning companion.

*   **Design Philosophy**: "The Curiosity Critter." Its design embodies learning and fun. Big, expressive eyes and dynamic poses provide clear, non-verbal feedback.
*   **Visual Style**: Vibrant, cute, and cool with a mix of electric colors and playful patterns. The overall feel is polished, friendly, and magical.

**Reference Character Design:**
![CogniCritter Reference](https://i.imgur.com/8QoN3Xj.png)

### 3.1 Personalization: The "Hatch Your Critter" Feature

To create an immediate emotional connection, players begin by personalizing their critter. This is achieved through a color tinting system where the player chooses a color that is applied to their critter's grayscale sprite throughout the game.

> **For a complete implementation guide, see the [Hatch Your Critter Feature Implementation](./hatch-your-critter-implementation.md) document.**

---

## 4. Visual Style Guide

This guide ensures a cohesive and kid-friendly user interface that complements the CogniCritter's art style.

### Color Palette

The palette is derived from the critter's vibrant colors, set against a dark background to make the UI pop.

| Role             | Color                | Hex Code  | Usage                                     |
| :--------------- | :------------------- | :-------- | :---------------------------------------- |
| **Primary**      | 🟢 **Cogni Green**   | `#A2E85B` | Main UI elements, progress bars, highlights. |
| **Primary**      | 🔵 **Spark Blue**    | `#4D96FF` | Secondary UI elements, icons, text links. |
| **Accent**       | 🟡 **Glow Yellow**   | `#FFD644` | Rewards, stars, special notifications.    |
| **Call to Action** | 💖 **Action Pink**   | `#F037A5` | Main buttons (e.g., "Start", "Next").     |
| **Background**   | 🔵 **Deep Space Navy** | `#0B132B` | App background, creates contrast.         |
| **Text & Panels**  | ⚪️ **Bright Cloud**  | `#F5F5F5` | Main text color, foreground UI panels.    |

### Typography

Fonts are chosen for their playful feel and high readability for young users. Both are available from Google Fonts.

*   **Headings & Titles:** `Nunito` (Weight: ExtraBold)
    *   *Rationale:* Soft, rounded letterforms feel friendly and fun, perfect for grabbing attention on titles and buttons.
*   **Body & Instructions:** `Poppins` (Weight: Regular)
    *   *Rationale:* Excellent clarity and readability for longer text blocks, with a geometric and rounded style that pairs well with `Nunito`.

### UI Shapes & Components

All UI elements should feel soft, tactile, and inviting. **No sharp corners.**

*   **Buttons**: Should have fully rounded corners (a large `borderRadius`, e.g., 20-30px). They should have a subtle drop shadow to feel like they are lifting off the screen.
*   **Cards & Panels**: All containers, pop-ups, and image cards must have rounded corners (e.g., `borderRadius: 16px`).
*   **Icons**: Use a filled icon style with thick, uniform strokes. Icons should be simple and immediately recognizable.
*   **Progress Bars**: Should be thick with rounded ends, filled with **Cogni Green**.

---

## 5. Technical Design & Architecture

### Tech Stack

*   **Framework**: React Native
*   **Machine Learning**: TensorFlow.js (with MobileNetV2 model, bundled on-device)
*   **Backend**: Firebase (Firestore for progress, Analytics for metrics)
*   **Animation**: React Native `Animated` API

### Component Breakdown

*   `GameScreen.js`: Manages overall game state (`LOADING`, `TEACHING`, `TESTING`).
*   `AnimatedCritter.js`: Displays the critter and handles all state transition animations.
*   `ImageCard.js`: Displays the image to be sorted.
*   `SortingBin.js`: Target for the `ImageCard`.

### State Management

Game logic will be managed by a `useReducer` hook in `GameScreen.js` to handle the finite state machine of the gameplay.

---

## 6. Animation, States & Sprites

### Animation Principle

All state transitions must be fluid and perform at a target of **60fps**. This is achieved using a 250ms crossfade animation powered by React Native's `Animated` API with `useNativeDriver: true`.

> **For a detailed technical breakdown, see the [Sprite Animation and Transition Implementation](./sprite-animation-and-transition-implementation.md) document.**

### Character States & Sprite Assets

The CogniCritter's emotional state provides crucial, non-verbal feedback to the child. Each state is represented by a distinct sprite image.

| State Name | Sprite Asset | Trigger | Visual Description |
| :--- | :--- | :--- | :--- |
| **LOADING** | `../public/assets/critter_thinking_grayscale.png` | App is initializing the TensorFlow.js model. | The critter is in its "Thinking" pose, perhaps with a loading spinner icon nearby. |
| **IDLE** | `../public/assets/critter_idle_grayscale.png` | The game is waiting for user input or has just loaded. | The critter is in a default, happy, and relaxed pose, looking at the user. |
| **THINKING** | `../public/assets/critter_thinking_grayscale.png` | The critter is in the "Testing Phase" and is processing an image to make a prediction. | The critter has a concentrated, pensive expression, possibly with a question mark above its head. |
| **HAPPY** | `../public/assets/critter_happy_grayscale.png` | The critter has made a correct prediction. | The critter is visibly excited, jumping for joy with confetti or sparkles. |
| **CONFUSED** | `../public/assets/critter_confused_grayscale.png`| The critter has made an incorrect prediction. | The critter looks sad or dizzy, with droopy ears and a confused expression. |

---

## 7. User Requirements (EARS Notation)

### US01: Character Personalization (Hatch Your Critter)

*   **As a new** player, **I want to** choose the color of my critter before starting the game, **so that** I can make it feel unique and personal to me.
*   **EARS-1.1**: **When** a new user starts the app for the first time, the system **shall** display the "Hatch Your Critter" screen.
*   **EARS-1.2**: **While** on the "Hatch Your Critter" screen, the system **shall** show a preview of the CogniCritter, a selection of color choices, and a "Start Game" button.
*   **EARS-1.3**: **When** the user selects a color, the system **shall** immediately update the critter preview to display the chosen color.
*   **EARS-1.4**: **When** the user presses the "Start Game" button, the system **shall** save the selected color and transition the user to the main game screen.

### US02: Game Initialization

*   **As a** child, **I want to** start the "Sorter Machine" game **so that** I can begin teaching my CogniCritter.
*   **EARS-1.1**: **While** the Machine Learning model is loading, the system **shall** display a loading animation.
*   **EARS-1.2**: **When** the model has successfully loaded, the system **shall** transition to the "Teaching Phase".

### US03: Teaching Phase

*   **As a** child, **I want to** sort images into correct categories **so that** I can teach my critter.
*   **EARS-2.1**: **While** in the "Teaching Phase", the system **shall** display an image and two sorting bins.
*   **EARS-2.2**: **When** the user sorts an image, the system **shall** record the classification and show the next image.
*   **EARS-2.3**: **After** 5 images, the system **shall** transition to the "Testing Phase".

### US04: Testing Phase

*   **As a** child, **I want to** watch my critter try to sort images on its own **so that** I can see if it has learned.
*   **EARS-3.1**: **While** in the "Testing Phase", the system **shall** animate the CogniCritter into its "Thinking" state.
*   **EARS-3.2**: **When** the critter makes a prediction, the system **shall** animate the image moving to the chosen bin.

### US05: Feedback Loop

*   **As a** child, **I want to** see if my critter was right or wrong **so that** I feel engaged.
*   **EARS-4.1**: **If** the critter's classification is correct, the system **shall** display the "Happy" state animation.
*   **EARS-4.2**: **If** the critter's classification is incorrect, the system **shall** display the "Confused" state animation.

---

## 8. Implementation Plan & Tasks

### Phase 1: Project Setup & Foundation (Est. 2-3 Hours)

- [ ] Initialize new React Native project: `npx react-native init CogniCritter`
- [ ] Install all required dependencies: `tfjs`, `tfjs-react-native`, `react-native-fs`, `react-native-image-picker`.
- [ ] Set up project folder structure (`/src`, `/components`, `/screens`, `/assets`).
- [ ] Download MobileNetV2 model files (`model.json`, `weights.bin`).
- [ ] Place model files and critter sprite images into the `/assets` directory.
- [ ] Configure `react-native.config.js` to link assets.

### Phase 2: UI Development (Est. 3-4 Hours)

- [ ] Create the `GameScreen.js` component with a static layout.
- [ ] Build the `Critter.js` component to display a single, static sprite image.
- [ ] Build the `ImageCard.js` component to display a static image.
- [ ] Build the `SortingBin.js` component with static text ("Apple", "Not Apple").
- [ ] Assemble all components into `GameScreen.js` and style them to match the visual design.

### Phase 3: TensorFlow.js Integration (Est. 4-5 Hours)

- [ ] Implement the model loading logic in `GameScreen.js` using `useEffect` and `tf.loadLayersModel`.
- [ ] Display a loading indicator while the model is loading.
- [ ] Create a helper module `ml.js` to contain the `imageToTensor` function.
- [ ] Implement the `imageToTensor` function, which handles reading the image file, decoding it, resizing to 224x224, and normalizing pixel values.
- [ ] Create the `classifyImage` function that takes an image URI, converts it to a tensor, and runs `model.predict()`.
- [ ] Test: Hardcode one image and verify that the `classifyImage` function returns a valid prediction tensor without crashing.

### Phase 4: Game Logic Implementation (Est. 4-5 Hours)

- [ ] Implement the `gameReducer` to manage the game's state machine (`LOADING`, `TEACHING`, `TESTING`).
- [ ] Create a list of image objects with their correct labels (e.g., `{ uri: '...', label: 'apple' }`).
- [ ] Implement the "Teaching Phase": On user sort, record the action and advance to the next image. Transition to `TESTING` after 5 images.
- [ ] Implement the "Testing Phase":
    - Call the `classifyImage` function.
    - Compare the model's prediction to the image's true label.
    - Update the score and critter state based on the result.
    - Advance to the next image.

### Phase 5: Animation & Polish (Est. 3-4 Hours)

- [ ] Refactor `Critter.js` into `AnimatedCritter.js` using the `Animated` API.
- [ ] Implement the crossfade transition logic based on the `state` prop.
- [ ] Connect the critter's state in the `gameReducer` to the `AnimatedCritter` component.
- [ ] Add sound effects for correct and incorrect answers.
- [ ] Add a score counter and progress bar to the UI.
- [ ] Implement drag-and-drop functionality for the `ImageCard` component.

### Phase 6: Final Touches (Est. 1-2 Hours)

- [ ] (Optional) Add Firebase SDK and log a simple analytic event when a game is completed.
- [ ] Perform final testing on a physical device.
- [ ] Prepare the app for building and submission to Devpost.
