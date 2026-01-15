import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { internshipService } from '../../services/internshipService';
import userService from '../../services/userService';
import { InternshipCreateRequest } from '../../types/internship';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  firstName?: string;
  lastName?: string;
}

interface FormData {
  title: string;
  description: string;
  studentId: number;
  supervisorId?: number;
  company: string;
  startDate: string;
  endDate: string;
  status: string;
}

const InternshipCreatePage: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Charger les étudiants si l'utilisateur est TEACHER ou ADMIN
      if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
        const studentsData = await userService.getAllStudents();
        setStudents(studentsData);
      }
      
      // Charger les enseignants
      const teachersData = await userService.getAllTeachers();
      setTeachers(teachersData);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Préparer les données pour la création
      const createData: InternshipCreateRequest = {
        title: data.title,
        description: data.description,
        studentId: data.studentId,
        supervisorId: data.supervisorId,
        company: data.company,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status as any
      };

      // Si l'utilisateur est STUDENT, on utilise son ID
      if (user?.role === 'STUDENT') {
        createData.studentId = parseInt(user.id);
      }

      // Si l'utilisateur est TEACHER et n'a pas spécifié d'encadrant, on utilise son ID
      if (user?.role === 'TEACHER' && !createData.supervisorId) {
        createData.supervisorId = parseInt(user.id);
      }

      // Créer le stage
      await internshipService.create(createData);
      
      setSuccess('Stage créé avec succès !');
      setTimeout(() => {
        navigate('/internships');
      }, 2000);
      
    } catch (err: any) {
      console.error('Détails de l\'erreur:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || err.message || 'Erreur lors de la création du stage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/internships">Stages</a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Créer un stage
          </li>
        </ol>
      </nav>

      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h2 className="mb-0">Créer un nouveau stage</h2>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">
                    Titre du stage *
                  </label>
                  <input
                    type="text"
                    id="title"
                    className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                    placeholder="Ex: Stage Développeur Full Stack"
                    {...register('title', {
                      required: 'Le titre est obligatoire',
                      minLength: {
                        value: 3,
                        message: 'Le titre doit contenir au moins 3 caractères'
                      }
                    })}
                  />
                  {errors.title && (
                    <div className="invalid-feedback">
                      {errors.title.message}
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
                    placeholder="Décrivez les responsabilités, objectifs et compétences requises..."
                    {...register('description', {
                      required: false,
                      minLength: {
                        value: 10,
                        message: 'La description doit contenir au moins 10 caractères'
                      }
                    })}
                  />
                  {errors.description && (
                    <div className="invalid-feedback">
                      {errors.description.message}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="company" className="form-label">
                    Entreprise *
                  </label>
                  <input
                    type="text"
                    id="company"
                    className={`form-control ${errors.company ? 'is-invalid' : ''}`}
                    placeholder="Ex: Google, Microsoft, Startup X..."
                    {...register('company', {
                      required: 'Le nom de l\'entreprise est obligatoire'
                    })}
                  />
                  {errors.company && (
                    <div className="invalid-feedback">
                      {errors.company.message}
                    </div>
                  )}
                </div>

                <div className="row">
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
                          {errors.startDate.message}
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
                          {errors.endDate.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="status" className="form-label">
                    Statut *
                  </label>
                  <select
                    id="status"
                    className={`form-control ${errors.status ? 'is-invalid' : ''}`}
                    {...register('status', {
                      required: 'Le statut est obligatoire'
                    })}
                  >
                    <option value="PLANNED">Planifié</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="COMPLETED">Terminé</option>
                    <option value="CANCELLED">Annulé</option>
                  </select>
                  {errors.status && (
                    <div className="invalid-feedback">
                      {errors.status.message}
                    </div>
                  )}
                </div>

                {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                  <div className="mb-3">
                    <label htmlFor="studentId" className="form-label">
                      Étudiant *
                    </label>
                    <select
                      id="studentId"
                      className={`form-control ${errors.studentId ? 'is-invalid' : ''}`}
                      {...register('studentId', {
                        required: 'L\'étudiant est obligatoire',
                        valueAsNumber: true
                      })}
                    >
                      <option value="">Sélectionner un étudiant...</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.firstName && student.lastName
                            ? `${student.firstName} ${student.lastName} (${student.username})`
                            : student.username}
                        </option>
                      ))}
                    </select>
                    {errors.studentId && (
                      <div className="invalid-feedback">
                        {errors.studentId.message}
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="supervisorId" className="form-label">
                    Encadrant
                  </label>
                  <select
                    id="supervisorId"
                    className={`form-control ${errors.supervisorId ? 'is-invalid' : ''}`}
                    {...register('supervisorId', {
                      valueAsNumber: true
                    })}
                  >
                    <option value="">Sélectionner un encadrant (optionnel)</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName && teacher.lastName
                          ? `${teacher.firstName} ${teacher.lastName} (${teacher.username})`
                          : teacher.username}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Si laissé vide, l'enseignant connecté sera assigné automatiquement
                  </div>
                  {errors.supervisorId && (
                    <div className="invalid-feedback">
                      {errors.supervisorId.message}
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-between mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/internships')}
                    disabled={loading}
                  >
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
                      'Créer le stage'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Informations */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Informations
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <h6 className="alert-heading">
                  <i className="bi bi-lightbulb me-2"></i>
                  Conseils pour créer un bon stage
                </h6>
                <ul className="mb-0">
                  <li>Assurez-vous que les dates sont correctes et réalistes</li>
                  <li>Remplissez une description détaillée pour aider les étudiants à comprendre les attentes</li>
                  <li>Vérifiez les informations de l'entreprise</li>
                  <li>Choisissez le statut approprié (Planifié, En cours, etc.)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternshipCreatePage;