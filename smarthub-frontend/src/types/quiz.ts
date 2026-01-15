export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  OPEN_ENDED = 'OPEN_ENDED'
}

export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED'
}

// Interfaces de base
export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  quizId?: number;
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
  questionCount?: number;
}

export interface Answer {
  id?: number;
  questionId: number;
  answerText: string;
  isCorrect?: boolean;
  correctAnswer?: string;
  questionText?: string;
}

export interface QuizAttempt {
  id: number;
  studentId: number;
  studentName: string;
  quizId: number;
  quizTitle: string;
  score: number | null;
  attemptedAt: string;
  completedAt: string | null;
  status: AttemptStatus;
  answers: Answer[];
}

export interface QuizStatistics {
  quizId: number;
  quizTitle: string;
  averageScore: number;
  maxScore: number;
  totalAttempts: number;
  questionCount: number;
  completedAttempts: number;
  inProgressAttempts: number;
}

export interface AnswerStatistics {
  questionId: number;
  questionText: string;
  totalAnswers: number;
  correctAnswers: number;
  incorrectAnswers: number;
  correctPercentage: number;
}

// DTOs pour les requêtes
export interface QuestionRequestDTO {
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
}

export interface QuizRequestDTO {
  title: string;
  description: string;
  active?: boolean;
  questions: QuestionRequestDTO[];
}

export interface QuizUpdateRequestDTO extends QuizRequestDTO {
  id: number;
}

export interface QuizGenerationRequest {
  topic: string;
  questionCount: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  questionTypes?: QuestionType[];
}

export interface AnswerRequestDTO {
  questionId: number;
  answerText: string;
}

export interface QuizAttemptRequestDTO {
  quizId: number;
  answers: AnswerRequestDTO[];
}

export interface QuizAttemptStartRequest {
  quizId: number;
  userId: number;
}

// DTOs pour les réponses
export interface QuizSummaryDTO {
  id: number;
  title: string;
  description: string;
  active: boolean;
  createdAt: string;
  questionCount: number;
}

export interface QuestionResponseDTO {
  id: number;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  quizId?: number;
}

export interface QuizResponseDTO {
  id: number;
  title: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  questions: QuestionResponseDTO[];
}

export interface QuizAttemptResponseDTO {
  id: number;
  studentId: number;
  studentName: string;
  quizId: number;
  quizTitle: string;
  score: number | null;
  attemptedAt: string;
  completedAt: string | null;
  status: AttemptStatus;
  answers: Answer[];
}

// Filtres pour la recherche
export interface QuizFilters {
  active?: boolean;
  search?: string;
  courseId?: number;
}

// types/quiz.ts - AJOUTER CES NOUVELLES INTERFACES

// Types pour le système RAG et Agents
export interface QuizSubmissionDTO {
  quizId: number;
  userId: number;
  answers: Record<number, string>;
}

export interface ProgressAnalysis {
  userId: number;
  quizCount: number;
  completedCount: number;
  successRate: number;
  averageScore: number;
  totalTimeSpent: number;
  lastActiveDate: string | null;
  topicPerformance: Record<string, number>;
  strongTopics: string[];
  weakTopics: string[];
}

export interface QuizRecommendation {
  id: number;
  recommendedTopic: string;
  reason: string;
  confidenceScore: number;
  recommendedAt: string;
  accepted: boolean;
  completedAt?: string;
}

export interface AgentParameters {
  strategy: 'DIAGNOSTIC' | 'REMEDIATION' | 'CHALLENGE' | 'REINFORCEMENT' | 'STANDARD';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionCount: number;
  questionTypes?: string[];
}

export interface KnowledgeBase {
  id: number;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  source: string;
  usageCount: number;
  hasEmbedding: boolean;
}

export interface LearningProfile {
  id: number;
  userId: number;
  interests: string[];
  weaknesses: string[];
  learningStyle: 'VISUAL' | 'AUDITORY' | 'READING_WRITING' | 'KINESTHETIC';
  proficiencyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  createdAt: string;
  updatedAt: string;
}

// À la fin de votre fichier types/quiz.ts, ajoutez ceci :

export interface RAGSystemStatus {
  ollamaConnected: boolean;
  vectorizationActive: boolean;
  totalDocuments: number;
  vectorizedDocuments: number;
  percentageVectorized: number;
  systemReady: boolean;
  lastUpdate: string;
  // Vous pouvez aussi ajouter ces champs si besoin :
  ollamaLLM?: boolean;
  ollamaEmbeddings?: boolean;
  serviceStatus?: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE';
  errorCount?: number;
  averageResponseTime?: number;
}