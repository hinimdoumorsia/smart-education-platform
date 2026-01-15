import React, { useState, useEffect } from 'react';
import { 
  FaClock, 
  FaCheck, 
  FaTimes, 
  FaExclamationTriangle, 
  FaQuestionCircle 
} from 'react-icons/fa';

interface QuizModalProps {
  attempt: any;
  onClose: () => void;
  onSubmit: (answers: any) => Promise<void>;
}

const CourseQuizModal: React.FC<QuizModalProps> = ({ attempt, onClose, onSubmit }) => {
  const [timeLeft, setTimeLeft] = useState(attempt.remainingTimeMinutes * 60);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, value: any, questionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Marquer la question comme répondue
    setAnsweredQuestions(prev => {
      const newSet = new Set(prev);
      newSet.add(questionIndex);
      return newSet;
    });
  };

  const handleAutoSubmit = async () => {
    if (!submitting) {
      setSubmitting(true);
      await onSubmit(answers);
      onClose();
    }
  };

  const handleManualSubmit = async () => {
    const unanswered = attempt.quizResponse?.questions?.length - answeredQuestions.size;
    
    if (unanswered > 0) {
      if (!window.confirm(`Vous avez ${unanswered} question(s) sans réponse. Souhaitez-vous quand même soumettre ?`)) {
        return;
      }
    }
    
    if (window.confirm('Êtes-vous sûr de vouloir soumettre vos réponses ?')) {
      setSubmitting(true);
      await onSubmit(answers);
      onClose();
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (attempt.quizResponse?.questions?.length || 1) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getQuestionStatus = (index: number) => {
    if (answers[`q${index}`] !== undefined) {
      return 'answered';
    }
    return 'unanswered';
  };

  const renderQuestion = (question: any, index: number) => {
    return (
      <div key={question.id || index} className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <strong>Question {index + 1}:</strong> {question.text}
            {question.explanation && (
              <div className="small text-muted mt-1">
                <FaExclamationTriangle className="me-1" />
                {question.explanation}
              </div>
            )}
          </div>
          <div>
            <span className={`badge ${getQuestionStatus(index) === 'answered' ? 'bg-success' : 'bg-warning'}`}>
              {getQuestionStatus(index) === 'answered' ? 'Répondu' : 'Non répondu'}
            </span>
          </div>
        </div>
        
        <div className="card-body">
          {question.type === 'SINGLE_CHOICE' && (
            <div className="list-group">
              {question.options.map((option: string, optIndex: number) => (
                <label key={optIndex} className="list-group-item list-group-item-action">
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={option}
                    checked={answers[`q${index}`] === option}
                    onChange={() => handleAnswerChange(`q${index}`, option, index)}
                    className="me-2"
                  />
                  {option}
                </label>
              ))}
            </div>
          )}
          
          {question.type === 'MULTIPLE_CHOICE' && (
            <div className="list-group">
              {question.options.map((option: string, optIndex: number) => {
                const currentAnswers = answers[`q${index}`] || [];
                const isChecked = currentAnswers.includes(option);
                
                return (
                  <label key={optIndex} className="list-group-item list-group-item-action">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const current = answers[`q${index}`] || [];
                        let newValue;
                        if (e.target.checked) {
                          newValue = [...current, option];
                        } else {
                          newValue = current.filter((opt: string) => opt !== option);
                        }
                        handleAnswerChange(`q${index}`, newValue, index);
                      }}
                      className="me-2"
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          )}
          
          {question.type === 'TRUE_FALSE' && (
            <div className="btn-group w-100">
              <button
                type="button"
                className={`btn btn-lg ${answers[`q${index}`] === 'true' ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => handleAnswerChange(`q${index}`, 'true', index)}
              >
                <FaCheck className="me-2" /> Vrai
              </button>
              <button
                type="button"
                className={`btn btn-lg ${answers[`q${index}`] === 'false' ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => handleAnswerChange(`q${index}`, 'false', index)}
              >
                <FaTimes className="me-2" /> Faux
              </button>
            </div>
          )}
          
          {question.type === 'SHORT_ANSWER' && (
            <div className="form-group">
              <textarea
                className="form-control"
                rows={3}
                value={answers[`q${index}`] || ''}
                onChange={(e) => handleAnswerChange(`q${index}`, e.target.value, index)}
                placeholder="Votre réponse..."
              />
              <small className="text-muted">Réponse courte attendue (1-2 phrases)</small>
            </div>
          )}
          
          {question.type === 'MATCHING' && question.pairs && (
            <div className="row">
              <div className="col-md-6">
                <h6>Colonne A</h6>
                <ul className="list-group">
                  {question.pairs.map((pair: any, pairIndex: number) => (
                    <li key={pairIndex} className="list-group-item">
                      {pair.left}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-md-6">
                <h6>Colonne B</h6>
                <select 
                  className="form-select mb-2"
                  onChange={(e) => {
                    const matchAnswers = answers[`q${index}`] || {};
                    handleAnswerChange(`q${index}`, {
                      ...matchAnswers,
                      [question.pairs[0].left]: e.target.value
                    }, index);
                  }}
                  defaultValue=""
                >
                  <option value="">Sélectionnez...</option>
                  {question.pairs.map((pair: any, pairIndex: number) => (
                    <option key={pairIndex} value={pair.right}>
                      {pair.right}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title d-flex align-items-center">
              <FaQuestionCircle className="me-2" />
              Quiz: {attempt.quizResponse?.title || 'Évaluation de cours'}
              <span className="badge bg-light text-primary ms-2">
                Question {currentQuestion + 1} sur {attempt.quizResponse?.questions?.length || 0}
              </span>
            </h5>
            <div className="d-flex align-items-center">
              <div className="me-3">
                <span className={`badge ${timeLeft < 300 ? 'bg-warning' : 'bg-info'}`}>
                  <FaClock className="me-1" />
                  {formatTime(timeLeft)}
                </span>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                disabled={submitting}
                aria-label="Close"
              ></button>
            </div>
          </div>
          
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Barre de progression des questions */}
            {attempt.quizResponse?.questions && attempt.quizResponse.questions.length > 1 && (
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <small>Progression:</small>
                  <small>
                    {answeredQuestions.size} / {attempt.quizResponse.questions.length} répondu(s)
                  </small>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{ 
                      width: `${(answeredQuestions.size / attempt.quizResponse.questions.length) * 100}%` 
                    }}
                  ></div>
                </div>
                
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {attempt.quizResponse.questions.map((_: any, index: number) => (
                    <button
                      key={index}
                      type="button"
                      className={`btn btn-sm ${currentQuestion === index ? 'btn-primary' : 
                        getQuestionStatus(index) === 'answered' ? 'btn-success' : 'btn-outline-secondary'}`}
                      onClick={() => setCurrentQuestion(index)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Avertissements et instructions */}
            {attempt.warnings && attempt.warnings.length > 0 && (
              <div className="alert alert-warning d-flex align-items-center">
                <FaExclamationTriangle className="me-2 flex-shrink-0" />
                <div>
                  {attempt.warnings.map((warning: string, index: number) => (
                    <div key={index}>{warning}</div>
                  ))}
                </div>
              </div>
            )}
            
            {attempt.instructions && (
              <div className="alert alert-info">
                <strong>Instructions importantes:</strong>
                {attempt.instructions.map((instruction: string, index: number) => (
                  <div key={index} className="mt-1">
                    • {instruction}
                  </div>
                ))}
              </div>
            )}
            
            {/* Question actuelle */}
            {attempt.quizResponse?.questions?.[currentQuestion] && 
              renderQuestion(attempt.quizResponse.questions[currentQuestion], currentQuestion)}
            
            {/* Navigation entre questions */}
            {attempt.quizResponse?.questions && attempt.quizResponse.questions.length > 1 && (
              <div className="d-flex justify-content-between mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePrevQuestion}
                  disabled={currentQuestion === 0 || submitting}
                >
                  ← Question précédente
                </button>
                
                <div className="btn-group">
                  {currentQuestion < (attempt.quizResponse.questions.length || 1) - 1 ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleNextQuestion}
                    >
                      Question suivante →
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleManualSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Soumission en cours...
                        </>
                      ) : (
                        'Terminer et soumettre'
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <div className="d-flex justify-content-between w-100">
              <div>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Quitter le quiz
                </button>
                
                {timeLeft < 600 && (
                  <div className="d-inline-block ms-3">
                    <div className="text-warning small">
                      <FaClock className="me-1" />
                      {Math.floor(timeLeft / 60)} min restante(s)
                    </div>
                  </div>
                )}
              </div>
              
              <div className="d-flex gap-2">
                {attempt.quizResponse?.questions?.length === 1 && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleManualSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Soumission...
                      </>
                    ) : (
                      <>
                        <FaCheck className="me-2" />
                        Soumettre le quiz
                      </>
                    )}
                  </button>
                )}
                
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleManualSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Traitement...
                    </>
                  ) : (
                    'Soumettre maintenant'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseQuizModal;