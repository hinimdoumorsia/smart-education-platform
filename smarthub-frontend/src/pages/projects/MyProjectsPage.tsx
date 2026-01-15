import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import projectService, { Project, ProjectStatus } from '../../services/projectService';

const MyProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const fetchMyProjects = async () => {
    try {
      setLoading(true);
      let data: Project[];
      
      if (user?.role === 'STUDENT') {
        data = await projectService.getMyStudentProjects();
      } else {
        data = await projectService.getMyProjects();
      }
      
      setProjects(data);
    } catch (err: any) {
      setError('Erreur lors du chargement de vos projets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-4">
        {user?.role === 'STUDENT' ? 'Mes projets étudiants' : 'Mes projets encadrés'}
      </h1>

      {error && (
        <div className="alert alert-danger mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          {user?.role === 'STUDENT'
            ? "Vous n'êtes inscrit à aucun projet pour le moment."
            : "Vous n'encadrez aucun projet pour le moment."}
          
          {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
            <button 
              className="btn btn-link text-decoration-none p-0 ms-2"
              onClick={() => navigate('/projects/create')}
              style={{ background: 'none', border: 'none' }}
            >
              Créez votre premier projet
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Statistiques */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card text-white bg-primary">
                <div className="card-body">
                  <h5 className="card-title">Total</h5>
                  <p className="card-text display-6">{projects.length}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-white bg-success">
                <div className="card-body">
                  <h5 className="card-title">En cours</h5>
                  <p className="card-text display-6">
                    {projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-white bg-warning">
                <div className="card-body">
                  <h5 className="card-title">Planifiés</h5>
                  <p className="card-text display-6">
                    {projects.filter(p => p.status === ProjectStatus.PLANNED).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-white bg-info">
                <div className="card-body">
                  <h5 className="card-title">Terminés</h5>
                  <p className="card-text display-6">
                    {projects.filter(p => p.status === ProjectStatus.COMPLETED).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des projets */}
          <div className="row">
            {projects.map((project) => (
              <div className="col-md-6 mb-4" key={project.id}>
                <div className="card h-100 shadow">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="card-title mb-0">{project.title}</h5>
                      <span className={`badge bg-${projectService.getStatusColor(project.status)}`}>
                        {projectService.getStatusLabel(project.status)}
                      </span>
                    </div>

                    <p className="card-text text-muted small mb-3">
                      {project.description && project.description.length > 100
                        ? `${project.description.substring(0, 100)}...`
                        : project.description || 'Pas de description'}
                    </p>

                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-calendar3 me-2 text-secondary"></i>
                        <small className="text-muted">
                          {projectService.formatDate(project.startDate)} - {projectService.formatDate(project.endDate)}
                        </small>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-person-badge me-2 text-primary"></i>
                        <small className="text-muted">
                          {user?.role === 'STUDENT' ? 'Superviseur' : 'Votre rôle'}:{' '}
                          {user?.role === 'STUDENT'
                            ? `${project.supervisor.firstName} ${project.supervisor.lastName}`
                            : 'Superviseur'}
                        </small>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-people me-2 text-success"></i>
                        <small className="text-muted">
                          {project.students.length} étudiant(s)
                        </small>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="mb-3">
                      <div className="progress" style={{ height: '8px' }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${projectService.calculateProgress(project.startDate, project.endDate)}%`
                          }}
                        ></div>
                      </div>
                      <small className="text-muted">
                        {projectService.calculateProgress(project.startDate, project.endDate)}% du temps écoulé
                      </small>
                    </div>

                    <div className="d-flex justify-content-between">
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="btn btn-outline-primary btn-sm"
                      >
                        <i className="bi bi-eye me-1"></i>
                        Détails
                      </button>

                      {user?.role !== 'STUDENT' && (
                        <div className="btn-group" role="group">
                          <button
                            onClick={() => navigate(`/projects/${project.id}/edit`)}
                            className="btn btn-outline-warning btn-sm"
                            title="Modifier"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            onClick={() => navigate(`/projects/${project.id}#students`)}
                            className="btn btn-outline-info btn-sm"
                            title="Gérer les étudiants"
                          >
                            <i className="bi bi-people"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MyProjectsPage;