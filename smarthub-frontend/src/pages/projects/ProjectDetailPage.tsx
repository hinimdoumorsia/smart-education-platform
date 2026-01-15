import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import projectService, { Project, ProjectStatus, UserBasic } from '../../services/projectService';
import userService from '../../services/userService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<UserBasic[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchProject(parseInt(id));
    }
  }, [id]);

  const fetchProject = async (projectId: number) => {
    try {
      setLoading(true);
      const data = await projectService.getById(projectId);
      setProject(data);
    } catch (err: any) {
      setError('Erreur lors du chargement du projet');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      setModalLoading(true);
      const students = await userService.getAllStudents();
      
      // Convertir et filtrer les étudiants
      const projectStudentIds = project?.students.map(s => s.id) || [];
      const userBasics: UserBasic[] = students
        .filter(student => {
          const studentId = parseInt(student.id);
          return !projectStudentIds.includes(studentId);
        })
        .map(student => ({
          id: parseInt(student.id),
          username: student.username,
          email: student.email,
          firstName: student.firstName,
          lastName: student.lastName,
          role: student.role
        }));
      
      setAvailableStudents(userBasics);
    } catch (err) {
      console.error('Erreur lors du chargement des étudiants:', err);
      setAvailableStudents([]);
    } finally {
      setModalLoading(false);
    }
  };

  const openAddStudentModal = async () => {
    setSelectedStudentIds([]);
    await fetchAvailableStudents();
    setShowAddStudentModal(true);
  };

  const handleAddStudents = async () => {
    if (!project || selectedStudentIds.length === 0) return;

    try {
      setModalLoading(true);
      await projectService.addStudents(project.id, selectedStudentIds);
      setShowAddStudentModal(false);
      setSelectedStudentIds([]);
      // Rafraîchir les données du projet
      fetchProject(project.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout des étudiants');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      return;
    }

    try {
      await projectService.delete(project.id);
      navigate('/projects');
    } catch (err: any) {
      setError('Erreur lors de la suppression');
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!project || !window.confirm('Retirer cet étudiant du projet ?')) {
      return;
    }

    try {
      await projectService.removeStudent(project.id, studentId);
      // Rafraîchir les données du projet
      fetchProject(project.id);
    } catch (err: any) {
      setError('Erreur lors du retrait de l\'étudiant');
    }
  };

  if (loading) return <LoadingSpinner message="Chargement du projet..." />;
  if (!project) return <div className="alert alert-danger">Projet non trouvé</div>;

  const progress = projectService.calculateProgress(project.startDate, project.endDate);
  const isSupervisor = user?.id === project.supervisor.id.toString();
  const canEdit = isSupervisor || user?.role === 'ADMIN';

  return (
    <div className="container mt-4">
      {/* Navigation */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <button 
              className="btn btn-link text-decoration-none p-0" 
              onClick={() => navigate('/projects')}
              style={{ background: 'none', border: 'none' }}
            >
              Projets
            </button>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {project.title}
          </li>
        </ol>
      </nav>

      {error && (
        <div className="alert alert-danger mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* En-tête avec actions */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div className="flex-grow-1">
          <h1 className="mb-2">{project.title}</h1>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <span className={`badge bg-${projectService.getStatusColor(project.status)}`}>
              {projectService.getStatusLabel(project.status)}
            </span>
            <span className="text-muted">
              <i className="bi bi-calendar3 me-1"></i>
              {projectService.formatDate(project.startDate)} - {projectService.formatDate(project.endDate)}
            </span>
            <span className="text-muted">
              <i className="bi bi-people me-1"></i>
              {project.students.length} étudiant(s)
            </span>
          </div>
        </div>
        
        {canEdit && (
          <div className="btn-group">
            <button
              className="btn btn-outline-warning"
              onClick={() => navigate(`/projects/${project.id}/edit`)}
            >
              <i className="bi bi-pencil me-2"></i>
              Modifier
            </button>
            <button
              className="btn btn-outline-danger"
              onClick={handleDelete}
            >
              <i className="bi bi-trash me-2"></i>
              Supprimer
            </button>
          </div>
        )}
      </div>

      <div className="row">
        {/* Colonne principale */}
        <div className="col-lg-8">
          {/* Description */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-card-text me-2"></i>
                Description
              </h5>
            </div>
            <div className="card-body">
              {project.description ? (
                <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>
                  {project.description}
                </p>
              ) : (
                <p className="text-muted fst-italic">Aucune description fournie</p>
              )}
            </div>
          </div>

          {/* Équipe */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-people me-2"></i>
                Équipe du projet
              </h5>
            </div>
            <div className="card-body">
              {/* Superviseur */}
              <div className="mb-4">
                <h6>Superviseur</h6>
                <div className="d-flex align-items-center p-3 border rounded">
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" 
                       style={{ width: '50px', height: '50px' }}>
                    <i className="bi bi-person-fill" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div className="ms-3">
                    <strong>{project.supervisor.firstName} {project.supervisor.lastName}</strong>
                    <div className="text-muted">{project.supervisor.email}</div>
                    <small className="text-muted">{project.supervisor.role}</small>
                  </div>
                  <span className="badge bg-info ms-auto">Superviseur</span>
                </div>
              </div>

              {/* Étudiants */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Étudiants ({project.students.length})</h6>
                  {canEdit && (
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={openAddStudentModal}
                        disabled={modalLoading}
                      >
                        {modalLoading ? (
                          <span className="spinner-border spinner-border-sm me-1"></span>
                        ) : (
                          <i className="bi bi-plus-circle me-1"></i>
                        )}
                        Ajouter des étudiants
                      </button>
                    </div>
                  )}
                </div>
                
                {project.students.length > 0 ? (
                  <div className="row">
                    {project.students.map((student) => (
                      <div key={student.id} className="col-md-6 mb-3">
                        <div className="d-flex align-items-center p-3 border rounded">
                          <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" 
                               style={{ width: '40px', height: '40px' }}>
                            <i className="bi bi-person-fill"></i>
                          </div>
                          <div className="ms-3 flex-grow-1">
                            <strong>{student.firstName} {student.lastName}</strong>
                            <div className="text-muted small">{student.email}</div>
                            <small className="text-muted">{student.role}</small>
                          </div>
                          {canEdit && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveStudent(student.id)}
                              title="Retirer du projet"
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Aucun étudiant n'est assigné à ce projet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="col-lg-4">
          {/* Progression */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Progression
              </h5>
            </div>
            <div className="card-body">
              <div className="text-center mb-3">
                <div className="display-4">{progress}%</div>
                <div className="text-muted">du temps écoulé</div>
              </div>
              
              <div className="progress mb-3" style={{ height: '20px' }}>
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: progress < 30 ? '#0d6efd' : 
                                   progress < 70 ? '#fd7e14' : '#198754'
                  }}
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {progress >= 20 ? `${progress}%` : ''}
                </div>
              </div>
              
              <div className="row text-center">
                <div className="col-6">
                  <div className="text-muted small">Début</div>
                  <div className="fw-bold">{projectService.formatDate(project.startDate)}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted small">Fin</div>
                  <div className="fw-bold">{projectService.formatDate(project.endDate)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations générales */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Informations
              </h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>ID</span>
                  <span className="text-muted">{project.id}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Statut</span>
                  <span className={`badge bg-${projectService.getStatusColor(project.status)}`}>
                    {projectService.getStatusLabel(project.status)}
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Durée</span>
                  <span>
                    {Math.ceil(
                      (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / 
                      (1000 * 60 * 60 * 24)
                    )} jours
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Créé le</span>
                  <span>{project.createdAt ? new Date(project.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span>Mis à jour</span>
                  <span>{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('fr-FR') : 'N/A'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-lightning-charge me-2"></i>
                Actions rapides
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {canEdit && (
                  <>
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => navigate(`/projects/${project.id}/edit`)}
                    >
                      <i className="bi bi-pencil me-2"></i>
                      Modifier le projet
                    </button>
                    <button
                      className="btn btn-outline-primary"
                      onClick={openAddStudentModal}
                      disabled={modalLoading}
                    >
                      <i className="bi bi-people me-2"></i>
                      Gérer les étudiants
                    </button>
                  </>
                )}
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => navigate('/projects')}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Retour à la liste
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'ajout d'étudiants */}
      {showAddStudentModal && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
          role="dialog"
        >
          <div 
            className="modal-dialog modal-lg modal-dialog-centered"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2"></i>
                  Ajouter des étudiants au projet
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddStudentModal(false)}
                  disabled={modalLoading}
                ></button>
              </div>
              <div className="modal-body">
                {modalLoading ? (
                  <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Chargement...</span>
                    </div>
                    <p className="mt-3 text-muted">Chargement des étudiants disponibles...</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Sélectionnez les étudiants à ajouter :</label>
                      <div className="input-group mb-3">
                        <span className="input-group-text">
                          <i className="bi bi-search"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Rechercher un étudiant..."
                          onChange={(e) => {
                            const searchTerm = e.target.value.toLowerCase();
                            if (availableStudents.length > 0) {
                              const filtered = availableStudents.filter(student =>
                                student.firstName?.toLowerCase().includes(searchTerm) ||
                                student.lastName?.toLowerCase().includes(searchTerm) ||
                                student.username.toLowerCase().includes(searchTerm) ||
                                student.email.toLowerCase().includes(searchTerm)
                              );
                              setAvailableStudents(filtered);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <div 
                        className="list-group border" 
                        style={{ maxHeight: '300px', overflowY: 'auto' }}
                      >
                        {availableStudents.length === 0 ? (
                          <div className="text-center p-4 text-muted">
                            <i className="bi bi-people display-6 d-block mb-2"></i>
                            {project?.students.length === 0 
                              ? "Aucun étudiant disponible" 
                              : "Tous les étudiants sont déjà dans ce projet"}
                          </div>
                        ) : (
                          availableStudents.map((student) => (
                            <div 
                              key={student.id} 
                              className={`list-group-item list-group-item-action ${selectedStudentIds.includes(student.id) ? 'active' : ''}`}
                              onClick={() => {
                                if (selectedStudentIds.includes(student.id)) {
                                  setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                                } else {
                                  setSelectedStudentIds([...selectedStudentIds, student.id]);
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                  <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3" 
                                       style={{ width: '35px', height: '35px' }}>
                                    <i className="bi bi-person"></i>
                                  </div>
                                  <div>
                                    <strong>{student.firstName} {student.lastName}</strong>
                                    <div className="small text-muted">
                                      {student.username} • {student.email}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <i className={`bi ${selectedStudentIds.includes(student.id) ? 'bi-check-circle-fill text-white' : 'bi-circle'}`}></i>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {selectedStudentIds.length > 0 && (
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>{selectedStudentIds.length} étudiant(s)</strong> sélectionné(s)
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddStudentModal(false)}
                  disabled={modalLoading}
                >
                  Annuler
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleAddStudents}
                  disabled={modalLoading || selectedStudentIds.length === 0}
                >
                  {modalLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Ajout en cours...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle me-2"></i>
                      Ajouter ({selectedStudentIds.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;