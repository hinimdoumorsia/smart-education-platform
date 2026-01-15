import api from './api';

interface QuizEligibility {
  userId: number;
  courseId: number;
  isEligible: boolean;
  reason?: string;
  maxAttemptsPerDay: number;
  attemptsToday: number;
  remainingAttemptsToday: number;
  lastAttemptDate?: string;
  nextAvailableTime?: string;
  recommendation?: string;
  courseTitle?: string;
  eligible?: boolean;
}

interface QuizStats {
  userId: number;
  courseId: number;
  totalAttempts: number;
  completedAttempts: number;
  bestScore: number;
  averageScore: number;
  lastAttemptDate?: string;
}

interface QuizAttempt {
  attemptId: number;
  quizId?: number;
  quizResponse: any;
  timeLimitMinutes: number;
  startTime: string;
  endTime: string;
  remainingTimeMinutes: number;
  instructions: string[];
  warnings: string[];
  supervisorEnabled: boolean;
}

const courseQuizService = {
  async checkEligibility(userId: number, courseId: number): Promise<QuizEligibility> {
    try {
      const response = await api.get('/api/agent/course-quiz/eligibility', {
        params: { userId, courseId }
      });
      
      // Normaliser la réponse
      const data = response.data;
      const isEligible = data.isEligible !== undefined ? data.isEligible : data.eligible;
      
      const normalizedResponse: QuizEligibility = {
        userId: data.userId || userId,
        courseId: data.courseId || courseId,
        isEligible: Boolean(isEligible),
        eligible: Boolean(isEligible),
        reason: data.reason || (isEligible ? 'Éligible pour passer le quiz' : 'Non éligible'),
        maxAttemptsPerDay: data.maxAttemptsPerDay || 3,
        attemptsToday: data.attemptsToday || 0,
        remainingAttemptsToday: data.remainingAttemptsToday || 3,
        lastAttemptDate: data.lastAttemptDate,
        nextAvailableTime: data.nextAvailableTime,
        recommendation: data.recommendation,
        courseTitle: data.courseTitle
      };
      
      return normalizedResponse;
      
    } catch (error: any) {
      // Retourner un objet par défaut en cas d'erreur
      return {
        userId,
        courseId,
        isEligible: false,
        eligible: false,
        reason: error.response?.data?.message || "Service temporairement indisponible",
        maxAttemptsPerDay: 3,
        attemptsToday: 0,
        remainingAttemptsToday: 3
      };
    }
  },

  async getStats(userId: number, courseId: number): Promise<QuizStats> {
    try {
      const response = await api.get('/api/agent/course-quiz/stats', {
        params: { userId, courseId }
      });
      return response.data;
    } catch (error: any) {
      return {
        userId,
        courseId,
        totalAttempts: 0,
        completedAttempts: 0,
        bestScore: 0,
        averageScore: 0
      };
    }
  },

  async initiateQuiz(userId: number, courseId: number): Promise<QuizAttempt> {
    try {
      const response = await api.post('/api/agent/course-quiz/initiate', null, {
        params: { userId, courseId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Impossible de démarrer le quiz");
    }
  },

  async submitQuiz(attemptId: number, answers: any): Promise<any> {
    try {
      const response = await api.post(`/api/agent/course-quiz/submit/${attemptId}`, answers);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erreur lors de la soumission");
    }
  },

  async getHistory(userId: number, courseId: number): Promise<any[]> {
    try {
      const response = await api.get(`/api/agent/course-quiz/history/${userId}/${courseId}`);
      return response.data;
    } catch (error: any) {
      return [];
    }
  }
};

export default courseQuizService;