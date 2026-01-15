import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import quizService from '../../services/quizService';
import { QuizAttemptResponseDTO } from '../../types/quiz';

const MyQuizAttemptsPage: React.FC = () => {
  const [attempts, setAttempts] = useState<QuizAttemptResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadAttempts();
    }
  }, [user]);

  const loadAttempts = async () => {
    try {
      setLoading(true);
      const data = await quizService.getUserQuizAttempts(parseInt(user!.id));
      setAttempts(data);
    } catch (err) {
      setError('Erreur lors du chargement des tentatives');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    return <span className={quizService.getStatusBadge(status)}>
      {quizService.getStatusLabel(status)}
    </span>;
  };

  const formatDate = (dateString: string) => {
    return quizService.formatDate(dateString);
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
        <h1>Mes tentatives de quiz</h1>
        <Link to="/quizzes" className="btn btn-primary">
          <i className="bi bi-list me-2"></i>
          Voir tous les quiz
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        {attempts.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              Vous n'avez pas encore passé de quiz.
              <Link to="/quizzes" className="ms-2">
                Commencez votre premier quiz
              </Link>
            </div>
          </div>
        ) : (
          attempts.map((attempt) => (
            <div className="col-md-6 col-lg-4 mb-4" key={attempt.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0" style={{ maxWidth: '80%' }}>
                      {attempt.quizTitle}
                    </h5>
                    <div>
                      {getStatusBadge(attempt.status)}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-person-circle me-2 text-primary"></i>
                      <small className="text-muted">
                        {attempt.studentName}
                      </small>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-calendar3 me-2 text-secondary"></i>
                      <small className="text-muted">
                        Débuté: {formatDate(attempt.attemptedAt)}
                      </small>
                    </div>
                    {attempt.completedAt && (
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-check-circle me-2 text-success"></i>
                        <small className="text-muted">
                          Terminé: {formatDate(attempt.completedAt)}
                        </small>
                      </div>
                    )}
                    {attempt.score !== null && (
                      <div className="d-flex align-items-center">
                        <i className={`bi bi-award me-2 text-${quizService.getScoreColor(attempt.score)}`}></i>
                        <small className={`text-${quizService.getScoreColor(attempt.score)}`}>
                          Score: {quizService.formatScore(attempt.score)}
                        </small>
                      </div>
                    )}
                  </div>
                  
                  <div className="d-flex justify-content-between mt-auto">
                    <Link
                      to={`/quizzes/attempts/${attempt.id}/results`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="bi bi-eye me-1"></i>
                      Voir résultats
                    </Link>
                    
                    <Link
                      to={`/quizzes/${attempt.quizId}`}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      <i className="bi bi-arrow-right me-1"></i>
                      Voir quiz
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistiques personnelles */}
      {attempts.length > 0 && (
        <div className="mt-5">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Mes statistiques de quiz
              </h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3 mb-3">
                  <div className="card border-primary">
                    <div className="card-body">
                      <h2 className="text-primary">{attempts.length}</h2>
                      <p className="text-muted mb-0">Tentatives totales</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card border-success">
                    <div className="card-body">
                      <h2 className="text-success">
                        {attempts.filter(a => a.status === 'COMPLETED').length}
                      </h2>
                      <p className="text-muted mb-0">Terminées</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card border-warning">
                    <div className="card-body">
                      <h2 className="text-warning">
                        {attempts.filter(a => a.status === 'IN_PROGRESS').length}
                      </h2>
                      <p className="text-muted mb-0">En cours</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card border-info">
                    <div className="card-body">
                      <h2 className="text-info">
                        {attempts.length > 0
                          ? quizService.formatScore(
                              attempts
                                .filter(a => a.score !== null)
                                .reduce((sum, a) => sum + (a.score || 0), 0) /
                              attempts.filter(a => a.score !== null).length
                            )
                          : '0%'}
                      </h2>
                      <p className="text-muted mb-0">Score moyen</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyQuizAttemptsPage;