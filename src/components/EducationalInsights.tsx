/**
 * EducationalInsights Component
 * Provides age-appropriate educational content about AI bias and training data diversity
 */

import { AppColors } from '@assets/index'
import type { TestResult, TrainingExample } from '@types/mlTypes'
import type React from 'react'
import { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface EducationalInsightsProps {
  trainingData: TrainingExample[]
  testResults: TestResult[]
  critterColor: string
}

interface BiasInsight {
  type: 'diversity' | 'balance' | 'accuracy' | 'learning'
  title: string
  explanation: string
  example?: string
  suggestion?: string
}

/**
 * EducationalInsights Component
 *
 * Analyzes training data and test results to provide educational insights
 * about AI bias, training data diversity, and machine learning concepts.
 * Requirements: 6.1, 6.2, 6.3
 */
export const EducationalInsights: React.FC<EducationalInsightsProps> = ({
  trainingData,
  testResults,
  critterColor: _critterColor,
}) => {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null)

  // Analyze training data for bias insights
  const analyzeTrainingBias = (): BiasInsight[] => {
    const insights: BiasInsight[] = []

    // Calculate training data statistics
    const appleCount = trainingData.filter(
      (ex) => ex.userLabel === 'apple'
    ).length
    const notAppleCount = trainingData.filter(
      (ex) => ex.userLabel === 'not_apple'
    ).length
    const total = trainingData.length

    // Calculate test accuracy
    const correctPredictions = testResults.filter(
      (result) => result.isCorrect
    ).length
    const accuracy =
      testResults.length > 0 ? correctPredictions / testResults.length : 0

    // Analyze apple vs not-apple accuracy separately
    const appleResults = testResults.filter(
      (result) => result.trueLabel === 'apple'
    )
    const notAppleResults = testResults.filter(
      (result) => result.trueLabel === 'not_apple'
    )

    const appleAccuracy =
      appleResults.length > 0
        ? appleResults.filter((r) => r.isCorrect).length / appleResults.length
        : 0
    const notAppleAccuracy =
      notAppleResults.length > 0
        ? notAppleResults.filter((r) => r.isCorrect).length /
          notAppleResults.length
        : 0

    // 1. Training Data Balance Insight
    if (total > 0) {
      const appleRatio = appleCount / total
      if (appleRatio > 0.8) {
        insights.push({
          type: 'balance',
          title: 'Training Data Balance',
          explanation: `Your critter learned from mostly apple examples (${appleCount} apples vs ${notAppleCount} other fruits). This might make it think everything looks like an apple!`,
          example:
            'It\'s like only showing someone red cars and then asking them to identify all vehicles - they might call a blue truck a "red car"!',
          suggestion:
            'Try using more non-apple examples next time to help your critter learn the differences better.',
        })
      } else if (appleRatio < 0.2) {
        insights.push({
          type: 'balance',
          title: 'Training Data Balance',
          explanation: `Your critter learned from mostly non-apple examples (${notAppleCount} other fruits vs ${appleCount} apples). This might make it hesitant to recognize real apples!`,
          example:
            "It's like mostly showing someone cats and only a few dogs - they might think all four-legged animals are cats!",
          suggestion:
            'Try using more apple examples next time to help your critter recognize apples better.',
        })
      } else {
        insights.push({
          type: 'balance',
          title: 'Good Training Balance!',
          explanation: `Great job! Your critter learned from a good mix of examples (${appleCount} apples and ${notAppleCount} other fruits). This helps it make fair decisions.`,
          example:
            "It's like showing someone equal examples of different animals - they learn to tell them apart better!",
        })
      }
    }

    // 2. Accuracy Pattern Analysis
    if (testResults.length > 0) {
      const accuracyDifference = Math.abs(appleAccuracy - notAppleAccuracy)

      if (accuracyDifference > 0.3) {
        if (appleAccuracy > notAppleAccuracy) {
          insights.push({
            type: 'accuracy',
            title: 'Better at Finding Apples',
            explanation: `Your critter is much better at recognizing apples (${Math.round(
              appleAccuracy * 100
            )}% correct) than other fruits (${Math.round(
              notAppleAccuracy * 100
            )}% correct).`,
            example:
              'This might be because it saw more clear apple examples during training, or the apples were easier to recognize.',
            suggestion:
              'In real AI, this could mean the training data had clearer apple photos or more apple variety.',
          })
        } else {
          insights.push({
            type: 'accuracy',
            title: 'Better at Avoiding False Apples',
            explanation: `Your critter is much better at recognizing non-apples (${Math.round(
              notAppleAccuracy * 100
            )}% correct) than real apples (${Math.round(
              appleAccuracy * 100
            )}% correct).`,
            example:
              'This might mean it learned to be very careful about calling something an apple, maybe too careful!',
            suggestion:
              'In real AI, this could happen when the system is trained to avoid mistakes in one direction.',
          })
        }
      }
    }

    // 3. Diversity Insight
    insights.push({
      type: 'diversity',
      title: 'Why Variety Matters',
      explanation:
        'Real AI systems work better when they learn from lots of different examples, just like your critter!',
      example:
        'If an AI only sees red apples, it might not recognize green or yellow apples. If it only sees apples from one angle, it might not recognize them from the side.',
      suggestion:
        'Real AI developers use thousands of different photos to make sure their systems work for everyone and every situation.',
    })

    // 4. Learning Process Insight
    if (accuracy >= 0.8) {
      insights.push({
        type: 'learning',
        title: 'Great Learning!',
        explanation: `Your critter learned really well from your teaching! It got ${Math.round(
          accuracy * 100
        )}% of the test questions right.`,
        example:
          "Just like how you get better at recognizing your friends' voices, your critter got better at recognizing apples through practice.",
      })
    } else if (accuracy >= 0.5) {
      insights.push({
        type: 'learning',
        title: 'Still Learning',
        explanation: `Your critter is learning but still makes some mistakes. It got ${Math.round(
          accuracy * 100
        )}% right, which means it needs more practice.`,
        example:
          "It's like learning to ride a bike - you get better with more practice and better examples!",
        suggestion:
          'Try teaching it with more examples or clearer pictures next time.',
      })
    } else {
      insights.push({
        type: 'learning',
        title: 'Needs More Practice',
        explanation: `Your critter found this tricky and got ${Math.round(
          accuracy * 100
        )}% right. Don't worry - even real AI systems need lots of practice!`,
        example:
          "It's like trying to learn a new language - you need to hear lots of examples before you understand.",
        suggestion:
          'Try teaching it with more examples, or make sure the pictures are clear and different from each other.',
      })
    }

    return insights
  }

  const insights = analyzeTrainingBias()

  const toggleInsight = (index: number) => {
    setExpandedInsight(expandedInsight === index ? null : index)
  }

  const getInsightIcon = (type: BiasInsight['type']) => {
    switch (type) {
      case 'diversity':
        return '🌈'
      case 'balance':
        return '⚖️'
      case 'accuracy':
        return '🎯'
      case 'learning':
        return '🧠'
      default:
        return '💡'
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤖 How AI Learns</Text>
      <Text style={styles.subtitle}>
        Let's explore what your critter's learning tells us about AI!
      </Text>

      <ScrollView
        style={styles.insightsContainer}
        showsVerticalScrollIndicator={false}
      >
        {insights.map((insight, index) => (
          <View
            key={`insight-${insight.title}-${index}`}
            style={styles.insightCard}
          >
            <TouchableOpacity
              style={styles.insightHeader}
              onPress={() => toggleInsight(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.insightIcon}>
                {getInsightIcon(insight.type)}
              </Text>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.expandIcon}>
                {expandedInsight === index ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {expandedInsight === index && (
              <View style={styles.insightContent}>
                <Text style={styles.explanation}>{insight.explanation}</Text>

                {insight.example && (
                  <View style={styles.exampleContainer}>
                    <Text style={styles.exampleLabel}>Real-world example:</Text>
                    <Text style={styles.exampleText}>{insight.example}</Text>
                  </View>
                )}

                {insight.suggestion && (
                  <View style={styles.suggestionContainer}>
                    <Text style={styles.suggestionLabel}>💡 Did you know?</Text>
                    <Text style={styles.suggestionText}>
                      {insight.suggestion}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🎓 You just learned about AI bias and training data - concepts that
          real AI scientists work with every day!
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(77, 150, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
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
  insightsContainer: {
    maxHeight: 300,
  },
  insightCard: {
    backgroundColor: 'rgba(245, 245, 245, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  insightTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.text,
  },
  expandIcon: {
    fontSize: 14,
    color: AppColors.sparkBlue,
    fontFamily: 'Nunito-ExtraBold',
  },
  insightContent: {
    padding: 15,
    paddingTop: 0,
  },
  explanation: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  exampleContainer: {
    backgroundColor: 'rgba(162, 232, 91, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  exampleLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.cogniGreen,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    lineHeight: 18,
  },
  suggestionContainer: {
    backgroundColor: 'rgba(255, 214, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  suggestionLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.glowYellow,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    lineHeight: 18,
  },
  footer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: 'rgba(162, 232, 91, 0.1)',
    borderRadius: 10,
  },
  footerText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    textAlign: 'center',
    lineHeight: 18,
  },
})
