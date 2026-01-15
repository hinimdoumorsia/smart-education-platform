import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import courseService from '../../services/courseService'; // Retirer CourseRequest import non utilisé
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
  files: File[];
}

const CourseCreatePage: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const teacherIdValue = watch('teacherId');

  useEffect(() => {
    console.log('=== DEBUG USER INFO ===');
    console.log('User:', user);
    console.log('User ID:', user?.id);
    console.log('User Role:', user?.role);
    console.log('User ID type:', typeof user?.id);

    if (user?.role === 'TEACHER') {
      console.log('Setting teacherId for TEACHER:', user.id);
      setValue('teacherId', user.id);
    } else if (user?.role === 'ADMIN') {
      fetchTeachers();
    }
  }, [user, setValue]);

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
      console.log('Teachers loaded:', teachersData);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    console.log('=== ON SUBMIT START ===');
    console.log('Form data:', data);
    console.log('User role:', user?.role);
    console.log('TeacherId from form:', data.teacherId);
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // DÉTERMINER teacherId
      let finalTeacherId: string;
      
      if (user?.role === 'TEACHER') {
        finalTeacherId = user.id;
        console.log('TEACHER - Using own ID:', finalTeacherId);
      } else if (user?.role === 'ADMIN') {
        finalTeacherId = data.teacherId;
        console.log('ADMIN - Using selected teacher ID:', finalTeacherId);
      } else {
        throw new Error('Accès non autorisé: seul un enseignant ou administrateur peut créer un cours');
      }

      // VALIDATION
      if (!finalTeacherId || finalTeacherId.trim() === '') {
        throw new Error('L\'ID de l\'enseignant est requis');
      }

      console.log('Final teacherId:', finalTeacherId);
      console.log('Type of teacherId:', typeof finalTeacherId);

      // Appeler le service de création
      console.log('Calling courseService.createCourse...');
      await courseService.createCourse({
        title: data.title,
        description: data.description || '',
        teacherId: finalTeacherId,
        files: selectedFiles
      });
      
      setSuccess('Cours créé avec succès !');
      setTimeout(() => {
        navigate('/courses');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = 'Erreur lors de la création du cours';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/courses">Cours</a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Créer un cours
          </li>
        </ol>
      </nav>

      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card">
            <div className="card-header">
              <h2 className="mb-0">Créer un nouveau cours</h2>
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
                <div className="row">
                  <div className="col-md-8">
                    <div className="mb-4">
                      <h5>Informations du cours</h5>
                      
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
                          placeholder="Ex: Introduction à l'IA"
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
                          placeholder="Décrivez le contenu du cours..."
                        />
                        {errors.description && (
                          <div className="invalid-feedback">
                            {errors.description.message}
                          </div>
                        )}
                      </div>

                      <input
                        type="hidden"
                        {...register('teacherId', {
                          required: 'L\'enseignant est requis'
                        })}
                      />
                      
                      {user?.role === 'ADMIN' && (
                        <div className="mb-3">
                          <label htmlFor="teacherSelect" className="form-label">
                            Enseignant *
                          </label>
                          <select
                            id="teacherSelect"
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
                          Vous serez automatiquement assigné comme enseignant de ce cours.
                          <input type="hidden" value={user.id} {...register('teacherId')} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-4">
                      <h5>Fichiers du cours</h5>
                      <div className="card">
                        <div className="card-body">
                          <div className="mb-3">
                            <label htmlFor="fileInput" className="form-label">
                              Ajouter des fichiers
                            </label>
                            <input
                              id="fileInput"
                              type="file"
                              className="form-control"
                              multiple
                              onChange={handleFileChange}
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar"
                            />
                            <div className="form-text">
                              Formats acceptés : PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP, RAR
                            </div>
                          </div>

                          {selectedFiles.length > 0 && (
                            <div className="mt-3">
                              <h6>Fichiers sélectionnés ({selectedFiles.length})</h6>
                              <div className="list-group">
                                {selectedFiles.map((file, index) => (
                                  <div key={index} className="list-group-item list-group-item-action">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div>
                                        <i className="bi bi-file-earmark me-2"></i>
                                        <span className="small">{file.name}</span>
                                        <br />
                                        <small className="text-muted">
                                          {formatFileSize(file.size)}
                                        </small>
                                      </div>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => removeFile(index)}
                                        title="Supprimer"
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedFiles.length === 0 && (
                            <div className="text-center text-muted py-3">
                              <i className="bi bi-cloud-upload fs-1 d-block mb-2"></i>
                              <p className="mb-0">Aucun fichier sélectionné</p>
                              <small>Vous pouvez ajouter des fichiers plus tard</small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-between mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/courses')}
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
                        Créer le cours
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Informations
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-warning">
                <h6>Débogage :</h6>
                <ul className="mb-0">
                  <li>Rôle utilisateur: <strong>{user?.role}</strong></li>
                  <li>ID utilisateur: <strong>{user?.id}</strong></li>
                  <li>TeacherId sélectionné: <strong>{teacherIdValue}</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCreatePage;