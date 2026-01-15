// src/pages/announcements/MyAnnouncementsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import announcementService from '../../services/announcementService';

const MyAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyAnnouncements();
  }, []);

  const fetchMyAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementService.getMyAnnouncements();
      setAnnouncements(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Erreur lors du chargement de vos annonces';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      try {
        await announcementService.delete(id);
        setAnnouncements(announcements.filter(a => a.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleTogglePublish = async (id: number) => {
    try {
      const updated = await announcementService.togglePublishStatus(id);
      setAnnouncements(announcements.map(a => a.id === id ? updated : a));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la modification');
    }
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

  // Si l'utilisateur est étudiant, il ne peut pas voir cette page
  if (user?.role === 'STUDENT') {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4>Accès refusé</h4>
          <p>Seuls les enseignants et administrateurs peuvent accéder à cette page.</p>
          <button onClick={() => navigate('/announcements')} className="btn btn-primary">
            Retour aux annonces
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Mes annonces</h1>
        <Link to="/announcements/create" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>
          Nouvelle annonce
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          Vous n'avez pas encore créé d'annonces.
          <Link to="/announcements/create" className="ms-2">
            Créez votre première annonce
          </Link>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Type</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Créée le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((announcement) => (
                <tr key={announcement.id}>
                  <td>
                    <Link to={`/announcements/${announcement.id}`} className="text-decoration-none">
                      {announcement.title}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge bg-${announcementService.getTypeColor(announcement.type)}`}>
                      {announcementService.getTypeLabel(announcement.type)}
                    </span>
                  </td>
                  <td>{announcementService.formatDate(announcement.date)}</td>
                  <td>
                    {announcement.published ? (
                      <span className="badge bg-success">
                        <i className="bi bi-eye me-1"></i>
                        Publiée
                      </span>
                    ) : (
                      <span className="badge bg-warning">
                        <i className="bi bi-eye-slash me-1"></i>
                        Non publiée
                      </span>
                    )}
                  </td>
                  <td>{announcementService.formatDate(announcement.createdAt)}</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        onClick={() => handleTogglePublish(announcement.id)}
                        className="btn btn-outline-secondary"
                        title={announcement.published ? 'Dépublier' : 'Publier'}
                      >
                        <i className={`bi bi-eye${announcement.published ? '-slash' : ''}`}></i>
                      </button>
                      <Link
                        to={`/announcements/${announcement.id}/edit`}
                        className="btn btn-outline-warning"
                        title="Modifier"
                      >
                        <i className="bi bi-pencil"></i>
                      </Link>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="btn btn-outline-danger"
                        title="Supprimer"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Statistiques */}
      <div className="mt-5">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-graph-up me-2"></i>
              Statistiques de vos annonces
            </h5>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-4 mb-3">
                <div className="card border-primary">
                  <div className="card-body">
                    <h2 className="text-primary">{announcements.length}</h2>
                    <p className="text-muted mb-0">Total</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="card border-success">
                  <div className="card-body">
                    <h2 className="text-success">
                      {announcements.filter(a => a.published).length}
                    </h2>
                    <p className="text-muted mb-0">Publiées</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="card border-warning">
                  <div className="card-body">
                    <h2 className="text-warning">
                      {announcements.filter(a => !a.published).length}
                    </h2>
                    <p className="text-muted mb-0">Non publiées</p>
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

export default MyAnnouncementsPage;