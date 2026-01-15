import api from './api';
import { 
  QuizSummaryDTO, 
  QuizRequestDTO,
  QuizResponseDTO,
  QuizAttemptResponseDTO,
  QuizGenerationRequest,
  QuizStatistics,
  AnswerStatistics,
  QuizFilters,
  QuestionType,
  AttemptStatus,
  QuizSubmissionDTO,
  ProgressAnalysis,
  QuizRecommendation,
  AgentParameters,
  KnowledgeBase,
  RAGSystemStatus
} from '../types/quiz';

class QuizService {
  // ==================== SYSTÈME RAG & AGENTS ====================

  async startQuizWithAI(userId: number, topic: string): Promise<QuizResponseDTO> {
    try {
      const response = await api.post<QuizResponseDTO>(
        `/api/rag/generate-personalized?userId=${userId}&topic=${encodeURIComponent(topic)}`,
        {}
      );
      return response.data;
    } catch (error: any) {
      console.error('Error starting AI quiz:', error.message);
      throw error;
    }
  }

  async startQuizWithAgentStrategy(
    userId: number, 
    topic: string, 
    strategy: 'DIAGNOSTIC' | 'REMEDIATION' | 'CHALLENGE' | 'REINFORCEMENT' | 'STANDARD',
    agentParameters?: Partial<AgentParameters>
  ): Promise<QuizResponseDTO> {
    try {
      const params: AgentParameters = {
        strategy,
        difficulty: agentParameters?.difficulty || 'MEDIUM',
        questionCount: agentParameters?.questionCount || 10,
        questionTypes: agentParameters?.questionTypes || ['SINGLE_CHOICE', 'MULTIPLE_CHOICE']
      };

      const response = await api.post<QuizResponseDTO>(
        `/api/rag/generate-with-agent?userId=${userId}&topic=${encodeURIComponent(topic)}`,
        params
      );
      return response.data;
    } catch (error: any) {
      console.error('Error starting quiz with agent strategy:', error.message);
      throw error;
    }
  }

  async submitQuizToAgent(attemptId: number, submission: QuizSubmissionDTO): Promise<{
    message: string;
    score: number;
    recommendations: QuizRecommendation[];
    nextTopic?: string;
  }> {
    try {
      const response = await api.post<{
        message: string;
        score: number;
        recommendations: QuizRecommendation[];
        nextTopic?: string;
      }>(
        `/api/agent/quiz/submit?attemptId=${attemptId}`,
        submission
      );
      return response.data;
    } catch (error: any) {
      console.error('Error submitting quiz to agent:', error.message);
      throw error;
    }
  }

  async getProgressAnalysis(userId: number): Promise<ProgressAnalysis> {
    try {
      const response = await api.get<ProgressAnalysis>(`/api/agent/analysis/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching progress analysis:', error.message);
      throw error;
    }
  }

  async getAIRecommendations(userId: number): Promise<QuizRecommendation[]> {
    try {
      const response = await api.get<QuizRecommendation[]>(`/api/rag/recommendations/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching AI recommendations:', error.message);
      throw error;
    }
  }

  async getProgressDashboard(userId: number): Promise<any> {
    try {
      const response = await api.get<any>(`/api/agent/dashboard/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching progress dashboard:', error.message);
      throw error;
    }
  }

  async recommendNextQuiz(userId: number): Promise<{ recommendedTopic: string; reason: string }> {
    try {
      const response = await api.get<{ recommendedTopic: string; reason: string }>(
        `/api/agent/recommend/next?userId=${userId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting next quiz recommendation:', error.message);
      throw error;
    }
  }

  async getRAGStatus(): Promise<RAGSystemStatus> {
    try {
      const response = await api.get<RAGSystemStatus>('/api/rag/status');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching RAG status:', error.message);
      throw error;
    }
  }

  async testRAGSystem(): Promise<string> {
    try {
      const response = await api.get<string>('/api/rag/diagnostic');
      return response.data;
    } catch (error: any) {
      console.error('Error testing RAG system:', error.message);
      throw error;
    }
  }

  async addToKnowledgeBase(
    title: string, 
    content: string, 
    tags: string[]
  ): Promise<KnowledgeBase> {
    try {
      const response = await api.post<KnowledgeBase>('/api/rag/knowledge-base', null, {
        params: { title, content, tags: tags.join(',') }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error adding to knowledge base:', error.message);
      throw error;
    }
  }

  async updateLearningProfile(
    userId: number, 
    quizId: number, 
    score: number, 
    topic: string
  ): Promise<void> {
    try {
      await api.post('/api/rag/update-profile', null, {
        params: { userId, quizId, score, topic }
      });
    } catch (error: any) {
      console.error('Error updating learning profile:', error.message);
      throw error;
    }
  }

  async generateLearningPath(userId: number): Promise<QuizRecommendation[]> {
    try {
      const recommendations = await this.getAIRecommendations(userId);
      return recommendations;
    } catch (error: any) {
      console.error('Error generating learning path:', error.message);
      throw error;
    }
  }

  async submitQuizWithRAG(
    quizId: number,
    attemptId: number,
    userId: number,
    answers: Record<number, string>,
    topic: string
  ): Promise<{
    message: string;
    score: number;
    recommendations: QuizRecommendation[];
    nextTopic?: string;
  }> {
    try {
      const submission: QuizSubmissionDTO = {
        quizId,
        userId,
        answers
      };

      const agentResult = await this.submitQuizToAgent(attemptId, submission);
      
      await this.updateLearningProfile(userId, quizId, agentResult.score, topic);
      
      return {
        ...agentResult,
        score: agentResult.score
      };
      
    } catch (error: any) {
      console.error('Error in submitQuizWithRAG:', error.message);
      throw error;
    }
  }

  async getUserTopicAnalysis(userId: number): Promise<{
    strongTopics: string[];
    weakTopics: string[];
    topicPerformance: Record<string, number>;
  }> {
    try {
      const analysis = await this.getProgressAnalysis(userId);
      return {
        strongTopics: analysis.strongTopics,
        weakTopics: analysis.weakTopics,
        topicPerformance: analysis.topicPerformance
      };
    } catch (error: any) {
      console.error('Error getting user topic analysis:', error.message);
      throw error;
    }
  }

  async generateRAGQuiz(
    userId: number,
    topic: string,
    options?: {
      difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
      questionCount?: number;
      questionTypes?: string[];
      agentStrategy?: 'DIAGNOSTIC' | 'REMEDIATION' | 'CHALLENGE' | 'REINFORCEMENT' | 'STANDARD';
    }
  ): Promise<QuizResponseDTO> {
    try {
      const agentParameters: Partial<AgentParameters> = {
        strategy: options?.agentStrategy || 'STANDARD',
        difficulty: options?.difficulty || 'MEDIUM',
        questionCount: options?.questionCount || 10,
        questionTypes: options?.questionTypes || ['SINGLE_CHOICE', 'MULTIPLE_CHOICE']
      };

      return await this.startQuizWithAgentStrategy(
        userId, 
        topic, 
        agentParameters.strategy as any, 
        agentParameters
      );
    } catch (error: any) {
      console.error('Error generating RAG quiz:', error.message);
      throw error;
    }
  }

  async isRAGSystemReady(): Promise<boolean> {
    try {
      const status = await this.getRAGStatus();
      return status.systemReady || (status.ollamaConnected && status.vectorizationActive);
    } catch (error) {
      console.error('RAG system not ready:', error);
      return false;
    }
  }

  formatRecommendation(recommendation: QuizRecommendation): {
    topic: string;
    reason: string;
    confidence: number;
    confidenceColor: string;
    icon: string;
  } {
    let confidenceColor = 'secondary';
    let icon = '📚';
    
    if (recommendation.confidenceScore >= 0.8) {
      confidenceColor = 'success';
      icon = '🎯';
    } else if (recommendation.confidenceScore >= 0.6) {
      confidenceColor = 'warning';
      icon = '📊';
    } else if (recommendation.confidenceScore >= 0.4) {
      confidenceColor = 'info';
      icon = '💡';
    }

    return {
      topic: recommendation.recommendedTopic,
      reason: recommendation.reason,
      confidence: recommendation.confidenceScore * 100,
      confidenceColor,
      icon
    };
  }

  getRecommendedStrategy(progress: ProgressAnalysis): 'DIAGNOSTIC' | 'REMEDIATION' | 'CHALLENGE' | 'REINFORCEMENT' {
    if (progress.successRate < 50) {
      return 'REMEDIATION';
    } else if (progress.successRate >= 80 && progress.weakTopics.length === 0) {
      return 'CHALLENGE';
    } else if (progress.weakTopics.length > 0) {
      return 'DIAGNOSTIC';
    } else {
      return 'REINFORCEMENT';
    }
  }

  generateProgressReport(analysis: ProgressAnalysis): {
    summary: string;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  } {
    const summary = `Performance globale: ${analysis.successRate.toFixed(1)}% de réussite. ` +
                   `Score moyen: ${analysis.averageScore.toFixed(1)}%. ` +
                   `${analysis.completedCount} quiz terminés.`;

    const strengths = analysis.strongTopics.map((topic: string) => 
      `🔹 ${topic}: ${analysis.topicPerformance[topic]?.toFixed(1) || 'N/A'}%`
    );

    const improvements = analysis.weakTopics.map((topic: string) => 
      `🔸 ${topic}: ${analysis.topicPerformance[topic]?.toFixed(1) || 'N/A'}% (à renforcer)`
    );

    const recommendations = [
      analysis.successRate < 60 ? '📉 Utilisez la stratégie REMEDIATION pour renforcer vos bases' : '',
      analysis.weakTopics.length > 0 ? '🎯 Concentrez-vous sur vos points faibles' : '',
      analysis.strongTopics.length > 0 ? '🚀 Essayez la stratégie CHALLENGE pour progresser' : '💪 Continuez sur votre lancée'
    ].filter(r => r !== '');

    return { summary, strengths, improvements, recommendations };
  }

  // ==================== MÉTHODES EXISTANTES ====================

  async getAllQuizzes(filters?: QuizFilters): Promise<QuizSummaryDTO[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.active !== undefined) params.append('active', filters.active.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.courseId) params.append('courseId', filters.courseId.toString());
      
      const queryString = params.toString();
      const url = `/api/v1/quizzes${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get<QuizSummaryDTO[]>(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  }

  async getQuizById(id: number): Promise<QuizResponseDTO> {
    try {
      const response = await api.get<QuizResponseDTO>(`/api/v1/quizzes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching quiz ${id}:`, error);
      throw error;
    }
  }

  async createQuiz(quizData: QuizRequestDTO): Promise<QuizResponseDTO> {
    try {
      const response = await api.post<QuizResponseDTO>('/api/v1/quizzes', quizData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating quiz:', error.message);
      throw error;
    }
  }

  async updateQuiz(id: number, quizData: QuizRequestDTO): Promise<QuizResponseDTO> {
    try {
      const response = await api.put<QuizResponseDTO>(`/api/v1/quizzes/${id}`, quizData);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating quiz ${id}:`, error.message);
      throw error;
    }
  }

  async deleteQuiz(id: number): Promise<void> {
    try {
      await api.delete(`/api/v1/quizzes/${id}`);
    } catch (error) {
      console.error(`Error deleting quiz ${id}:`, error);
      throw error;
    }
  }

  async getActiveQuizzes(): Promise<QuizSummaryDTO[]> {
    try {
      const response = await api.get<QuizSummaryDTO[]>('/api/v1/quizzes/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active quizzes:', error);
      throw error;
    }
  }

  async searchQuizzes(query: string): Promise<QuizSummaryDTO[]> {
    try {
      const response = await api.get<QuizSummaryDTO[]>('/api/v1/quizzes/search', {
        params: { title: query }
      });
      return response.data;
    } catch (error) {
      console.error(`Error searching quizzes with query ${query}:`, error);
      throw error;
    }
  }

  async generateQuiz(generationRequest: QuizGenerationRequest): Promise<QuizResponseDTO> {
    try {
      const response = await api.post<QuizResponseDTO>('/api/v1/quizzes/generate', generationRequest);
      return response.data;
    } catch (error: any) {
      console.error('Error generating quiz:', error.message);
      throw error;
    }
  }

  async generateQuizFromUrl(url: string, questionCount: number = 5): Promise<QuizResponseDTO> {
    try {
      const response = await api.post<QuizResponseDTO>('/api/v1/quizzes/generate-from-url', null, {
        params: { url, questionCount }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error generating quiz from URL:', error.message);
      throw error;
    }
  }

  async startQuizAttempt(quizId: number, userId: number): Promise<QuizAttemptResponseDTO> {
    try {
      const response = await api.post<QuizAttemptResponseDTO>(
        `/api/v1/quizzes/${quizId}/attempts/start`,
        null,
        { params: { userId } }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error starting quiz attempt:', error.message);
      throw error;
    }
  }

  async submitQuizAttempt(quizId: number, attemptId: number, answers: any[]): Promise<QuizAttemptResponseDTO> {
    try {
      const attemptRequest = {
        quizId,
        answers: answers.map(answer => ({
          questionId: answer.questionId,
          answerText: answer.answerText
        }))
      };
      
      const response = await api.post<QuizAttemptResponseDTO>(
        `/api/v1/quizzes/${quizId}/attempts/${attemptId}/submit`,
        attemptRequest
      );
      return response.data;
    } catch (error: any) {
      console.error('Error submitting quiz attempt:', error.message);
      throw error;
    }
  }

  async getQuizAttempt(attemptId: number): Promise<QuizAttemptResponseDTO> {
    try {
      const response = await api.get<QuizAttemptResponseDTO>(`/api/v1/quizzes/attempts/${attemptId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching quiz attempt ${attemptId}:`, error);
      throw error;
    }
  }

  async getUserQuizAttempts(userId: number): Promise<QuizAttemptResponseDTO[]> {
    try {
      const response = await api.get<QuizAttemptResponseDTO[]>(`/api/v1/quizzes/users/${userId}/attempts`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching quiz attempts for user ${userId}:`, error);
      throw error;
    }
  }

  async getUserQuizAttemptsForQuiz(userId: number, quizId: number): Promise<QuizAttemptResponseDTO[]> {
    try {
      const response = await api.get<QuizAttemptResponseDTO[]>(
        `/api/v1/quizzes/${quizId}/users/${userId}/attempts`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching quiz attempts for user ${userId} and quiz ${quizId}:`, error);
      throw error;
    }
  }

  async resumeOrStartQuizAttempt(userId: number, quizId: number): Promise<QuizAttemptResponseDTO> {
    try {
      const response = await api.get<QuizAttemptResponseDTO>(
        `/api/v1/quizzes/${quizId}/users/${userId}/resume`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error resuming quiz attempt:', error.message);
      throw error;
    }
  }

  async getUserRecentAttempts(userId: number, limit: number = 5): Promise<QuizAttemptResponseDTO[]> {
    try {
      const response = await api.get<QuizAttemptResponseDTO[]>(
        `/api/v1/quizzes/users/${userId}/recent-attempts`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching recent attempts for user ${userId}:`, error);
      throw error;
    }
  }

  async getQuizStatistics(quizId: number): Promise<QuizStatistics> {
    try {
      const response = await api.get<QuizStatistics>(`/api/v1/quizzes/${quizId}/statistics`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching statistics for quiz ${quizId}:`, error);
      throw error;
    }
  }

  async getQuestionStatistics(questionId: number): Promise<AnswerStatistics> {
    try {
      const response = await api.get<AnswerStatistics>(`/api/v1/quizzes/questions/${questionId}/statistics`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching statistics for question ${questionId}:`, error);
      throw error;
    }
  }

  // ==================== UTILS ====================

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatScore(score: number | null): string {
    if (score === null) return 'Non noté';
    return `${score.toFixed(2)}%`;
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case AttemptStatus.IN_PROGRESS: return 'badge bg-primary';
      case AttemptStatus.COMPLETED: return 'badge bg-success';
      case AttemptStatus.ABANDONED: return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case AttemptStatus.IN_PROGRESS: return 'En cours';
      case AttemptStatus.COMPLETED: return 'Terminé';
      case AttemptStatus.ABANDONED: return 'Abandonné';
      default: return status;
    }
  }

  getQuestionTypeLabel(type: string): string {
    switch (type) {
      case QuestionType.SINGLE_CHOICE: return 'Choix unique';
      case QuestionType.MULTIPLE_CHOICE: return 'Choix multiple';
      case QuestionType.TRUE_FALSE: return 'Vrai/Faux';
      case QuestionType.OPEN_ENDED: return 'Question ouverte';
      default: return type;
    }
  }

  getQuestionTypeBadge(type: string): string {
    switch (type) {
      case QuestionType.SINGLE_CHOICE: return 'badge bg-primary';
      case QuestionType.MULTIPLE_CHOICE: return 'badge bg-info';
      case QuestionType.TRUE_FALSE: return 'badge bg-warning';
      case QuestionType.OPEN_ENDED: return 'badge bg-success';
      default: return 'badge bg-secondary';
    }
  }
}

const quizService = new QuizService();
export default quizService;