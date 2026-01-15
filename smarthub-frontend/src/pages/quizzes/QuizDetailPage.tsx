import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import quizService from '../../services/quizService';
import { QuizResponseDTO } from '../../types/quiz';

const QuizDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<QuizResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statistics, setStatistics] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadQuiz();
      loadStatistics();
    }
  }, [id]);

  const loadQuiz = async () => {
    try {
      const data = await quizService.getQuizById(parseInt(id!));
      setQuiz(data);
    } catch (err) {
      setError('Erreur lors du chargement du quiz');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await quizService.getQuizStatistics(parseInt(id!));
      setStatistics(stats);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce quiz ? Cette action est irréversible.')) {
      try {
        await quizService.deleteQuiz(quiz!.id);
        navigate('/quizzes');
      } catch (err) {
        alert('Erreur lors de la suppression du quiz');
      }
    }
  };

  const getQuestionTypeBadge = (type: string) => {
    return <span className={quizService.getQuestionTypeBadge(type)}>
      {quizService.getQuestionTypeLabel(type)}
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

  if (error || !quiz) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h5>Erreur</h5>
          <p>{error || 'Quiz non trouvé'}</p>
          <button onClick={() => navigate('/quizzes')} className="btn btn-primary">
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const canEdit = user?.role === 'ADMIN' || user?.role === 'TEACHER';
  const canTakeQuiz = user?.role === 'STUDENT' && quiz.active;

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/quizzes">Quiz</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {quiz.title}
          </li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="mb-0">{quiz.title}</h3>
              <div>
                <span className={`badge ${quiz.active ? 'bg-success' : 'bg-secondary'}`}>
                  {quiz.active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h5>Description</h5>
                <p className="card-text">
                  {quiz.description || (
                    <span className="text-muted">Aucune description fournie</span>
                  )}
                </p>
              </div>

              <div className="mb-4">
                <h5>Questions ({quiz.questions.length})</h5>
                {quiz.questions.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Aucune question dans ce quiz.
                  </div>
                ) : (
                  <div className="list-group">
                    {quiz.questions.map((question, index) => (
                      <div key={question.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <strong>Question {index + 1}:</strong> {question.text}
                          </div>
                          <div>
                            {getQuestionTypeBadge(question.type)}
                          </div>
                        </div>
                        {question.options && question.options.length > 0 && (
                          <div className="mt-2">
                            <small className="text-muted">Options:</small>
                            <ul className="mb-1">
                              {question.options.map((option, optIndex) => (
                                <li key={optIndex} className="small">
                                  {option}
                                  {option === question.correctAnswer && (
                                    <span className="badge bg-success ms-2">Correcte</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {question.type === 'TRUE_FALSE' && (
                          <div className="mt-2">
                            <small className="text-muted">Réponse correcte: </small>
                            <span className="badge bg-info">{question.correctAnswer}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          {/* Actions */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-gear me-2"></i>
                Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {canTakeQuiz && (
                  <Link 
                    to={`/quizzes/${quiz.id}/attempt`}
                    className="btn btn-success"
                  >
                    <i className="bi bi-play-circle me-2"></i>
                    Commencer le quiz
                  </Link>
                )}
                
                {canEdit && (
                  <>
                    <Link 
                      to={`/quizzes/${quiz.id}/edit`}
                      className="btn btn-outline-primary"
                    >
                      <i className="bi bi-pencil me-2"></i>
                      Modifier le quiz
                    </Link>
                    
                    <button 
                      onClick={handleDelete}
                      className="btn btn-outline-danger"
                    >
                      <i className="bi bi-trash me-2"></i>
                      Supprimer
                    </button>
                  </>
                )}

                <Link to="/quizzes" className="btn btn-outline-secondary">
                  <i className="bi bi-arrow-left me-2"></i>
                  Retour à la liste
                </Link>
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Informations
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Créé le:</strong>
                <div>{formatDate(quiz.createdAt)}</div>
              </div>
              <div className="mb-3">
                <strong>Dernière modification:</strong>
                <div>{formatDate(quiz.updatedAt)}</div>
              </div>
              <div className="mb-3">
                <strong>Nombre de questions:</strong>
                <div>{quiz.questions.length}</div>
              </div>
              <div>
                <strong>Statut:</strong>
                <div>
                  <span className={`badge ${quiz.active ? 'bg-success' : 'bg-secondary'}`}>
                    {quiz.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          {statistics && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-graph-up me-2"></i>
                  Statistiques
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-2">
                  <strong>Tentatives complétées:</strong>
                  <div>{statistics.completedAttempts || 0}</div>
                </div>
                <div className="mb-2">
                  <strong>Score moyen:</strong>
                  <div className={`text-${quizService.getScoreColor(statistics.averageScore || 0)}`}>
                    {quizService.formatScore(statistics.averageScore || 0)}
                  </div>
                </div>
                <div className="mb-2">
                  <strong>Score maximum:</strong>
                  <div>{quizService.formatScore(statistics.maxScore || 0)}</div>
                </div>
                <div>
                  <strong>Tentatives en cours:</strong>
                  <div>{statistics.inProgressAttempts || 0}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizDetailPage;