import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import resourceService from '../../services/resourceService';
import userService from '../../services/userService';
import { ResourceCreateRequest } from '../../types/resource';
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
  abstractText: string;
  publicationDate: string;
  type: string;
  authorIds?: number[];
  file?: FileList;
}

const ResourceCreatePage: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const teachersData = await userService.getAllTeachers();
      setTeachers(teachersData);
    } catch (err) {
      console.error('Erreur lors du chargement des enseignants:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // CORRECTION DÉFINITIVE : Construire le tableau d'auteurs étape par étape
      const authorIds: number[] = [];
      
      // 1. Ajouter les auteurs du formulaire (s'ils existent)
      if (data.authorIds && data.authorIds.length > 0) {
        data.authorIds.forEach(id => {
          if (id && !authorIds.includes(id)) {
            authorIds.push(id);
          }
        });
      }
      
      // 2. Ajouter l'utilisateur connecté si c'est un enseignant ou admin
      if (user && (user.role === 'TEACHER' || user.role === 'ADMIN')) {
        const userId = parseInt(user.id);
        if (!isNaN(userId) && !authorIds.includes(userId)) {
          authorIds.push(userId);
        }
      }

      // Préparer les données pour la création
      const createData: ResourceCreateRequest = {
        title: data.title,
        authorIds: authorIds, // Maintenant garantie d'être un tableau (même vide)
        abstractText: data.abstractText || '',
        publicationDate: data.publicationDate,
        type: data.type as any,
        file: selectedFile || undefined
      };

      // Créer la ressource
      await resourceService.create(createData);
      
      setSuccess('Ressource créée avec succès !');
      setTimeout(() => {
        navigate('/resources');
      }, 2000);
      
    } catch (err: any) {
      console.error('Détails de l\'erreur:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || err.message || 'Erreur lors de la création de la ressource');
    } finally {
      setLoading(false);
    }
  };

  // ... (le reste du code reste identique jusqu'au return)

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/resources">Ressources</a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Créer une ressource
          </li>
        </ol>
      </nav>

      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h2 className="mb-0">Créer une nouvelle ressource</h2>
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
                    Titre *
                  </label>
                  <input
                    type="text"
                    id="title"
                    className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                    placeholder="Ex: Analyse des algorithmes d'apprentissage profond"
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
                  <label htmlFor="abstractText" className="form-label">
                    Résumé
                  </label>
                  <textarea
                    id="abstractText"
                    className={`form-control ${errors.abstractText ? 'is-invalid' : ''}`}
                    rows={5}
                    placeholder="Résumé de la ressource (max 2000 caractères)..."
                    {...register('abstractText', {
                      required: false,
                      maxLength: {
                        value: 2000,
                        message: 'Le résumé ne peut pas dépasser 2000 caractères'
                      }
                    })}
                  />
                  {errors.abstractText && (
                    <div className="invalid-feedback">
                      {errors.abstractText.message}
                    </div>
                  )}
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="publicationDate" className="form-label">
                        Date de publication *
                      </label>
                      <input
                        type="date"
                        id="publicationDate"
                        className={`form-control ${errors.publicationDate ? 'is-invalid' : ''}`}
                        {...register('publicationDate', {
                          required: 'La date de publication est obligatoire'
                        })}
                      />
                      {errors.publicationDate && (
                        <div className="invalid-feedback">
                          {errors.publicationDate.message}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="type" className="form-label">
                        Type *
                      </label>
                      <select
                        id="type"
                        className={`form-control ${errors.type ? 'is-invalid' : ''}`}
                        {...register('type', {
                          required: 'Le type est obligatoire'
                        })}
                      >
                        <option value="">Sélectionner un type...</option>
                        <option value="ARTICLE">Article</option>
                        <option value="THESIS">Thèse</option>
                        <option value="PUBLICATION">Publication</option>
                        <option value="REPORT">Rapport</option>
                        <option value="OTHER">Autre</option>
                      </select>
                      {errors.type && (
                        <div className="invalid-feedback">
                          {errors.type.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="authorIds" className="form-label">
                    Co-auteurs (optionnel)
                  </label>
                  <select
                    id="authorIds"
                    className={`form-control ${errors.authorIds ? 'is-invalid' : ''}`}
                    multiple
                    {...register('authorIds', {
                      setValueAs: (value) => {
                        if (!value) return [];
                        const values = Array.isArray(value) ? value : [value];
                        return values.map(v => parseInt(v)).filter(v => !isNaN(v));
                      }
                    })}
                    size={4}
                  >
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName && teacher.lastName
                          ? `${teacher.firstName} ${teacher.lastName} (${teacher.username})`
                          : teacher.username}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Maintenez Ctrl (Cmd sur Mac) pour sélectionner plusieurs auteurs
                  </div>
                  {errors.authorIds && (
                    <div className="invalid-feedback">
                      {errors.authorIds.message}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="file" className="form-label">
                    Fichier (optionnel)
                  </label>
                  <input
                    type="file"
                    id="file"
                    className={`form-control ${errors.file ? 'is-invalid' : ''}`}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
                    onChange={handleFileChange}
                  />
                  {selectedFile && (
                    <div className="mt-2">
                      <small className="text-muted">
                        Fichier sélectionné: {selectedFile.name} ({resourceService.formatFileSize(selectedFile.size)})
                      </small>
                    </div>
                  )}
                  <div className="form-text">
                    Formats acceptés: PDF, Word, Excel, PowerPoint, images, ZIP
                  </div>
                </div>

                <div className="d-flex justify-content-between mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/resources')}
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
                      'Créer la ressource'
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
                  Conseils pour créer une bonne ressource
                </h6>
                <ul className="mb-0">
                  <li>Choisissez un titre clair et descriptif</li>
                  <li>Rédigez un résumé concis qui explique l'objectif et les résultats</li>
                  <li>Vérifiez que la date de publication est correcte</li>
                  <li>Ajoutez tous les co-auteurs concernés</li>
                  <li>Joignez le document complet si disponible</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceCreatePage;