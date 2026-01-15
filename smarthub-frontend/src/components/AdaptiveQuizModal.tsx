import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaRobot, 
  FaClock, 
  FaBrain, 
  FaBook, 
  FaChartLine,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';

interface AdaptiveQuizModalProps {
  quizData: any;
  strategy: string;
  onClose: () => void;
  onSubmit: (answers: any) => void;
}

const AdaptiveQuizModal: React.FC<AdaptiveQuizModalProps> = ({ 
  quizData, 
  strategy, 
  onClose, 
  onSubmit 
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(45 * 60); // 45 minutes en secondes
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Déplacer handleAutoSubmit avec useCallback
  const handleAutoSubmit = useCallback(() => {
    onSubmit(answers);
  }, [answers, onSubmit]);

  // Gestion du timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, handleAutoSubmit]); // Ajouter handleAutoSubmit aux dépendances

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    onSubmit(answers);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStrategyIcon = () => {
    switch (strategy) {
      case 'DIAGNOSTIC': return <FaBrain className="text-primary" />;
      case 'REMEDIATION': return <FaBook className="text-warning" />;
      case 'CHALLENGE': return <FaChartLine className="text-danger" />;
      case 'REINFORCEMENT': return <FaRobot className="text-success" />;
      default: return <FaRobot className="text-info" />;
    }
  };

  const getStrategyColor = () => {
    switch (strategy) {
      case 'DIAGNOSTIC': return 'border-primary text-primary';
      case 'REMEDIATION': return 'border-warning text-warning';
      case 'CHALLENGE': return 'border-danger text-danger';
      case 'REINFORCEMENT': return 'border-success text-success';
      default: return 'border-info text-info';
    }
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1050,
      overflowY: 'auto'
    }}>
      <div className="modal-dialog modal-lg" style={{ margin: '20px auto' }}>
        <div className="modal-content">
          <div className="modal-header bg-dark text-white">
            <div className="d-flex align-items-center w-100">
              {getStrategyIcon()}
              <div className="ms-3 flex-grow-1">
                <h5 className="modal-title mb-0">
                  Quiz Adaptatif IA - {strategy}
                </h5>
                <small>
                  Généré par intelligence artificielle
                </small>
              </div>
              <div className={`border ${getStrategyColor()} rounded px-3 py-1`}>
                <FaClock className="me-2" />
                {formatTime(timeLeft)}
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            />
          </div>

          <div className="modal-body">
            {/* Informations du quiz */}
            <div className="alert alert-info">
              <div className="row">
                <div className="col-md-6">
                  <strong>Stratégie:</strong> {strategy}
                </div>
                <div className="col-md-6">
                  <strong>Difficulté:</strong>{' '}
                  <span className="badge bg-primary">
                    {quizData.agentParameters?.difficulty || 'MEDIUM'}
                  </span>
                </div>
              </div>
              {quizData.progressAnalysis && (
                <div className="mt-2">
                  <strong>Basé sur votre progression:</strong>{' '}
                  Score moyen: {quizData.progressAnalysis.averageScore?.toFixed(1)}%
                </div>
              )}
            </div>

            {/* Instructions */}
            {quizData.initiation?.instructions && (
              <div className="alert alert-light">
                <h6>Instructions:</h6>
                <ul className="mb-0">
                  {quizData.initiation.instructions.map((instruction: string, index: number) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Questions */}
            {quizData.quiz?.questions && (
              <div className="questions-section">
                <h5 className="mb-4">Questions</h5>
                {quizData.quiz.questions.map((question: any, index: number) => (
                  <div key={question.id || index} className="card mb-3">
                    <div className="card-body">
                      <h6 className="card-title">
                        Question {index + 1}: {question.text}
                      </h6>
                      
                      {question.type === 'SINGLE_CHOICE' && (
                        <div className="options">
                          {question.options.map((option: string, optIndex: number) => (
                            <div key={optIndex} className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name={`question-${index}`}
                                id={`option-${index}-${optIndex}`}
                                checked={answers[`q${index}`] === option}
                                onChange={() => handleAnswerChange(`q${index}`, option)}
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`option-${index}-${optIndex}`}
                              >
                                {option}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.type === 'MULTIPLE_CHOICE' && (
                        <div className="options">
                          {question.options.map((option: string, optIndex: number) => (
                            <div key={optIndex} className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                name={`question-${index}`}
                                id={`option-${index}-${optIndex}`}
                                checked={answers[`q${index}`]?.includes?.(option) || false}
                                onChange={(e) => {
                                  const currentAnswers = answers[`q${index}`]?.split(',') || [];
                                  if (e.target.checked) {
                                    currentAnswers.push(option);
                                  } else {
                                    const index = currentAnswers.indexOf(option);
                                    if (index > -1) currentAnswers.splice(index, 1);
                                  }
                                  handleAnswerChange(`q${index}`, currentAnswers.join(','));
                                }}
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`option-${index}-${optIndex}`}
                              >
                                {option}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.type === 'TRUE_FALSE' && (
                        <div className="options">
                          {['Vrai', 'Faux'].map((option, optIndex) => (
                            <div key={optIndex} className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name={`question-${index}`}
                                id={`option-${index}-${optIndex}`}
                                checked={answers[`q${index}`] === option}
                                onChange={() => handleAnswerChange(`q${index}`, option)}
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`option-${index}-${optIndex}`}
                              >
                                {option}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <FaTimesCircle className="me-2" />
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(answers).length === 0}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Soumission en cours...
                </>
              ) : (
                <>
                  <FaCheckCircle className="me-2" />
                  Soumettre le quiz ({Object.keys(answers).length}/{quizData.quiz?.questions?.length || 0})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveQuizModal;