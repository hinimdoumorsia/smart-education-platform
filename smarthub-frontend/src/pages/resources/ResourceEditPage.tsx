import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import resourceService from '../../services/resourceService';
import userService from '../../services/userService';
import { ResourceUpdateRequest } from '../../types/resource';

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
  authorIds: number[];
  file?: FileList;
}

const ResourceEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<FormData>();
  const [resource, setResource] = useState<any>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingResource, setLoadingResource] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchResourceData();
    }
  }, [id]);

  const fetchResourceData = async () => {
    try {
      setLoadingResource(true);
      const resourceData = await resourceService.getById(parseInt(id!));
      setResource(resourceData);
      
      // Pré-remplir le formulaire
      reset({
        title: resourceData.title,
        abstractText: resourceData.abstractText || '',
        publicationDate: resourceData.publicationDate.split('T')[0],
        type: resourceData.type,
        authorIds: resourceData.authors.map(author => author.id)
      });

      // Charger les enseignants
      await fetchTeachers();
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement de la ressource');
    } finally {
      setLoadingResource(false);
    }
  };

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

  // Dans la fonction onSubmit de ResourceEditPage.tsx, remplacez la section similaire :

const onSubmit = async (data: FormData) => {
  try {
    setLoading(true);
    setError('');
    setSuccess('');

    // Vérifier les permissions
    if (!user) {
      throw new Error('Vous devez être connecté');
    }

    // Initialiser authorIds comme tableau vide s'il n'est pas défini
    const authorIds = data.authorIds || [];

    // Préparer les données pour la mise à jour
    const updateData: ResourceUpdateRequest = {
      title: data.title,
      abstractText: data.abstractText,
      publicationDate: data.publicationDate,
      type: data.type as any,
      authorIds: authorIds // Toujours un tableau
    };

    // Ajouter le fichier si sélectionné
    if (selectedFile) {
      updateData.file = selectedFile;
    }

    // Mettre à jour la ressource
    await resourceService.update(parseInt(id!), updateData);
    
    setSuccess('Ressource mise à jour avec succès !');
    setTimeout(() => {
      navigate(`/resources/${id}`);
    }, 2000);
    
  } catch (err: any) {
    console.error('Détails de l\'erreur:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
    setError(err.response?.data?.message || err.message || 'Erreur lors de la mise à jour de la ressource');
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette ressource ? Cette action est irréversible.')) {
      try {
        await resourceService.delete(parseInt(id!));
        navigate('/resources');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  if (loadingResource) {
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

  if (error && !resource) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h5>Erreur</h5>
          <p>{error}</p>
          <button onClick={() => navigate('/resources')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/resources">Ressources</a>
          </li>
          <li className="breadcrumb-item">
            <a href={`/resources/${id}`}>{resource?.title}</a>
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
              <h2 className="mb-0">Modifier la ressource</h2>
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
                    Auteurs *
                  </label>
                  <select
                    id="authorIds"
                    className={`form-control ${errors.authorIds ? 'is-invalid' : ''}`}
                    multiple
                    {...register('authorIds', {
                      required: 'Au moins un auteur est requis',
                      setValueAs: (value) => {
                        if (!value) return [];
                        const values = Array.isArray(value) ? value : [value];
                        return values.map(v => parseInt(v));
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
                        Nouveau fichier: {selectedFile.name} ({resourceService.formatFileSize(selectedFile.size)})
                      </small>
                    </div>
                  )}
                  {resource?.originalFileName && !selectedFile && (
                    <div className="mt-2">
                      <small className="text-muted">
                        Fichier actuel: {resource.originalFileName}
                      </small>
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-between mt-4">
                  <div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => navigate(`/resources/${id}`)}
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

          {/* Informations sur la ressource */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Informations de la ressource
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>ID:</strong> {resource?.id}</p>
                  <p><strong>Type:</strong> {resourceService.getTypeLabel(resource?.type)}</p>
                  <p><strong>Date de création:</strong> {resource?.createdAt ? formatDate(resource.createdAt) : 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Nombre d'auteurs:</strong> {resource?.authors?.length}</p>
                  <p><strong>Dernière modification:</strong> {resource?.updatedAt ? formatDate(resource.updatedAt) : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceEditPage;