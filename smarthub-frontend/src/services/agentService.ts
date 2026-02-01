import axios from 'axios';

// CORRECTION UNIQUE : CHANGER L'URL LOCALHOST PAR RENDER
const API_BASE = 'https://smart-education-platform.onrender.com/api';

const api = axios.create({
  baseURL: 'https://smart-education-platform.onrender.com',
  timeout: 600000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const agentService = {
  checkQuizEligibility: async (userId: number, courseId: number) => {
    try {
      const response = await api.get(`${API_BASE}/agent/course-quiz/eligibility`, {
        params: { userId, courseId },
        timeout: 20000
      });
      
      const data = response.data || {};
      
      let finalEligible;
      if (data.eligible !== undefined) {
        finalEligible = data.eligible === true || data.eligible === 'true';
      } else if (data.isEligible !== undefined) {
        finalEligible = data.isEligible === true || data.isEligible === 'true';
      } else {
        finalEligible = false;
      }
      
      return {
        ...data,
        isEligible: finalEligible,
        eligible: finalEligible
      };
      
    } catch (error: any) {
      console.error('❌ Eligibility check error:', error);
      
      return {
        isEligible: false,
        eligible: false,
        reason: error.response?.data?.message || 'Erreur de vérification',
        attemptsToday: 0,
        maxAttemptsPerDay: 3,
        remainingAttemptsToday: 3,
        nextAvailableTime: null,
        userId,
        courseId
      };
    }
  },

  initiateCourseQuiz: async (userId: number, courseId: number) => {
    try {
      console.log('🎯 Initiating course quiz with URL params:', { userId, courseId });
      
      const response = await api.post(
        `${API_BASE}/agent/course-quiz/initiate?userId=${userId}&courseId=${courseId}`,
        {},
        { 
          timeout: 600000
        }
      );
      
      console.log('✅ Course quiz response:', response.data);
      
      const responseData = response.data || {};
      
      return {
        attemptId: responseData.attemptId,
        quizId: responseData.quizId,
        quizResponse: responseData.quizResponse || responseData.quiz,
        timeLimitMinutes: responseData.timeLimitMinutes || 60,
        startTime: responseData.startTime || new Date().toISOString(),
        
        status: responseData.status || 'SUCCESS',
        message: responseData.message || 'Quiz initié avec succès',
        warnings: responseData.warnings || [],
        instructions: responseData.instructions || [],
        endTime: responseData.endTime,
        remainingTimeMinutes: responseData.remainingTimeMinutes,
        supervisorEnabled: responseData.supervisorEnabled || true,
        
        rawData: responseData
      };
      
    } catch (error: any) {
      console.error('❌ Course quiz initiation error:', error);
      
      if (error.code === 'ECONNABORTED') {
        console.log('⚠️ Timeout détecté, création de fallback');
        return {
          status: 'SUCCESS',
          message: 'Quiz généré (mode fallback - timeout)',
          attemptId: Math.floor(Math.random() * 10000),
          quizId: Math.floor(Math.random() * 10000),
          quizResponse: {
            title: 'Quiz - Mode Secours',
            description: 'Quiz généré automatiquement (service IA en attente)',
            timeLimitMinutes: 30,
            questions: [
              {
                id: 1,
                text: "Question 1: Décrivez les principaux concepts abordés dans ce cours",
                type: 'SHORT_ANSWER',
                options: [],
                correctAnswer: "Réponse libre - basée sur votre compréhension",
                explanation: "Cette question évalue votre compréhension globale"
              },
              {
                id: 2,
                text: "Question 2: Quels sont les avantages de cette technologie ?",
                type: 'MULTIPLE_CHOICE',
                options: ["Efficacité", "Précision", "Automatisation", "Coût réduit"],
                correctAnswer: ["Efficacité", "Précision", "Automatisation"],
                explanation: "Tous ces éléments sont des avantages clés"
              },
              {
                id: 3,
                text: "Question 3: Quelle est l'application principale de ce sujet ?",
                type: 'SINGLE_CHOICE',
                options: ["Recherche académique", "Applications pratiques", "Développement théorique", "Enseignement"],
                correctAnswer: "Applications pratiques",
                explanation: "L'accent est mis sur les applications réelles"
              }
            ]
          },
          timeLimitMinutes: 30,
          startTime: new Date().toISOString(),
          supervisorEnabled: false,
          warnings: ['Mode fallback activé - Timeout dépassé']
        };
      }
      
      return {
        status: 'ERROR',
        message: error.response?.data?.message || error.message || 'Erreur lors du démarrage du quiz',
        warnings: error.response?.data?.warnings || [],
        attemptId: null,
        quizId: null,
        quizResponse: null,
        timeLimitMinutes: 60,
        startTime: new Date().toISOString(),
        supervisorEnabled: false
      };
    }
  },

  submitCourseQuiz: async (attemptId: number, submission: any) => {
    try {
      console.log('📤 Submitting quiz attempt:', attemptId);
      
      const response = await api.post(
        `${API_BASE}/agent/course-quiz/submit/${attemptId}`,
        submission,
        { timeout: 20000 }
      );
      
      console.log('✅ Quiz submission response:', response.data);
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Quiz submission error:', error);
      throw error;
    }
  },

  getCourseQuizStats: async (userId: number, courseId: number) => {
    try {
      const response = await api.get(`${API_BASE}/agent/course-quiz/stats`, {
        params: { userId, courseId },
        timeout: 20000
      });
      
      const data = response.data || {};
      return {
        userId: data.userId || userId,
        courseId: data.courseId || courseId,
        totalAttempts: data.totalAttempts || 0,
        completedAttempts: data.completedAttempts || 0,
        bestScore: data.bestScore || 0,
        averageScore: data.averageScore || 0,
        lastAttemptDate: data.lastAttemptDate || null,
        performanceLevel: data.performanceLevel || 'BEGINNER',
        trendDirection: data.trendDirection || 'STABLE',
        weakTopics: data.weakTopics || [],
        successRate: data.successRate || 0,
        quizCount: data.quizCount || 0
      };
      
    } catch (error: any) {
      console.error('❌ Stats error:', error);
      return {
        userId,
        courseId,
        totalAttempts: 0,
        completedAttempts: 0,
        bestScore: 0,
        averageScore: 0,
        lastAttemptDate: null,
        performanceLevel: 'BEGINNER',
        trendDirection: 'STABLE',
        weakTopics: [],
        successRate: 0,
        quizCount: 0
      };
    }
  },

  initiateAdaptiveQuiz: async (userId: number, courseId: number, strategy?: string) => {
    try {
      console.log('🧠 Initiating adaptive quiz:', { userId, courseId, strategy });
      
      let url = `${API_BASE}/agent/adaptive-quiz/initiate?userId=${userId}&courseId=${courseId}`;
      if (strategy && strategy !== 'auto') {
        url += `&strategy=${strategy}`;
      }
      
      const response = await api.post(
        url,
        {},
        { 
          timeout: 600000
        }
      );
      
      console.log('✅ Adaptive quiz response:', response.data);
      
      const data = response.data || {};
      return {
        status: data.status || 'SUCCESS',
        message: data.message || 'Quiz adaptatif généré avec succès',
        strategy: data.strategy || strategy || 'STANDARD',
        quiz: data.quiz || data.quizResponse || {
          title: 'Quiz Adaptatif IA',
          description: 'Quiz généré par intelligence artificielle',
          timeLimitMinutes: 30,
          questions: []
        },
        attemptId: data.attemptId,
        warnings: data.warnings || []
      };
      
    } catch (error: any) {
      console.error('❌ Adaptive quiz error:', error);
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          status: 'SUCCESS',
          message: 'Quiz adaptatif généré (mode secours)',
          strategy: strategy || 'STANDARD',
          quiz: {
            title: 'Quiz Adaptatif IA - Mode Secours',
            description: 'Quiz généré automatiquement (service IA temporairement indisponible)',
            timeLimitMinutes: 20,
            questions: [
              {
                id: 1,
                text: "Question 1: Décrivez les concepts principaux que vous avez appris dans ce cours",
                type: 'SHORT_ANSWER',
                options: [],
                correctAnswer: "Réponse libre basée sur votre compréhension du cours",
                explanation: "Cette question évalue votre compréhension globale du sujet"
              },
              {
                id: 2,
                text: "Question 2: Quels sont les points clés abordés dans ce cours ?",
                type: 'MULTIPLE_CHOICE',
                options: ["Concepts fondamentaux", "Applications pratiques", "Études de cas", "Exercices d'apprentissage"],
                correctAnswer: ["Concepts fondamentaux", "Applications pratiques"],
                explanation: "Les concepts fondamentaux et applications pratiques sont essentiels"
              }
            ]
          },
          attemptId: Math.floor(Math.random() * 10000),
          warnings: ['Mode secours activé - Service IA temporairement indisponible']
        };
      }
      
      throw error;
    }
  },

  generateRAGQuiz: async (userId: number, topic: string) => {
    try {
      const response = await api.post(
        `${API_BASE}/rag/generate-personalized`,
        null,
        {
          params: { userId, topic },
          timeout: 600000
        }
      );
      return response.data;
    } catch (error) {
      console.error('RAG quiz error:', error);
      throw error;
    }
  }
};

export default agentService;
