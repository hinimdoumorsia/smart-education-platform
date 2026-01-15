import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { internshipService } from '../../services/internshipService';
import { Internship } from '../../types/internship';

const InternshipListPage: React.FC = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const data = await internshipService.getAll();
      setInternships(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des stages');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await internshipService.getAll({ company: searchQuery });
      setInternships(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce stage ?')) {
      try {
        await internshipService.delete(id);
        setInternships(internships.filter(internship => internship.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
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

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Liste des stages</h1>
        {(user?.role === 'STUDENT' || user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <Link to="/internships/create" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            Nouveau stage
          </Link>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Barre de recherche */}
      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher un stage par entreprise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-outline-secondary" type="submit">
                <i className="bi bi-search"></i> Rechercher
              </button>
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={fetchInternships}
                title="Rafraîchir"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Liste des stages */}
      <div className="row">
        {internships.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              Aucun stage disponible pour le moment.
              {(user?.role === 'STUDENT' || user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                <Link to="/internships/create" className="ms-2">
                  Créez votre premier stage
                </Link>
              )}
            </div>
          </div>
        ) : (
          internships.map((internship) => (
            <div className="col-md-6 col-lg-4 mb-4" key={internship.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0" style={{ maxWidth: '80%' }}>
                      {internship.title}
                    </h5>
                    {getStatusBadge(internship.status)}
                  </div>
                  
                  <p className="card-text text-muted small mb-3">
                    {internship.description && internship.description.length > 120
                      ? `${internship.description.substring(0, 120)}...`
                      : internship.description || 'Pas de description'}
                  </p>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-building me-2 text-primary"></i>
                      <small className="text-muted">
                        {internship.company}
                      </small>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-person-circle me-2 text-success"></i>
                      <small className="text-muted">
                        Étudiant: {internship.student.firstName || internship.student.username}
                      </small>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-person-badge me-2 text-warning"></i>
                      <small className="text-muted">
                        Encadrant: {internship.supervisor.firstName || internship.supervisor.username}
                      </small>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-calendar3 me-2 text-secondary"></i>
                      <small className="text-muted">
                        {new Date(internship.startDate).toLocaleDateString()} - {new Date(internship.endDate).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-between mt-auto">
                    <Link
                      to={`/internships/${internship.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="bi bi-eye me-1"></i>
                      Consulter
                    </Link>
                    
                    {(user?.role === 'ADMIN' || 
                      (user?.role === 'TEACHER' && user?.id === internship.supervisor.id.toString()) ||
                      (user?.role === 'STUDENT' && user?.id === internship.student.id.toString())) && (
                      <div className="btn-group" role="group">
                        <button
                          onClick={() => navigate(`/internships/${internship.id}/edit`)}
                          className="btn btn-outline-warning btn-sm"
                          title="Modifier"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        {(user?.role === 'ADMIN' || 
                          (user?.role === 'STUDENT' && user?.id === internship.student.id.toString())) && (
                          <button
                            onClick={() => handleDelete(internship.id)}
                            className="btn btn-outline-danger btn-sm"
                            title="Supprimer"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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
              Statistiques des stages
            </h5>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-3 mb-3">
                <div className="card border-primary">
                  <div className="card-body">
                    <h2 className="text-primary">{internships.length}</h2>
                    <p className="text-muted mb-0">Stages total</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-success">
                  <div className="card-body">
                    <h2 className="text-success">
                      {internships.filter(i => i.status === 'IN_PROGRESS').length}
                    </h2>
                    <p className="text-muted mb-0">En cours</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-info">
                  <div className="card-body">
                    <h2 className="text-info">
                      {internships.filter(i => i.status === 'COMPLETED').length}
                    </h2>
                    <p className="text-muted mb-0">Terminés</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-warning">
                  <div className="card-body">
                    <h2 className="text-warning">
                      {Array.from(new Set(internships.map(i => i.company))).length}
                    </h2>
                    <p className="text-muted mb-0">Entreprises</p>
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

export default InternshipListPage;