import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import quizService from '../../services/quizService';
import { QuizRequestDTO, QuestionType } from '../../types/quiz';

interface FormData {
  title: string;
  description: string;
  active: boolean;
  questions: {
    id?: number;
    text: string;
    type: QuestionType;
    options: string[];
    correctAnswer: string;
  }[];
}

const QuizEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { register, control, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions"
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadQuiz();
    }
  }, [id]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const quizData = await quizService.getQuizById(parseInt(id!));
      
      // Transformer les données pour le formulaire
      const formData = {
        title: quizData.title,
        description: quizData.description || '',
        active: quizData.active,
        questions: quizData.questions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options || [],
          correctAnswer: q.correctAnswer
        }))
      };
      
      reset(formData);
    } catch (err: any) {
      setError('Erreur lors du chargement du quiz');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      // Préparer les données pour la mise à jour
      const quizData: QuizRequestDTO = {
        title: data.title,
        description: data.description,
        active: data.active,
        questions: data.questions.map(q => ({
          text: q.text,
          type: q.type,
          options: q.options || [],
          correctAnswer: q.correctAnswer
        }))
      };

      // Mettre à jour le quiz
      await quizService.updateQuiz(parseInt(id!), quizData);
      
      setSuccess('Quiz mis à jour avec succès !');
      setTimeout(() => {
        navigate(`/quizzes/${id}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Détails de l\'erreur:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || err.message || 'Erreur lors de la mise à jour du quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce quiz ? Cette action est irréversible.')) {
      try {
        await quizService.deleteQuiz(parseInt(id!));
        navigate('/quizzes');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const addQuestion = () => {
    append({
      text: '',
      type: QuestionType.SINGLE_CHOICE,
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: ''
    });
  };

  const addTrueFalseQuestion = () => {
    append({
      text: '',
      type: QuestionType.TRUE_FALSE,
      options: ['Vrai', 'Faux'],
      correctAnswer: 'Vrai'
    });
  };

  const addOpenEndedQuestion = () => {
    append({
      text: '',
      type: QuestionType.OPEN_ENDED,
      options: [],
      correctAnswer: ''
    });
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
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/quizzes">Quiz</a>
          </li>
          <li className="breadcrumb-item">
            <a href={`/quizzes/${id}`}>Quiz #{id}</a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Modifier
          </li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h2 className="mb-0">Modifier le quiz</h2>
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

              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Informations de base du quiz */}
                <div className="mb-4">
                  <h5>Informations du quiz</h5>
                  
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      Titre du quiz *
                    </label>
                    <input
                      type="text"
                      id="title"
                      className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                      {...register('title', {
                        required: 'Le titre est obligatoire',
                        minLength: {
                          value: 3,
                          message: 'Le titre doit contenir au moins 3 caractères'
                        }
                      })}
                    />
                    {errors.title && (
                      <div className="invalid-feedback">
                        {errors.title.message}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      Description
                    </label>
                    <textarea
                      id="description"
                      className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                      rows={3}
                      {...register('description', {
                        required: false,
                        maxLength: {
                          value: 1000,
                          message: 'La description ne peut pas dépasser 1000 caractères'
                        }
                      })}
                    />
                    {errors.description && (
                      <div className="invalid-feedback">
                        {errors.description.message}
                      </div>
                    )}
                  </div>

                  <div className="mb-3 form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="active"
                      {...register('active')}
                    />
                    <label className="form-check-label" htmlFor="active">
                      Quiz actif
                    </label>
                    <div className="form-text">
                      Un quiz inactif n'est pas visible par les étudiants
                    </div>
                  </div>
                </div>

                {/* Questions */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Questions ({fields.length})</h5>
                    <div className="btn-group" role="group">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={addQuestion}
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        Question choix
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-info btn-sm"
                        onClick={addTrueFalseQuestion}
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        Vrai/Faux
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={addOpenEndedQuestion}
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        Question ouverte
                      </button>
                    </div>
                  </div>

                  {fields.length === 0 ? (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Aucune question dans ce quiz. Ajoutez-en au moins une.
                    </div>
                  ) : (
                    <div className="accordion" id="questionsAccordion">
                      {fields.map((field, index) => (
                        <div key={field.id} className="accordion-item mb-2">
                          <h2 className="accordion-header">
                            <button
                              className="accordion-button collapsed"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target={`#question-${index}`}
                            >
                              Question {index + 1}
                              {field.text && (
                                <span className="ms-2 text-truncate" style={{ maxWidth: '300px' }}>
                                  : {field.text.substring(0, 50)}...
                                </span>
                              )}
                              <span className={`badge ${quizService.getQuestionTypeBadge(field.type)} ms-2`}>
                                {quizService.getQuestionTypeLabel(field.type)}
                              </span>
                            </button>
                          </h2>
                          <div
                            id={`question-${index}`}
                            className="accordion-collapse collapse"
                            data-bs-parent="#questionsAccordion"
                          >
                            <div className="accordion-body">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6>Question {index + 1}</h6>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => remove(index)}
                                >
                                  <i className="bi bi-trash"></i> Supprimer
                                </button>
                              </div>

                              <div className="mb-3">
                                <label className="form-label">
                                  Texte de la question *
                                </label>
                                <textarea
                                  className={`form-control ${errors.questions?.[index]?.text ? 'is-invalid' : ''}`}
                                  rows={2}
                                  placeholder="Entrez le texte de la question..."
                                  {...register(`questions.${index}.text`, {
                                    required: 'Le texte de la question est obligatoire'
                                  })}
                                />
                                {errors.questions?.[index]?.text && (
                                  <div className="invalid-feedback">
                                    {errors.questions?.[index]?.text?.message}
                                  </div>
                                )}
                              </div>

                              <div className="mb-3">
                                <label className="form-label">
                                  Type de question
                                </label>
                                <select
                                  className={`form-control ${errors.questions?.[index]?.type ? 'is-invalid' : ''}`}
                                  {...register(`questions.${index}.type`)}
                                >
                                  <option value={QuestionType.SINGLE_CHOICE}>Choix unique</option>
                                  <option value={QuestionType.MULTIPLE_CHOICE}>Choix multiple</option>
                                  <option value={QuestionType.TRUE_FALSE}>Vrai/Faux</option>
                                  <option value={QuestionType.OPEN_ENDED}>Question ouverte</option>
                                </select>
                              </div>

                              {/* Options pour les questions à choix */}
                              {(watch(`questions.${index}.type`) === QuestionType.SINGLE_CHOICE || 
                                watch(`questions.${index}.type`) === QuestionType.MULTIPLE_CHOICE) && (
                                <div className="mb-3">
                                  <label className="form-label">
                                    Options de réponse
                                  </label>
                                  {[0, 1, 2, 3].map((optionIndex) => (
                                    <div key={optionIndex} className="input-group mb-2">
                                      <div className="input-group-text">
                                        <input
                                          type={watch(`questions.${index}.type`) === QuestionType.SINGLE_CHOICE ? 'radio' : 'checkbox'}
                                          name={`correctAnswer-${index}`}
                                          value={watch(`questions.${index}.options.${optionIndex}`) || ''}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              // Mettre à jour la réponse correcte
                                            }
                                          }}
                                          checked={watch(`questions.${index}.correctAnswer`) === watch(`questions.${index}.options.${optionIndex}`)}
                                        />
                                      </div>
                                      <input
                                        type="text"
                                        className="form-control"
                                        placeholder={`Option ${optionIndex + 1}`}
                                        {...register(`questions.${index}.options.${optionIndex}`)}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Réponse correcte */}
                              <div className="mb-3">
                                <label className="form-label">
                                  Réponse correcte *
                                </label>
                                {watch(`questions.${index}.type`) === QuestionType.TRUE_FALSE ? (
                                  <select
                                    className={`form-control ${errors.questions?.[index]?.correctAnswer ? 'is-invalid' : ''}`}
                                    {...register(`questions.${index}.correctAnswer`)}
                                  >
                                    <option value="Vrai">Vrai</option>
                                    <option value="Faux">Faux</option>
                                  </select>
                                ) : watch(`questions.${index}.type`) === QuestionType.OPEN_ENDED ? (
                                  <textarea
                                    className={`form-control ${errors.questions?.[index]?.correctAnswer ? 'is-invalid' : ''}`}
                                    rows={2}
                                    placeholder="Réponse attendue..."
                                    {...register(`questions.${index}.correctAnswer`)}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    className={`form-control ${errors.questions?.[index]?.correctAnswer ? 'is-invalid' : ''}`}
                                    placeholder="Entrez la réponse correcte..."
                                    {...register(`questions.${index}.correctAnswer`, {
                                      required: 'La réponse correcte est obligatoire'
                                    })}
                                  />
                                )}
                                {errors.questions?.[index]?.correctAnswer && (
                                  <div className="invalid-feedback">
                                    {errors.questions?.[index]?.correctAnswer?.message}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-between mt-4">
                  <div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => navigate(`/quizzes/${id}`)}
                      disabled={submitting}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger ms-2"
                      onClick={handleDelete}
                      disabled={submitting}
                    >
                      Supprimer
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || fields.length === 0}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          {/* Informations */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Informations
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <h6 className="alert-heading">
                  <i className="bi bi-lightbulb me-2"></i>
                  Modifier un quiz
                </h6>
                <ul className="mb-0">
                  <li>Toutes les modifications sont immédiates</li>
                  <li>Les étudiants verront la nouvelle version du quiz</li>
                  <li>Les tentatives en cours utiliseront l'ancienne version</li>
                  <li>Les nouvelles tentatives utiliseront la nouvelle version</li>
                </ul>
              </div>

              <div className="alert alert-warning">
                <h6 className="alert-heading">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Attention
                </h6>
                <ul className="mb-0">
                  <li>La suppression d'une question est irréversible</li>
                  <li>Les modifications affectent toutes les futures tentatives</li>
                  <li>Vérifiez les réponses correctes après modification</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizEditPage;