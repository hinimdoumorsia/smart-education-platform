import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import quizService from '../../services/quizService';
import { QuizResponseDTO, Answer, QuestionType, AttemptStatus } from '../../types/quiz';

const QuizAttemptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<QuizResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id && user) {
      startAttempt();
    }
  }, [id, user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeRemaining !== null && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeRemaining === 0) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const startAttempt = async () => {
    try {
      setLoading(true);
      const quizData = await quizService.getQuizById(parseInt(id!));
      setQuiz(quizData);

      // Commencer ou reprendre une tentative
      const attempt = await quizService.resumeOrStartQuizAttempt(parseInt(user!.id), parseInt(id!));
      setAttemptId(attempt.id);

      // Initialiser les réponses existantes
      const initialAnswers: Record<number, string | string[]> = {};
      attempt.answers.forEach((answer: any) => {
        initialAnswers[answer.questionId] = answer.answerText;
      });
      setAnswers(initialAnswers);

      // Définir un timer si nécessaire (par exemple, 30 minutes)
      setTimeRemaining(30 * 60); // 30 minutes en secondes

    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du démarrage du quiz');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, value: string | string[], type: QuestionType) => {
    setAnswers(prev => {
      if (type === QuestionType.MULTIPLE_CHOICE) {
        const currentAnswers = Array.isArray(prev[questionId]) ? prev[questionId] as string[] : [];
        const newAnswers = Array.isArray(value) ? value : [value];
        
        // Toggle the selected value
        const updatedAnswers = newAnswers[0] === 'toggle' 
          ? currentAnswers.includes(value as string)
            ? currentAnswers.filter(v => v !== value)
            : [...currentAnswers, value as string]
          : newAnswers;

        return { ...prev, [questionId]: updatedAnswers };
      } else {
        return { ...prev, [questionId]: value };
      }
    });
  };

  const handleSubmit = async () => {
    if (!attemptId || !quiz) return;

    try {
      setSubmitting(true);
      setError('');

      // Préparer les réponses pour la soumission
      const answerArray: Array<{ questionId: number; answerText: string }> = [];
      
      Object.entries(answers).forEach(([questionIdStr, answerValue]) => {
        const questionId = parseInt(questionIdStr);
        const question = quiz.questions.find(q => q.id === questionId);
        
        if (question) {
          let answerText = '';
          
          if (question.type === QuestionType.MULTIPLE_CHOICE && Array.isArray(answerValue)) {
            answerText = answerValue.join(';');
          } else {
            answerText = answerValue as string;
          }
          
          answerArray.push({ questionId, answerText });
        }
      });

      // Soumettre la tentative
      const result = await quizService.submitQuizAttempt(quiz.id, attemptId, answerArray);
      
      // Rediriger vers les résultats
      navigate(`/quizzes/attempts/${attemptId}/results`);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission du quiz');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Préparation du quiz...</p>
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

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/quizzes">Quiz</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/quizzes/${quiz.id}`}>{quiz.title}</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Passation
          </li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="mb-0">{quiz.title}</h3>
              {timeRemaining !== null && (
                <div className={`badge ${timeRemaining < 300 ? 'bg-danger' : 'bg-warning'}`}>
                  <i className="bi bi-clock me-1"></i>
                  {formatTime(timeRemaining)}
                </div>
              )}
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h5>Description</h5>
                <p>{quiz.description || 'Aucune description'}</p>
              </div>

              <div className="mb-4">
                <h5>Questions ({quiz.questions.length})</h5>
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Répondez à toutes les questions avant de soumettre
                </div>
              </div>

              <form>
                {quiz.questions.map((question, index) => (
                  <div key={question.id} className="card mb-4">
                    <div className="card-header">
                      <h6 className="mb-0">
                        Question {index + 1}
                        <span className={`badge ${quizService.getQuestionTypeBadge(question.type)} ms-2`}>
                          {quizService.getQuestionTypeLabel(question.type)}
                        </span>
                      </h6>
                    </div>
                    <div className="card-body">
                      <p className="card-text mb-3">{question.text}</p>

                      {question.type === QuestionType.SINGLE_CHOICE && question.options.length > 0 && (
                        <div className="list-group">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="list-group-item">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name={`question-${question.id}`}
                                  id={`option-${question.id}-${optIndex}`}
                                  value={option}
                                  checked={answers[question.id] === option}
                                  onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
                                />
                                <label className="form-check-label" htmlFor={`option-${question.id}-${optIndex}`}>
                                  {option}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === QuestionType.MULTIPLE_CHOICE && question.options.length > 0 && (
                        <div className="list-group">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="list-group-item">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  name={`question-${question.id}`}
                                  id={`option-${question.id}-${optIndex}`}
                                  value={option}
                                  checked={Array.isArray(answers[question.id]) && (answers[question.id] as string[]).includes(option)}
                                  onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
                                />
                                <label className="form-check-label" htmlFor={`option-${question.id}-${optIndex}`}>
                                  {option}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === QuestionType.TRUE_FALSE && (
                        <div className="btn-group" role="group">
                          <input
                            type="radio"
                            className="btn-check"
                            name={`question-${question.id}`}
                            id={`true-${question.id}`}
                            value="Vrai"
                            checked={answers[question.id] === 'Vrai'}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
                          />
                          <label className="btn btn-outline-success" htmlFor={`true-${question.id}`}>
                            Vrai
                          </label>

                          <input
                            type="radio"
                            className="btn-check"
                            name={`question-${question.id}`}
                            id={`false-${question.id}`}
                            value="Faux"
                            checked={answers[question.id] === 'Faux'}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
                          />
                          <label className="btn btn-outline-danger" htmlFor={`false-${question.id}`}>
                            Faux
                          </label>
                        </div>
                      )}

                      {question.type === QuestionType.OPEN_ENDED && (
                        <div className="form-group">
                          <textarea
                            className="form-control"
                            rows={4}
                            placeholder="Votre réponse..."
                            value={answers[question.id] as string || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value, question.type)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {/* Progression */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-list-check me-2"></i>
                Progression
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Questions répondues</small>
                  <small>{Object.keys(answers).length} / {quiz.questions.length}</small>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${(Object.keys(answers).length / quiz.questions.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>

              <div className="list-group list-group-flush">
                {quiz.questions.map((question, index) => (
                  <a 
                    key={question.id}
                    href={`#question-${index}`}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${answers[question.id] ? 'list-group-item-success' : ''}`}
                  >
                    <span>Question {index + 1}</span>
                    <span className={`badge ${answers[question.id] ? 'bg-success' : 'bg-secondary'}`}>
                      {answers[question.id] ? 'Répondu' : 'Non répondu'}
                    </span>
                  </a>
                ))}
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
                <button
                  className="btn btn-success"
                  onClick={handleSubmit}
                  disabled={submitting || Object.keys(answers).length === 0}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Soumission en cours...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Soumettre le quiz
                    </>
                  )}
                </button>

                <button
                  className="btn btn-outline-warning"
                  onClick={() => {
                    if (window.confirm('Êtes-vous sûr de vouloir sauvegarder et quitter ? Vous pourrez reprendre plus tard.')) {
                      navigate('/quizzes');
                    }
                  }}
                >
                  <i className="bi bi-save me-2"></i>
                  Sauvegarder et quitter
                </button>

                <Link to={`/quizzes/${quiz.id}`} className="btn btn-outline-secondary">
                  <i className="bi bi-arrow-left me-2"></i>
                  Annuler et retourner
                </Link>
              </div>

              {error && (
                <div className="alert alert-danger mt-3" role="alert">
                  {error}
                </div>
              )}

              <div className="alert alert-info mt-3">
                <i className="bi bi-info-circle me-2"></i>
                <small>
                  Vous pouvez quitter et reprendre ce quiz plus tard. 
                  Vos réponses sont sauvegardées automatiquement.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAttemptPage;