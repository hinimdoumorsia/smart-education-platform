import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import statsService from '../../services/statsService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Définir une interface complète pour les statistiques
interface AdminStats {
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

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    users: 0,
    courses: 0,
    projects: 0,
    announcements: 0,
    internships: 0,
    resources: 0,
    quizzes: 0,
    quizAttempts: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await statsService.getAdminStats();
      setStats(data);
      setRecentActivities(data.recentActivities || []);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Accès réservé aux administrateurs</h4>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Tableau de bord Administrateur</h1>
        <button className="btn btn-outline-primary" onClick={loadStats}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Rafraîchir
        </button>
      </div>
      
      {/* Cartes statistiques cliquables */}
      <div className="row">
        <StatCard 
          title="Utilisateurs" 
          value={stats.users} 
          icon="bi-people"
          color="primary"
          link="/admin/users"
          linkText="Gérer les utilisateurs"
        />
        
        <StatCard 
          title="Cours" 
          value={stats.courses} 
          icon="bi-book"
          color="success"
          link="/courses"
          linkText="Voir tous les cours"
        />
        
        <StatCard 
          title="Projets" 
          value={stats.projects} 
          icon="bi-folder"
          color="info"
          link="/projects"
          linkText="Voir les projets"
        />
        
        <StatCard 
          title="Quiz" 
          value={stats.quizzes} 
          icon="bi-question-circle"
          color="warning"
          link="/quizzes"
          linkText="Gérer les quiz"
        />
      </div>

      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Activités récentes</h5>
              <span className="badge bg-primary">{recentActivities.length}</span>
            </div>
            <div className="card-body">
              {recentActivities.length > 0 ? (
                <div className="list-group list-group-flush">
                  {recentActivities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="list-group-item">
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{activity.title}</h6>
                        <small className="text-muted">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </small>
                      </div>
                      <p className="mb-1">{activity.description}</p>
                      <small className="text-muted">Par {activity.user}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-3">Aucune activité récente</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Actions rapides</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link to="/admin/users" className="btn btn-outline-primary text-start">
                  <i className="bi bi-person-plus me-2"></i>
                  Ajouter un nouvel utilisateur
                </Link>
                <Link to="/courses/create" className="btn btn-outline-success text-start">
                  <i className="bi bi-plus-circle me-2"></i>
                  Créer un nouveau cours
                </Link>
                <Link to="/announcements/create" className="btn btn-outline-info text-start">
                  <i className="bi bi-megaphone me-2"></i>
                  Publier une annonce
                </Link>
                <Link to="/quizzes/create" className="btn btn-outline-warning text-start">
                  <i className="bi bi-question-circle me-2"></i>
                  Créer un quiz
                </Link>
                <Link to="/projects/create" className="btn btn-outline-secondary text-start">
                  <i className="bi bi-folder-plus me-2"></i>
                  Créer un projet
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-12">
          <div className="card shadow">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">
                <i className="bi bi-bar-chart me-2"></i>
                Statistiques détaillées
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <div className="card border-0 shadow-sm" style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  }}>
                    <div className="card-body text-white text-center">
                      <i className="bi bi-person-check fs-1 mb-3"></i>
                      <h6 className="card-title">Utilisateurs actifs</h6>
                      <h3 className="mb-0">{stats.activeUsers}</h3>
                      <small>sur {stats.users} total</small>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3 mb-3">
                  <div className="card border-0 shadow-sm" style={{ 
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
                  }}>
                    <div className="card-body text-white text-center">
                      <i className="bi bi-clipboard-check fs-1 mb-3"></i>
                      <h6 className="card-title">Tentatives de quiz</h6>
                      <h3 className="mb-0">{stats.quizAttempts}</h3>
                      <small>quiz complétés</small>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3 mb-3">
                  <div className="card border-0 shadow-sm" style={{ 
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' 
                  }}>
                    <div className="card-body text-white text-center">
                      <i className="bi bi-briefcase fs-1 mb-3"></i>
                      <h6 className="card-title">Stages</h6>
                      <h3 className="mb-0">{stats.internships}</h3>
                      <small>enregistrés</small>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3 mb-3">
                  <div className="card border-0 shadow-sm" style={{ 
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' 
                  }}>
                    <div className="card-body text-white text-center">
                      <i className="bi bi-journal-text fs-1 mb-3"></i>
                      <h6 className="card-title">Ressources</h6>
                      <h3 className="mb-0">{stats.resources}</h3>
                      <small>de recherche</small>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Section distribution par rôle - Si disponible */}
              {(stats.teachers !== undefined || stats.students !== undefined) && (
                <div className="row mt-4">
                  <div className="col-md-12">
                    <div className="card">
                      <div className="card-header bg-info text-white">
                        <h6 className="mb-0">Distribution par rôle</h6>
                      </div>
                      <div className="card-body">
                        <div className="d-flex justify-content-around text-center">
                          <div>
                            <div className="badge bg-danger p-2 fs-5">{stats.teachers || 0}</div>
                            <div className="mt-2">Enseignants</div>
                          </div>
                          <div>
                            <div className="badge bg-primary p-2 fs-5">{stats.students || 0}</div>
                            <div className="mt-2">Étudiants</div>
                          </div>
                          <div>
                            <div className="badge bg-warning p-2 fs-5">{stats.admins || 0}</div>
                            <div className="mt-2">Administrateurs</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Section activité récente - Si disponible */}
              {(stats.newUsers7d !== undefined || stats.quizAttempts7d !== undefined) && (
                <div className="row mt-4">
                  <div className="col-md-12">
                    <div className="card">
                      <div className="card-header bg-success text-white">
                        <h6 className="mb-0">Activité récente (7 jours)</h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-4">
                            <div className="d-flex justify-content-between">
                              <span>Nouvelles inscriptions</span>
                              <span className="badge bg-success">{stats.newUsers7d || 0}</span>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="d-flex justify-content-between">
                              <span>Quiz complétés</span>
                              <span className="badge bg-warning">{stats.quizAttempts7d || 0}</span>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="d-flex justify-content-between">
                              <span>Projets créés</span>
                              <span className="badge bg-info">{stats.newProjects7d || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour les cartes statistiques
interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  link: string;
  linkText: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, link, linkText }) => {
  return (
    <div className="col-md-3 mb-4">
      <div className={`card bg-${color} text-white`}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h5 className="card-title">{title}</h5>
              <h2 className="mb-0">{value}</h2>
            </div>
            <i className={`bi ${icon} fs-1 opacity-50`}></i>
          </div>
          <div className="mt-3">
            <Link to={link} className="btn btn-light btn-sm w-100">
              {linkText}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;