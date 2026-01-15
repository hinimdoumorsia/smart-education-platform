import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { internshipService } from '../../services/internshipService';
import userService from '../../services/userService';
import { InternshipUpdateRequest } from '../../types/internship';

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

const InternshipEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<FormData>();
  const [internship, setInternship] = useState<any>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInternship, setLoadingInternship] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchInternshipData();
    }
  }, [id]);

  const fetchInternshipData = async () => {
    try {
      setLoadingInternship(true);
      const internshipData = await internshipService.getById(parseInt(id!));
      setInternship(internshipData);
      
      // Format dates for input fields
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      // Pré-remplir le formulaire
      reset({
        title: internshipData.title,
        description: internshipData.description || '',
        studentId: internshipData.student.id,
        supervisorId: internshipData.supervisor.id,
        company: internshipData.company,
        startDate: formatDate(internshipData.startDate),
        endDate: formatDate(internshipData.endDate),
        status: internshipData.status
      });

      // Charger les étudiants et enseignants
      await fetchUsers();
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du stage');
    } finally {
      setLoadingInternship(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const studentsData = await userService.getAllStudents();
      const teachersData = await userService.getAllTeachers();
      
      setStudents(studentsData);
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

      // Vérifier les permissions
      if (!user) {
        throw new Error('Vous devez être connecté');
      }

      // Préparer les données pour la mise à jour
      const updateData: InternshipUpdateRequest = {
        title: data.title,
        description: data.description,
        studentId: data.studentId,
        supervisorId: data.supervisorId,
        company: data.company,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status as any
      };

      // Mettre à jour le stage
      await internshipService.update(parseInt(id!), updateData);
      
      setSuccess('Stage mis à jour avec succès !');
      setTimeout(() => {
        navigate(`/internships/${id}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Détails de l\'erreur:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || err.message || 'Erreur lors de la mise à jour du stage');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce stage ? Cette action est irréversible.')) {
      try {
        await internshipService.delete(parseInt(id!));
        navigate('/internships');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  if (loadingInternship) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !internship) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h5>Erreur</h5>
          <p>{error}</p>
          <button onClick={() => navigate('/internships')} className="btn btn-primary">
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
            <a href="/internships">Stages</a>
          </li>
          <li className="breadcrumb-item">
            <a href={`/internships/${id}`}>{internship?.title}</a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Modifier
          </li>
        </ol>
      </nav>

      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h2 className="mb-0">Modifier le stage</h2>
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

                <div className="row">
                  <div className="col-md-6">
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
                  </div>
                  <div className="col-md-6">
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
                        <option value="">Sélectionner un encadrant...</option>
                        {teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.firstName && teacher.lastName
                              ? `${teacher.firstName} ${teacher.lastName} (${teacher.username})`
                              : teacher.username}
                          </option>
                        ))}
                      </select>
                      {errors.supervisorId && (
                        <div className="invalid-feedback">
                          {errors.supervisorId.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between mt-4">
                  <div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => navigate(`/internships/${id}`)}
                      disabled={loading}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger ms-2"
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      Supprimer
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Informations sur le stage */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Informations du stage
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>ID:</strong> {internship?.id}</p>
                  <p><strong>Date de création:</strong> {internship?.createdAt ? new Date(internship.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Dernière modification:</strong> {internship?.updatedAt ? new Date(internship.updatedAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternshipEditPage;