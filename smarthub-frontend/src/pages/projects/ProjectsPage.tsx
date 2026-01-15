// src/pages/projects/ProjectsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import projectService, { Project, ProjectStatus, ProjectRequest, ProjectUser } from '../../services/projectService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAll();
      setProjects(data);
    } catch (err: any) {
      setError('Erreur lors du chargement des projets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchProjects();
      return;
    }

    try {
      setLoading(true);
      const data = await projectService.search(searchQuery);
      setProjects(data);
    } catch (err: any) {
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = async (status: ProjectStatus | 'ALL') => {
    setStatusFilter(status);
    
    try {
      setLoading(true);
      let data: Project[];
      
      if (status === 'ALL') {
        data = await projectService.getAll();
      } else {
        data = await projectService.getByStatus(status);
      }
      
      setProjects(data);
    } catch (err: any) {
      setError('Erreur lors du filtrage');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      return;
    }

    try {
      await projectService.delete(id);
      setProjects(projects.filter(project => project.id !== id));
    } catch (err: any) {
      setError('Erreur lors de la suppression');
    }
  };

  if (loading) return <LoadingSpinner message="Chargement des projets..." />;

  return (
    <div className="container mt-4">
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Projets</h1>
        {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <Link to="/projects/create" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            Nouveau projet
          </Link>
        )}
      </div>

      {/* Messages d'erreur/succès */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-8">
              <form onSubmit={handleSearch}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher un projet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="btn btn-outline-primary" type="submit">
                    <i className="bi bi-search"></i> Rechercher
                  </button>
                </div>
              </form>
            </div>
            <div className="col-md-4">
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleStatusFilter('ALL')}
                >
                  Tous
                </button>
                {Object.values(ProjectStatus).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleStatusFilter(status)}
                  >
                    {projectService.getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Boutons d'actions */}
      <div className="mb-4">
        <div className="btn-group" role="group">
          <button
            className="btn btn-outline-secondary"
            onClick={fetchProjects}
            title="Rafraîchir"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
          <Link to="/projects/active" className="btn btn-outline-success">
            Projets actifs
          </Link>
          <Link to="/my-projects" className="btn btn-outline-info">
            Mes projets
          </Link>
        </div>
      </div>

      {/* Liste des projets */}
      {projects.length === 0 ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          Aucun projet trouvé.
          {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
            <Link to="/projects/create" className="ms-2">
              Créez votre premier projet
            </Link>
          )}
        </div>
      ) : (
        <div className="row">
          {projects.map((project) => (
            <div className="col-md-6 col-lg-4 mb-4" key={project.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  {/* En-tête du projet */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0">{project.title}</h5>
                    <span className={`badge bg-${projectService.getStatusColor(project.status)}`}>
                      {projectService.getStatusLabel(project.status)}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="card-text text-muted small mb-3">
                    {project.description && project.description.length > 100
                      ? `${project.description.substring(0, 100)}...`
                      : project.description || 'Pas de description'}
                  </p>

                  {/* Informations */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-person-badge me-2 text-primary"></i>
                      <small className="text-muted">
                        {project.supervisor.firstName} {project.supervisor.lastName}
                      </small>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-calendar3 me-2 text-secondary"></i>
                      <small className="text-muted">
                        {projectService.formatDate(project.startDate)} - {projectService.formatDate(project.endDate)}
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
                    <div className="progress" style={{ height: '6px' }}>
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

                  {/* Actions */}
                  <div className="d-flex justify-content-between">
                    <Link
                      to={`/projects/${project.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="bi bi-eye me-1"></i>
                      Détails
                    </Link>

                    {/* Actions pour superviseur/admin */}
                    {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                      <div className="btn-group" role="group">
                        <button
                          onClick={() => navigate(`/projects/${project.id}/edit`)}
                          className="btn btn-outline-warning btn-sm"
                          title="Modifier"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="btn btn-outline-danger btn-sm"
                          title="Supprimer"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;