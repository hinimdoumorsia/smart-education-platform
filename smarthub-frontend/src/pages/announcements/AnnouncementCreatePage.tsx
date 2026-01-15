// src/pages/announcements/AnnouncementCreatePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import announcementService from '../../services/announcementService';
import { AnnouncementType } from '../../types/announcement';

const AnnouncementCreatePage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>(AnnouncementType.SEMINAR);
  const [date, setDate] = useState('');
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validation
      if (!title.trim() || !content.trim() || !date) {
        throw new Error('Tous les champs obligatoires doivent être remplis');
      }

      const announcementData = {
        title: title.trim(),
        content: content.trim(),
        type,
        date: new Date(date).toISOString(),
        published
      };

      await announcementService.create(announcementData);
      
      setSuccess('Annonce créée avec succès !');
      
      // Redirection après 2 secondes
      setTimeout(() => {
        navigate('/announcements');
      }, 2000);
      
    } catch (err: any) {
      console.error('Erreur création annonce:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Erreur lors de la création';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Si l'utilisateur est un étudiant, il ne peut pas créer d'annonces
  if (user?.role === 'STUDENT') {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Accès refusé</h4>
          <p>Seuls les enseignants et administrateurs peuvent créer des annonces.</p>
          <button onClick={() => navigate('/announcements')} className="btn btn-primary">
            Retour aux annonces
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">
                <i className="bi bi-plus-circle me-2"></i>
                Créer une nouvelle annonce
              </h2>
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
                  <div className="mt-2">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Redirection...</span>
                    </div>
                    <span className="ms-2">Redirection vers la liste des annonces...</span>
                  </div>
                </div>
              )}
              
              {!success && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      <i className="bi bi-type me-1"></i>
                      Titre *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="Titre de l'annonce"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="type" className="form-label">
                      <i className="bi bi-tag me-1"></i>
                      Type *
                    </label>
                    <select
                      className="form-control"
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value as AnnouncementType)}
                      required
                      disabled={loading}
                    >
                      {Object.values(AnnouncementType).map(typeValue => (
                        <option key={typeValue} value={typeValue}>
                          {announcementService.getTypeLabel(typeValue)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="date" className="form-label">
                      <i className="bi bi-calendar3 me-1"></i>
                      Date et heure *
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">
                      <i className="bi bi-text-paragraph me-1"></i>
                      Contenu *
                    </label>
                    <textarea
                      className="form-control"
                      id="content"
                      rows={8}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="Contenu détaillé de l'annonce..."
                    />
                    <div className="form-text">
                      {content.length}/5000 caractères
                    </div>
                  </div>
                  
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="published"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      disabled={loading}
                    />
                    <label className="form-check-label" htmlFor="published">
                      <i className="bi bi-eye me-1"></i>
                      Publier immédiatement
                    </label>
                    <div className="form-text">
                      Si décoché, l'annonce sera enregistrée mais non visible par les étudiants.
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Auteur : {user?.firstName} {user?.lastName} ({user?.username})
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-between mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => navigate('/announcements')}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-left me-1"></i>
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading || !title.trim() || !content.trim() || !date}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Création...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Créer l'annonce
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementCreatePage;