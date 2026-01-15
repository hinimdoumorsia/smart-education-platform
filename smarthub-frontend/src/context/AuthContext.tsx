import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import authService, { AuthResponse } from '../services/authService';
import userService from '../services/userService';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour vérifier l'authentification
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    // VÉRIFICATION : le token n'est pas "undefined"
    if (token && (token === 'undefined' || token === 'null')) {
      console.error('Token invalide détecté, nettoyage...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      setUser(null);
      setLoading(false);
      return;
    }
    
    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        logout();
      }
    }
    setLoading(false);
  };

  // Utilise useEffect pour appeler checkAuth au chargement
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('AuthContext: Attempting login with', { username });
      
      // Appel du service d'authentification
      const response: AuthResponse = await authService.login({ 
        username, 
        password 
      });
      
      console.log('AuthContext: Login response', response);
      
      // VÉRIFICATION CRITIQUE : Le token existe
      if (!response.token) {
        throw new Error('Token non trouvé dans la réponse');
      }
      
      // VÉRIFICATION : Le token n'est pas "undefined"
      if (response.token === 'undefined' || response.token === 'null') {
        throw new Error('Token invalide reçu du serveur');
      }
      
      // VÉRIFICATION : Le token est un JWT valide (contient des points)
      if (!response.token.includes('.')) {
        throw new Error('Token mal formé (pas un JWT)');
      }
      
      console.log('✅ Token valide reçu:', response.token.substring(0, 30) + '...');
      
      // Stocker le token et les infos de base
      localStorage.setItem('token', response.token);
      localStorage.setItem('username', response.username);
      localStorage.setItem('role', response.role);
      
      // Construire l'objet user initial
      const userData: User = {
        id: response.id || '',
        username: response.username,
        email: response.email || '',
        role: response.role,
        firstName: response.firstName,
        lastName: response.lastName
      };
      
      // Essayer de récupérer les données complètes de l'utilisateur
      try {
        const fullUser = await userService.getCurrentUser();
        const fullUserData: User = {
          id: fullUser.id,
          username: fullUser.username,
          email: fullUser.email,
          role: fullUser.role,
          firstName: fullUser.firstName,
          lastName: fullUser.lastName,
          phoneNumber: fullUser.phoneNumber,
          active: fullUser.active,
          createdAt: fullUser.createdAt,
          updatedAt: fullUser.updatedAt,
          profileImage: fullUser.profileImage
        };
        setUser(fullUserData);
        localStorage.setItem('user', JSON.stringify(fullUserData));
      } catch (error) {
        console.warn('Could not fetch complete user data, using basic info:', error);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
    } catch (error: any) {
      console.error('AuthContext: Login error:', {
        message: error.message,
        response: error.response?.data
      });
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authService.register(userData);
      
      // Même logique que login après l'inscription
      localStorage.setItem('token', response.token);
      localStorage.setItem('username', response.username);
      localStorage.setItem('role', response.role);
      
      const userObj: User = {
        id: response.id || '',
        username: response.username,
        email: response.email || '',
        role: response.role,
        firstName: response.firstName,
        lastName: response.lastName
      };
      
      setUser(userObj);
      localStorage.setItem('user', JSON.stringify(userObj));
      
    } catch (error: any) {
      console.error('AuthContext: Registration error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (user) {
      try {
        const updatedUser = await userService.getCurrentUser();
        const updatedUserData: User = {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phoneNumber: updatedUser.phoneNumber,
          active: updatedUser.active,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
          profileImage: updatedUser.profileImage
        };
        setUser(updatedUserData);
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        
        if (updatedUser.profileImage !== user.profileImage) {
          console.log('Profile image updated, refreshing UI...');
        }
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      try {
        const { id, ...dataWithoutId } = userData;
        const updatedUser = await userService.updateProfile(dataWithoutId);
        
        const updatedUserData: User = {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phoneNumber: updatedUser.phoneNumber,
          active: updatedUser.active,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
          profileImage: updatedUser.profileImage
        };
        
        setUser(updatedUserData);
        localStorage.setItem('user', JSON.stringify(updatedUserData));
      } catch (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
    updateUser,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};