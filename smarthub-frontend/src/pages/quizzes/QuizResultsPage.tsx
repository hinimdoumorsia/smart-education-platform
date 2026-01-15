import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';
import { QuizAttemptResponseDTO, QuestionType } from '../../types/quiz';

const QuizResultsPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [attempt, setAttempt] = useState<QuizAttemptResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (attemptId) {
      loadResults();
    }
  }, [attemptId]);

  const loadResults = async () => {
    try {
      const data = await quizService.getQuizAttempt(parseInt(attemptId!));
      setAttempt(data);
    } catch (err) {
      setError('Erreur lors du chargement des résultats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getAnswerStatus = (isCorrect: boolean | undefined) => {
    if (isCorrect === undefined) return 'warning';
    return isCorrect ? 'success' : 'danger';
  };

  const getAnswerStatusText = (isCorrect: boolean | undefined) => {
    if (isCorrect === undefined) return 'Non noté';
    return isCorrect ? 'Correct' : 'Incorrect';
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

  if (error || !attempt) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h5>Erreur</h5>
          <p>{error || 'Résultats non trouvés'}</p>
          <button onClick={() => navigate('/quizzes')} className="btn btn-primary">
            Retour aux quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/quizzes">Quiz</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/quizzes/${attempt.quizId}`}>{attempt.quizTitle}</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Résultats
          </li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">Résultats du quiz</h3>
            </div>
            <div className="card-body">
              {/* Résumé */}
              <div className="row text-center mb-4">
                <div className="col-md-6 mb-3">
                  <div className="card border-primary">
                    <div className="card-body">
                      <h2 className={`text-${quizService.getScoreColor(attempt.score || 0)}`}>
                        {quizService.formatScore(attempt.score)}
                      </h2>
                      <p className="text-muted mb-0">Score final</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="card border-success">
                    <div className="card-body">
                      <h2 className="text-success">
                        {attempt.answers.filter(a => a.isCorrect).length} / {attempt.answers.length}
                      </h2>
                      <p className="text-muted mb-0">Réponses correctes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Détails des réponses */}
              <h5 className="mb-3">Détails des réponses</h5>
              <div className="accordion" id="answersAccordion">
                {attempt.answers.map((answer, index) => (
                  <div key={answer.id} className="accordion-item mb-2">
                    <h2 className="accordion-header">
                      <button
                        className="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#answer-${answer.id}`}
                      >
                        <div className="d-flex justify-content-between align-items-center w-100">
                          <span>
                            Question {index + 1}
                          </span>
                          <span className={`badge bg-${getAnswerStatus(answer.isCorrect)}`}>
                            {getAnswerStatusText(answer.isCorrect)}
                          </span>
                        </div>
                      </button>
                    </h2>
                    <div
                      id={`answer-${answer.id}`}
                      className="accordion-collapse collapse show"
                      data-bs-parent="#answersAccordion"
                    >
                      <div className="accordion-body">
                        <div className="mb-2">
                          <strong>Question:</strong>
                          <p>{answer.questionText}</p>
                        </div>
                        
                        <div className="mb-2">
                          <strong>Votre réponse:</strong>
                          <p className={`text-${answer.isCorrect ? 'success' : 'danger'}`}>
                            {answer.answerText}
                          </p>
                        </div>
                        
                        {answer.correctAnswer && (
                          <div className="mb-2">
                            <strong>Réponse correcte:</strong>
                            <p className="text-success">{answer.correctAnswer}</p>
                          </div>
                        )}
                        
                        {answer.isCorrect !== undefined && !answer.isCorrect && answer.correctAnswer && (
                          <div className="alert alert-warning">
                            <i className="bi bi-lightbulb me-2"></i>
                            <strong>Explication:</strong> La réponse correcte est "{answer.correctAnswer}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          {/* Informations sur la tentative */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Informations
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Quiz:</strong>
                <div>{attempt.quizTitle}</div>
              </div>
              
              <div className="mb-3">
                <strong>Étudiant:</strong>
                <div>{attempt.studentName}</div>
              </div>
              
              <div className="mb-3">
                <strong>Débuté le:</strong>
                <div>{quizService.formatDate(attempt.attemptedAt)}</div>
              </div>
              
              <div className="mb-3">
                <strong>Terminé le:</strong>
                <div>{attempt.completedAt ? quizService.formatDate(attempt.completedAt) : 'Non terminé'}</div>
              </div>
              
              <div className="mb-3">
                <strong>Statut:</strong>
                <div>
                  <span className={quizService.getStatusBadge(attempt.status)}>
                    {quizService.getStatusLabel(attempt.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-gear me-2"></i>
                Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link to={`/quizzes/${attempt.quizId}`} className="btn btn-outline-primary">
                  <i className="bi bi-arrow-left me-2"></i>
                  Retour au quiz
                </Link>
                
                <Link to="/quizzes" className="btn btn-outline-secondary">
                  <i className="bi bi-list me-2"></i>
                  Voir tous les quiz
                </Link>
                
                {attempt.status === 'COMPLETED' && (
                  <button 
                    className="btn btn-outline-success"
                    onClick={() => {
                      // Option pour refaire le quiz
                      if (window.confirm('Voulez-vous refaire ce quiz ?')) {
                        navigate(`/quizzes/${attempt.quizId}/attempt`);
                      }
                    }}
                  >
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Refaire le quiz
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Performance
              </h5>
            </div>
            <div className="card-body">
              <div className="progress mb-3" style={{ height: '30px' }}>
                <div 
                  className={`progress-bar bg-${quizService.getScoreColor(attempt.score || 0)}`}
                  style={{ width: `${attempt.score || 0}%` }}
                  role="progressbar"
                >
                  {quizService.formatScore(attempt.score)}
                </div>
              </div>
              
              <div className="text-center">
                <div className={`display-6 text-${quizService.getScoreColor(attempt.score || 0)}`}>
                  {quizService.formatScore(attempt.score)}
                </div>
                <p className="text-muted">Score final</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResultsPage;