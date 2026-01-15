import api from './api';

export interface StatsResponse {
  users: number;
  courses: number;
  projects: number;
  announcements: number;
  internships: number;
  resources: number;
  quizzes: number;
  quizAttempts: number;
  activeUsers: number;
  teachers?: number;
  students?: number;
  admins?: number;
  newUsers7d?: number;
  quizAttempts7d?: number;
  newProjects7d?: number;
  recentActivities?: any[];
}

class StatsService {
  async getAdminStats(): Promise<StatsResponse> {
    try {
      const response = await api.get('/api/v1/stats/admin');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        users: 0,
        courses: 0,
        projects: 0,
        announcements: 0,
        internships: 0,
        resources: 0,
        quizzes: 0,
        quizAttempts: 0,
        activeUsers: 0,
        teachers: 0,
        students: 0,
        admins: 0,
        newUsers7d: 0,
        quizAttempts7d: 0,
        newProjects7d: 0,
        recentActivities: []
      };
    }
  }

  async getDashboardStats(): Promise<any> {
    try {
      const response = await api.get('/api/v1/stats/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return null;
    }
  }
}

const statsService = new StatsService();
export default statsService;