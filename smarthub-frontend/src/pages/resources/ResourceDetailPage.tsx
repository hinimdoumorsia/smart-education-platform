import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import resourceService from '../../services/resourceService';
import { Resource } from '../../types/resource';

const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadResource();
    }
  }, [id]);

  const loadResource = async () => {
    try {
      const data = await resourceService.getById(parseInt(id!));
      setResource(data);
    } catch (err) {
      setError('Erreur lors du chargement de la ressource');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette ressource ? Cette action est irréversible.')) {
      try {
        await resourceService.delete(resource!.id);
        navigate('/resources');
      } catch (err) {
        alert('Erreur lors de la suppression de la ressource');
      }
    }
  };

  const handleDownload = async () => {
    if (!resource?.fileDownloadUrl) return;
    
    const fileName = resource.fileDownloadUrl.split('/').pop() || '';
    try {
      await resourceService.downloadFile(fileName, resource.originalFileName || 'document');
    } catch (err) {
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getTypeBadge = (type: string) => {
    return <span className={resourceService.getTypeBadge(type)}>
      {resourceService.getTypeLabel(type)}
    </span>;
  };

  if (loading) {
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

  if (error || !resource) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h5>Erreur</h5>
          <p>{error || 'Ressource non trouvée'}</p>
          <button onClick={() => navigate('/resources')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const canEdit = user?.role === 'ADMIN' || 
    resource.authors.some(author => author.id.toString() === user?.id);
  
  const canDelete = canEdit; // Même condition pour la suppression

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/resources">Ressources</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {resource.title}
          </li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="mb-0">{resource.title}</h3>
              <div>
                {getTypeBadge(resource.type)}
              </div>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h5>Résumé</h5>
                <p className="card-text">
                  {resource.abstractText || (
                    <span className="text-muted">Aucun résumé fourni</span>
                  )}
                </p>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <h6><i className="bi bi-calendar3 me-2"></i>Date de publication</h6>
                    <p>{formatDate(resource.publicationDate)}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <h6><i className="bi bi-person-badge me-2"></i>Auteurs</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {resource.authors.map(author => (
                        <span key={author.id} className="badge bg-light text-dark">
                          {author.firstName || author.username}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fichier joint */}
              {resource.originalFileName && (
                <div className="mb-3">
                  <h6><i className="bi bi-paperclip me-2"></i>Fichier joint</h6>
                  <div className="d-flex align-items-center">
                    <i className={`bi ${resourceService.getFileIcon(resource.fileType)} fs-4 me-3`}></i>
                    <div>
                      <div>{resource.originalFileName}</div>
                      <small className="text-muted">
                        {resource.fileSize && resourceService.formatFileSize(resource.fileSize)}
                        {resource.fileType && ` • ${resource.fileType}`}
                      </small>
                    </div>
                    <button 
                      onClick={handleDownload}
                      className="btn btn-outline-primary btn-sm ms-auto"
                    >
                      <i className="bi bi-download me-1"></i>
                      Télécharger
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          {/* Informations sur la ressource */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Informations
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Créée le:</strong>
                <div>{formatDate(resource.createdAt)}</div>
              </div>
              <div className="mb-3">
                <strong>Dernière modification:</strong>
                <div>{formatDate(resource.updatedAt)}</div>
              </div>
              <div>
                <strong>Type:</strong>
                <div>{resourceService.getTypeLabel(resource.type)}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-gear me-2"></i>
                Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link 
                  to={`/resources/${resource.id}/edit`}
                  className={`btn btn-outline-primary ${!canEdit ? 'disabled' : ''}`}
                  style={!canEdit ? { pointerEvents: 'none' } : {}}
                >
                  <i className="bi bi-pencil me-2"></i>
                  Modifier
                </Link>
                
                <button 
                  onClick={handleDelete}
                  className={`btn btn-outline-danger ${!canDelete ? 'disabled' : ''}`}
                  disabled={!canDelete}
                >
                  <i className="bi bi-trash me-2"></i>
                  Supprimer
                </button>

                <Link to="/resources" className="btn btn-outline-secondary">
                  <i className="bi bi-arrow-left me-2"></i>
                  Retour à la liste
                </Link>
              </div>
            </div>
          </div>

          {/* Auteurs */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-people me-2"></i>
                Auteurs
              </h5>
            </div>
            <div className="card-body">
              {resource.authors.map(author => (
                <div key={author.id} className="mb-3">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <i className="bi bi-person-circle fs-4 text-primary"></i>
                    </div>
                    <div>
                      <strong>{author.firstName} {author.lastName}</strong>
                      {author.lastName && <br />}
                      <div className="text-muted small">{author.username}</div>
                      <span className="badge bg-info">{author.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailPage;