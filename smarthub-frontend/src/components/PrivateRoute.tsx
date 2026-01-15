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