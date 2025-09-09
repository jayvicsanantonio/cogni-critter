/**
 * CogniCritter App
 * Main application entry point with navigation and TensorFlow initialization
 */

import type React from 'react'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { AppColors } from './src/assets/index'
import { initializeTensorFlow } from './src/utils/tensorflowSetup'
import { AppNavigator } from './src/screens/AppNavigator'
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler'
import { DevPerfOverlay } from './src/components/DevPerfOverlay'
import { DevDebugMenu } from './src/components/DevDebugMenu'
import { devSettings } from './src/utils/devSettings'

function App(): React.JSX.Element {
  const [isTfReady, setIsTfReady] = useState(false)
  const [tfError, setTfError] = useState<string | null>(null)
  const [overlayEnabled, setOverlayEnabled] = useState(__DEV__ ? devSettings.isOverlayEnabled() : false)
  const [debugMenuOpen, setDebugMenuOpen] = useState(__DEV__ ? devSettings.isDebugMenuOpen() : false)

  useEffect(() => {
    if (__DEV__) {
      const unsub = devSettings.onChange(() => {
        setOverlayEnabled(devSettings.isOverlayEnabled())
        setDebugMenuOpen(devSettings.isDebugMenuOpen())
      })
      // Ensure cleanup returns void to satisfy EffectCallback
      return () => {
        try {
          unsub()
        } catch {}
      }
    }
    // Explicitly return undefined for non-dev to satisfy TS7030
    return undefined
  }, [])

  useEffect(() => {
    const setupTensorFlow = async () => {
      try {
        await initializeTensorFlow()
        setIsTfReady(true)
        console.log('TensorFlow.js initialized successfully')
      } catch (error) {
        console.error('Failed to initialize TensorFlow.js:', error)
        setTfError((error as Error).message)
        // Still proceed to app - TensorFlow will be initialized later if needed
        setIsTfReady(true)
      }
    }

    setupTensorFlow()
  }, [])

  // Show loading screen while TensorFlow initializes
  if (!isTfReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={AppColors.background}
        />
        <Text style={styles.title}>CogniCritter</Text>
        <Text style={styles.subtitle}>AI Learning Adventure</Text>
        <ActivityIndicator
          size="large"
          color={AppColors.accent}
          style={styles.loader}
        />
        <Text style={styles.status}>Initializing TensorFlow.js...</Text>
      </View>
    )
  }

  // Show error if TensorFlow failed to initialize
  if (tfError) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={AppColors.background}
        />
        <Text style={styles.title}>CogniCritter</Text>
        <Text style={styles.errorText}>TensorFlow initialization failed</Text>
        <Text style={styles.errorDetails}>{tfError}</Text>
        <Text style={styles.status}>
          The app will continue but ML features may be limited
        </Text>
      </View>
    )
  }

  // Dev-only triple-tap (top-left 80x80) to open Debug Menu
  const tripleTap = __DEV__
    ? Gesture.Tap()
        .numberOfTaps(3)
        .onEnd((_event, success) => {
          if (success) {
            devSettings.setDebugMenuOpen(true)
          }
        })
    : Gesture.Tap()

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={AppColors.background}
      />
      <AppNavigator />
      {__DEV__ && overlayEnabled ? (
        // Development-only performance overlay
        <DevPerfOverlay />
      ) : null}
      {__DEV__ && debugMenuOpen ? <DevDebugMenu /> : null}

      {__DEV__ ? (
        <GestureDetector gesture={tripleTap}>
          <View style={styles.tripleTapHotspot} />
        </GestureDetector>
      ) : null}
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.accent,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    marginBottom: 30,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
  },
  status: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: AppColors.error || '#FF4444',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.7,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  tripleTapHotspot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: 80,
    backgroundColor: 'transparent',
  },
})

export default App
