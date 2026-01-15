// src/pages/announcements/AnnouncementEditPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import announcementService from '../../services/announcementService';
import { AnnouncementType } from '../../types/announcement';

const AnnouncementEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>(AnnouncementType.SEMINAR);
  const [date, setDate] = useState('');
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
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
      
      // Pré-remplir le formulaire
      setTitle(data.title);
      setContent(data.content);
      setType(data.type);
      
      // Formater la date pour l'input datetime-local
      const dateObj = new Date(data.date);
      const formattedDate = dateObj.toISOString().slice(0, 16);
      setDate(formattedDate);
      
      setPublished(data.published);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement de l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

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

      await announcementService.update(parseInt(id!), announcementData);
      
      setSuccess('Annonce mise à jour avec succès !');
      
      // Redirection après 2 secondes
      setTimeout(() => {
        navigate(`/announcements/${id}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Erreur mise à jour annonce:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Erreur lors de la mise à jour';
      setError(errorMsg);
    } finally {
      setSaving(false);
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

  // Vérifier si l'utilisateur est l'auteur ou admin
  const isAuthor = user?.id === announcement?.author.id.toString() || user?.role === 'ADMIN';
  
  if (!isAuthor) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Accès refusé</h4>
          <p>Vous n'êtes pas autorisé à modifier cette annonce.</p>
          <button onClick={() => navigate(`/announcements/${id}`)} className="btn btn-primary">
            Retour aux détails
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
            <div className="card-header bg-warning text-dark">
              <h2 className="mb-0">
                <i className="bi bi-pencil me-2"></i>
                Modifier l'annonce
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
                    <span className="ms-2">Redirection vers les détails...</span>
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
                      disabled={saving}
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
                      disabled={saving}
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
                      disabled={saving}
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
                      disabled={saving}
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
                      disabled={saving}
                    />
                    <label className="form-check-label" htmlFor="published">
                      <i className="bi bi-eye me-1"></i>
                      Publiée
                    </label>
                  </div>
                  
                  <div className="d-flex justify-content-between mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => navigate(`/announcements/${id}`)}
                      disabled={saving}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-warning"
                      disabled={saving || !title.trim() || !content.trim() || !date}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Enregistrer les modifications
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

export default AnnouncementEditPage;