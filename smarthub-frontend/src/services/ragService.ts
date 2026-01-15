// services/ragService.ts
import api from './api';

export interface QuizResponseDTO {
  id: number;
  title: string;
  description: string;
  questions: Array<{
    id: number;
    text: string;
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'MATCHING';
    options: string[];
    explanation?: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic: string;
  }>;
  timeLimitMinutes: number;
  passingScore: number;
  topic: string;
  agentGenerated: boolean;
}

export interface QuizRecommendation {
  quizId: number;
  title: string;
  topic: string;
  difficulty: string;
  reason: string;
  confidence: number;
  estimatedTime: number;
  expectedScore: number;
}

export interface KnowledgeBase {
  id: number;
  title: string;
  content: string;
  tags: string[];
  embeddingGenerated: boolean;
  createdAt: string;
}

class RAGService {
  private readonly BASE_URL = '/api/rag';

  // Générer un quiz personnalisé RAG
  async generatePersonalizedQuiz(userId: number, topic: string): Promise<QuizResponseDTO> {
    const response = await api.post(`${this.BASE_URL}/generate-personalized`, null, {
      params: { userId, topic }
    });
    return response.data;
  }

  // Générer un quiz avec paramètres d'agent
  async generateQuizWithAgentParameters(
    userId: number, 
    topic: string, 
    agentParameters: any
  ): Promise<QuizResponseDTO> {
    const response = await api.post(
      `${this.BASE_URL}/generate-with-agent`, 
      agentParameters,
      { params: { userId, topic } }
    );
    return response.data;
  }

  // Obtenir les recommandations
  async getRecommendations(userId: number): Promise<QuizRecommendation[]> {
    const response = await api.get(`${this.BASE_URL}/recommendations/${userId}`);
    return response.data;
  }

  // Mettre à jour le profil d'apprentissage
  async updateLearningProfile(
    userId: number, 
    quizId: number, 
    score: number, 
    topic: string
  ): Promise<void> {
    await api.post(`${this.BASE_URL}/update-profile`, null, {
      params: { userId, quizId, score, topic }
    });
  }

  // Ajouter à la base de connaissances
  async addToKnowledgeBase(
    title: string, 
    content: string, 
    tags: string[]
  ): Promise<KnowledgeBase> {
    const response = await api.post(`${this.BASE_URL}/knowledge-base`, null, {
      params: { title, content, tags }
    });
    return response.data;
  }

  // Diagnostics
  async testVectorSystem(): Promise<string> {
    const response = await api.get(`${this.BASE_URL}/diagnostic`);
    return response.data;
  }

  async getSystemStatus(): Promise<string> {
    const response = await api.get(`${this.BASE_URL}/status`);
    return response.data;
  }
}

export default new RAGService();