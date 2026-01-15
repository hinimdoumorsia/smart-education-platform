import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import resourceService from '../../services/resourceService';
import { Resource } from '../../types/resource';

const MyResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      let data: Resource[] = [];
      
      if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
        data = await resourceService.getMyResources();
      } else {
        // Pour les étudiants, on peut montrer les ressources où ils sont co-auteurs
        if (user?.id) {
          data = await resourceService.getByAuthor(parseInt(user.id));
        }
      }
      
      setResources(data);
    } catch (err) {
      setError('Erreur lors du chargement des ressources');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    return <span className={resourceService.getTypeBadge(type)}>
      {resourceService.getTypeLabel(type)}
    </span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getPageTitle = () => {
    if (user?.role === 'TEACHER') return 'Mes Ressources';
    if (user?.role === 'ADMIN') return 'Toutes les Ressources';
    return 'Ressources où je suis co-auteur';
  };

  const getPageDescription = () => {
    if (user?.role === 'TEACHER') return 'Gérez vos publications et ressources de recherche';
    if (user?.role === 'ADMIN') return 'Vue d\'ensemble de toutes les ressources';
    return 'Ressources où vous êtes listé comme co-auteur';
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
        {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <Link to="/resources/create" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            Nouvelle ressource
          </Link>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        {resources.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              {user?.role === 'TEACHER' 
                ? "Vous n'avez pas encore publié de ressource."
                : user?.role === 'ADMIN'
                ? "Aucune ressource disponible."
                : "Vous n'êtes pas encore co-auteur d'une ressource."}
              {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                <Link to="/resources/create" className="ms-2">
                  Créez votre première ressource
                </Link>
              )}
            </div>
          </div>
        ) : (
          resources.map((resource) => (
            <div className="col-md-6 col-lg-4 mb-4" key={resource.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0" style={{ maxWidth: '80%' }}>
                      {resource.title}
                    </h5>
                    <div>
                      {getTypeBadge(resource.type)}
                    </div>
                  </div>
                  
                  <p className="card-text text-muted small mb-3">
                    {resource.abstractText && resource.abstractText.length > 100
                      ? `${resource.abstractText.substring(0, 100)}...`
                      : resource.abstractText || 'Pas de résumé'}
                  </p>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-people me-2 text-primary"></i>
                      <small className="text-muted">
                        Co-auteurs: {resource.authors.map(a => a.firstName || a.username).join(', ')}
                      </small>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-calendar3 me-2 text-secondary"></i>
                      <small className="text-muted">
                        Publié: {formatDate(resource.publicationDate)}
                      </small>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-between mt-auto">
                    <Link
                      to={`/resources/${resource.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="bi bi-eye me-1"></i>
                      Consulter
                    </Link>
                    
                    <Link
                      to={`/resources/${resource.id}/edit`}
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
              Mes statistiques de ressources
            </h5>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-3 mb-3">
                <div className="card border-primary">
                  <div className="card-body">
                    <h2 className="text-primary">{resources.length}</h2>
                    <p className="text-muted mb-0">Total</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-success">
                  <div className="card-body">
                    <h2 className="text-success">
                      {resources.filter(r => r.type === 'ARTICLE').length}
                    </h2>
                    <p className="text-muted mb-0">Articles</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-info">
                  <div className="card-body">
                    <h2 className="text-info">
                      {resources.filter(r => r.type === 'THESIS').length}
                    </h2>
                    <p className="text-muted mb-0">Thèses</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-warning">
                  <div className="card-body">
                    <h2 className="text-warning">
                      {new Set(resources.flatMap(r => r.authors.map(a => a.id))).size}
                    </h2>
                    <p className="text-muted mb-0">Co-auteurs uniques</p>
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

export default MyResourcesPage;