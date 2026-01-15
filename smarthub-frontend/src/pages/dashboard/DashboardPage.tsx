import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './DashboardPage.css'; // Nous créerons ce fichier

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    courses: 6,
    projects: 5,
    assignments: 3,
    announcements: 3,
    quizzes: 2,
    deadlines: 1
  });
  const [recentActivities, setRecentActivities] = useState([
    { id: 1, type: 'quiz', title: 'Quiz: Architecture des ordinateurs', date: '2025-12-10', status: 'completed' },
    { id: 2, type: 'assignment', title: 'Devoir: Base de données', date: '2025-12-12', status: 'pending' },
    { id: 3, type: 'announcement', title: 'Nouveau: Séminaire IA', date: '2025-12-11', status: 'new' },
  ]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([
    { id: 1, title: 'Projet Java', course: 'Programmation Avancée', dueDate: '2025-12-20', type: 'project' },
    { id: 2, title: 'Rapport de stage', course: 'Stage Professionnel', dueDate: '2025-12-25', type: 'report' },
  ]);

  useEffect(() => {
    // Ici, vous appellerez votre API pour récupérer les données réelles
    // fetchDashboardData();
  }, []);

  const handleQuickAction = (action: string) => {
    switch(action) {
      case 'new-assignment':
        navigate('/assignments/create');
        break;
      case 'new-announcement':
        navigate('/announcements/create');
        break;
      case 'new-quiz':
        navigate('/quizzes/create');
        break;
      case 'new-course':
        navigate('/courses/create');
        break;
    }
  };

  const renderRoleSpecificDashboard = () => {
    switch(user?.role) {
      case 'STUDENT':
        return (
          <>
            {/* En-tête étudiant */}
            <div className="dashboard-header student-bg">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h1 className="display-5 text-white mb-3">
                    Bienvenue, <span className="fw-bold">{user.firstName || user.username}</span> 👋
                  </h1>
                  <p className="lead text-white mb-0">
                    Voici votre espace d'apprentissage intelligent
                  </p>
                </div>
                <div className="col-md-4 text-end">
                  <div className="card bg-white-20 border-0">
                    <div className="card-body py-2">
                      <p className="mb-0 text-white">
                        <i className="bi bi-calendar-check me-2"></i>
                        Semaine 14 • Trimestre 2
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cartes statistiques */}
            <div className="row mt-4 g-4">
              <div className="col-md-3">
                <div className="card stat-card bg-primary-gradient text-white border-0 shadow">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h2 className="mb-0 fw-bold">{stats.courses}</h2>
                        <p className="mb-0">Cours actifs</p>
                      </div>
                      <i className="bi bi-book display-6 opacity-50"></i>
                    </div>
                    <div className="mt-3">
                      <Link to="/courses" className="text-white text-decoration-none">
                        Voir mes cours <i className="bi bi-arrow-right ms-1"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card stat-card bg-success-gradient text-white border-0 shadow">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h2 className="mb-0 fw-bold">{stats.assignments}</h2>
                        <p className="mb-0">Devoirs en cours</p>
                      </div>
                      <i className="bi bi-clipboard-check display-6 opacity-50"></i>
                    </div>
                    <div className="mt-3">
                      <Link to="/assignments" className="text-white text-decoration-none">
                        Voir les devoirs <i className="bi bi-arrow-right ms-1"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card stat-card bg-warning-gradient text-white border-0 shadow">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h2 className="mb-0 fw-bold">{stats.quizzes}</h2>
                        <p className="mb-0">Quiz à terminer</p>
                      </div>
                      <i className="bi bi-question-circle display-6 opacity-50"></i>
                    </div>
                    <div className="mt-3">
                      <Link to="/quizzes" className="text-white text-decoration-none">
                        Passer un quiz <i className="bi bi-arrow-right ms-1"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card stat-card bg-info-gradient text-white border-0 shadow">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h2 className="mb-0 fw-bold">{stats.deadlines}</h2>
                        <p className="mb-0">Échéances proches</p>
                      </div>
                      <i className="bi bi-clock display-6 opacity-50"></i>
                    </div>
                    <div className="mt-3">
                      <Link to="/deadlines" className="text-white text-decoration-none">
                        Voir calendrier <i className="bi bi-arrow-right ms-1"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section devoirs urgents */}
            <div className="row mt-5">
              <div className="col-lg-8">
                <div className="card shadow border-0">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                      Devoirs à rendre rapidement
                    </h5>
                    <span className="badge bg-warning">{upcomingDeadlines.length} urgent(s)</span>
                  </div>
                  <div className="card-body">
                    {upcomingDeadlines.map(deadline => (
                      <div key={deadline.id} className="deadline-item border-bottom pb-3 mb-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">{deadline.title}</h6>
                            <p className="text-muted mb-1">
                              <i className="bi bi-book me-1"></i>
                              {deadline.course}
                            </p>
                            <span className="badge bg-danger">
                              <i className="bi bi-clock me-1"></i>
                              À rendre avant: {deadline.dueDate}
                            </span>
                          </div>
                          <button className="btn btn-sm btn-primary">
                            <i className="bi bi-upload me-1"></i>
                            Soumettre
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="text-center">
                      <Link to="/assignments" className="btn btn-outline-primary">
                        Voir tous les devoirs
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Activités récentes */}
                <div className="card shadow border-0 mt-4">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">
                      <i className="bi bi-activity me-2"></i>
                      Activités récentes
                    </h5>
                  </div>
                  <div className="card-body">
                    {recentActivities.map(activity => (
                      <div key={activity.id} className="activity-item d-flex align-items-center mb-3">
                        <div className={`activity-icon me-3 ${activity.type}`}>
                          <i className={`bi bi-${
                            activity.type === 'quiz' ? 'question-circle' :
                            activity.type === 'assignment' ? 'clipboard' :
                            'megaphone'
                          }`}></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{activity.title}</h6>
                          <p className="text-muted mb-0 small">
                            <i className="bi bi-calendar me-1"></i>
                            {activity.date}
                          </p>
                        </div>
                        <span className={`badge ${
                          activity.status === 'completed' ? 'bg-success' :
                          activity.status === 'pending' ? 'bg-warning' :
                          'bg-info'
                        }`}>
                          {activity.status === 'completed' ? 'Terminé' :
                           activity.status === 'pending' ? 'En attente' : 'Nouveau'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar - Cours et outils */}
              <div className="col-lg-4">
                <div className="card shadow border-0">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">
                      <i className="bi bi-collection-play me-2"></i>
                      Mes cours
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="list-group list-group-flush">
                      <Link to="/courses/1" className="list-group-item list-group-item-action border-0">
                        <div className="d-flex align-items-center">
                          <div className="course-icon bg-primary rounded-circle me-3">
                            <i className="bi bi-cpu text-white"></i>
                          </div>
                          <div>
                            <h6 className="mb-1">Architecture distribuée</h6>
                            <p className="text-muted small mb-0">Prof. HAJJI</p>
                          </div>
                        </div>
                      </Link>
                      <Link to="/courses/2" className="list-group-item list-group-item-action border-0">
                        <div className="d-flex align-items-center">
                          <div className="course-icon bg-success rounded-circle me-3">
                            <i className="bi bi-database text-white"></i>
                          </div>
                          <div>
                            <h6 className="mb-1">Bases de données</h6>
                            <p className="text-muted small mb-0">Prof. HOSNI</p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Outils rapides */}
                <div className="card shadow border-0 mt-4">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">
                      <i className="bi bi-lightning-charge me-2"></i>
                      Outils rapides
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-2">
                      <div className="col-6">
                        <button className="btn btn-outline-primary w-100 h-100 py-3">
                          <i className="bi bi-calendar-week display-6 d-block mb-2"></i>
                          Calendrier
                        </button>
                      </div>
                      <div className="col-6">
                        <button className="btn btn-outline-success w-100 h-100 py-3">
                          <i className="bi bi-chat-dots display-6 d-block mb-2"></i>
                          Messagerie
                        </button>
                      </div>
                      <div className="col-6">
                        <button className="btn btn-outline-warning w-100 h-100 py-3">
                          <i className="bi bi-graph-up display-6 d-block mb-2"></i>
                          Statistiques
                        </button>
                      </div>
                      <div className="col-6">
                        <button className="btn btn-outline-info w-100 h-100 py-3">
                          <i className="bi bi-cloud-arrow-down display-6 d-block mb-2"></i>
                          Documents
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progression générale */}
                <div className="card shadow border-0 mt-4">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">
                      <i className="bi bi-graph-up-arrow me-2"></i>
                      Progression
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="progress mb-3" style={{ height: '20px' }}>
                      <div 
                        className="progress-bar bg-success" 
                        role="progressbar" 
                        style={{ width: '75%' }}
                      >
                        75% Complet
                      </div>
                    </div>
                    <div className="d-flex justify-content-between small">
                      <span>Cours: 6/8</span>
                      <span>Quiz: 2/5</span>
                      <span>Projets: 3/4</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'TEACHER':
        return (
          <>
            {/* En-tête enseignant */}
            <div className="dashboard-header teacher-bg">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h1 className="display-5 text-white mb-3">
                    Bonjour, Professeur <span className="fw-bold">{user.firstName || user.username}</span> 👨‍🏫
                  </h1>
                  <p className="lead text-white mb-0">
                    Gérez vos cours, devoirs et étudiants
                  </p>
                </div>
                <div className="col-md-4">
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-light"
                      onClick={() => handleQuickAction('new-assignment')}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Nouveau devoir
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions rapides enseignants */}
            <div className="row mt-4 g-4">
              <div className="col-md-3">
                <div className="card quick-action-card border-0 shadow">
                  <div className="card-body text-center">
                    <div className="icon-wrapper bg-primary mb-3">
                      <i className="bi bi-journal-plus text-white"></i>
                    </div>
                    <h5>Créer un cours</h5>
                    <p className="text-muted small">Ajouter un nouveau cours</p>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleQuickAction('new-course')}
                    >
                      Commencer
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card quick-action-card border-0 shadow">
                  <div className="card-body text-center">
                    <div className="icon-wrapper bg-success mb-3">
                      <i className="bi bi-clipboard-plus text-white"></i>
                    </div>
                    <h5>Nouveau devoir</h5>
                    <p className="text-muted small">Assigner un travail</p>
                    <button 
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleQuickAction('new-assignment')}
                    >
                      Créer
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card quick-action-card border-0 shadow">
                  <div className="card-body text-center">
                    <div className="icon-wrapper bg-warning mb-3">
                      <i className="bi bi-question-circle text-white"></i>
                    </div>
                    <h5>Générer un quiz</h5>
                    <p className="text-muted small">Créer avec IA</p>
                    <button 
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => handleQuickAction('new-quiz')}
                    >
                      Générer
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card quick-action-card border-0 shadow">
                  <div className="card-body text-center">
                    <div className="icon-wrapper bg-info mb-3">
                      <i className="bi bi-megaphone text-white"></i>
                    </div>
                    <h5>Annonce</h5>
                    <p className="text-muted small">Publier une info</p>
                    <button 
                      className="btn btn-sm btn-outline-info"
                      onClick={() => handleQuickAction('new-announcement')}
                    >
                      Publier
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistiques enseignants */}
            <div className="row mt-4">
              <div className="col-md-8">
                <div className="card shadow border-0">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Devoirs à corriger</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Devoir</th>
                            <th>Cours</th>
                            <th>Soumissions</th>
                            <th>Échéance</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Projet Spring Boot</td>
                            <td>Java Avancé</td>
                            <td><span className="badge bg-warning">15/25</span></td>
                            <td>2025-12-20</td>
                            <td>
                              <button className="btn btn-sm btn-primary">
                                <i className="bi bi-eye"></i>
                              </button>
                            </td>
                          </tr>
                          <tr>
                            <td>Rapport de base de données</td>
                            <td>Bases de données</td>
                            <td><span className="badge bg-success">22/22</span></td>
                            <td>2025-12-18</td>
                            <td>
                              <button className="btn btn-sm btn-success">
                                <i className="bi bi-check-circle"></i>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card shadow border-0">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Mes cours</h5>
                  </div>
                  <div className="card-body">
                    <div className="list-group list-group-flush">
                      <Link to="/my-courses" className="list-group-item list-group-item-action border-0">
                        <i className="bi bi-book me-2"></i>
                        Java Avancé (5 étudiants)
                      </Link>
                      <Link to="/my-courses" className="list-group-item list-group-item-action border-0">
                        <i className="bi bi-database me-2"></i>
                        Bases de données (2 étudiants)
                      </Link>
                      <Link to="/my-courses" className="list-group-item list-group-item-action border-0">
                        <i className="bi bi-cpu me-2"></i>
                        Architecture (3 étudiants)
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'ADMIN':
        return (
          <>
            {/* En-tête admin */}
            <div className="dashboard-header admin-bg">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h1 className="display-5 text-white mb-3">
                    Tableau de bord Administrateur
                  </h1>
                  <p className="lead text-white mb-0">
                    Gestion complète de la plateforme
                  </p>
                </div>
                <div className="col-md-4 text-end">
                  <div className="admin-badge">
                    <i className="bi bi-shield-lock display-4"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistiques admin */}
            <div className="row mt-4 g-4">
              <div className="col-md-3">
                <div className="card stat-card bg-danger-gradient text-white">
                  <div className="card-body">
                    <h2 className="display-4 fw-bold">10</h2>
                    <p className="mb-0">Utilisateurs</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card stat-card bg-primary-gradient text-white">
                  <div className="card-body">
                    <h2 className="display-4 fw-bold">6</h2>
                    <p className="mb-0">Cours actifs</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card stat-card bg-success-gradient text-white">
                  <div className="card-body">
                    <h2 className="display-4 fw-bold">8</h2>
                    <p className="mb-0">Projets</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card stat-card bg-warning-gradient text-white">
                  <div className="card-body">
                    <h2 className="display-4 fw-bold">1</h2>
                    <p className="mb-0">Quiz complétés</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gestion admin */}
            <div className="row mt-4">
              <div className="col-md-6">
                <div className="card shadow border-0">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Gestion rapide</h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-6">
                        <Link to="/admin/users" className="card admin-action-card text-decoration-none">
                          <div className="card-body text-center">
                            <i className="bi bi-people display-4 text-primary"></i>
                            <h6 className="mt-2">Utilisateurs</h6>
                          </div>
                        </Link>
                      </div>
                      <div className="col-6">
                        <Link to="/courses" className="card admin-action-card text-decoration-none">
                          <div className="card-body text-center">
                            <i className="bi bi-book display-4 text-success"></i>
                            <h6 className="mt-2">Cours</h6>
                          </div>
                        </Link>
                      </div>
                      <div className="col-6">
                        <Link to="/projects" className="card admin-action-card text-decoration-none">
                          <div className="card-body text-center">
                            <i className="bi bi-folder display-4 text-warning"></i>
                            <h6 className="mt-2">Projets</h6>
                          </div>
                        </Link>
                      </div>
                      <div className="col-6">
                        <Link to="/quizzes" className="card admin-action-card text-decoration-none">
                          <div className="card-body text-center">
                            <i className="bi bi-question-circle display-4 text-info"></i>
                            <h6 className="mt-2">Quiz</h6>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card shadow border-0">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Activité récente</h5>
                  </div>
                  <div className="card-body">
                    <div className="activity-feed">
                      <div className="activity-item">
                        <div className="activity-dot bg-success"></div>
                        <div className="activity-content">
                          <p className="mb-1">Nouvel utilisateur inscrit</p>
                          <small className="text-muted">Il y a 5 minutes</small>
                        </div>
                      </div>
                      <div className="activity-item">
                        <div className="activity-dot bg-primary"></div>
                        <div className="activity-content">
                          <p className="mb-1">Nouveau cours créé</p>
                          <small className="text-muted">Il y a 2 heures</small>
                        </div>
                      </div>
                      <div className="activity-item">
                        <div className="activity-dot bg-warning"></div>
                        <div className="activity-content">
                          <p className="mb-1">Quiz généré avec IA</p>
                          <small className="text-muted">Il y a 1 jour</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      default:
        return (
          <div className="text-center py-5">
            <h3>Chargement du tableau de bord...</h3>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      {/* Navigation */}
      <div className="dashboard-nav">
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
          <div className="container-fluid">
            <span className="navbar-brand">
              <i className="bi bi-speedometer2 me-2"></i>
              Tableau de bord
            </span>
            <button className="btn btn-outline-danger btn-sm" onClick={logout}>
              <i className="bi bi-box-arrow-right me-1"></i>
              Déconnexion
            </button>
          </div>
        </nav>
      </div>

      {/* Contenu principal */}
      <div className="dashboard-content">
        {renderRoleSpecificDashboard()}
      </div>

      {/* Footer du dashboard */}
      <div className="dashboard-footer mt-5 pt-4 border-top">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h6>IATD SmartHub</h6>
              <p className="text-muted small">
                Plateforme d'apprentissage intelligente
              </p>
            </div>
            <div className="col-md-6 text-end">
              <div className="btn-group">
                <button className="btn btn-outline-secondary btn-sm">
                  <i className="bi bi-question-circle"></i>
                </button>
                <button className="btn btn-outline-secondary btn-sm">
                  <i className="bi bi-gear"></i>
                </button>
                <button className="btn btn-outline-secondary btn-sm">
                  <i className="bi bi-bell"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;