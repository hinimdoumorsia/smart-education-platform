import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import quizService from '../../services/quizService';
import { QuizRequestDTO, QuestionType } from '../../types/quiz';

interface FormData {
  title: string;
  description: string;
  active: boolean;
  questions: {
    text: string;
    type: QuestionType;
    options: string[];
    correctAnswer: string;
  }[];
}

const QuizCreatePage: React.FC = () => {
  const { register, control, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      active: true,
      questions: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Préparer les données pour la création
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

      // Créer le quiz
      await quizService.createQuiz(quizData);
      
      setSuccess('Quiz créé avec succès !');
      setTimeout(() => {
        navigate('/quizzes');
      }, 2000);
      
    } catch (err: any) {
      console.error('Détails de l\'erreur:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || err.message || 'Erreur lors de la création du quiz');
    } finally {
      setLoading(false);
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

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/quizzes">Quiz</a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Créer un quiz
          </li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h2 className="mb-0">Créer un nouveau quiz</h2>
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
                      placeholder="Ex: Quiz sur les algorithmes"
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
                      placeholder="Description du quiz..."
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
                      Ajoutez au moins une question à votre quiz
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
                              Question {index + 1}: {field.text.substring(0, 50)}...
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
                              {(field.type === QuestionType.SINGLE_CHOICE || field.type === QuestionType.MULTIPLE_CHOICE) && (
                                <div className="mb-3">
                                  <label className="form-label">
                                    Options de réponse
                                  </label>
                                  {field.options?.map((_, optionIndex) => (
                                    <div key={optionIndex} className="input-group mb-2">
                                      <div className="input-group-text">
                                        <input
                                          type={field.type === QuestionType.SINGLE_CHOICE ? 'radio' : 'checkbox'}
                                          name={`correctAnswer-${index}`}
                                          value={field.options[optionIndex]}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              // Pour les questions à choix unique, on ne garde que cette option
                                              if (field.type === QuestionType.SINGLE_CHOICE) {
                                                // Mettre à jour le correctAnswer
                                              } else {
                                                // Pour les choix multiples, on pourrait gérer un tableau
                                              }
                                            }
                                          }}
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
                                {field.type === QuestionType.TRUE_FALSE ? (
                                  <select
                                    className={`form-control ${errors.questions?.[index]?.correctAnswer ? 'is-invalid' : ''}`}
                                    {...register(`questions.${index}.correctAnswer`)}
                                  >
                                    <option value="Vrai">Vrai</option>
                                    <option value="Faux">Faux</option>
                                  </select>
                                ) : field.type === QuestionType.OPEN_ENDED ? (
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
                    disabled={loading || fields.length === 0}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Création en cours...
                      </>
                    ) : (
                      'Créer le quiz'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          {/* Aide */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Conseils
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <h6 className="alert-heading">
                  <i className="bi bi-lightbulb me-2"></i>
                  Créer un bon quiz
                </h6>
                <ul className="mb-0">
                  <li>Choisissez un titre clair et descriptif</li>
                  <li>Ajoutez une description pour expliquer l'objectif du quiz</li>
                  <li>Variez les types de questions (choix, vrai/faux, ouvertes)</li>
                  <li>Assurez-vous que chaque question a une réponse correcte claire</li>
                  <li>Limitez le quiz à 20-30 questions maximum</li>
                  <li>Testez votre quiz avant de le publier</li>
                </ul>
              </div>

              <div className="alert alert-warning">
                <h6 className="alert-heading">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Types de questions
                </h6>
                <ul className="mb-0">
                  <li><strong>Choix unique:</strong> Une seule réponse correcte</li>
                  <li><strong>Choix multiple:</strong> Plusieurs réponses possibles</li>
                  <li><strong>Vrai/Faux:</strong> Simplement vrai ou faux</li>
                  <li><strong>Question ouverte:</strong> Réponse libre (correction manuelle)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizCreatePage;