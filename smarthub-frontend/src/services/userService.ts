import api from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  profileImage?: string; // AJOUTER CETTE PROPRIÉTÉ
}

class UserService {
  async getAllTeachers(): Promise<User[]> {
    try {
      const response = await api.get('/api/v1/users/role/TEACHER');
      return response.data.map((teacher: any) => ({
        ...teacher,
        id: teacher.id.toString()
      }));
    } catch (error) {
      console.error('Error fetching teachers:', error);
      const allUsers = await this.getAllUsers();
      return allUsers.filter(user => user.role === 'TEACHER');
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await api.get('/api/v1/users');
      return response.data.map((user: any) => ({
        ...user,
        id: user.id.toString()
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User> {
    try {
      const response = await api.get(`/api/v1/users/${id}`);
      return {
        ...response.data,
        id: response.data.id.toString()
      };
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('api/v1/users/me');
      return {
        ...response.data,
        id: response.data.id.toString()
      };
    } catch (error) {
      console.warn('getCurrentUser endpoint not available, using localStorage:', error);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return { ...user, id: user.id ? user.id.toString() : '' };
      }
      throw new Error('No user found');
    }
  }

  async updateProfile(userData: Partial<Omit<User, 'id'>>): Promise<User> {
    try {
      const response = await api.put('api/v1/users/profile', userData);
      return {
        ...response.data,
        id: response.data.id.toString()
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async getAllStudents(): Promise<User[]> {
    try {
      const response = await api.get('api/v1/users/role/STUDENT');
      return response.data.map((student: any) => ({
        ...student,
        id: student.id.toString()
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      const allUsers = await this.getAllUsers();
      return allUsers.filter(user => user.role === 'STUDENT');
    }
  }

  async getUserByUsername(username: string): Promise<User> {
    try {
      const response = await api.get(`/users/username/${username}`);
      return {
        ...response.data,
        id: response.data.id.toString()
      };
    } catch (error) {
      console.error(`Error fetching user by username ${username}:`, error);
      throw error;
    }
  }

  // AJOUTEZ CES MÉTHODES MANQUANTES AVEC LES TYPES CORRECTS :
  async getAvailableStudents(courseId: string): Promise<User[]> {
    try {
      const allStudents = await this.getAllStudents();
      
      try {
        const response = await api.get(`/courses/${courseId}/students`);
        const enrolledStudents: User[] = response.data.map((student: any) => ({
          ...student,
          id: student.id.toString()
        }));
        
        // CORRECTION : Ajouter le type pour le paramètre 's'
        const enrolledIds = enrolledStudents.map((s: User) => s.id);
        return allStudents.filter(student => !enrolledIds.includes(student.id));
      } catch (error) {
        console.warn('Could not fetch enrolled students, showing all students', error);
        return allStudents;
      }
    } catch (error) {
      console.error('Error in getAvailableStudents:', error);
      throw error;
    }
  }

  async searchStudents(query: string): Promise<User[]> {
    try {
      const allStudents = await this.getAllStudents();
      const lowercaseQuery = query.toLowerCase();
      
      return allStudents.filter(student =>
        student.username.toLowerCase().includes(lowercaseQuery) ||
        student.email.toLowerCase().includes(lowercaseQuery) ||
        (student.firstName && student.firstName.toLowerCase().includes(lowercaseQuery)) ||
        (student.lastName && student.lastName.toLowerCase().includes(lowercaseQuery))
      );
    } catch (error) {
      console.error('Error in searchStudents:', error);
      throw error;
    }
  }
}

const userService = new UserService();
export default userService;