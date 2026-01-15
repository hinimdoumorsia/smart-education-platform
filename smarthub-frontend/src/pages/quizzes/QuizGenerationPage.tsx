import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import quizService from '../../services/quizService';
import { QuizGenerationRequest, QuestionType } from '../../types/quiz';

interface FormData {
  topic: string;
  questionCount: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionTypes: QuestionType[];
}

const QuizGenerationPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      topic: '',
      questionCount: 10,
      difficulty: 'MEDIUM',
      questionTypes: [QuestionType.SINGLE_CHOICE, QuestionType.TRUE_FALSE]
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);
  const navigate = useNavigate();

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const generationRequest: QuizGenerationRequest = {
        topic: data.topic,
        questionCount: data.questionCount,
        difficulty: data.difficulty,
        questionTypes: data.questionTypes
      };

      const quiz = await quizService.generateQuiz(generationRequest);
      setGeneratedQuiz(quiz);
      setSuccess('Quiz généré avec succès !');

    } catch (err: any) {
      console.error('Error generating quiz:', err);
      setError(err.response?.data?.message || 'Erreur lors de la génération du quiz');
    } finally {
      setLoading(false);
    }
  };

  const saveGeneratedQuiz = async () => {
    if (!generatedQuiz) return;

    try {
      setLoading(true);
      // Le quiz est déjà sauvegardé par le backend
      setSuccess('Quiz sauvegardé avec succès !');
      setTimeout(() => {
        navigate(`/quizzes/${generatedQuiz.id}`);
      }, 2000);
    } catch (err: any) {
      setError('Erreur lors de la sauvegarde du quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/quizzes">Quiz</a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Générer avec IA
          </li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h2 className="mb-0">Générer un quiz avec IA</h2>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}

              {!generatedQuiz ? (
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-3">
                    <label htmlFor="topic" className="form-label">
                      Sujet du quiz *
                    </label>
                    <input
                      type="text"
                      id="topic"
                      className={`form-control ${errors.topic ? 'is-invalid' : ''}`}
                      placeholder="Ex: Algorithmes de tri, Histoire de France, Biologie cellulaire..."
                      {...register('topic', {
                        required: 'Le sujet est obligatoire',
                        minLength: {
                          value: 5,
                          message: 'Le sujet doit contenir au moins 5 caractères'
                        }
                      })}
                    />
                    {errors.topic && (
                      <div className="invalid-feedback">
                        {errors.topic.message}
                      </div>
                    )}
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="questionCount" className="form-label">
                          Nombre de questions
                        </label>
                        <input
                          type="number"
                          id="questionCount"
                          className={`form-control ${errors.questionCount ? 'is-invalid' : ''}`}
                          min="1"
                          max="50"
                          {...register('questionCount', {
                            required: 'Le nombre de questions est obligatoire',
                            min: { value: 1, message: 'Minimum 1 question' },
                            max: { value: 50, message: 'Maximum 50 questions' }
                          })}
                        />
                        {errors.questionCount && (
                          <div className="invalid-feedback">
                            {errors.questionCount.message}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="difficulty" className="form-label">
                          Difficulté
                        </label>
                        <select
                          id="difficulty"
                          className={`form-control ${errors.difficulty ? 'is-invalid' : ''}`}
                          {...register('difficulty')}
                        >
                          <option value="EASY">Facile</option>
                          <option value="MEDIUM">Moyen</option>
                          <option value="HARD">Difficile</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Types de questions
                    </label>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value={QuestionType.SINGLE_CHOICE}
                        {...register('questionTypes')}
                        defaultChecked
                      />
                      <label className="form-check-label">
                        Questions à choix unique
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value={QuestionType.MULTIPLE_CHOICE}
                        {...register('questionTypes')}
                      />
                      <label className="form-check-label">
                        Questions à choix multiple
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value={QuestionType.TRUE_FALSE}
                        {...register('questionTypes')}
                        defaultChecked
                      />
                      <label className="form-check-label">
                        Vrai/Faux
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value={QuestionType.OPEN_ENDED}
                        {...register('questionTypes')}
                      />
                      <label className="form-check-label">
                        Questions ouvertes
                      </label>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => navigate('/quizzes')}
                      disabled={loading}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-magic me-2"></i>
                          Générer le quiz
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="alert alert-success">
                    <i className="bi bi-check-circle me-2"></i>
                    Quiz généré avec succès !
                  </div>

                  <div className="mb-4">
                    <h4>{generatedQuiz.title}</h4>
                    <p>{generatedQuiz.description}</p>
                    <p><strong>Questions générées:</strong> {generatedQuiz.questions?.length || 0}</p>
                  </div>

                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setGeneratedQuiz(null)}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Générer un autre quiz
                    </button>
                    <div className="btn-group">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={saveGeneratedQuiz}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-save me-2"></i>
                            Sauvegarder le quiz
                          </>
                        )}
                      </button>
                      <a
                        href={`/quizzes/${generatedQuiz.id}/edit`}
                        className="btn btn-outline-primary"
                      >
                        <i className="bi bi-pencil me-2"></i>
                        Modifier avant sauvegarde
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                À propos de la génération IA
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <h6 className="alert-heading">
                  <i className="bi bi-lightbulb me-2"></i>
                  Comment ça marche ?
                </h6>
                <ul className="mb-0">
                  <li>L'IA analyse votre sujet et génère des questions pertinentes</li>
                  <li>Vous pouvez choisir le nombre et le type de questions</li>
                  <li>Les questions sont générées avec leurs réponses correctes</li>
                  <li>Vous pouvez modifier le quiz généré avant de le sauvegarder</li>
                </ul>
              </div>

              <div className="alert alert-warning">
                <h6 className="alert-heading">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Recommandations
                </h6>
                <ul className="mb-0">
                  <li>Soyez précis dans votre sujet pour de meilleurs résultats</li>
                  <li>Vérifiez toujours les questions générées avant de les publier</li>
                  <li>Limitez à 20 questions maximum pour une meilleure qualité</li>
                  <li>Les questions ouvertes peuvent nécessiter une relecture</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizGenerationPage;