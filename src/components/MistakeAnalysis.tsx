/**
 * MistakeAnalysis Component
 * Analyzes common mistakes and provides explanations based on training examples
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { TrainingExample, TestResult } from '@types/mlTypes';
import { AppColors } from '@assets/index';

interface MistakeAnalysisProps {
  trainingData: TrainingExample[];
  testResults: TestResult[];
}

interface MistakePattern {
  type:
    | 'false_positive'
    | 'false_negative'
    | 'confidence_issue'
    | 'training_gap';
  title: string;
  description: string;
  explanation: string;
  suggestion: string;
  count: number;
  examples: string[];
}

/**
 * MistakeAnalysis Component
 *
 * Analyzes test results against training data to identify common mistake patterns
 * and provide educational explanations for why they occurred.
 * Requirements: 6.2, 6.4
 */
export const MistakeAnalysis: React.FC<MistakeAnalysisProps> = ({
  trainingData,
  testResults,
}) => {
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Analyze mistake patterns
  const analyzeMistakes = (): MistakePattern[] => {
    const patterns: MistakePattern[] = [];
    const mistakes = testResults.filter(
      (result) => !result.isCorrect
    );

    if (mistakes.length === 0) {
      return [
        {
          type: 'confidence_issue',
          title: 'Perfect Score! 🎉',
          description: 'Your critter made no mistakes!',
          explanation:
            'This means your training examples were clear and diverse enough for your critter to learn the difference between apples and other fruits.',
          suggestion:
            'Great job! This is what AI developers aim for - accurate predictions based on good training data.',
          count: 0,
          examples: [],
        },
      ];
    }

    // Analyze false positives (predicted apple when it wasn't)
    const falsePositives = mistakes.filter(
      (result) =>
        result.predictedLabel === 'apple' &&
        result.trueLabel === 'not_apple'
    );

    if (falsePositives.length > 0) {
      patterns.push({
        type: 'false_positive',
        title: 'Seeing Apples Everywhere',
        description: `Your critter called ${falsePositives.length} non-apple(s) an apple.`,
        explanation:
          'This happens when the critter learned to look for features that apples share with other round, colorful fruits. It might be focusing on shape or color instead of apple-specific details.',
        suggestion:
          'In real AI, this could be fixed by training with more diverse non-apple examples or by teaching the system to look for more specific apple features.',
        count: falsePositives.length,
        examples: falsePositives.map(
          (fp) => `Thought ${fp.trueLabel} was an apple`
        ),
      });
    }

    // Analyze false negatives (predicted not-apple when it was)
    const falseNegatives = mistakes.filter(
      (result) =>
        result.predictedLabel === 'not_apple' &&
        result.trueLabel === 'apple'
    );

    if (falseNegatives.length > 0) {
      patterns.push({
        type: 'false_negative',
        title: 'Missing Real Apples',
        description: `Your critter missed ${falseNegatives.length} real apple(s).`,
        explanation:
          "This happens when the critter learned a very specific idea of what an apple looks like. Maybe it only saw red apples in training, so it doesn't recognize green or yellow ones.",
        suggestion:
          'In real AI, this could be fixed by training with more variety - different apple colors, sizes, and angles to help the system recognize all types of apples.',
        count: falseNegatives.length,
        examples: falseNegatives.map((fn) => `Missed a real apple`),
      });
    }

    // Analyze confidence patterns
    const lowConfidenceMistakes = mistakes.filter(
      (result) => result.confidence < 0.7
    );
    const highConfidenceMistakes = mistakes.filter(
      (result) => result.confidence >= 0.7
    );

    if (highConfidenceMistakes.length > 0) {
      patterns.push({
        type: 'confidence_issue',
        title: 'Very Confident, But Wrong',
        description: `Your critter was very sure about ${highConfidenceMistakes.length} wrong answer(s).`,
        explanation:
          'This is interesting! Your critter was confident but wrong. This might mean the training examples were too similar to each other, so it learned overly simple rules.',
        suggestion:
          'In real AI, this shows the importance of diverse training data. The more variety in training, the better AI systems become at handling new situations.',
        count: highConfidenceMistakes.length,
        examples: highConfidenceMistakes.map(
          (hc) =>
            `${Math.round(hc.confidence * 100)}% confident but wrong`
        ),
      });
    }

    // Analyze training data gaps
    const appleTrainingCount = trainingData.filter(
      (ex) => ex.userLabel === 'apple'
    ).length;
    const notAppleTrainingCount = trainingData.filter(
      (ex) => ex.userLabel === 'not_apple'
    ).length;

    if (Math.abs(appleTrainingCount - notAppleTrainingCount) > 2) {
      const majorityLabel =
        appleTrainingCount > notAppleTrainingCount
          ? 'apple'
          : 'not_apple';
      const minorityLabel =
        appleTrainingCount > notAppleTrainingCount
          ? 'not_apple'
          : 'apple';

      patterns.push({
        type: 'training_gap',
        title: 'Unbalanced Learning',
        description: `Your critter learned from more ${majorityLabel} examples (${Math.max(
          appleTrainingCount,
          notAppleTrainingCount
        )}) than ${minorityLabel} examples (${Math.min(
          appleTrainingCount,
          notAppleTrainingCount
        )}).`,
        explanation:
          "When AI systems see more examples of one type, they can become biased toward that type. It's like if you only saw pictures of big dogs - you might think all dogs are big!",
        suggestion:
          'Real AI developers work hard to balance their training data to make fair and accurate systems for everyone.',
        count: Math.abs(appleTrainingCount - notAppleTrainingCount),
        examples: [
          `${Math.max(
            appleTrainingCount,
            notAppleTrainingCount
          )} ${majorityLabel} vs ${Math.min(
            appleTrainingCount,
            notAppleTrainingCount
          )} ${minorityLabel}`,
        ],
      });
    }

    return patterns;
  };

  const mistakePatterns = analyzeMistakes();
  const totalMistakes = testResults.filter(
    (result) => !result.isCorrect
  ).length;

  if (totalMistakes === 0 && !showAnalysis) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowAnalysis(!showAnalysis)}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleButtonText}>
            🎯 Perfect Score Analysis
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowAnalysis(!showAnalysis)}
        activeOpacity={0.7}
      >
        <Text style={styles.toggleButtonText}>
          {showAnalysis ? '📊 Hide' : '🔍 Analyze'} Mistake Patterns
          {totalMistakes > 0 && ` (${totalMistakes} mistakes)`}
        </Text>
      </TouchableOpacity>

      {showAnalysis && (
        <View style={styles.analysisContainer}>
          <Text style={styles.title}>🧐 Why Did This Happen?</Text>
          <Text style={styles.subtitle}>
            Let's learn from your critter's mistakes!
          </Text>

          <ScrollView
            style={styles.patternsContainer}
            showsVerticalScrollIndicator={false}
          >
            {mistakePatterns.map((pattern, index) => (
              <View key={index} style={styles.patternCard}>
                <View style={styles.patternHeader}>
                  <Text style={styles.patternTitle}>
                    {pattern.title}
                  </Text>
                  {pattern.count > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>
                        {pattern.count}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.patternDescription}>
                  {pattern.description}
                </Text>

                <View style={styles.explanationContainer}>
                  <Text style={styles.explanationLabel}>
                    🤔 Why this happens:
                  </Text>
                  <Text style={styles.explanationText}>
                    {pattern.explanation}
                  </Text>
                </View>

                <View style={styles.suggestionContainer}>
                  <Text style={styles.suggestionLabel}>
                    💡 In real AI:
                  </Text>
                  <Text style={styles.suggestionText}>
                    {pattern.suggestion}
                  </Text>
                </View>

                {pattern.examples.length > 0 && (
                  <View style={styles.examplesContainer}>
                    <Text style={styles.examplesLabel}>
                      Examples:
                    </Text>
                    {pattern.examples
                      .slice(0, 3)
                      .map((example, exIndex) => (
                        <Text
                          key={exIndex}
                          style={styles.exampleText}
                        >
                          • {example}
                        </Text>
                      ))}
                    {pattern.examples.length > 3 && (
                      <Text style={styles.moreExamples}>
                        ... and {pattern.examples.length - 3} more
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🎓 Understanding mistakes helps us build better AI
              systems!
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  toggleButton: {
    backgroundColor: AppColors.sparkBlue,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.text,
  },
  analysisContainer: {
    backgroundColor: 'rgba(240, 55, 165, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginTop: 15,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  patternsContainer: {
    maxHeight: 400,
  },
  patternCard: {
    backgroundColor: 'rgba(245, 245, 245, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  patternTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.text,
    flex: 1,
  },
  countBadge: {
    backgroundColor: AppColors.actionPink,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.text,
  },
  patternDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  explanationContainer: {
    backgroundColor: 'rgba(162, 232, 91, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  explanationLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.cogniGreen,
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    lineHeight: 18,
  },
  suggestionContainer: {
    backgroundColor: 'rgba(77, 150, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  suggestionLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.sparkBlue,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    lineHeight: 18,
  },
  examplesContainer: {
    backgroundColor: 'rgba(255, 214, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  examplesLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.glowYellow,
    marginBottom: 6,
  },
  exampleText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    marginBottom: 2,
    opacity: 0.9,
  },
  moreExamples: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(162, 232, 91, 0.1)',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
});
