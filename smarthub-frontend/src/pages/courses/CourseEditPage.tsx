import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import courseService, { Course, CourseRequest } from '../../services/courseService';
import userService from '../../services/userService';

interface Teacher {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface FormData {
  title: string;
  description: string;
  teacherId: string;
}

const CourseEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<FormData>();
  const [course, setCourse] = useState<Course | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id]);

  const fetchCourseData = async () => {
    try {
      setLoadingCourse(true);
      const courseData = await courseService.getCourseById(id!);
      setCourse(courseData);
      
      // Pré-remplir le formulaire
      reset({
        title: courseData.title,
        description: courseData.description || '',
        teacherId: courseData.teacherId
      });

      // Charger les enseignants si admin
      if (user?.role === 'ADMIN') {
        await fetchTeachers();
      }
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du cours');
    } finally {
      setLoadingCourse(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const data = await userService.getAllTeachers();
      const teachersData: Teacher[] = data.map(teacher => ({
        id: teacher.id,
        username: teacher.username,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        role: teacher.role
      }));
      setTeachers(teachersData);
    } catch (err) {
      console.error('Error fetching teachers:', err);
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

      if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
        throw new Error('Vous n\'avez pas la permission de modifier ce cours');
      }

      if (user.role === 'TEACHER' && user.id !== course?.teacherId) {
        throw new Error('Vous ne pouvez modifier que vos propres cours');
      }

      // Préparer les données pour la mise à jour
      const updateData: Partial<CourseRequest> = {
        title: data.title,
        description: data.description,
      };

      // Si admin, on peut changer l'enseignant
      if (user.role === 'ADMIN' && data.teacherId !== course?.teacherId) {
        updateData.teacherId = data.teacherId;
      }

      // Mettre à jour le cours
      await courseService.updateCourse(id!, updateData);
      
      setSuccess('Cours mis à jour avec succès !');
      setTimeout(() => {
        navigate(`/courses/${id}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || err.message || 'Erreur lors de la mise à jour du cours');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ? Cette action est irréversible.')) {
      try {
        await courseService.deleteCourse(id!);
        navigate('/courses');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  if (loadingCourse) {
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

  if (error && !course) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h5>Erreur</h5>
          <p>{error}</p>
          <button onClick={() => navigate('/courses')} className="btn btn-primary">
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
            <a href="/courses">Cours</a>
          </li>
          <li className="breadcrumb-item">
            <a href={`/courses/${id}`}>{course?.title}</a>
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
              <h2 className="mb-0">Modifier le cours</h2>
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
                    Titre du cours *
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

                {user?.role === 'ADMIN' && (
                  <div className="mb-3">
                    <label htmlFor="teacherId" className="form-label">
                      Enseignant *
                    </label>
                    <select
                      id="teacherId"
                      className={`form-control ${errors.teacherId ? 'is-invalid' : ''}`}
                      {...register('teacherId', {
                        required: 'Veuillez sélectionner un enseignant'
                      })}
                    >
                      <option value="">Sélectionner un enseignant...</option>
                      {teachers
                        .filter(t => t.role === 'TEACHER')
                        .map(teacher => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.firstName && teacher.lastName
                              ? `${teacher.firstName} ${teacher.lastName} (${teacher.username})`
                              : teacher.username}
                          </option>
                        ))}
                    </select>
                    {errors.teacherId && (
                      <div className="invalid-feedback">
                        {errors.teacherId.message}
                      </div>
                    )}
                  </div>
                )}

                {user?.role === 'TEACHER' && (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Vous êtes l'enseignant de ce cours. Pour changer d'enseignant, contactez un administrateur.
                  </div>
                )}

                <div className="d-flex justify-content-between mt-4">
                  <div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => navigate(`/courses/${id}`)}
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

          {/* Informations sur le cours */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Informations du cours
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>ID:</strong> {course?.id}</p>
                  <p><strong>Date de création:</strong> {course?.createdDate ? new Date(course.createdDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Enseignant ID:</strong> {course?.teacherId}</p>
                  <p><strong>Nombre d'étudiants:</strong> {course?.students?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseEditPage;