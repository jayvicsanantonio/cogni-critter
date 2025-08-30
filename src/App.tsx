import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {initializeTensorFlow} from './utils/tensorflowSetup';

function App(): JSX.Element {
  const [isTfReady, setIsTfReady] = useState(false);

  useEffect(() => {
    const setupTensorFlow = async () => {
      try {
        await initializeTensorFlow();
        setIsTfReady(true);
      } catch (error) {
        console.error('Failed to initialize TensorFlow.js:', error);
      }
    };

    setupTensorFlow();
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.title}>CogniCritter</Text>
        <Text style={styles.subtitle}>Sorter Machine Gameplay</Text>
        <Text style={styles.status}>
          TensorFlow.js: {isTfReady ? 'Ready' : 'Loading...'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B132B', // Deep Space Navy
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5F5F5', // Bright Cloud
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A2E85B', // Cogni Green
  },
  status: {
    fontSize: 14,
    color: '#4D96FF', // Spark Blue
    marginTop: 16,
  },
});

export default App;