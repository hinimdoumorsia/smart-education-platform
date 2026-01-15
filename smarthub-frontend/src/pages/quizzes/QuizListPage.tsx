import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import quizService from '../../services/quizService';
import { QuizSummaryDTO } from '../../types/quiz';

const QuizListPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const filters = showActiveOnly ? { active: true } : {};
      const data = await quizService.getAllQuizzes(filters);
      setQuizzes(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await quizService.searchQuizzes(searchQuery);
      setQuizzes(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      try {
        await quizService.deleteQuiz(id);
        setQuizzes(quizzes.filter(quiz => quiz.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const getActiveBadge = (active: boolean) => {
    return active ? (
      <span className="badge bg-success">Actif</span>
    ) : (
      <span className="badge bg-secondary">Inactif</span>
    );
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
        <h1>Quiz disponibles</h1>
        {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <div className="btn-group" role="group">
            <Link to="/quizzes/create" className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              Créer un quiz
            </Link>
            <Link to="/quizzes/generate" className="btn btn-outline-primary">
              <i className="bi bi-magic me-2"></i>
              Générer avec IA
            </Link>
          </div>
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
          <div className="row">
            <div className="col-md-8">
              <form onSubmit={handleSearch}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher un quiz par titre..."
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
                      fetchQuizzes();
                    }}
                    title="Réinitialiser"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                </div>
              </form>
            </div>
            <div className="col-md-4">
              <div className="form-check form-switch mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="activeFilter"
                  checked={showActiveOnly}
                  onChange={(e) => {
                    setShowActiveOnly(e.target.checked);
                    fetchQuizzes();
                  }}
                />
                <label className="form-check-label" htmlFor="activeFilter">
                  Afficher seulement les quiz actifs
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des quiz */}
      <div className="row">
        {quizzes.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              Aucun quiz disponible pour le moment.
              {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                <Link to="/quizzes/create" className="ms-2">
                  Créez votre premier quiz
                </Link>
              )}
            </div>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div className="col-md-6 col-lg-4 mb-4" key={quiz.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0" style={{ maxWidth: '80%' }}>
                      {quiz.title}
                    </h5>
                    <div>
                      {getActiveBadge(quiz.active)}
                    </div>
                  </div>
                  
                  <p className="card-text text-muted small mb-3">
                    {quiz.description && quiz.description.length > 100
                      ? `${quiz.description.substring(0, 100)}...`
                      : quiz.description || 'Pas de description'}
                  </p>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-question-circle me-2 text-primary"></i>
                      <small className="text-muted">
                        {quiz.questionCount} questions
                      </small>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-calendar3 me-2 text-secondary"></i>
                      <small className="text-muted">
                        Créé le: {formatDate(quiz.createdAt)}
                      </small>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-between mt-auto">
                    <div>
                      <Link
                        to={`/quizzes/${quiz.id}`}
                        className="btn btn-outline-primary btn-sm me-2"
                      >
                        <i className="bi bi-eye me-1"></i>
                        Consulter
                      </Link>
                      {user?.role === 'STUDENT' && (
                        <Link
                          to={`/quizzes/${quiz.id}/attempt`}
                          className="btn btn-success btn-sm"
                        >
                          <i className="bi bi-play-circle me-1"></i>
                          Commencer
                        </Link>
                      )}
                    </div>
                    
                    {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
                      <div className="btn-group" role="group">
                        <button
                          onClick={() => navigate(`/quizzes/${quiz.id}/edit`)}
                          className="btn btn-outline-warning btn-sm"
                          title="Modifier"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(quiz.id)}
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
              Statistiques des quiz
            </h5>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-3 mb-3">
                <div className="card border-primary">
                  <div className="card-body">
                    <h2 className="text-primary">{quizzes.length}</h2>
                    <p className="text-muted mb-0">Quiz total</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-success">
                  <div className="card-body">
                    <h2 className="text-success">
                      {quizzes.filter(q => q.active).length}
                    </h2>
                    <p className="text-muted mb-0">Quiz actifs</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-info">
                  <div className="card-body">
                    <h2 className="text-info">
                      {quizzes.reduce((total, quiz) => total + (quiz.questionCount || 0), 0)}
                    </h2>
                    <p className="text-muted mb-0">Questions total</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-warning">
                  <div className="card-body">
                    <h2 className="text-warning">
                      {quizzes.filter(q => !q.active).length}
                    </h2>
                    <p className="text-muted mb-0">Quiz inactifs</p>
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

export default QuizListPage;