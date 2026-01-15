// src/pages/projects/ProjectCreatePage.tsx - CORRIGÉ
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import projectService, { 
  ProjectRequest, 
  ProjectStatus, 
  UserBasic  // ← Import depuis projectService
} from '../../services/projectService';
import userService from '../../services/userService';

interface FormData extends Omit<ProjectRequest, 'studentIds'> {
  studentIds: string[];
}

const ProjectCreatePage: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>();
  const [students, setStudents] = useState<UserBasic[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<UserBasic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
    const today = new Date().toISOString().split('T')[0];
    setValue('startDate', today);
    
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    setValue('endDate', threeMonthsLater.toISOString().split('T')[0]);
    
    setValue('status', ProjectStatus.PLANNED);
  }, [setValue]);

  const fetchStudents = async () => {
    try {
      const data = await userService.getAllStudents();
      // Conversion vers UserBasic
      const userBasics: UserBasic[] = data.map(student => ({
        id: parseInt(student.id),
        username: student.username,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        role: student.role
      }));
      setStudents(userBasics);
    } catch (err) {
      console.error('Erreur lors du chargement des étudiants:', err);
    }
  };

  const handleStudentSelect = (student: UserBasic) => {
    if (!selectedStudents.some(s => s.id === student.id)) {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  const removeStudent = (studentId: number) => {
    setSelectedStudents(selectedStudents.filter(s => s.id !== studentId));
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      if (endDate <= startDate) {
        setError('La date de fin doit être postérieure à la date de début');
        setLoading(false);
        return;
      }

      const projectData: ProjectRequest = {
        title: data.title,
        description: data.description || '',
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status || ProjectStatus.PLANNED,
        studentIds: selectedStudents.map(student => student.id)
      };

      await projectService.create(projectData);
      
      setSuccess('Projet créé avec succès !');
      setTimeout(() => {
        navigate('/projects');
      }, 2000);
      
    } catch (err: any) {
      console.error('Erreur lors de la création:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création du projet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/projects">Projets</a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Créer un projet
          </li>
        </ol>
      </nav>

      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">
                <i className="bi bi-plus-circle me-2"></i>
                Créer un nouveau projet
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
                {/* Informations de base */}
                <div className="mb-4">
                  <h5>Informations du projet</h5>
                  
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
                      placeholder="Ex: Développement d'une application web"
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
                      rows={4}
                      {...register('description', {
                        maxLength: {
                          value: 1000,
                          message: 'La description ne peut pas dépasser 1000 caractères'
                        }
                      })}
                      placeholder="Décrivez les objectifs et le contenu du projet..."
                    />
                    {errors.description && (
                      <div className="invalid-feedback">
                        {errors.description.message as string}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="mb-3">
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
                          {errors.startDate.message as string}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
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
                          {errors.endDate.message as string}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Statut */}
                <div className="mb-4">
                  <label htmlFor="status" className="form-label">
                    Statut
                  </label>
                  <select
                    id="status"
                    className="form-control"
                    {...register('status')}
                  >
                    {(Object.values(ProjectStatus) as ProjectStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {projectService.getStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gestion des étudiants */}
                <div className="mb-4">
                  <h5>Étudiants participants</h5>
                  
                  {selectedStudents.length > 0 && (
                    <div className="mb-3">
                      <h6>Étudiants sélectionnés ({selectedStudents.length})</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {selectedStudents.map((student) => (
                          <div key={student.id} className="badge bg-primary d-flex align-items-center">
                            {student.firstName} {student.lastName} ({student.username})
                            <button
                              type="button"
                              className="btn btn-sm btn-light ms-2"
                              onClick={() => removeStudent(student.id)}
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Ajouter des étudiants</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Rechercher un étudiant..."
                        onChange={async (e) => {
                          const query = e.target.value;
                          if (query.length > 2) {
                            try {
                              const results = await userService.searchStudents(query);
                              // Conversion vers UserBasic
                              const userBasics: UserBasic[] = results.map(student => ({
                                id: parseInt(student.id),
                                username: student.username,
                                email: student.email,
                                firstName: student.firstName,
                                lastName: student.lastName,
                                role: student.role
                              }));
                              setStudents(userBasics);
                            } catch (err) {
                              console.error('Erreur de recherche:', err);
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="card" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <div className="card-body">
                      {students.length === 0 ? (
                        <p className="text-muted text-center mb-0">
                          Aucun étudiant disponible
                        </p>
                      ) : (
                        <div className="list-group">
                          {students
                            .filter(student => !selectedStudents.some(s => s.id === student.id))
                            .map((student) => (
                              <button
                                key={student.id}
                                type="button"
                                className="list-group-item list-group-item-action"
                                onClick={() => handleStudentSelect(student)}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <strong>{student.firstName} {student.lastName}</strong>
                                    <br />
                                    <small className="text-muted">
                                      {student.username} • {student.email}
                                    </small>
                                  </div>
                                  <i className="bi bi-plus-lg text-primary"></i>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Information superviseur */}
                <div className="alert alert-info mb-4">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Information :</strong> Vous serez automatiquement assigné comme superviseur de ce projet.
                  {selectedStudents.length === 0 && (
                    <div className="mt-2">
                      <i className="bi bi-exclamation-triangle me-2 text-warning"></i>
                      Vous n'avez sélectionné aucun étudiant. Vous pourrez en ajouter plus tard.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/projects')}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Créer le projet
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreatePage;