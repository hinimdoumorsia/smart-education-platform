// src/pages/projects/ProjectEditPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import projectService, { Project, ProjectStatus, ProjectRequest, ProjectUser } from '../../services/projectService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface FormData extends Omit<ProjectRequest, 'studentIds'> {
  studentIds: string[];
}

const ProjectEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>();
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
      
      // Pré-remplir le formulaire
      reset({
        title: data.title,
        description: data.description || '',
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        studentIds: data.students.map(s => s.id.toString())
      });
    } catch (err: any) {
      setError('Erreur lors du chargement du projet');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!project) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Vérifier les dates
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      if (endDate <= startDate) {
        setError('La date de fin doit être postérieure à la date de début');
        setSaving(false);
        return;
      }

      // Préparer les données
      const projectData: Partial<ProjectRequest> = {
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        studentIds: data.studentIds.map(id => parseInt(id))
      };

      // Mettre à jour le projet
      const updatedProject = await projectService.update(project.id, projectData);
      setProject(updatedProject);
      
      setSuccess('Projet mis à jour avec succès !');
      setTimeout(() => {
        navigate(`/projects/${project.id}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour:', err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du projet');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/projects/${id}`);
  };

  if (loading) return <LoadingSpinner message="Chargement du projet..." />;
  if (!project) return <div className="alert alert-danger">Projet non trouvé</div>;

  // Vérifier les permissions
  const isSupervisor = user?.id === project.supervisor.id.toString();
  const canEdit = isSupervisor || user?.role === 'ADMIN';
  
  if (!canEdit) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Accès refusé</h4>
          <p>Vous n'avez pas les permissions nécessaires pour modifier ce projet.</p>
          <button className="btn btn-primary" onClick={() => navigate(`/projects/${id}`)}>
            Retour au projet
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
            <a href="/projects">Projets</a>
          </li>
          <li className="breadcrumb-item">
            <a href={`/projects/${project.id}`}>{project.title}</a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Modifier
          </li>
        </ol>
      </nav>

      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-warning text-white">
              <h2 className="mb-0">
                <i className="bi bi-pencil-square me-2"></i>
                Modifier le projet
              </h2>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" role="alert">
                  <i className="bi bi-check-circle me-2"></i>
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">
                    Titre du projet *
                  </label>
                  <input
                    type="text"
                    id="title"
                    className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                    {...register('title', {
                      required: 'Le titre est obligatoire',
                      minLength: {
                        value: 3,
                        message: 'Le titre doit contenir au moins 3 caractères'
                      },
                      maxLength: {
                        value: 255,
                        message: 'Le titre ne peut pas dépasser 255 caractères'
                      }
                    })}
                  />
                  {errors.title && (
                    <div className="invalid-feedback">
                      {errors.title.message as string}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                    rows={5}
                    {...register('description', {
                      maxLength: {
                        value: 1000,
                        message: 'La description ne peut pas dépasser 1000 caractères'
                      }
                    })}
                  />
                  {errors.description && (
                    <div className="invalid-feedback">
                      {errors.description.message}
                    </div>
                  )}
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="startDate" className="form-label">
                      Date de début *
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
                      {...register('startDate', {
                        required: 'La date de début est obligatoire'
                      })}
                    />
                    {errors.startDate && (
                      <div className="invalid-feedback">
                        {errors.startDate.message}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="endDate" className="form-label">
                      Date de fin *
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      className={`form-control ${errors.endDate ? 'is-invalid' : ''}`}
                      {...register('endDate', {
                        required: 'La date de fin est obligatoire'
                      })}
                    />
                    {errors.endDate && (
                      <div className="invalid-feedback">
                        {errors.endDate.message}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="status" className="form-label">
                    Statut
                  </label>
                  <select
                    id="status"
                    className="form-control"
                    {...register('status')}
                  >
                    {Object.values(ProjectStatus).map((status) => (
                      <option key={status} value={status}>
                        {projectService.getStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Information superviseur */}
                <div className="alert alert-info mb-4">
                  <i className="bi bi-person-badge me-2"></i>
                  <strong>Superviseur :</strong> {project.supervisor.firstName} {project.supervisor.lastName}
                  <br />
                  <small className="text-muted">
                    (Vous ne pouvez pas modifier le superviseur. Seul l'administrateur peut changer le superviseur.)
                  </small>
                </div>

                {/* Information étudiants */}
                <div className="alert alert-secondary mb-4">
                  <i className="bi bi-people me-2"></i>
                  <strong>Étudiants :</strong> {project.students.length} étudiant(s) inscrit(s)
                  <div className="mt-2">
                    <a 
                      href={`/projects/${project.id}/manage-students`} 
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="bi bi-people me-1"></i>
                      Gérer les étudiants
                    </a>
                  </div>
                </div>

                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Enregistrer les modifications
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Information sur les dates */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-calendar-check me-2"></i>
                Informations sur les dates
              </h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-4 mb-3">
                  <div className="card border-primary">
                    <div className="card-body">
                      <h6 className="card-title">Date de début</h6>
                      <p className="card-text">
                        {projectService.formatDate(project.startDate)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card border-success">
                    <div className="card-body">
                      <h6 className="card-title">Date de fin</h6>
                      <p className="card-text">
                        {projectService.formatDate(project.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card border-info">
                    <div className="card-body">
                      <h6 className="card-title">Progression</h6>
                      <p className="card-text display-6">
                        {projectService.calculateProgress(project.startDate, project.endDate)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectEditPage;