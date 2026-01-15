import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { internshipService } from '../../services/internshipService';
import { Internship } from '../../types/internship';

const MyInternshipsPage: React.FC = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadInternships();
  }, []);

  const loadInternships = async () => {
    setLoading(true);
    try {
      let data: Internship[] = [];
      
      if (user?.role === 'STUDENT') {
        data = await internshipService.getMyInternships();
      } else if (user?.role === 'TEACHER') {
        data = await internshipService.getSupervisedInternships();
      } else {
        data = await internshipService.getAll();
      }
      
      setInternships(data);
    } catch (err) {
      setError('Erreur lors du chargement des stages');
      console.error(err);
    } finally {
      setLoading(false);
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

  const getPageTitle = () => {
    if (user?.role === 'STUDENT') return 'Mes Stages';
    if (user?.role === 'TEACHER') return 'Stages Supervisés';
    return 'Tous les Stages';
  };

  const getPageDescription = () => {
    if (user?.role === 'STUDENT') return 'Suivez vos stages';
    if (user?.role === 'TEACHER') return 'Gérez les stages que vous supervisez';
    return 'Vue d\'ensemble de tous les stages';
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
        <div>
          <h1>{getPageTitle()}</h1>
          <p className="text-muted">{getPageDescription()}</p>
        </div>
        {user?.role === 'STUDENT' && (
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

      <div className="row">
        {internships.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              {user?.role === 'STUDENT' 
                ? "Vous n'avez pas encore de stage enregistré."
                : user?.role === 'TEACHER'
                ? "Aucun stage n'est assigné à votre supervision."
                : "Aucun stage disponible."}
              {user?.role === 'STUDENT' && (
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
                    {internship.description && internship.description.length > 100
                      ? `${internship.description.substring(0, 100)}...`
                      : internship.description || 'Pas de description'}
                  </p>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-building me-2 text-primary"></i>
                      <small className="text-muted">
                        {internship.company}
                      </small>
                    </div>
                    {user?.role === 'TEACHER' && (
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-person-circle me-2 text-success"></i>
                        <small className="text-muted">
                          Étudiant: {internship.student.firstName || internship.student.username}
                        </small>
                      </div>
                    )}
                    {user?.role === 'STUDENT' && (
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-person-badge me-2 text-warning"></i>
                        <small className="text-muted">
                          Encadrant: {internship.supervisor.firstName || internship.supervisor.username}
                        </small>
                      </div>
                    )}
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
                    
                    <Link
                      to={`/internships/${internship.id}/edit`}
                      className="btn btn-outline-warning btn-sm"
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Modifier
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistiques personnelles */}
      <div className="mt-5">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-graph-up me-2"></i>
              Mes statistiques de stages
            </h5>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-3 mb-3">
                <div className="card border-primary">
                  <div className="card-body">
                    <h2 className="text-primary">{internships.length}</h2>
                    <p className="text-muted mb-0">Total</p>
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

export default MyInternshipsPage;