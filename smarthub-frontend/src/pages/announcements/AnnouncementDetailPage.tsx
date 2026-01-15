// src/pages/announcements/AnnouncementDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import announcementService from '../../services/announcementService';
import { AnnouncementType } from '../../types/announcement';

const AnnouncementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchAnnouncement();
    }
  }, [id]);

  const fetchAnnouncement = async () => {
    try {
      setLoading(true);
      const data = await announcementService.getById(parseInt(id!));
      setAnnouncement(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement de l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      try {
        setActionLoading(true);
        await announcementService.delete(parseInt(id!));
        navigate('/announcements');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
        setActionLoading(false);
      }
    }
  };

  const handleTogglePublish = async () => {
    try {
      setActionLoading(true);
      const updated = await announcementService.togglePublishStatus(parseInt(id!));
      setAnnouncement(updated);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Erreur</h4>
          <p>{error || 'Annonce non trouvée'}</p>
          <button onClick={() => navigate('/announcements')} className="btn btn-primary">
            Retour aux annonces
          </button>
        </div>
      </div>
    );
  }

  const isAuthor = user?.id === announcement.author.id.toString() || user?.role === 'ADMIN';
  const isPast = announcementService.isPast(announcement.date);
  const isUpcoming = announcementService.isUpcoming(announcement.date);

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-0">
                  <i className={`bi ${announcementService.getTypeIcon(announcement.type)} me-2`}></i>
                  {announcement.title}
                </h2>
              </div>
              <div>
                {!announcement.published && (
                  <span className="badge bg-warning me-2">
                    <i className="bi bi-eye-slash me-1"></i>
                    Non publiée
                  </span>
                )}
                <span className={`badge bg-${announcementService.getTypeColor(announcement.type)}`}>
                  {announcementService.getTypeLabel(announcement.type)}
                </span>
              </div>
            </div>
            
            <div className="card-body">
              {/* Actions */}
              {isAuthor && (
                <div className="mb-4">
                  <div className="btn-group" role="group">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={handleTogglePublish}
                      disabled={actionLoading}
                    >
                      <i className={`bi bi-eye${announcement.published ? '-slash' : ''} me-1`}></i>
                      {announcement.published ? 'Dépublier' : 'Publier'}
                    </button>
                    <Link
                      to={`/announcements/${id}/edit`}
                      className="btn btn-outline-warning"
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Modifier
                    </Link>
                    <button
                      className="btn btn-outline-danger"
                      onClick={handleDelete}
                      disabled={actionLoading}
                    >
                      <i className="bi bi-trash me-1"></i>
                      Supprimer
                    </button>
                  </div>
                </div>
              )}

              {/* Informations */}
              <div className="mb-4">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="card-subtitle mb-2 text-muted">
                          <i className="bi bi-person-circle me-2"></i>
                          Auteur
                        </h6>
                        <p className="card-text mb-0">
                          {announcement.author.firstName && announcement.author.lastName
                            ? `${announcement.author.firstName} ${announcement.author.lastName}`
                            : announcement.author.username}
                          <br />
                          <small className="text-muted">
                            {announcement.author.email}
                          </small>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="card-subtitle mb-2 text-muted">
                          <i className="bi bi-calendar3 me-2"></i>
                          Date et heure
                        </h6>
                        <p className="card-text">
                          <strong>{announcementService.formatDate(announcement.date)}</strong>
                          {isPast && (
                            <span className="badge bg-secondary ms-2">
                              <i className="bi bi-clock-history me-1"></i>
                              Passée
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="badge bg-info ms-2">
                              <i className="bi bi-clock me-1"></i>
                              À venir
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className="mb-4">
                <h5>Contenu</h5>
                <div className="card">
                  <div className="card-body">
                    <div className="announcement-content" 
                         style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {announcement.content}
                    </div>
                  </div>
                </div>
              </div>

              {/* Métadonnées */}
              <div className="text-muted small">
                <div className="d-flex justify-content-between">
                  <div>
                    <i className="bi bi-clock me-1"></i>
                    Créée le {announcementService.formatDate(announcement.createdAt)}
                  </div>
                  <div>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Modifiée le {announcementService.formatDate(announcement.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card-footer text-end">
              <button
                onClick={() => navigate('/announcements')}
                className="btn btn-outline-secondary"
              >
                <i className="bi bi-arrow-left me-1"></i>
                Retour aux annonces
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetailPage;