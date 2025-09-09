import type { ImageLabel } from '@types/coreTypes'
import type { TrainingExample } from '@types/mlTypes'

/**
 * TrainingDataService
 *
 * Handles collection, validation, and storage of user-labeled training examples
 * during the teaching phase. Provides utilities for training data quality assessment.
 *
 * Requirements: 2.2
 */
export class TrainingDataService {
  private static instance: TrainingDataService
  private trainingData: TrainingExample[] = []

  private constructor() {}

  public static getInstance(): TrainingDataService {
    if (!TrainingDataService.instance) {
      TrainingDataService.instance = new TrainingDataService()
    }
    return TrainingDataService.instance
  }

  /**
   * Creates a new training example from user input
   */
  public createTrainingExample(
    imageUri: string,
    userLabel: ImageLabel,
    imageId?: string
  ): TrainingExample {
    return {
      id:
        imageId ||
        `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageUri,
      userLabel,
      timestamp: Date.now(),
    }
  }

  /**
   * Adds a training example to the collection
   */
  public addTrainingExample(example: TrainingExample): void {
    this.trainingData.push(example)
  }

  /**
   * Handles user sorting action and creates training example
   */
  public handleUserSort(
    imageUri: string,
    userLabel: ImageLabel,
    imageId?: string
  ): TrainingExample {
    const example = this.createTrainingExample(imageUri, userLabel, imageId)
    this.addTrainingExample(example)
    return example
  }

  /**
   * Gets all training examples
   */
  public getTrainingData(): TrainingExample[] {
    return [...this.trainingData]
  }

  /**
   * Gets training data statistics
   */
  public getTrainingStats(): {
    total: number
    apples: number
    notApples: number
    progress: number
    isBalanced: boolean
  } {
    const apples = this.trainingData.filter(
      (ex) => ex.userLabel === 'apple'
    ).length
    const notApples = this.trainingData.filter(
      (ex) => ex.userLabel === 'not_apple'
    ).length
    const total = this.trainingData.length
    const progress = Math.min(total / 5, 1) // Assuming minimum 5 examples

    // Consider balanced if neither class is more than 70% of total
    const isBalanced =
      total === 0 || (apples / total <= 0.7 && notApples / total <= 0.7)

    return {
      total,
      apples,
      notApples,
      progress,
      isBalanced,
    }
  }

  /**
   * Validates training data quality and diversity
   */
  public validateTrainingData(): {
    isValid: boolean
    issues: string[]
    suggestions: string[]
  } {
    const issues: string[] = []
    const suggestions: string[] = []

    // Check minimum count
    if (this.trainingData.length < 5) {
      issues.push('Need at least 5 training examples')
    }

    // Check label distribution
    const stats = this.getTrainingStats()

    if (stats.apples === 0) {
      issues.push('No apple examples provided')
      suggestions.push(
        'Add some apple images to help your critter learn what apples look like'
      )
    }

    if (stats.notApples === 0) {
      issues.push('No non-apple examples provided')
      suggestions.push(
        'Add some non-apple images to help your critter learn what is NOT an apple'
      )
    }

    // Check for severe imbalance (more than 80% of one class)
    if (stats.total > 0) {
      const appleRatio = stats.apples / stats.total
      if (appleRatio > 0.8) {
        suggestions.push(
          'Try adding more non-apple examples for better balance'
        )
      } else if (appleRatio < 0.2) {
        suggestions.push('Try adding more apple examples for better balance')
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    }
  }

  /**
   * Evaluates teaching progress and determines next steps
   */
  public evaluateTeachingProgress(
    minImages: number = 5,
    maxImages: number = 10
  ): {
    shouldContinue: boolean
    shouldTransition: boolean
    canTransition: boolean
    message?: string
  } {
    const validation = this.validateTrainingData()
    const hasMinimum = this.trainingData.length >= minImages
    const hasMaximum = this.trainingData.length >= maxImages

    // Must transition if at maximum
    if (hasMaximum) {
      return {
        shouldContinue: false,
        shouldTransition: true,
        canTransition: true,
        message: 'Great job! Your critter has learned from enough examples.',
      }
    }

    // Can transition if minimum met and data is valid
    if (hasMinimum && validation.isValid) {
      return {
        shouldContinue: true,
        shouldTransition: false,
        canTransition: true,
        message:
          'Your critter is ready to test its learning! Add more examples or start testing.',
      }
    }

    // Must continue if minimum not met or data invalid
    return {
      shouldContinue: true,
      shouldTransition: false,
      canTransition: false,
      message:
        validation.issues[0] ||
        'Keep teaching your critter with more examples.',
    }
  }

  /**
   * Gets training examples by label
   */
  public getExamplesByLabel(label: ImageLabel): TrainingExample[] {
    return this.trainingData.filter((ex) => ex.userLabel === label)
  }

  /**
   * Gets the most recent training example
   */
  public getLastExample(): TrainingExample | undefined {
    return this.trainingData[this.trainingData.length - 1]
  }

  /**
   * Checks if an image has already been used for training
   */
  public hasImageBeenUsed(imageUri: string): boolean {
    return this.trainingData.some((ex) => ex.imageUri === imageUri)
  }

  /**
   * Gets used image IDs for exclusion from test sets
   */
  public getUsedImageIds(): string[] {
    return this.trainingData.map((ex) => ex.id)
  }

  /**
   * Clears all training data (for new sessions)
   */
  public clearTrainingData(): void {
    this.trainingData = []
  }

  /**
   * Exports training data for ML model training
   */
  public exportForTraining(): {
    examples: TrainingExample[]
    stats: ReturnType<typeof this.getTrainingStats>
    validation: ReturnType<typeof this.validateTrainingData>
  } {
    return {
      examples: this.getTrainingData(),
      stats: this.getTrainingStats(),
      validation: this.validateTrainingData(),
    }
  }

  /**
   * Imports training data (for session restoration)
   */
  public importTrainingData(examples: TrainingExample[]): void {
    this.trainingData = [...examples]
  }

  /**
   * Gets training data summary for UI display
   */
  public getDisplaySummary(): {
    totalExamples: number
    appleExamples: number
    notAppleExamples: number
    progressPercentage: number
    balanceStatus: 'balanced' | 'needs_apples' | 'needs_not_apples'
    readyForTesting: boolean
  } {
    const stats = this.getTrainingStats()
    const validation = this.validateTrainingData()

    let balanceStatus: 'balanced' | 'needs_apples' | 'needs_not_apples' =
      'balanced'

    if (stats.apples === 0) {
      balanceStatus = 'needs_apples'
    } else if (stats.notApples === 0) {
      balanceStatus = 'needs_not_apples'
    } else if (stats.apples / stats.total > 0.8) {
      balanceStatus = 'needs_not_apples'
    } else if (stats.notApples / stats.total > 0.8) {
      balanceStatus = 'needs_apples'
    }

    return {
      totalExamples: stats.total,
      appleExamples: stats.apples,
      notAppleExamples: stats.notApples,
      progressPercentage: Math.round(stats.progress * 100),
      balanceStatus,
      readyForTesting: validation.isValid && stats.total >= 5,
    }
  }

  /**
   * Generates educational insights about the training data
   */
  public generateInsights(): string[] {
    const stats = this.getTrainingStats()
    const insights: string[] = []

    if (stats.total === 0) {
      insights.push('Start by sorting some images to teach your critter!')
      return insights
    }

    if (stats.apples === 0) {
      insights.push(
        'Your critter needs to see some apple examples to learn what apples look like.'
      )
    } else if (stats.notApples === 0) {
      insights.push(
        'Your critter needs to see some non-apple examples to learn what is NOT an apple.'
      )
    } else if (stats.isBalanced) {
      insights.push(
        'Great balance! Your critter is learning from both apple and non-apple examples.'
      )
    } else {
      const appleRatio = stats.apples / stats.total
      if (appleRatio > 0.7) {
        insights.push(
          'Try adding more non-apple examples to help your critter avoid false positives.'
        )
      } else {
        insights.push(
          'Try adding more apple examples to help your critter recognize apples better.'
        )
      }
    }

    if (stats.total >= 5) {
      insights.push(
        'Your critter has enough examples to start testing its learning!'
      )
    } else {
      insights.push(
        `Add ${5 - stats.total} more examples to reach the minimum for testing.`
      )
    }

    return insights
  }
}
