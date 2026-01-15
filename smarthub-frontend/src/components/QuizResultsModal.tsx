// components/QuizResultsModal.tsx
import React from 'react';
import { 
  FaTrophy, 
  FaChartBar, 
  FaLightbulb, 
  FaBook, 
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaStar
} from 'react-icons/fa';

interface QuizResultsProps {
  results: any;
  onClose: () => void;
  onRetry?: () => void;
  onContinue?: () => void;
}

const QuizResultsModal: React.FC<QuizResultsProps> = ({ 
  results, 
  onClose, 
  onRetry, 
  onContinue 
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 80) return 'text-primary';
    if (score >= 70) return 'text-info';
    if (score >= 60) return 'text-warning';
    return 'text-danger';
  };

  const getPerformanceMessage = (score: number) => {
    if (score >= 90) return 'Excellent ! Maîtrise parfaite du sujet.';
    if (score >= 80) return 'Très bon travail ! Vous avez une bonne compréhension.';
    if (score >= 70) return 'Bon travail ! Quelques points à améliorer.';
    if (score >= 60) return 'Satisfaisant. Revoyez certains concepts.';
    return 'Ne vous découragez pas ! Revoyez le cours attentivement.';
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title d-flex align-items-center">
              <FaTrophy className="me-2" />
              Résultats du Quiz
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          
          <div className="modal-body">
            {/* En-tête des résultats */}
            <div className="text-center mb-4">
              <div className={`display-4 fw-bold ${getScoreColor(results.score)}`}>
                {results.score.toFixed(1)}%
              </div>
              <div className="h4 mt-2">
                {results.passed ? (
                  <span className="text-success">
                    <FaCheckCircle className="me-2" />
                    Quiz Réussi !
                  </span>
                ) : (
                  <span className="text-warning">
                    <FaTimesCircle className="me-2" />
                    Quiz Échoué
                  </span>
                )}
              </div>
              <p className="lead">{getPerformanceMessage(results.score)}</p>
            </div>
            
            {/* Statistiques détaillées */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header bg-light">
                    <h6 className="mb-0 d-flex align-items-center">
                      <FaChartBar className="me-2" />
                      Statistiques
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between">
                        <span>Temps passé:</span>
                        <strong>
                          <FaClock className="me-1" />
                          {Math.floor(results.timeSpentMinutes)} min
                        </strong>
                      </div>
                      <div className="progress mt-1">
                        <div 
                          className="progress-bar bg-info" 
                          style={{ width: `${Math.min(results.timeSpentMinutes / 60 * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {results.feedback && (
                      <>
                        <div className="mb-2">
                          <small className="text-muted">Note:</small>
                          <div className="h5">{results.feedback.grade}</div>
                        </div>
                        
                        {results.certificateEligible && (
                          <div className="alert alert-success small">
                            <FaStar className="me-1" />
                            Félicitations ! Vous êtes éligible pour un certificat.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header bg-light">
                    <h6 className="mb-0 d-flex align-items-center">
                      <FaLightbulb className="me-2" />
                      Recommandations
                    </h6>
                  </div>
                  <div className="card-body">
                    {results.recommendations && (
                      <>
                        <p className="small mb-2">
                          <strong>Action recommandée:</strong> {results.recommendations.message}
                        </p>
                        
                        {results.recommendations.chapters && (
                          <div className="mb-2">
                            <small className="text-muted">Chapitres à revoir:</small>
                            <div>
                              {results.recommendations.chapters.map((chapter: string, idx: number) => (
                                <span key={idx} className="badge bg-warning me-1">{chapter}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {results.recommendations.waitHours && (
                          <div className="alert alert-warning small">
                            ⏳ Prochaine tentative possible dans {results.recommendations.waitHours} heures
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Points forts et faibles */}
            {results.feedback && (
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card h-100 border-success">
                    <div className="card-header bg-success text-white">
                      <h6 className="mb-0">Points Forts</h6>
                    </div>
                    <div className="card-body">
                      {results.feedback.strengths && results.feedback.strengths.length > 0 ? (
                        <ul className="list-unstyled">
                          {results.feedback.strengths.map((strength: string, idx: number) => (
                            <li key={idx} className="mb-2">
                              <FaCheckCircle className="text-success me-2" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted">Aucun point fort identifié</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card h-100 border-warning">
                    <div className="card-header bg-warning text-white">
                      <h6 className="mb-0">Points à Améliorer</h6>
                    </div>
                    <div className="card-body">
                      {results.feedback.weaknesses && results.feedback.weaknesses.length > 0 ? (
                        <ul className="list-unstyled">
                          {results.feedback.weaknesses.map((weakness: string, idx: number) => (
                            <li key={idx} className="mb-2">
                              <FaTimesCircle className="text-warning me-2" />
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted">Aucun point faible identifié</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Suggestions d'amélioration */}
            {results.feedback?.suggestions && results.feedback.suggestions.length > 0 && (
              <div className="card border-info mb-4">
                <div className="card-header bg-info text-white">
                  <h6 className="mb-0 d-flex align-items-center">
                    <FaBook className="me-2" />
                    Suggestions d'Amélioration
                  </h6>
                </div>
                <div className="card-body">
                  <ol className="mb-0">
                    {results.feedback.suggestions.map((suggestion: string, idx: number) => (
                      <li key={idx} className="mb-2">{suggestion}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
            
            {/* Éligibilité pour le prochain quiz */}
            {results.nextQuizEligibility && (
              <div className="alert alert-secondary">
                <h6>Prochain Quiz</h6>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    {results.nextQuizEligibility.isEligible ? (
                      <span className="text-success">
                        ✅ Vous pouvez repasser le quiz
                      </span>
                    ) : (
                      <span className="text-warning">
                        ⏳ {results.nextQuizEligibility.reason}
                      </span>
                    )}
                  </div>
                  <div>
                    <small className="text-muted">
                      Tentatives restantes aujourd'hui: {results.nextQuizEligibility.remainingAttemptsToday}
                    </small>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <div className="d-flex justify-content-between w-100">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                Fermer
              </button>
              
              <div className="btn-group">
                {onRetry && !results.passed && (
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={onRetry}
                    disabled={!results.nextQuizEligibility?.isEligible}
                  >
                    {results.nextQuizEligibility?.isEligible ? 'Réessayer le Quiz' : 'Réessayer plus tard'}
                  </button>
                )}
                
                {onContinue && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onContinue}
                  >
                    Continuer l'apprentissage
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResultsModal;