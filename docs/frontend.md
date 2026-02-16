<h1 style="color:#0d47a1;">PARTIE FRONTEND : SmartHub</h1>

Le frontend est l'interface utilisateur de SmartHub. Il :

- Affiche les vues et gère l'UX/UI
- Communique avec le backend via API REST
- Gère l'état (auth, quiz, ressources)
- Orchestre la navigation et les protections de routes
- Intègre la génération/consommation RAG/agents via services


## <h2 style="color:#0d47a1;">Architecture générale du projet</h2>

- Point d'entrée : `public/index.html` / `src/index.tsx`
- Entrée applicative : `src/App.tsx` (router principal)
- Contexte / Store principal : `src/context/AuthContext.tsx`
- Routes protégées : `src/components/PrivateRoute.tsx`
- Services HTTP : `src/services/api.ts` et services métiers (`quizService`, `authService`, etc.)
- Pages : `src/pages/*` (auth, dashboard, courses, quizzes, resources...)
- Composants réutilisables : `src/components/*`
- Types/DTOs : `src/types/*`
- Styles : `src/App.css`, `src/index.css` et Bootstrap

> Remarque importante : le projet utilise `react-scripts` (Create React App) selon `package.json`, pas Vite.


## <h2 style="color:#0d47a1;">Dépendances principales</h2>

<div align="center">

  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-4.9-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white" />
  <img src="https://img.shields.io/badge/Axios-1.6-5A29E4" />
  <img src="https://img.shields.io/badge/React_Router-6-blue" />
  <img src="https://img.shields.io/badge/React_Hook_Form-7-FF6B6B" />

</div>


### 6. `src/pages/auth/LoginPage.tsx` — Page de connexion utilisateur

Ce composant gère l’authentification des utilisateurs : il affiche le formulaire de connexion, gère les erreurs, propose la récupération de mot de passe (simulation), et déclenche la logique d’authentification via le contexte. Il interagit avec le service d’authentification et le contexte global pour stocker le token et l’utilisateur connecté.

```tsx
...existing code...
```

| Aspect | Détails |
|---|---|
| Chemin | `src/pages/auth/LoginPage.tsx` |
| Rôle | Formulaire de connexion, gestion des erreurs et forgot-password (simulation) |
| Exporte | `LoginPage` (default) |
| Dépendances | `useAuth`, `react-router-dom`, Bootstrap, `authService` via `AuthContext` |
| Appels HTTP | `authService.login()` — généralement POST `/api/auth/login` (implémentation backend) |
| DTOs | Requête: `{ username, password }`; Réponse: `AuthResponse` contenant `token`, `username`, `role`, `id` |
| Auth | Après succès, `AuthContext` stocke token & user; redirection vers `/dashboard` |
| Effets secondaires | Ecrit dans `localStorage` via `AuthContext`, navigation, affichage d'alerts |
| Remarques | Sanitize input, protéger contre bruteforce, afficher messages utilisateur utiles |

---

### 7. `src/pages/quizzes/QuizAttemptPage.tsx` — Passation de quiz

Ce composant permet à l’étudiant de démarrer ou reprendre une tentative de quiz : il gère le timer, la navigation entre questions, la collecte et la soumission des réponses. Il communique avec le service de quiz pour récupérer les questions, enregistrer les réponses et soumettre la tentative. Toute la logique de gestion du temps, de validation et de navigation est encapsulée ici.

```tsx
...existing code...
```

| Aspect | Détails |
|---|---|
| Chemin | `src/pages/quizzes/QuizAttemptPage.tsx` |
| Rôle | Démarrer/reprendre une tentative, timer, collecte des réponses, soumission |
| Exporte | `QuizAttemptPage` (default) |
| Dépendances | `quizService`, `useAuth`, types `QuizResponseDTO`, `QuestionType` |
| Appels HTTP | `quizService.getQuizById(id)` (GET `/api/quizzes/:id`), `quizService.resumeOrStartQuizAttempt(userId, quizId)` (POST/GET `/api/quizzes/:id/attempts`), `quizService.submitQuizAttempt(quizId, attemptId, answers)` (POST `/api/quizzes/:id/attempts/:attemptId/submit`) |
| DTOs | `QuizResponseDTO` (quiz metadata & questions), `Answer` (questionId, answerText), `Attempt` (id, answers) |
| Auth | Doit être authentifié (étudiant) — `PrivateRoute` sur la route d'accès |
| Effets secondaires | Navigation vers page résultats, timers, stockage temporaire d'état en mémoire (possibilité d'ajouter sauvegarde locale) |
| Remarques | Gérer la persistance côté serveur pour reprise; protéger endpoint de soumission contre triche côté serveur |

---
```tsx
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
```

| Aspect | Détails |
|---|---|
| Chemin | `src/context/AuthContext.tsx` |
| Rôle | Fournit l'état d'authentification, `login`, `register`, `logout`, `refreshUser`, `updateUser` |
| Exporte | `AuthProvider`, `useAuth` |
| Dépendances | `authService`, `userService`, `localStorage` |
| Appels HTTP | `authService.login/register()` (POST login/register), `userService.getCurrentUser()` (GET /users/me), `userService.updateProfile()` (PUT/PATCH) |
| DTOs | `AuthResponse` (token, username, role, id, email), `User` (id, username, email, role, profile fields) |
| Auth | Stocke le token dans `localStorage` et stocke l'objet `user` sérialisé dans `localStorage` |
| Effets secondaires | Modification de `localStorage`, navigation effectuée par les pages après `login`/`logout` |
| Remarques | Valider et filtrer strictement les valeurs stockées dans `localStorage`; améliorer sécurité en utilisant cookie `HttpOnly` et rafraîchissement côté serveur si possible |

---

**`src/components/PrivateRoute.tsx` — Garde de routes**

```tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRoles?: Array<'STUDENT' | 'TEACHER' | 'ADMIN'>;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Rediriger vers /login en sauvegardant l'emplacement actuel
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier les rôles si spécifiés
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    if (!hasRequiredRole) {
      return (
        <div className="container mt-5">
          <div className="alert alert-danger">
            <h4>Accès refusé</h4>
            <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
            <p>Rôle requis: {requiredRoles.join(' ou ')}</p>
            <a href="/dashboard" className="btn btn-primary">
              Retour au tableau de bord
            </a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
```

| Aspect | Détails |
|---|---|
| Chemin | `src/components/PrivateRoute.tsx` |
| Rôle | Vérifie `isAuthenticated` et `requiredRoles`; renvoie `<Navigate>` vers `/login` ou panneau d'accès refusé |
| Exporte | `PrivateRoute` (default) |
| Dépendances | `useAuth`, `react-router-dom` |
| Appels HTTP | Aucun |
| Auth | Lit l'état depuis `AuthContext` (qui dépend du token en `localStorage`) |
| Effets secondaires | Redirections et affichage d'un message d'accès refusé si rôle manquant |

---

**`src/pages/auth/LoginPage.tsx` — Page de connexion**

```tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username.trim(), password.trim());
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      if (errorMsg.includes('Bad credentials') || errorMsg.includes('Identifications sont erronées')) {
        setError('Nom d\'utilisateur ou mot de passe incorrect');
      } else {
        setError(errorMsg || 'Échec de la connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordMessage('');
    
    if (!forgotPasswordEmail) {
      setForgotPasswordMessage('Veuillez entrer votre email');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setForgotPasswordMessage(`Un email de réinitialisation a été envoyé à ${forgotPasswordEmail}`);
      setForgotPasswordEmail('');
    } catch (err) {
      setForgotPasswordMessage('Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          {/* En-tête compact - Logo uniquement */}
          <div className="d-flex align-items-center justify-content-center mb-3">
            {/* Logo de l'école - SANS icône */}
            <div 
              className="rounded-circle bg-white d-flex align-items-center justify-content-center me-3 overflow-hidden"
              style={{ 
                width: '70px', 
                height: '70px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '2px solid #fd9c0d',
                flexShrink: 0
              }}
            >
              {/* SEULEMENT le logo image */}
              <img 
                src="/logo-giatd.jpg" 
                alt="Logo GIATD-ENSAM" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  borderRadius: '50%',
                  //padding: '5px'
                }} 
                onError={(e) => {
                  // Fallback si le logo n'existe pas
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="text-primary text-center">
                      <div style="font-size: 1.5rem; font-weight: bold">IATD</div>
                      <div style="font-size: 0.7rem">ENSAM</div>
                    </div>
                  `;
                }}
              />
            </div>
            
            {/* Texte à droite du logo */}
            <div className="text-start">
              <h2 className="fw-bold text-primary mb-0" style={{ fontSize: '1.8rem' }}>
                GIATD-SI
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: '1rem' }}>
                École Nationale Supérieure des Arts et Métiers - Meknès
              </p>
            </div>
          </div>

          {/* Ligne séparatrice */}
          <hr className="mb-4" />

          {/* Formulaire de connexion */}
          <div className="card shadow border-0">
            <div className="card-body p-4">
              <h4 className="text-center mb-4">Connexion à SmartHub</h4>
              
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}

              {!showForgotPassword ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label fw-medium">
                      <i className="bi bi-person me-1"></i>
                      Nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="Entrez votre nom d'utilisateur"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-medium">
                      <i className="bi bi-key me-1"></i>
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="Entrez votre mot de passe"
                    />
                  </div>

                  <div className="mb-3 text-end">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none p-0 text-primary"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      <i className="bi bi-question-circle me-1"></i>
                      Mot de passe oublié ?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Se connecter
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <div className="mb-3">
                    <p className="text-muted mb-3">
                      <i className="bi bi-info-circle me-1"></i>
                      Entrez votre email pour réinitialiser votre mot de passe.
                    </p>
                    <label htmlFor="forgotPasswordEmail" className="form-label fw-medium">
                      Adresse email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="forgotPasswordEmail"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="votre.email@ensam.ma"
                      required
                      disabled={loading}
                    />
                  </div>

                  {forgotPasswordMessage && (
                    <div className={`alert ${forgotPasswordMessage.includes('envoyé') ? 'alert-success' : 'alert-info'} mb-3`}>
                      <i className="bi bi-check-circlece me-2"></i>
                      {forgotPasswordMessage}
                    </div>
                  )}

                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordMessage('');
                      }}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-left me-1"></i>
                      Retour
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-1"></i>
                          Envoyer
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center mt-4 pt-3 border-top">
                <p className="mb-2">
                  Pas encore de compte ?{' '}
                <Link to="/register/select-role" className="text-decoration-none fw-medium text-primary">
                  <i className="bi bi-person-plus me-1"></i>
                  Créer un compte
                </Link>
                </p>
                <p className="text-muted small mb-0">
                  <i className="bi bi-shield-check me-1"></i>
                  Plateforme sécurisée - IATD SmartHub v1.0
                </p>
              </div>
            </div>
          </div>

          {/* Footer minimaliste */}
          <div className="text-center mt-3">
            <p className="text-muted small">
              © {new Date().getFullYear()} ENSAM Meknès - Tous droits réservés
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
```

| Aspect | Détails |
|---|---|
| Chemin | `src/pages/auth/LoginPage.tsx` |
| Rôle | Formulaire de connexion, gestion des erreurs et forgot-password (simulation) |
| Exporte | `LoginPage` (default) |
| Dépendances | `useAuth`, `react-router-dom`, Bootstrap, `authService` via `AuthContext` |
| Appels HTTP | `authService.login()` — généralement POST `/api/auth/login` (implémentation backend) |
| DTOs | Requête: `{ username, password }`; Réponse: `AuthResponse` contenant `token`, `username`, `role`, `id` |
| Auth | Après succès, `AuthContext` stocke token & user; redirection vers `/dashboard` |
| Effets secondaires | Ecrit dans `localStorage` via `AuthContext`, navigation, affichage d'alerts |
| Remarques | Sanitize input, protéger contre bruteforce, afficher messages utilisateur utiles |

---

**`src/pages/quizzes/QuizAttemptPage.tsx` — Passation de quiz**

```tsx
// (voir ci-dessus) Contenu complet de `src/pages/quizzes/QuizAttemptPage.tsx`
```

| Aspect | Détails |
|---|---|
| Chemin | `src/pages/quizzes/QuizAttemptPage.tsx` |
| Rôle | Démarrer/reprendre une tentative, timer, collecte des réponses, soumission |
| Exporte | `QuizAttemptPage` (default) |
| Dépendances | `quizService`, `useAuth`, types `QuizResponseDTO`, `QuestionType` |
| Appels HTTP | `quizService.getQuizById(id)` (GET `/api/quizzes/:id`), `quizService.resumeOrStartQuizAttempt(userId, quizId)` (POST/GET `/api/quizzes/:id/attempts`), `quizService.submitQuizAttempt(quizId, attemptId, answers)` (POST `/api/quizzes/:id/attempts/:attemptId/submit`) |
| DTOs | `QuizResponseDTO` (quiz metadata & questions), `Answer` (questionId, answerText), `Attempt` (id, answers) |
| Auth | Doit être authentifié (étudiant) — `PrivateRoute` sur la route d'accès |
| Effets secondaires | Navigation vers page résultats, timers, stockage temporaire d'état en mémoire (possibilité d'ajouter sauvegarde locale) |
| Remarques | Gérer la persistance côté serveur pour reprise; protéger endpoint de soumission contre triche côté serveur |


<h2 style="color:#0d47a1;">App.tsx – Configuration Globale du Routing et de la Sécurité</h2>

<h3 style="color:#1565c0;">Rôle Principal du Fichier</h3>

Le fichier <strong>App.tsx</strong> est le cœur structurel du frontend.

Il :

- Configure le Router principal
- Définit toutes les routes de l’application
- Protège les pages sensibles
- Gère les rôles (STUDENT, TEACHER, ADMIN)
- Structure l’interface globale (Navbar + Footer)

C’est le centre de navigation de toute la plateforme.

---

<h3 style="color:#1565c0;">AuthProvider – Sécurité Globale</h3>

Toute l’application est enveloppée par :

AuthProvider

Cela permet :

- D’avoir accès au contexte utilisateur partout
- De connaître l’état d’authentification
- De protéger les routes dynamiquement

Sans AuthProvider, PrivateRoute ne fonctionnerait pas.

---

<h3 style="color:#1565c0;">Router – Navigation SPA</h3>

L’application utilise :

BrowserRouter

Cela permet :

- Une navigation sans rechargement de page
- Une architecture Single Page Application
- Une gestion dynamique des URLs

Exemple :

/courses/5 charge CourseDetailPage avec id = 5

---

<h3 style="color:#1565c0;">PrivateRoute – Protection des Routes</h3>

Toutes les routes sensibles sont encapsulées dans :

PrivateRoute

Il vérifie :

1. Si l’utilisateur est connecté
2. Si son rôle est autorisé (si spécifié)

Exemples :

Accès libre aux utilisateurs connectés :
- /dashboard
- /courses
- /projects

Accès réservé STUDENT :
- /quizzes/:id/attempt

Accès réservé TEACHER / ADMIN :
- /courses/create
- /quizzes/create

Accès réservé ADMIN :
- /admin
- /admin/users

---

<h3 style="color:#1565c0;">Organisation des Routes</h3>

Le fichier est structuré en blocs logiques :

ROUTES PUBLIQUES
- /login
- /register

ROUTES PROTÉGÉES GÉNÉRALES
- dashboard
- cours
- projets
- annonces
- stages
- ressources
- quiz

ROUTES PROTÉGÉES PAR RÔLE
- Création / modification (Teacher/Admin)
- Administration (Admin uniquement)

ROUTE PAR DÉFAUT
- "*" redirige vers "/"

Cela évite les erreurs 404 internes.

---

<h3 style="color:#1565c0;">Structure Visuelle Globale</h3>

L’application contient :

Navbar (toujours visible)
Container principal
Footer global

Cela crée :

Une structure cohérente sur toutes les pages.

---

<h3 style="color:#1565c0;">Gestion des Rôles</h3>

Les rôles utilisés sont :

- STUDENT
- TEACHER
- ADMIN

Exemple concret :

Un étudiant peut :
- Voir les quiz
- Tenter un quiz
- Créer un stage

Un enseignant peut :
- Créer un quiz
- Modifier un cours
- Publier une annonce

Un admin peut :
- Gérer les utilisateurs
- Accéder au dashboard admin

---

<h3 style="color:#1565c0;">Conclusion</h3>

App.tsx est :

- Le contrôleur de navigation
- Le point central de sécurité
- Le chef d’orchestre du frontend

Sans ce fichier, la plateforme ne peut ni naviguer ni sécuriser ses pages.


---
```tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Import Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Layout & Components
import Navbar from './components/Navbar';

// Pages Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterRoleSelect from './pages/auth/RegisterRoleSelect';
import RegisterPage from './pages/auth/RegisterPage';

// Pages Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Pages Cours
import CourseListPage from './pages/courses/CourseListPage';
import CourseDetailPage from './pages/courses/CourseDetailPage';
import CourseCreatePage from './pages/courses/CourseCreatePage';
import CourseEditPage from './pages/courses/CourseEditPage';
import MyCoursesPage from './pages/courses/MyCoursesPage';

// Pages Projets
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import ProjectCreatePage from './pages/projects/ProjectCreatePage';
import ProjectEditPage from './pages/projects/ProjectEditPage';
import MyProjectsPage from './pages/projects/MyProjectsPage';

// Pages Annonces
import AnnouncementListPage from './pages/announcements/AnnouncementListPage';
import AnnouncementCreatePage from './pages/announcements/AnnouncementCreatePage';
import AnnouncementDetailPage from './pages/announcements/AnnouncementDetailPage';
import AnnouncementEditPage from './pages/announcements/AnnouncementEditPage';
import MyAnnouncementsPage from './pages/announcements/MyAnnouncementsPage';

// Pages Stages
import InternshipListPage from './pages/internships/InternshipListPage';
import InternshipDetailPage from './pages/internships/InternshipDetailPage';
import InternshipCreatePage from './pages/internships/InternshipCreatePage';
import InternshipEditPage from './pages/internships/InternshipEditPage';
import MyInternshipsPage from './pages/internships/MyInternshipsPage';

// Pages Resources
import ResourceListPage from './pages/resources/ResourceListPage';
import ResourceDetailPage from './pages/resources/ResourceDetailPage';
import ResourceCreatePage from './pages/resources/ResourceCreatePage';
import ResourceEditPage from './pages/resources/ResourceEditPage';
import MyResourcesPage from './pages/resources/MyResourcesPage';

// Pages Quiz
import QuizListPage from './pages/quizzes/QuizListPage';
import QuizDetailPage from './pages/quizzes/QuizDetailPage';
import QuizCreatePage from './pages/quizzes/QuizCreatePage';
import QuizEditPage from './pages/quizzes/QuizEditPage';
import QuizAttemptPage from './pages/quizzes/QuizAttemptPage';
import QuizResultsPage from './pages/quizzes/QuizResultsPage';
import MyQuizAttemptsPage from './pages/quizzes/MyQuizAttemptsPage';
import QuizGenerationPage from './pages/quizzes/QuizGenerationPage';

// Pages Profil et Admin
import ProfilePage from './pages/profile/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';

// Styles
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="container-fluid mt-3">
          <Routes>
            {/* ============================ */}
            {/* ROUTES PUBLIQUES */}
            {/* ============================ */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/select-role" element={<RegisterRoleSelect />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ============================ */}
            {/* ROUTES PROTÉGÉES - Accès général */}
            {/* ============================ */}
            <Route path="/" element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } />
            
            <Route path="/dashboard" element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } />
            
            {/* Cours */}
            <Route path="/courses" element={
              <PrivateRoute>
                <CourseListPage />
              </PrivateRoute>
            } />
            
            <Route path="/courses/:id" element={
              <PrivateRoute>
                <CourseDetailPage />
              </PrivateRoute>
            } />
            
            {/* Projets */}
            <Route path="/projects" element={
              <PrivateRoute>
                <ProjectsPage />
              </PrivateRoute>
            } />
            
            <Route path="/projects/:id" element={
              <PrivateRoute>
                <ProjectDetailPage />
              </PrivateRoute>
            } />
            
            <Route path="/my-projects" element={
              <PrivateRoute>
                <MyProjectsPage />
              </PrivateRoute>
            } />

            {/* Annonces */}
            <Route path="/announcements" element={
              <PrivateRoute>
                <AnnouncementListPage />
              </PrivateRoute>
            } />

            <Route path="/announcements/:id" element={
              <PrivateRoute>
                <AnnouncementDetailPage />
              </PrivateRoute>
            } />

            {/* Stages */}
            <Route path="/internships" element={
              <PrivateRoute>
                <InternshipListPage />
              </PrivateRoute>
            } />

            <Route path="/internships/:id" element={
              <PrivateRoute>
                <InternshipDetailPage />
              </PrivateRoute>
            } />

            <Route path="/my-internships" element={
              <PrivateRoute>
                <MyInternshipsPage />
              </PrivateRoute>
            } />

            {/* Ressources */}
            <Route path="/resources" element={
              <PrivateRoute>
                <ResourceListPage />
              </PrivateRoute>
            } />

            <Route path="/resources/:id" element={
              <PrivateRoute>
                <ResourceDetailPage />
              </PrivateRoute>
            } />

            <Route path="/my-resources" element={
              <PrivateRoute>
                <MyResourcesPage />
              </PrivateRoute>
            } />
            
            {/* Quiz */}
            <Route path="/quizzes" element={
              <PrivateRoute>
                <QuizListPage />
              </PrivateRoute>
            } />

            <Route path="/quizzes/:id" element={
              <PrivateRoute>
                <QuizDetailPage />
              </PrivateRoute>
            } />

            <Route path="/quizzes/:id/attempt" element={
              <PrivateRoute requiredRoles={[ 'STUDENT' ]}>
                <QuizAttemptPage />
              </PrivateRoute>
            } />

            <Route path="/quizzes/attempts/:attemptId/results" element={
              <PrivateRoute>
                <QuizResultsPage />
              </PrivateRoute>
            } />

            <Route path="/my-quiz-attempts" element={
              <PrivateRoute>
                <MyQuizAttemptsPage />
              </PrivateRoute>
            } />

            {/* ============================ */}
            {/* ROUTES PROTÉGÉES - TEACHER et ADMIN seulement */}
            {/* ============================ */}
            {/* Cours (TEACHER/ADMIN) */}
            <Route path="/courses/create" element={
              <PrivateRoute requiredRoles={[ 'TEACHER', 'ADMIN' ]}>
                <CourseCreatePage />
              </PrivateRoute>
            } />
            
            <Route path="/courses/:id/edit" element={
              <PrivateRoute requiredRoles={[ 'TEACHER', 'ADMIN' ]}>
                <CourseEditPage />
              </PrivateRoute>
            } />
            
            <Route path="/my-courses" element={
              <PrivateRoute requiredRoles={[ 'TEACHER', 'ADMIN' ]}>
                <MyCoursesPage />
              </PrivateRoute>
            } />
            
            {/* Projets (TEACHER/ADMIN) */}
            <Route path="/projects/create" element={
              <PrivateRoute requiredRoles={[ 'TEACHER', 'ADMIN' ]}>
                <ProjectCreatePage />
              </PrivateRoute>
            } />
            
            <Route path="/projects/:id/edit" element={
              <PrivateRoute requiredRoles={[ 'TEACHER', 'ADMIN' ]}>
                <ProjectEditPage />
              </PrivateRoute>
            } />

            {/* Annonces (TEACHER/ADMIN) */}
            <Route path="/announcements/create" element={
              <PrivateRoute requiredRoles={[ 'TEACHER', 'ADMIN' ]}>
                <AnnouncementCreatePage />
              </PrivateRoute>
            } />

            <Route path="/announcements/:id/edit" element={
              <PrivateRoute requiredRoles={[ 'TEACHER', 'ADMIN' ]}>
                <AnnouncementEditPage />
              </PrivateRoute>
            } />

            <Route path="/my-announcements" element={
              <PrivateRoute requiredRoles={[ 'TEACHER', 'ADMIN' ]}>
                <MyAnnouncementsPage />
              </PrivateRoute>
            } />

            {/* Stages (Étudiants peuvent créer) */}
            <Route path="/internships/create" element={
              <PrivateRoute requiredRoles={[ 'STUDENT', 'TEACHER', 'ADMIN' ]}>
                <InternshipCreatePage />
              </PrivateRoute>
            } />

            <Route path="/internships/:id/edit" element={
              <PrivateRoute requiredRoles={[ 'TEACHER', 'ADMIN' ]}>
                <InternshipEditPage />
              </PrivateRoute>
            } />

            {/* Ressources (TEACHER/ADMIN) */}
            <Route path="/resources/create" element={
              <PrivateRoute requiredRoles={[ 'TEACHER', 'ADMIN' ]}>
                <ResourceCreatePage />
              </PrivateRoute>
            } />

            <Route path="/resources/:id/edit" element={
              <PrivateRoute requiredRoles={[ 'TEACHER', 'ADMIN' ]}>
                <ResourceEditPage />
              </PrivateRoute>
            } />

            {/* Quiz (TEACHER/ADMIN) */}
            <Route path="/quizzes/create" element={
              <PrivateRoute requiredRoles={[ 'TEACHER', 'ADMIN' ]}>
                <QuizCreatePage />
              </PrivateRoute>
            } />

            <Route path="/quizzes/generate" element={
              <PrivateRoute requiredRoles={[ 'TEACHER', 'ADMIN' ]}>
                <QuizGenerationPage />
              </PrivateRoute>
            } />

            <Route path="/quizzes/:id/edit" element={
              <PrivateRoute requiredRoles={[ 'TEACHER', 'ADMIN' ]}>
                <QuizEditPage />
              </PrivateRoute>
            } />

            {/* ============================ */}
            {/* ROUTES PROTÉGÉES - PROFIL */}
            {/* ============================ */}
            <Route path="/profile" element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } />

            {/* ============================ */}
            {/* ROUTES PROTÉGÉES - ADMIN seulement */}
            {/* ============================ */}
            <Route path="/admin" element={
              <PrivateRoute requiredRoles={[ 'ADMIN' ]}>
                <AdminDashboardPage />
              </PrivateRoute>
            } />

            <Route path="/admin/users" element={
              <PrivateRoute requiredRoles={[ 'ADMIN' ]}>
                <UserManagementPage />
              </PrivateRoute>
            } />

            {/* ============================ */}
            {/* ROUTE PAR DÉFAUT */}
            {/* ============================ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        
        {/* Footer */}
        <footer className="footer mt-5 py-3 bg-light">
          <div className="container">
            <div className="row">
              <div className="col-md-6">
                <h5>IATD SmartHub</h5>
                <p className="text-muted">
                  Plateforme de gestion des ressources académiques
                </p>
              </div>
              <div className="col-md-6 text-end">
                <span className="text-muted">
                  © {new Date().getFullYear()} IATD - Tous droits réservés
                </span>
              </div>
            </div>
          </div>
        </footer>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

<h2 style="color:#0d47a1;">index.tsx – Point d’Entrée Principal de l’Application</h2>

<h3 style="color:#1565c0;">Rôle du fichier</h3>

Le fichier <strong>index.tsx</strong> est le point de démarrage de l’application React.

C’est lui qui :

- Initialise React
- Monte l’application dans le DOM
- Charge les styles globaux
- Lance le composant principal App

Sans ce fichier, l’application ne peut pas s’afficher dans le navigateur.

---

<h3 style="color:#1565c0;">Création de la racine React</h3>

React 18 utilise :

ReactDOM.createRoot()

Cette méthode permet :

- Un rendu plus performant
- Le support du mode concurrent
- Une meilleure gestion des mises à jour

L’application est injectée dans :

document.getElementById('root')

Ce "root" correspond à la div présente dans index.html.

---

<h3 style="color:#1565c0;">Chargement des styles globaux</h3>

Ce fichier importe :

- index.css → styles personnalisés globaux
- bootstrap.min.css → framework CSS
- bootstrap-icons.css → icônes Bootstrap

Cela signifie que :

- Toute l’application a accès aux classes Bootstrap
- Les icônes peuvent être utilisées partout
- Les styles personnalisés sont appliqués globalement

---

<h3 style="color:#1565c0;">React.StrictMode</h3>

L’application est enveloppée dans :

React.StrictMode

Ce mode :

- Active des vérifications supplémentaires en développement
- Détecte les mauvaises pratiques
- Aide à identifier des effets secondaires

Il n’a aucun impact en production.

---

<h3 style="color:#1565c0;">Rôle de App</h3>

Le composant App est :

- Le composant racine
- Le point central du routing
- Le conteneur principal de l’application

index.tsx ne contient aucune logique métier.
Il sert uniquement à démarrer l’application.

---

<h3 style="color:#1565c0;">Conclusion</h3>

index.tsx est :

- Le point d’entrée technique
- Le bootstrap du frontend
- Le lien entre React et le HTML

C’est la première étape du cycle de vie de l’application.


```tsx
// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

<h2 style="color:#0d47a1;">api.ts – Configuration Globale Axios</h2>

<h3 style="color:#1565c0;">Rôle du fichier</h3>

Le fichier <strong>api.ts</strong> configure une instance Axios centralisée pour toute l’application.

Il permet :

- De définir une baseURL unique
- D’ajouter automatiquement le token JWT aux requêtes
- De gérer les erreurs globales (notamment 401)
- D’éviter la duplication de configuration dans chaque service

Tous les services (authService, userService, quizService, etc.) utilisent cette instance.

---

<h3 style="color:#1565c0;">Configuration de base</h3>

Une instance Axios est créée avec :

- baseURL → URL du backend
- Content-Type → application/json

Cela signifie que toutes les requêtes utiliseront automatiquement :

https://smart-education-platform.onrender.com

Sans avoir à répéter l’URL dans chaque appel API.

---

<h3 style="color:#1565c0;">Intercepteur de requête (Request Interceptor)</h3>

Avant chaque requête :

1. Le token est récupéré depuis localStorage
2. S’il existe, il est ajouté dans le header :

Authorization: Bearer TOKEN

Cela permet :

- Une authentification automatique
- Une sécurisation de toutes les routes protégées
- Une architecture propre et centralisée

Sans cet intercepteur, chaque service devrait ajouter le header manuellement.

---

<h3 style="color:#1565c0;">Intercepteur de réponse (Response Interceptor)</h3>

Après chaque réponse :

Si le serveur retourne un code 401 (Unauthorized) :

1. Le token est supprimé
2. L’utilisateur est déconnecté
3. Redirection automatique vers /login

Cela protège contre :

- Token expiré
- Token invalide
- Accès non autorisé

C’est une sécurité globale côté frontend.

---

<h3 style="color:#1565c0;">Pourquoi cette architecture est importante</h3>

Cette configuration permet :

- Centralisation des règles réseau
- Gestion automatique du JWT
- Sécurité renforcée
- Code plus propre et maintenable
- Gestion automatique des sessions expirées

Sans ce fichier, la gestion des requêtes serait :

- Répétitive
- Risquée
- Difficile à maintenir

---

<h3 style="color:#1565c0;">Conclusion</h3>

api.ts est la couche réseau centrale de l’application.

Il agit comme :

- Un gestionnaire de communication backend
- Un injecteur automatique de JWT
- Un système de sécurité global contre les accès non autorisés


```typescript
// src/services/api.ts
import axios from 'axios';

// Configuration de base pour Axios
const api = axios.create({
  baseURL: 'https://smart-education-platform.onrender.com', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT automatiquement
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

// Intercepteur pour gérer les erreurs globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

<h2 style="color:#0d47a1;">AuthContext.tsx – Gestion Globale de l’Authentification</h2>

<h3 style="color:#1565c0;">Rôle du Contexte</h3>

Le fichier <strong>AuthContext.tsx</strong> centralise toute la logique d’authentification de l’application.

Il permet :

- De gérer l’utilisateur connecté
- De stocker et vérifier le token JWT
- D’exposer les fonctions login, register et logout
- De partager l’état d’authentification dans toute l’application

Il fonctionne avec :
- localStorage (persistance)
- authService (API login/register)
- userService (récupération des infos complètes)

---

<h3 style="color:#1565c0;">Structure Principale</h3>

Le contexte expose :

- user → utilisateur connecté
- isAuthenticated → true si user existe
- loading → état de vérification initiale
- login()
- register()
- logout()
- updateUser()
- refreshUser()

Toute l’application peut accéder à ces données via :

useAuth()

---

<h3 style="color:#1565c0;">Fonction checkAuth()</h3>

Appelée au chargement grâce à useEffect.

Rôle :
1. Vérifier si un token existe
2. Vérifier qu’il n’est pas "undefined" ou "null"
3. Restaurer l’utilisateur depuis localStorage
4. Nettoyer les données corrompues

Exemple de sécurité importante :

- Vérifie que le token contient un point (.)
- Cela confirme que c’est bien un JWT valide

Un JWT a toujours 3 parties séparées par des points :
header.payload.signature

---

<h3 style="color:#1565c0;">Fonction login()</h3>

Étapes :

1. Appel API via authService.login()
2. Vérification que le token existe
3. Vérification qu’il est valide
4. Stockage du token dans localStorage
5. Tentative de récupération du profil complet
6. Mise à jour du state user

Sécurité importante :
- Refuse un token "undefined"
- Refuse un token mal formé

Exemple de données stockées :

- token
- username
- role
- user (objet complet JSON)

---

<h3 style="color:#1565c0;">Fonction register()</h3>

Même logique que login :

1. Appel API register
2. Stockage token
3. Création de l’objet utilisateur
4. Mise à jour du state global

Permet connexion automatique après inscription.

---

<h3 style="color:#1565c0;">Fonction refreshUser()</h3>

Permet de :

- Recharger les données depuis le serveur
- Mettre à jour l’image de profil
- Synchroniser les modifications backend

Utilisée par exemple après modification du profil.

---

<h3 style="color:#1565c0;">Fonction updateUser()</h3>

Permet de :

1. Envoyer les modifications au backend
2. Mettre à jour l’utilisateur dans le state
3. Mettre à jour localStorage

Important :
L’id n’est jamais modifié.

---

<h3 style="color:#1565c0;">Fonction logout()</h3>

Nettoie complètement :

- token
- user
- username
- role

Puis remet user à null.

Cela provoque automatiquement :
isAuthenticated = false

---

<h3 style="color:#1565c0;">Pourquoi cette architecture est importante</h3>

Ce contexte permet :

- Une gestion centralisée de l’authentification
- Une sécurité renforcée côté frontend
- Une persistance après refresh navigateur
- Une séparation claire entre logique UI et logique auth

Sans ce contexte, chaque composant devrait gérer l’authentification individuellement, ce qui serait :

- Complexe
- Redondant
- Difficile à maintenir

---

<h3 style="color:#1565c0;">Conclusion</h3>

AuthContext.tsx est le cœur du système d’authentification frontend.

Il agit comme :

- Un gestionnaire d’état global
- Un validateur de sécurité JWT
- Un pont entre backend et interface utilisateur


```tsx
// src/context/AuthContext.tsx
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
```
<h2 style="color:#0d47a1;">PrivateRoute.tsx – Protection des Routes</h2>

<h3 style="color:#1565c0;">Rôle du composant</h3>

Le composant <strong>PrivateRoute</strong> permet de sécuriser l’accès aux pages sensibles de l’application.  
Il agit comme une barrière entre l’utilisateur et la route demandée.

Il vérifie :

- Si l’utilisateur est authentifié
- Si le chargement des données d’authentification est terminé
- Si l’utilisateur possède les rôles requis

Ce composant est généralement utilisé avec <code>react-router-dom</code> pour protéger des routes comme :
- /dashboard
- /admin
- /teacher
- /profile

---

<h3 style="color:#1565c0;">Fonctionnement détaillé</h3>

<strong>1. Gestion du chargement (loading)</strong>  
Si les données d’authentification sont encore en cours de récupération, un spinner Bootstrap est affiché.

Objectif : éviter d'afficher brièvement une page protégée avant la vérification complète.

---

<strong>2. Vérification de l’authentification</strong>  
Si <code>isAuthenticated</code> est false, l’utilisateur est redirigé vers <code>/login</code>.

La position actuelle est sauvegardée via :
<code>state={{ from: location }}</code>

Cela permet après connexion de rediriger l’utilisateur vers la page qu’il voulait initialement visiter.

---

<strong>3. Vérification des rôles</strong>  

Si des rôles sont spécifiés via <code>requiredRoles</code>, le composant vérifie que :

<code>requiredRoles.includes(user.role)</code>

Si l’utilisateur n’a pas le bon rôle :
- Un message d’erreur est affiché
- Le rôle requis est affiché
- Un bouton permet de revenir au tableau de bord

---

<h3 style="color:#1565c0;">Structure des Props</h3>

<strong>children</strong>  
Contenu à afficher si l’accès est autorisé.

<strong>requiredRoles</strong>  
Liste des rôles autorisés :
- STUDENT
- TEACHER
- ADMIN

Si la liste est vide, toute personne authentifiée peut accéder à la route.

---

<h3 style="color:#1565c0;">Exemple d’utilisation</h3>

Protection simple (authentification uniquement) :

<pre>
&lt;PrivateRoute&gt;
  &lt;Dashboard /&gt;
&lt;/PrivateRoute&gt;
</pre>

Protection avec rôle spécifique :

<pre>
&lt;PrivateRoute requiredRoles={['ADMIN']}&gt;
  &lt;AdminPanel /&gt;
&lt;/PrivateRoute&gt;
</pre>

---

<h3 style="color:#1565c0;">Importance dans l’architecture</h3>

Ce composant est essentiel pour :

- Sécuriser les pages sensibles
- Centraliser la logique d’autorisation
- Éviter la duplication de code
- Améliorer l’expérience utilisateur avec redirection intelligente

Il constitue une couche de sécurité côté frontend, en complément de la sécurité backend.

```tsx
// src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRoles?: Array<'STUDENT' | 'TEACHER' | 'ADMIN'>;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Rediriger vers /login en sauvegardant l'emplacement actuel
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier les rôles si spécifiés
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    if (!hasRequiredRole) {
      return (
        <div className="container mt-5">
          <div className="alert alert-danger">
            <h4>Accès refusé</h4>
            <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
            <p>Rôle requis: {requiredRoles.join(' ou ')}</p>
            <a href="/dashboard" className="btn btn-primary">
              Retour au tableau de bord
            </a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};


export default PrivateRoute;
```

---

### 6. `src/pages/auth/LoginPage.tsx` — Page de connexion utilisateur

Ce composant gère l’authentification des utilisateurs : il affiche le formulaire de connexion, gère les erreurs, propose la récupération de mot de passe (simulation), et déclenche la logique d’authentification via le contexte. Il interagit avec le service d’authentification et le contexte global pour stocker le token et l’utilisateur connecté.




# <h2 style="color: blue;">LoginPage.tsx – Explication Technique Complète<h2>

---

# <h2 style="color: blue;">1. Rôle Général du Composant<h2>

`LoginPage` est le composant React responsable de :

-  Authentifier un utilisateur
-  Gérer les erreurs de connexion
-  Rediriger vers le dashboard après succès
-  Gérer un module "Mot de passe oublié"
-  Fournir une UX sécurisée et fluide

Il constitue le **point d’entrée sécurisé de l’application SmartHub**.

---

# <h2 style="color: blue;">2. Architecture Technique<h2>

| Élément | Rôle |
|----------|------|
| useState | Gestion des états locaux |
| useAuth() | Gestion authentification globale |
| useNavigate() | Redirection après login |
| React Router | Navigation |
| Bootstrap | UI / Design |
| Context API | Stockage session utilisateur |

---

# <h2 style="color: blue;">3. Gestion des États<h2>

| State | Type | Rôle |
|--------|------|------|
| username | string | Stocke nom utilisateur |
| password | string | Stocke mot de passe |
| error | string | Message d’erreur |
| loading | boolean | Indique requête en cours |
| showForgotPassword | boolean | Toggle formulaire oublié |
| forgotPasswordEmail | string | Email saisi |
| forgotPasswordMessage | string | Message retour utilisateur |

---

# <h2 style="color: blue;">4. handleSubmit() – Connexion<h2>

## Objectif
Authentifier l’utilisateur via `useAuth().login()`.

## <h2 style="color: blue;">Flux d’exécution<h2>

| Étape | Action |
|--------|--------|
| 1 | Empêche rechargement page |
| 2 | Active loading |
| 3 | Appel login(username, password) |
| 4 | Redirection vers /dashboard |
| 5 | Gestion erreur |

---

## <h2 style="color: blue;"> Gestion intelligente des erreurs<h2>

```ts
if (errorMsg.includes('Bad credentials'))
```

Permet d’afficher un message utilisateur clair :

> "Nom d'utilisateur ou mot de passe incorrect"

---

# <h2 style="color: blue;">5. handleForgotPassword()<h2>

⚠️ Simulation d'envoi email (mock).

## <h2 style="color: blue;">Étapes<h2>

| Étape | Description |
|--------|------------|
| 1 | Vérifie email non vide |
| 2 | Simule appel backend (setTimeout) |
| 3 | Affiche message succès |
| 4 | Reset champ email |

---

# <h2 style="color: blue;">6. Structure UI<h2>

## <h2 style="color: blue;">Bloc Header<h2>

- Logo circulaire
- Titre GIATD-SI
- Sous-titre ENSAM Meknès
- Fallback dynamique si image échoue

---

## <h2 style="color: blue;">Formulaire Principal<h2>

### Champs

| Champ | Type |
|--------|------|
| username | text |
| password | password |

---

## <h2 style="color: blue;">Bouton dynamique<h2>

| État | Affichage |
|-------|-----------|
| loading = false | "Se connecter" |
| loading = true | Spinner + "Connexion en cours..." |

---

# <h2 style="color: blue;">7. Toggle Mot de Passe Oublié<h2>

```ts
showForgotPassword ? FormForgot : FormLogin
```

Permet d’afficher :

- Formulaire login
- OU formulaire réinitialisation

UX propre sans changer de page.

---

# <h2 style="color: blue;">8. Gestion UX & Sécurité<h2>

| Feature | Rôle |
|----------|------|
| disabled={loading} | Empêche double clic |
| Spinner | Feedback visuel |
| trim() | Supprime espaces inutiles |
| Alert dismissible | Permet fermer erreur |
| Confirmation email envoyé | Feedback utilisateur |

---

# <h2 style="color: blue;">9. Flux Global<h2>

```
User arrive
   ↓
Remplit formulaire
   ↓
handleSubmit()
   ↓
AuthContext.login()
   ↓
Backend valide
   ↓
navigate('/dashboard')
```

---

#  <h2 style="color: blue;">10. Intégration avec AuthContext<h2>

`useAuth()` fournit :

| Fonction | Description |
|----------|------------|
| login() | Appel API authentification |
| user | Données utilisateur |

Ce composant ne gère PAS le token directement.
Il délègue à AuthContext.

---

#  <h2 style="color: blue;">11. Points Forts Architecturaux<h2>

✔ Séparation logique UI / Auth  
✔ Gestion propre des erreurs  
✔ UX moderne avec feedback  
✔ Simulation réinitialisation prête à brancher backend  
✔ Navigation React Router propre  

---

#  <h2 style="color: blue;">Conclusion<h2>

LoginPage est :

- Le point d’accès sécurisé
- Connecté au système global d’authentification
- Optimisé UX
- Extensible (OAuth, JWT, etc.)

C’est un composant critique pour la sécurité et l’expérience utilisateur de SmartHub.



```tsx
// src/pages/auth/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username.trim(), password.trim());
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      if (errorMsg.includes('Bad credentials') || errorMsg.includes('Identifications sont erronées')) {
        setError('Nom d\'utilisateur ou mot de passe incorrect');
      } else {
        setError(errorMsg || 'Échec de la connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordMessage('');
    
    if (!forgotPasswordEmail) {
      setForgotPasswordMessage('Veuillez entrer votre email');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setForgotPasswordMessage(`Un email de réinitialisation a été envoyé à ${forgotPasswordEmail}`);
      setForgotPasswordEmail('');
    } catch (err) {
      setForgotPasswordMessage('Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          {/* En-tête compact - Logo uniquement */}
          <div className="d-flex align-items-center justify-content-center mb-3">
            {/* Logo de l'école - SANS icône */}
            <div 
              className="rounded-circle bg-white d-flex align-items-center justify-content-center me-3 overflow-hidden"
              style={{ 
                width: '70px', 
                height: '70px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '2px solid #fd9c0d',
                flexShrink: 0
              }}
            >
              {/* SEULEMENT le logo image */}
              <img 
                src="/logo-giatd.jpg" 
                alt="Logo GIATD-ENSAM" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  borderRadius: '50%',
                  //padding: '5px'
                }} 
                onError={(e) => {
                  // Fallback si le logo n'existe pas
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="text-primary text-center">
                      <div style="font-size: 1.5rem; font-weight: bold">IATD</div>
                      <div style="font-size: 0.7rem">ENSAM</div>
                    </div>
                  `;
                }}
              />
            </div>
            
            {/* Texte à droite du logo */}
            <div className="text-start">
              <h2 className="fw-bold text-primary mb-0" style={{ fontSize: '1.8rem' }}>
                GIATD-SI
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: '1rem' }}>
                École Nationale Supérieure des Arts et Métiers - Meknès
              </p>
            </div>
          </div>

          {/* Ligne séparatrice */}
          <hr className="mb-4" />

          {/* Formulaire de connexion */}
          <div className="card shadow border-0">
            <div className="card-body p-4">
              <h4 className="text-center mb-4">Connexion à SmartHub</h4>
              
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}

              {!showForgotPassword ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label fw-medium">
                      <i className="bi bi-person me-1"></i>
                      Nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="Entrez votre nom d'utilisateur"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-medium">
                      <i className="bi bi-key me-1"></i>
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="Entrez votre mot de passe"
                    />
                  </div>

                  <div className="mb-3 text-end">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none p-0 text-primary"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      <i className="bi bi-question-circle me-1"></i>
                      Mot de passe oublié ?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Se connecter
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <div className="mb-3">
                    <p className="text-muted mb-3">
                      <i className="bi bi-info-circle me-1"></i>
                      Entrez votre email pour réinitialiser votre mot de passe.
                    </p>
                    <label htmlFor="forgotPasswordEmail" className="form-label fw-medium">
                      Adresse email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="forgotPasswordEmail"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="votre.email@ensam.ma"
                      required
                      disabled={loading}
                    />
                  </div>

                  {forgotPasswordMessage && (
                    <div className={`alert ${forgotPasswordMessage.includes('envoyé') ? 'alert-success' : 'alert-info'} mb-3`}>
                      <i className="bi bi-check-circle me-2"></i>
                      {forgotPasswordMessage}
                    </div>
                  )}

                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordMessage('');
                      }}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-left me-1"></i>
                      Retour
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-1"></i>
                          Envoyer
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center mt-4 pt-3 border-top">
                <p className="mb-2">
                  Pas encore de compte ?{' '}
                <Link to="/register/select-role" className="text-decoration-none fw-medium text-primary">
                  <i className="bi bi-person-plus me-1"></i>
                  Créer un compte
                </Link>
                </p>
                <p className="text-muted small mb-0">
                  <i className="bi bi-shield-check me-1"></i>
                  Plateforme sécurisée - IATD SmartHub v1.0
                </p>
              </div>
            </div>
          </div>

          {/* Footer minimaliste */}
          <div className="text-center mt-3">
            <p className="text-muted small">
              © {new Date().getFullYear()} ENSAM Meknès - Tous droits réservés
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
```
#  QuizAttemptPage.tsx – Explication Technique Complète

---

##  1. Rôle Général du Composant

`QuizAttemptPage` est un composant React responsable de :

-  Charger un quiz depuis le backend
-  Démarrer ou reprendre une tentative
-  Gérer les réponses utilisateur
-  Gérer un timer en temps réel
-  Soumettre les réponses
-  Afficher la progression
-  Rediriger vers la page des résultats

Il représente le **cœur fonctionnel de la passation d’un quiz côté Frontend**.

---

#  2. Architecture Logique

| Couche | Rôle |
|--------|------|
| React Hooks | Gestion d’état et cycle de vie |
| quizService | Communication API Backend |
| useAuth | Récupération utilisateur connecté |
| React Router | Navigation et paramètres URL |
| Bootstrap | UI & styles |

---

#  3. Gestion des États (useState)

| State | Type | Rôle |
|-------|------|------|
| quiz | QuizResponseDTO \| null | Stocke les données du quiz |
| loading | boolean | Affiche spinner pendant chargement |
| submitting | boolean | Indique soumission en cours |
| error | string | Stocke message d’erreur |
| answers | Record<number, string \| string[]> | Stocke réponses par question |
| attemptId | number \| null | ID tentative active |
| timeRemaining | number \| null | Timer en secondes |

 Structure de `answers` :

```ts
{
  1: "Option A",
  2: ["Option B", "Option D"],
  3: "Vrai"
}
```

---

# 4. useEffect – Cycle de Vie

## 🔹 Démarrage du Quiz

```ts
useEffect(() => {
  if (id && user) {
    startAttempt();
  }
}, [id, user]);
```

| Déclencheur | Action |
|-------------|--------|
| id change | Lance startAttempt |
| user change | Lance startAttempt |

---

## 🔹 Gestion du Timer

```ts
setInterval(() => {
  setTimeRemaining(prev => prev - 1);
}, 1000);
```

| Condition | Action |
|-----------|--------|
| timeRemaining > 0 | Décrémente chaque seconde |
| timeRemaining === 0 | Soumission automatique |

---

#  5. startAttempt()

Fonction responsable de démarrer ou reprendre une tentative.

## Étapes internes

| Étape | Action |
|--------|--------|
| 1 | Charger quiz via API |
| 2 | Démarrer ou reprendre tentative |
| 3 | Charger réponses existantes |
| 4 | Initialiser timer (30 min) |

## Appels API

```ts
quizService.getQuizById()
quizService.resumeOrStartQuizAttempt()
```

---

#  6. handleAnswerChange()

Gère la logique selon le type de question.

| Type | Comportement |
|------|-------------|
| SINGLE_CHOICE | Remplace valeur |
| MULTIPLE_CHOICE | Toggle option |
| TRUE_FALSE | Valeur simple |
| OPEN_ENDED | Texte libre |

### Cas Multiple Choice

Les réponses multiples sont envoyées au backend sous forme :

```
Option A;Option C
```

---

#  7. handleSubmit()

Fonction de soumission finale.

## Étapes internes

| Étape | Description |
|--------|------------|
| 1 | Transformer answers en tableau |
| 2 | Adapter format selon type |
| 3 | Appeler submitQuizAttempt |
| 4 | Redirection vers résultats |

## Format envoyé au backend

```ts
[
  { questionId: 1, answerText: "Option A" },
  { questionId: 2, answerText: "Option B;Option D" }
]
```

---

#  8. formatTime()

Convertit secondes → affichage humain

| Input | Output |
|--------|--------|
| 90 | 1m 30s |
| 3700 | 1h 1m 40s |

---

#  9. Rendu UI Dynamique

## Affichage conditionnel

| Condition | Rendu |
|------------|-------|
| loading | Spinner |
| error | Alert danger |
| quiz ok | Formulaire |

---

## Types de Questions

| Type | Composant utilisé |
|------|-------------------|
| SINGLE_CHOICE | Radio buttons |
| MULTIPLE_CHOICE | Checkbox |
| TRUE_FALSE | Boutons toggle |
| OPEN_ENDED | Textarea |

---

#  10. Bloc Progression

Calcul dynamique :

```ts
(Object.keys(answers).length / quiz.questions.length) * 100
```

Affiche :

- Barre de progression
- Badge Répondu / Non répondu
- Nombre total répondu

---

#  11. Sécurité & UX

| Feature | Objectif |
|----------|----------|
| Désactivation bouton si aucune réponse | Empêche soumission vide |
| Timer rouge < 5min | Urgence visuelle |
| Confirmation avant quitter | Prévention perte données |
| Spinner soumission | Feedback utilisateur |

---

#  12. Flux Global d’Exécution

```
User arrive
   ↓
startAttempt()
   ↓
Chargement quiz
   ↓
Affichage questions
   ↓
User répond
   ↓
Timer décrémente
   ↓
handleSubmit()
   ↓
Redirection résultats
```

---

#  Conclusion

Ce composant :

- Centralise toute la logique de passation
- Gère l’état complet du quiz
- Synchronise avec backend
- Implémente gestion temps réelle
- Offre UX complète et sécurisée

Il constitue un élément critique du module Quiz côté Frontend.

```tsx
// src/pages/quizzes/QuizAttemptPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import quizService from '../../services/quizService';
import { QuizResponseDTO, Answer, QuestionType, AttemptStatus } from '../../types/quiz';

const QuizAttemptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<QuizResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id && user) {
      startAttempt();
    }
  }, [id, user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeRemaining !== null && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeRemaining === 0) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const startAttempt = async () => {
    try {
      setLoading(true);
      const quizData = await quizService.getQuizById(parseInt(id!));
      setQuiz(quizData);

      // Commencer ou reprendre une tentative
      const attempt = await quizService.resumeOrStartQuizAttempt(parseInt(user!.id), parseInt(id!));
      setAttemptId(attempt.id);

      // Initialiser les réponses existantes
      const initialAnswers: Record<number, string | string[]> = {};
      attempt.answers.forEach((answer: any) => {
        initialAnswers[answer.questionId] = answer.answerText;
      });
      setAnswers(initialAnswers);

      // Définir un timer si nécessaire (par exemple, 30 minutes)
      setTimeRemaining(30 * 60); // 30 minutes en secondes

    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du démarrage du quiz');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, value: string | string[], type: QuestionType) => {
    setAnswers(prev => {
      if (type === QuestionType.MULTIPLE_CHOICE) {
        const currentAnswers = Array.isArray(prev[questionId]) ? prev[questionId] as string[] : [];
        const newAnswers = Array.isArray(value) ? value : [value];
        
        // Toggle the selected value
        const updatedAnswers = newAnswers[0] === 'toggle' 
          ? currentAnswers.includes(value as string)
            ? currentAnswers.filter(v => v !== value)
            : [...currentAnswers, value as string]
          : newAnswers;

        return { ...prev, [questionId]: updatedAnswers };
      } else {
        return { ...prev, [questionId]: value };
      }
    });
  };

  const handleSubmit = async () => {
    if (!attemptId || !quiz) return;

    try {
      setSubmitting(true);
      setError('');

      // Préparer les réponses pour la soumission
      const answerArray: Array<{ questionId: number; answerText: string }> = [];
      
      Object.entries(answers).forEach(([questionIdStr, answerValue]) => {
        const questionId = parseInt(questionIdStr);
        const question = quiz.questions.find(q => q.id === questionId);
        
        if (question) {
          let answerText = '';
          
          if (question.type === QuestionType.MULTIPLE_CHOICE && Array.isArray(answerValue)) {
            answerText = answerValue.join(';');
          } else {
            answerText = answerValue as string;
          }
          
          answerArray.push({ questionId, answerText });
        }
      });

      // Soumettre la tentative
      const result = await quizService.submitQuizAttempt(quiz.id, attemptId, answerArray);
      
      // Rediriger vers les résultats
      navigate(`/quizzes/attempts/${attemptId}/results`);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission du quiz');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Préparation du quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h5>Erreur</h5>
          <p>{error || 'Quiz non trouvé'}</p>
          <button onClick={() => navigate('/quizzes')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/quizzes">Quiz</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/quizzes/${quiz.id}`}>{quiz.title}</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Passation
          </li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="mb-0">{quiz.title}</h3>
              {timeRemaining !== null && (
                <div className={`badge ${timeRemaining < 300 ? 'bg-danger' : 'bg-warning'}`}>
                  <i className="bi bi-clock me-1"></i>
                  {formatTime(timeRemaining)}
                </div>
              )}
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h5>Description</h5>
                <p>{quiz.description || 'Aucune description'}</p>
              </div>

              <div className="mb-4">
                <h5>Questions ({quiz.questions.length})</h5>
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Répondez à toutes les questions avant de soumettre
                </div>
              </div>

              <form>
                {quiz.questions.map((question, index) => (
                  <div key={question.id} className="card mb-4">
                    <div className="card-header">
                      <h6 className="mb-0">
                        Question {index + 1}
                        <span className={`badge ${quizService.getQuestionTypeBadge(question.type)} ms-2`}>
                          {quizService.getQuestionTypeLabel(question.type)}
                        </span>
                      </h6>
                    </div>
                    <div className="card-body">
                      <p className="card-text mb-3">{question.text}</p>

                      {question.type === QuestionType.SINGLE_CHOICE && question.options.length > 0 && (
                        <div className="list-group">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="list-group-item">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name={`question-${question.id}`}
                                  id={`option-${question.id}-${optIndex}`}
                                  value={option}
                                  checked={answers[question.id] === option}
                                  onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
                                />
                                <label className="form-check-label" htmlFor={`option-${question.id}-${optIndex}`}>
                                  {option}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === QuestionType.MULTIPLE_CHOICE && question.options.length > 0 && (
                        <div className="list-group">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="list-group-item">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  name={`question-${question.id}`}
                                  id={`option-${question.id}-${optIndex}`}
                                  value={option}
                                  checked={Array.isArray(answers[question.id]) && (answers[question.id] as string[]).includes(option)}
                                  onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
                                />
                                <label className="form-check-label" htmlFor={`option-${question.id}-${optIndex}`}>
                                  {option}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === QuestionType.TRUE_FALSE && (
                        <div className="btn-group" role="group">
                          <input
                            type="radio"
                            className="btn-check"
                            name={`question-${question.id}`}
                            id={`true-${question.id}`}
                            value="Vrai"
                            checked={answers[question.id] === 'Vrai'}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
                          />
                          <label className="btn btn-outline-success" htmlFor={`true-${question.id}`}>
                            Vrai
                          </label>

                          <input
                            type="radio"
                            className="btn-check"
                            name={`question-${question.id}`}
                            id={`false-${question.id}`}
                            value="Faux"
                            checked={answers[question.id] === 'Faux'}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
                          />
                          <label className="btn btn-outline-danger" htmlFor={`false-${question.id}`}>
                            Faux
                          </label>
                        </div>
                      )}

                      {question.type === QuestionType.OPEN_ENDED && (
                        <div className="form-group">
                          <textarea
                            className="form-control"
                            rows={4}
                            placeholder="Votre réponse..."
                            value={answers[question.id] as string || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {/* Progression */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-list-check me-2"></i>
                Progression
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Questions répondues</small>
                  <small>{Object.keys(answers).length} / {quiz.questions.length}</small>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${(Object.keys(answers).length / quiz.questions.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>

              <div className="list-group list-group-flush">
                {quiz.questions.map((question, index) => (
                  <a 
                    key={question.id}
                    href={`#question-${index}`} 
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${answers[question.id] ? 'list-group-item-success' : ''}`}
                  >
                    <span>Question {index + 1}</span>
                    <span className={`badge ${answers[question.id] ? 'bg-success' : 'bg-secondary'}`}>
                      {answers[question.id] ? 'Répondu' : 'Non répondu'}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-gear me-2"></i>
                Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button
                  className="btn btn-success"
                  onClick={handleSubmit}
                  disabled={submitting || Object.keys(answers).length === 0}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Soumission en cours...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Soumettre le quiz
                    </>
                  )}
                </button>

                <button
                  className="btn btn-outline-warning"
                  onClick={() => {
                    if (window.confirm('Êtes-vous sûr de vouloir sauvegarder et quitter ? Vous pourrez reprendre plus tard.')) {
                      navigate('/quizzes');
                    }
                  }}
                >
                  <i className="bi bi-save me-2"></i>
                  Sauvegarder et quitter
                </button>

                <Link to={`/quizzes/${quiz.id}`} className="btn btn-outline-secondary">
                  <i className="bi bi-arrow-left me-2"></i>
                  Annuler et retourner
                </Link>
```




## Documentation officielle & références

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Create React App](https://create-react-app.dev/)
- [React Router](https://reactrouter.com/)
- [Axios](https://axios-http.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Bootstrap](https://getbootstrap.com/)


## <h2 style="color:#0d47a1;">Conclusion</h2>

Le frontend `smarthub-frontend` est structuré, clair et prêt pour évoluer : services centralisés, routage protégé, intégration avec RAG/agents via `quizService`. Pour une production robuste, je recommande :

- Passer à un stockage de token plus sécurisé (HttpOnly cookies)
- Ajouter tests unitaires et d'intégration
- Implémenter lazy-loading des pages
- Ajouter un gestionnaire global de notifications (toasts)


# 🎉 Félicitations !  

Vous avez entre les mains une base frontend extrêmement solide, moderne et parfaitement structurée pour le projet **SmartHub**.

## <span style="color:#0d47a1;" align="center"> Conclusion Générale : SmartHub Frontend</span>

Le frontend de SmartHub est bien plus qu'une simple interface ; c'est l'orchestrateur de l'expérience utilisateur. Il a été conçu avec une architecture robuste et évolutive, capable de supporter la complexité d'une plateforme éducative moderne, intégrant des fonctionnalités avancées comme les quiz, la gestion de contenu et l'authentification sécurisée.

### Points clés de l'architecture

- **Centralisation & Sécurité** : La gestion de l'état (`AuthContext`), les appels API (`api.ts`) et la protection des routes (`PrivateRoute`) sont centralisés, garantissant un code maintenable et une sécurité renforcée.
- **Expérience Utilisateur (UX)** : Des composants comme `LoginPage` (avec feedback en temps réel) et `QuizAttemptPage` (avec timer et gestion d'état complexe) montrent une attention particulière portée à l'utilisateur final.
- **Prêt pour l'avenir** : La séparation claire entre les pages, les composants et les services, ainsi que l'intégration prévue avec des agents RAG, permettent au projet d'évoluer sans dettes techniques majeures.
- **Technologies modernes** : Basé sur React 18, TypeScript, et une architecture propre, ce frontend est parfaitement adapté aux défis d'aujourd'hui et de demain.

### En résumé, ce frontend est :

- Le point d'entrée de l'utilisateur dans l'écosystème SmartHub.  
- Le garant de la sécurité côté client grâce à une gestion de token et des routes infaillibles.  
- Le chef d'orchestre des interactions complexes (quiz, navigation).  
- Une base de code propre, facile à comprendre et à étendre pour toute une équipe.

##  Technologies Utilisées

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 18"/> 
  <img src="https://img.shields.io/badge/TypeScript-4.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 4.9"/> 
  <img src="https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white" alt="Bootstrap 5.3"/> 
  <img src="https://img.shields.io/badge/React_Router-6-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="React Router 6"/> 
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Axios-1.6-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios 1.6"/> 
  <img src="https://img.shields.io/badge/React_Hook_Form-7-EC5990?style=for-the-badge&logo=react-hook-form&logoColor=white" alt="React Hook Form 7"/> 
  <img src="https://img.shields.io/badge/Create_React_App-4285F4?style=for-the-badge&logo=createreactapp&logoColor=white" alt="Create React App"/> 
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript ES6+"/>
</p>


## <span style="color:#0d47a1;" align="center">✨ Mot de la Fin</span>

Ce n'est pas une fin, mais un lancement parfait. Avec une base aussi saine, l'équipe de développement peut désormais se concentrer sur l'ajout de fonctionnalités métier sans avoir à revoir les fondations.  

La plateforme est non seulement fonctionnelle, mais elle est aussi prête à passer à l'échelle.

**Bon courage pour la suite du développement de SmartHub !**  
Vous êtes sur la bonne voie pour créer un outil pédagogique exceptionnel. 🎓✨


## <span style="color:#0d47a1;">Démos du projet</span>

Vous pouvez découvrir le projet via plusieurs ressources :

- **Présentation complète avec explications :**  
  [Voir la vidéo YouTube](https://youtu.be/y0RjRl1l7fE?si=ILAPrpO_GC3_NF_3)  
  *Cette vidéo détaille le projet, son fonctionnement et les choix techniques.*

- **Démo de l’application seulement :**  
  [Voir la démonstration sur LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7423897690977042432/?originTrackingId=00wryq7BSwTZmQ6yxPRm6g%3D%3D)  
  *Accès direct à l’application en action, sans explications supplémentaires.*

- **Code source complet sur GitHub :**  
  [Voir le dépôt GitHub](https://github.com/hinimdoumorsia/smart-education-platform)  
  *Vous pouvez cloner ou explorer le projet complet.*

- **Tester l’application en ligne :**  
  [Accéder à l’application](https://smart-education-platform-3qsejixj2.vercel.app)  
  *Essayez directement l’application depuis votre navigateur.*

