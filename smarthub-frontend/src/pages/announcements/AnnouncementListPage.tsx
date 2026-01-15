// src/pages/announcements/AnnouncementListPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import announcementService from '../../services/announcementService';
import { Announcement, AnnouncementType } from '../../types/announcement'; // AJOUTEZ Announcement


const AnnouncementListPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<AnnouncementType | 'ALL'>('ALL');
  const [showOnlyPublished, setShowOnlyPublished] = useState(true);
  const [showOnlyUpcoming, setShowOnlyUpcoming] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, searchQuery, selectedType, showOnlyPublished, showOnlyUpcoming]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementService.getAll();
      setAnnouncements(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = [...announcements];

    // Filtre par type
    if (selectedType !== 'ALL') {
      filtered = filtered.filter(a => a.type === selectedType);
    }

    // Filtre par publication
    if (showOnlyPublished) {
      filtered = filtered.filter(a => a.published);
    }

    // Filtre par date (à venir)
    if (showOnlyUpcoming) {
      filtered = filtered.filter(a => !announcementService.isPast(a.date));
    }

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.content.toLowerCase().includes(query) ||
        a.author.username.toLowerCase().includes(query) ||
        (a.author.firstName && a.author.firstName.toLowerCase().includes(query)) ||
        (a.author.lastName && a.author.lastName.toLowerCase().includes(query))
      );
    }

    // Trier par date (plus récent en premier)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredAnnouncements(filtered);
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

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Annonces</h1>
        {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <Link to="/announcements/create" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            Nouvelle annonce
          </Link>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="col-md-3 mb-3">
              <select
                className="form-control"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as AnnouncementType | 'ALL')}
              >
                <option value="ALL">Tous les types</option>
                {Object.values(AnnouncementType).map(type => (
                  <option key={type} value={type}>
                    {announcementService.getTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <div className="d-flex gap-2">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showPublished"
                    checked={showOnlyPublished}
                    onChange={(e) => setShowOnlyPublished(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="showPublished">
                    Publiées
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showUpcoming"
                    checked={showOnlyUpcoming}
                    onChange={(e) => setShowOnlyUpcoming(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="showUpcoming">
                    À venir
                  </label>
                </div>
                <button
                  className="btn btn-outline-secondary ms-auto"
                  onClick={fetchAnnouncements}
                  title="Rafraîchir"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des annonces */}
      <div className="row">
        {filteredAnnouncements.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              Aucune annonce disponible.
              {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                <Link to="/announcements/create" className="ms-2">
                  Créez votre première annonce
                </Link>
              )}
            </div>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <div className="col-md-6 col-lg-4 mb-4" key={announcement.id}>
              <div className={`card h-100 shadow-sm ${!announcement.published ? 'border-warning' : ''}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <span className={`badge bg-${announcementService.getTypeColor(announcement.type)} me-2`}>
                        <i className={`bi ${announcementService.getTypeIcon(announcement.type)} me-1`}></i>
                        {announcementService.getTypeLabel(announcement.type)}
                      </span>
                      {!announcement.published && (
                        <span className="badge bg-warning">
                          <i className="bi bi-eye-slash me-1"></i>
                          Non publiée
                        </span>
                      )}
                      {announcementService.isUpcoming(announcement.date) && (
                        <span className="badge bg-info ms-2">
                          <i className="bi bi-clock me-1"></i>
                          À venir
                        </span>
                      )}
                    </div>
                    {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          type="button"
                          data-bs-toggle="dropdown"
                        >
                          <i className="bi bi-three-dots"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => handleTogglePublish(announcement.id)}
                            >
                              <i className={`bi bi-eye${announcement.published ? '-slash' : ''} me-2`}></i>
                              {announcement.published ? 'Dépublier' : 'Publier'}
                            </button>
                          </li>
                          <li>
                            <Link
                              to={`/announcements/${announcement.id}/edit`}
                              className="dropdown-item"
                            >
                              <i className="bi bi-pencil me-2"></i>
                              Modifier
                            </Link>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button
                              className="dropdown-item text-danger"
                              onClick={() => handleDelete(announcement.id)}
                            >
                              <i className="bi bi-trash me-2"></i>
                              Supprimer
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <h5 className="card-title">{announcement.title}</h5>
                  
                  <p className="card-text text-muted small mb-3">
                    {announcement.content.length > 100
                      ? `${announcement.content.substring(0, 100)}...`
                      : announcement.content}
                  </p>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-person-circle me-2 text-primary"></i>
                      <small className="text-muted">
                        {announcement.author.firstName && announcement.author.lastName
                          ? `${announcement.author.firstName} ${announcement.author.lastName}`
                          : announcement.author.username}
                      </small>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-calendar3 me-2 text-secondary"></i>
                      <small className="text-muted">
                        {announcementService.formatDate(announcement.date)}
                      </small>
                    </div>
                  </div>
                  
                  <Link
                    to={`/announcements/${announcement.id}`}
                    className="btn btn-outline-primary btn-sm w-100"
                  >
                    <i className="bi bi-eye me-1"></i>
                    Voir les détails
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistiques */}
      <div className="mt-5">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-graph-up me-2"></i>
              Statistiques des annonces
            </h5>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-2 mb-3">
                <div className="card border-primary">
                  <div className="card-body">
                    <h2 className="text-primary">{announcements.length}</h2>
                    <p className="text-muted mb-0">Total</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2 mb-3">
                <div className="card border-success">
                  <div className="card-body">
                    <h2 className="text-success">
                      {announcements.filter(a => a.published).length}
                    </h2>
                    <p className="text-muted mb-0">Publiées</p>
                  </div>
                </div>
              </div>
              {Object.values(AnnouncementType).map(type => (
                <div className="col-md-2 mb-3" key={type}>
                  <div className={`card border-${announcementService.getTypeColor(type)}`}>
                    <div className="card-body">
                      <h2 className={`text-${announcementService.getTypeColor(type)}`}>
                        {announcements.filter(a => a.type === type).length}
                      </h2>
                      <p className="text-muted mb-0">{announcementService.getTypeLabel(type)}</p>
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

export default AnnouncementListPage;