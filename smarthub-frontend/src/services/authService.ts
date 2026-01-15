import api from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

// INTERFACE CORRIGÉE pour correspondre à la réponse réelle
export interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    username: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

// Pour la compatibilité avec l'ancien code
export interface AuthResponse {
  token: string;
  username: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('Sending login request to /api/auth/login:', credentials);
    
    const response = await api.post<ApiResponse>('/api/auth/login', credentials);
    
    console.log('Login full response:', response.data);
    
    // VÉRIFICATION 1: La réponse a-t-elle la bonne structure ?
    if (!response.data) {
      console.error('❌ Pas de réponse du serveur');
      throw new Error('Pas de réponse du serveur');
    }
    
    // VÉRIFICATION 2: Le backend retourne-t-il success: true ?
    if (!response.data.success) {
      console.error('❌ Login échoué:', response.data.message);
      throw new Error(response.data.message || 'Login échoué');
    }
    
    // VÉRIFICATION 3: Le data contient-il un token ?
    if (!response.data.data || !response.data.data.token) {
      console.error('❌ Pas de token dans la réponse data:', response.data);
      throw new Error('Token manquant dans la réponse du serveur');
    }
    
    // Extraction des données du data field
    const authData = response.data.data;
    console.log('✅ Token extrait:', authData.token.substring(0, 30) + '...');
    
    // Retourner dans le format attendu par ton AuthContext
    return {
      token: authData.token,
      username: authData.username,
      role: authData.role,
      id: authData.id,
      email: authData.email,
      firstName: authData.firstName,
      lastName: authData.lastName
    };
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    console.log('Sending register request:', userData);
    
    const response = await api.post<ApiResponse>('/api/auth/register', userData);
    
    console.log('Register response:', response.data);
    
    // Mêmes vérifications que pour login
    if (!response.data) {
      throw new Error('Pas de réponse du serveur');
    }
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Inscription échouée');
    }
    
    if (!response.data.data || !response.data.data.token) {
      console.error('❌ Pas de token dans la réponse d\'inscription:', response.data);
      throw new Error('Token manquant dans la réponse d\'inscription');
    }
    
    const authData = response.data.data;
    
    return {
      token: authData.token,
      username: authData.username,
      role: authData.role,
      id: authData.id,
      email: authData.email,
      firstName: authData.firstName,
      lastName: authData.lastName
    };
  }

  async getCurrentUser() {
    try {
      console.log('Fetching current user...');
      const response = await api.get('/api/v1/users/me');
      console.log('Current user response:', response.data);
      return response.data;
    } catch (error: any) {
      console.warn('getCurrentUser endpoint not available:', error.message);
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
  }

  logout() {
    console.log('Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async forgotPassword(email: string): Promise<void> {
    console.log('Requesting password reset for:', email);
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    console.log('Resetting password with token');
    const response = await api.post('/api/auth/reset-password', {
      token,
      newPassword
    });
    return response.data;
  }
}

const authService = new AuthService();
export default authService;