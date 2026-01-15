import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import resourceService from '../../services/resourceService';
import { Resource } from '../../types/resource';

const ResourceListPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await resourceService.getAll();
      setResources(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des ressources');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (searchQuery) {
        const data = await resourceService.search(searchQuery);
        setResources(data);
      } else {
        fetchResources();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterByType = async (type: string) => {
    try {
      setLoading(true);
      setSelectedType(type);
      if (type) {
        const data = await resourceService.getByType(type);
        setResources(data);
      } else {
        fetchResources();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du filtrage');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) {
      try {
        await resourceService.delete(id);
        setResources(resources.filter(resource => resource.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
      }
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
        <h1>Ressources de recherche</h1>
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

      {/* Barre de recherche et filtres */}
      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher par titre ou résumé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-outline-primary" type="submit">
                <i className="bi bi-search"></i> Rechercher
              </button>
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('');
                  fetchResources();
                }}
                title="Réinitialiser"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </form>

          {/* Filtres par type */}
          <div className="d-flex flex-wrap gap-2">
            <button
              className={`btn btn-sm ${selectedType === '' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleFilterByType('')}
            >
              Tous
            </button>
            <button
              className={`btn btn-sm ${selectedType === 'ARTICLE' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleFilterByType('ARTICLE')}
            >
              Articles
            </button>
            <button
              className={`btn btn-sm ${selectedType === 'THESIS' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => handleFilterByType('THESIS')}
            >
              Thèses
            </button>
            <button
              className={`btn btn-sm ${selectedType === 'PUBLICATION' ? 'btn-info' : 'btn-outline-info'}`}
              onClick={() => handleFilterByType('PUBLICATION')}
            >
              Publications
            </button>
            <button
              className={`btn btn-sm ${selectedType === 'REPORT' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => handleFilterByType('REPORT')}
            >
              Rapports
            </button>
          </div>
        </div>
      </div>

      {/* Liste des ressources */}
      <div className="row">
        {resources.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              Aucune ressource disponible pour le moment.
              {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                <Link to="/resources/create" className="ms-2">
                  Ajoutez votre première ressource
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
                    {resource.abstractText && resource.abstractText.length > 120
                      ? `${resource.abstractText.substring(0, 120)}...`
                      : resource.abstractText || 'Pas de résumé'}
                  </p>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-people me-2 text-primary"></i>
                      <small className="text-muted">
                        {resource.authors.map(a => a.firstName || a.username).join(', ')}
                      </small>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-calendar3 me-2 text-secondary"></i>
                      <small className="text-muted">
                        Publié le: {formatDate(resource.publicationDate)}
                      </small>
                    </div>
                    {resource.fileSize && (
                      <div className="d-flex align-items-center">
                        <i className={`bi ${resourceService.getFileIcon(resource.fileType)} me-2`}></i>
                        <small className="text-muted">
                          {resourceService.formatFileSize(resource.fileSize)}
                          {resource.originalFileName && (
                            <span className="ms-2">{resource.originalFileName}</span>
                          )}
                        </small>
                      </div>
                    )}
                  </div>
                  
                  <div className="d-flex justify-content-between mt-auto">
                    <Link
                      to={`/resources/${resource.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="bi bi-eye me-1"></i>
                      Consulter
                    </Link>
                    
                    {(user?.role === 'ADMIN' || 
                      resource.authors.some(author => author.id.toString() === user?.id)) && (
                      <div className="btn-group" role="group">
                        <button
                          onClick={() => navigate(`/resources/${resource.id}/edit`)}
                          className="btn btn-outline-warning btn-sm"
                          title="Modifier"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          className="btn btn-outline-danger btn-sm"
                          title="Supprimer"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
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
              Statistiques des ressources
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
                      {Array.from(new Set(resources.flatMap(r => r.authors.map(a => a.id)))).length}
                    </h2>
                    <p className="text-muted mb-0">Auteurs uniques</p>
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

export default ResourceListPage;