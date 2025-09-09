# Getting Started: CogniCritter (Beginner/Jr Engineer Guide)

This guide helps you set up the repo, run the app on iOS/Android, and manually test the Sorter Machine gameplay.

If you get stuck, don’t worry—use the Troubleshooting section at the end, or ask a teammate for help.

---

## 1) Prerequisites

- macOS 13+ (Apple Silicon recommended)
- Node.js 18+ (recommended to install via nvm)
- Watchman (improves Metro performance)
- Xcode 15+ with Command Line Tools (for iOS)
- CocoaPods 1.14+ (for iOS pods)
- Android Studio (latest), Android SDK Platform 34, Build Tools 34.0.0
- Java 17 (e.g., Temurin JDK 17)

Quick install commands (macOS):

```
# Node via nvm (if you don’t have nvm yet)
brew install nvm
mkdir -p ~/.nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && . "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
source ~/.zshrc
nvm install 18

# Watchman
brew install watchman

# CocoaPods
sudo gem install cocoapods

# Java 17 (Temurin)
brew install --cask temurin@17
# Add JAVA_HOME (adjust path if different)
echo 'export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"' >> ~/.zshrc
source ~/.zshrc
```

Android SDK vars (add to ~/.zshrc):

```
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/emulator
export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools
```

Create an Android Virtual Device (AVD) from Android Studio:
- Open Android Studio → Device Manager → Create Device
- Pick a Pixel device, API Level 34 (Android 14)

---

## 2) Clone and install

```
# Clone the repo
git clone <your-fork-or-repo-url>
cd cogni-critter

# Install dependencies
npm install

# iOS pods
cd ios && pod install && cd ..

# Optional but recommended: download local MobileNetV2 model for offline use
npm run download-models
```

Notes:
- The offline model will be placed under `src/assets/models/mobilenet_v2/`. If it’s present, the app prefers it; otherwise it falls back to fetching the MobileNet model via network.
- If pods fail, see Troubleshooting.

---

## 3) Start the Metro bundler

Run Metro bundler in one terminal window:

```
npx react-native start --reset-cache
```

You can keep this running while you work. If you change native code or pods, you might need to restart.

---

## 4) Run the app (iOS)

In a second terminal:

```
# Launch on the default iOS simulator
npm run ios
# or: npx react-native run-ios
```

Tips:
- If you have multiple simulators, open the Simulator app, pick a device (e.g., iPhone 15), and re-run the command.
- If you see pod-related errors, re-run `cd ios && pod install`.

---

## 5) Run the app (Android)

First, ensure an emulator is running (Android Studio → Device Manager → Start the AVD). Then:

```
# With emulator running
npm run android
# or: npx react-native run-android
```

If you see build or SDK errors, check that `JAVA_HOME` points to JDK 17 and that your Android SDK is installed and on PATH.

---

## 6) Developer scripts

```
# Type check
npm run typecheck

# Lint
npm run lint

# Unit tests
npm test

# Download offline model (MobileNetV2)
npm run download-models
```

---

## 7) First run walkthrough

- On launch, you’ll see “Hatch Your Critter!” (first-time user flow).
- Pick a color and tap “Start Game” (color is saved for future sessions).
- You’ll then enter the game flow managed by GameScreen.

---

## 8) Manual testing checklist

This plan validates the basic gameplay, ML integration, and error handling. Perform these steps on either iOS Simulator or Android Emulator (both preferred).

### A. Hatching flow
1) Confirm you see the hatching screen.
2) Choose a color; verify the preview critter is tinted accordingly.
3) Tap “Start Game” → navigates to game, color persists across screens.

Expected: Smooth fade/scale transition; no errors. Returning users skip the hatching flow (preference saved).

### B. Teaching phase (manual sorting)
1) You should see an image with two bins: Left = “Not Apple”, Right = “Apple”.
2) Drag the image left/right. Visual feedback should highlight the predicted drop zone.
3) Release beyond the threshold to drop into the bin. Card animates to the bin and resets to center for next image.
4) Check the progress indicator updates. Minimum = 5 images, Maximum = 10 images.
5) After reaching the minimum, you should see messaging that you can continue or proceed. At max, it auto-continues to training.

Expected: Smooth 60fps animations, no stutter, progress accurate, and at completion it transitions to training.

### C. Model training
1) After teaching completes, model training starts. You’ll see the critter thinking.
2) No UI interaction needed; wait for it to finish.

Expected: No crashes; logs show training start/stop. Training completes within seconds on simulator.

### D. Testing phase (ML predictions)
1) For each image, “Thinking…” shows briefly; the critter is in THINKING state.
2) Within ~1s, a prediction is made:
   - The image animates toward the predicted bin (Right = Apple, Left = Not Apple).
   - A brief result/mood display (HAPPY for correct, CONFUSED for wrong).
3) ScoreCounter updates; progress indicator shows tested count/total.
4) Repeat until the test set is complete.

Expected: Each prediction completes within 1s. If a timeout occurs, fallback logic provides a default result and an alert explains the issue. Animations remain smooth.

### E. Results summary
1) Final accuracy is displayed with a performance message.
2) Educational insights about bias and data diversity are shown.
3) Tap “Play Again” to restart.

Expected: Restart returns to Teaching phase with training data cleared and score reset.

### F. Offline behavior (optional)
1) Turn off your network.
2) Ensure you’ve run `npm run download-models` before bundling.
3) Relaunch the app.

Expected: The app uses the local MobileNetV2 feature extractor. If the local model isn’t available, it should still allow teaching and later attempt a network fallback when needed—errors are handled gracefully.

### G. Background/foreground (optional)
1) While in the testing phase, send the app to background for ~10–20 seconds.
2) Return to the app.

Expected: No crash; state persists. If it was away long enough, logs may indicate that the model may need reloading; gameplay remains stable.

### H. Performance overlay (dev only)
- Triple-tap the top-left corner (80×80 hotspot) to open the debug menu.
- Enable the performance overlay to watch FPS/memory during animations and ML predictions.

Expected: Target ~60fps during simple UI transitions and near-smooth animations during predictions.

---

## 9) Common troubleshooting

### Metro cache or odd runtime errors
```
# Stop Metro, then:
watchman watch-del-all
rm -rf node_modules
npm install
rm -rf ~/.cache/metro
npx react-native start --reset-cache
```

### iOS: Xcode/Pods errors
```
# Reinstall pods
cd ios && pod deintegrate && pod install && cd ..

# Make sure Command Line Tools are installed
xcode-select --install

# If build artifacts get stuck, try cleaning Derived Data
echo "Open Xcode → Settings → Locations → Derived Data → Delete"
```

### Android: SDK/JDK/Gradle issues
```
# Ensure JDK 17 is set
export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"

# Clean Gradle build
cd android && ./gradlew clean && cd ..

# Confirm SDK and platform-tools are on PATH (see prerequisites)
```

### Simulators/Emulators not launching
- iOS: Open the Simulator app manually and choose a device, then re-run `npm run ios`.
- Android: Open Android Studio → Device Manager → Start the AVD, then run `npm run android`.

### Offline model missing
- Re-run: `npm run download-models`
- Rebuild the app so Metro bundles the files.

---

## 10) Helpful docs in this repo
- docs/sorter-machine-gameplay-architecture.md — How the spec maps to the implementation.
- docs/model-bundling-guide.md — Details on bundling MobileNetV2 locally.
- docs/performance-profiling.md — How to measure frame rate, memory, and timings.
- docs/sprite-animation-and-transition-implementation.md — Animation details.

---

## 11) What to do if something is unclear
- Ask in the team channel and link to the step where you’re blocked.
- Open a small PR to improve this doc if you found a missing step.

Welcome to the team—have fun teaching your CogniCritter! 🎉

