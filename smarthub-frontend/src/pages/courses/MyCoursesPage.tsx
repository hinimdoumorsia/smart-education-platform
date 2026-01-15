import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import courseService, { Course } from '../../services/courseService';

const MyCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      let data: Course[] = [];
      
      if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
        // Récupérer les cours de l'enseignant
        data = await courseService.getMyCourses();
      } else if (user?.role === 'STUDENT') {
        // Pour un étudiant, récupérer les cours auxquels il est inscrit
        data = await courseService.getStudentCourses(user.id);
      }
      
      setCourses(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
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
            <Link to="/dashboard">Tableau de bord</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Mes cours
          </li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <i className="bi bi-journal-bookmark me-2"></i>
          Mes cours
        </h1>
        {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <Link to="/courses/create" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            Nouveau cours
          </Link>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-journal-x display-1 text-muted mb-3"></i>
            <h3>Aucun cours</h3>
            <p className="text-muted">
              {user?.role === 'TEACHER' 
                ? "Vous n'avez pas encore créé de cours." 
                : "Vous n'êtes inscrit à aucun cours."}
            </p>
            {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
              <Link to="/courses/create" className="btn btn-primary">
                Créer votre premier cours
              </Link>
            )}
            {user?.role === 'STUDENT' && (
              <Link to="/courses" className="btn btn-primary">
                Parcourir les cours disponibles
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="row">
          {courses.map((course) => (
            <div className="col-md-6 col-lg-4 mb-4" key={course.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0" style={{ maxWidth: '80%' }}>
                      {course.title}
                    </h5>
                    <span className="badge bg-primary">
                      {course.students?.length || 0} étudiants
                    </span>
                  </div>
                  
                  <p className="card-text text-muted small mb-3">
                    {course.description && course.description.length > 120
                      ? `${course.description.substring(0, 120)}...`
                      : course.description || 'Pas de description'}
                  </p>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-person-circle me-2 text-primary"></i>
                      <small className="text-muted">
                        {course.teacherName || `Enseignant ID: ${course.teacherId}`}
                      </small>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-calendar3 me-2 text-secondary"></i>
                      <small className="text-muted">
                        Créé le {formatDate(course.createdDate)}
                      </small>
                    </div>
                    {course.files && course.files.length > 0 && (
                      <div className="d-flex align-items-center mt-2">
                        <i className="bi bi-paperclip me-2 text-success"></i>
                        <small className="text-muted">
                          {course.files.length} fichier(s)
                        </small>
                      </div>
                    )}
                  </div>
                  
                  <div className="d-flex justify-content-between mt-auto">
                    <Link
                      to={`/courses/${course.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="bi bi-eye me-1"></i>
                      Consulter
                    </Link>
                    
                    {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                      <Link
                        to={`/courses/${course.id}/edit`}
                        className="btn btn-outline-warning btn-sm"
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Modifier
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistiques */}
      <div className="card mt-5">
        <div className="card-header bg-light">
          <h5 className="mb-0">
            <i className="bi bi-bar-chart me-2"></i>
            Statistiques de mes cours
          </h5>
        </div>
        <div className="card-body">
          <div className="row text-center">
            <div className="col-md-4 mb-3">
              <div className="card border-primary">
                <div className="card-body">
                  <h2 className="text-primary">{courses.length}</h2>
                  <p className="text-muted mb-0">Cours total</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card border-success">
                <div className="card-body">
                  <h2 className="text-success">
                    {courses.reduce((total, c) => total + (c.students?.length || 0), 0)}
                  </h2>
                  <p className="text-muted mb-0">Étudiants total</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card border-info">
                <div className="card-body">
                  <h2 className="text-info">
                    {courses.reduce((total, c) => total + (c.files?.length || 0), 0)}
                  </h2>
                  <p className="text-muted mb-0">Fichiers total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCoursesPage;