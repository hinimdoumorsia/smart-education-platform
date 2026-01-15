import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import courseService, { Course } from '../../services/courseService';
import userService from '../../services/userService';
import { 
  FaPlus, 
  FaSearch, 
  FaEye,  
  FaTrash, 
  FaCalendar, 
  FaPaperclip, 
  FaChartLine,
  FaBook,
  FaUserGraduate,
  FaUsers,
  FaFile
} from 'react-icons/fa';

const CourseListPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [teachers, setTeachers] = useState<Map<string, string>>(new Map());
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // AJOUT: État pour forcer le rafraîchissement
  const [refreshKey, setRefreshKey] = useState(0);

  // MODIF: Ajout de refreshKey dans les dépendances
  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, [refreshKey]);

  // AJOUT: Fonction pour rafraîchir les cours
  const refreshCourses = () => {
    console.log('Rafraîchissement manuel des cours...');
    setRefreshKey(prev => prev + 1);
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const teachersData = await userService.getAllTeachers();
      const teacherMap = new Map<string, string>();
      teachersData.forEach(teacher => {
        teacherMap.set(
          teacher.id,
          `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.username
        );
      });
      setTeachers(teacherMap);
    } catch (err) {
      console.warn('Could not fetch teachers:', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await courseService.searchCourses(searchQuery);
      setCourses(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      try {
        await courseService.deleteCourse(id);
        setCourses(courses.filter(course => course.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const getTeacherName = (teacherId: string): string => {
    return teachers.get(teacherId) || `Enseignant ID: ${teacherId}`;
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Liste des cours</h1>
        
        <div className="d-flex gap-2">
          {/* BOUTON RAFRAÎCHIR AJOUTÉ ICI */}
          <button 
            onClick={refreshCourses}
            className="btn btn-outline-primary"
            title="Rafraîchir la liste"
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Rafraîchir
          </button>
          
          {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
            <Link to="/courses/create" className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              Nouveau cours
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Barre de recherche */}
      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher un cours par titre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-outline-secondary" type="submit">
                <i className="bi bi-search"></i> Rechercher
              </button>
              {/* BOUTON RAFRAÎCHIR MODIFIÉ ICI */}
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={refreshCourses}
                title="Rafraîchir"
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Liste des cours */}
      <div className="row">
        {courses.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              Aucun cours disponible pour le moment.
              {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                <Link to="/courses/create" className="ms-2">
                  Créez votre premier cours
                </Link>
              )}
            </div>
          </div>
        ) : (
          courses.map((course) => (
            <div className="col-md-6 col-lg-4 mb-4" key={course.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0" style={{ maxWidth: '80%' }}>
                      {course.title}
                    </h5>
                    <span className="badge bg-primary">
                      {/* CHANGEMENT ICI : studentCount au lieu de students?.length */}
                      {course.studentCount || 0} étudiants
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
                        {getTeacherName(course.teacherId)}
                      </small>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-calendar3 me-2 text-secondary"></i>
                      <small className="text-muted">
                        Créé le {new Date(course.createdDate).toLocaleDateString()}
                      </small>
                    </div>
                    {/* CHANGEMENT ICI : fileCount au lieu de files?.length */}
                    {course.fileCount && course.fileCount > 0 && (
                      <div className="d-flex align-items-center mt-2">
                        <i className="bi bi-paperclip me-2 text-success"></i>
                        <small className="text-muted">
                          {course.fileCount} fichier(s)
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
                      <div className="btn-group" role="group">
                        <button
                          onClick={() => navigate(`/courses/${course.id}/edit`)}
                          className="btn btn-outline-warning btn-sm"
                          title="Modifier"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="btn btn-outline-danger btn-sm"
                          title="Supprimer"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistiques */}
      <div className="mt-5">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-graph-up me-2"></i>
              Statistiques des cours
            </h5>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-3 mb-3">
                <div className="card border-primary">
                  <div className="card-body">
                    <h2 className="text-primary">{courses.length}</h2>
                    <p className="text-muted mb-0">Cours total</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-success">
                  <div className="card-body">
                    <h2 className="text-success">
                      {Array.from(new Set(courses.map(c => c.teacherId))).length}
                    </h2>
                    <p className="text-muted mb-0">Enseignants</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-info">
                  <div className="card-body">
                    {/* CHANGEMENT ICI : studentCount au lieu de students?.length */}
                    <h2 className="text-info">
                      {courses.reduce((total, c) => total + (c.studentCount || 0), 0)}
                    </h2>
                    <p className="text-muted mb-0">Étudiants inscrits</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card border-warning">
                  <div className="card-body">
                    {/* CHANGEMENT ICI : fileCount au lieu de files?.length */}
                    <h2 className="text-warning">
                      {courses.reduce((total, c) => total + (c.fileCount || 0), 0)}
                    </h2>
                    <p className="text-muted mb-0">Fichiers total</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseListPage;