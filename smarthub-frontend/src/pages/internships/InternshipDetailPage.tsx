import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { internshipService } from '../../services/internshipService';
import { Internship } from '../../types/internship';

const InternshipDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadInternship();
    }
  }, [id]);

  const loadInternship = async () => {
    try {
      const data = await internshipService.getById(parseInt(id!));
      setInternship(data);
    } catch (err) {
      setError('Erreur lors du chargement du stage');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce stage ? Cette action est irréversible.')) {
      try {
        await internshipService.delete(internship!.id);
        navigate('/internships');
      } catch (err) {
        alert('Erreur lors de la suppression du stage');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return <span className="badge bg-info">Planifié</span>;
      case 'IN_PROGRESS':
        return <span className="badge bg-success">En cours</span>;
      case 'COMPLETED':
        return <span className="badge bg-secondary">Terminé</span>;
      case 'CANCELLED':
        return <span className="badge bg-danger">Annulé</span>;
      default:
        return <span className="badge bg-warning">{status}</span>;
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

  if (error || !internship) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h5>Erreur</h5>
          <p>{error || 'Stage non trouvé'}</p>
          <button onClick={() => navigate('/internships')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const canEdit = user?.role === 'ADMIN' || 
    (user?.role === 'TEACHER' && user?.id === internship.supervisor.id.toString());
  
  const canDelete = user?.role === 'ADMIN' || 
    (user?.role === 'STUDENT' && user?.id === internship.student.id.toString());

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/internships">Stages</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {internship.title}
          </li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="mb-0">{internship.title}</h3>
              <div>
                {getStatusBadge(internship.status)}
              </div>
            </div>
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-building me-2"></i>
                {internship.company}
              </h5>
              
              <div className="mb-4">
                <h6>Description</h6>
                <p className="card-text">
                  {internship.description || (
                    <span className="text-muted">Aucune description fournie</span>
                  )}
                </p>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <h6><i className="bi bi-calendar3 me-2"></i>Dates</h6>
                    <p className="mb-1">
                      <strong>Début:</strong> {new Date(internship.startDate).toLocaleDateString()}
                    </p>
                    <p className="mb-0">
                      <strong>Fin:</strong> {new Date(internship.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <h6><i className="bi bi-clock-history me-2"></i>Durée</h6>
                    <p>
                      {Math.ceil(
                        (new Date(internship.endDate).getTime() - new Date(internship.startDate).getTime()) 
                        / (1000 * 60 * 60 * 24)
                      )} jours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          {/* Participants Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-people me-2"></i>
                Participants
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <h6>Étudiant</h6>
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <i className="bi bi-person-circle fs-4 text-primary"></i>
                  </div>
                  <div>
                    <strong>{internship.student.firstName || internship.student.username}</strong>
                    <div className="text-muted small">{internship.student.email}</div>
                    <span className="badge bg-info">Étudiant</span>
                  </div>
                </div>
              </div>

              <div>
                <h6>Encadrant</h6>
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <i className="bi bi-person-badge fs-4 text-success"></i>
                  </div>
                  <div>
                    <strong>{internship.supervisor.firstName || internship.supervisor.username}</strong>
                    <div className="text-muted small">{internship.supervisor.email}</div>
                    <span className="badge bg-success">Encadrant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Card */}
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
                  to={`/internships/${internship.id}/edit`}
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

                <Link to="/internships" className="btn btn-outline-secondary">
                  <i className="bi bi-arrow-left me-2"></i>
                  Retour à la liste
                </Link>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Informations
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-2">
                <strong>Créé le:</strong>
                <div>{new Date(internship.createdAt).toLocaleDateString()}</div>
              </div>
              <div>
                <strong>Dernière modification:</strong>
                <div>{new Date(internship.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternshipDetailPage;