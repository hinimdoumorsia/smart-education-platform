import React, { useState, useEffect } from 'react';
import courseService from '../../services/courseService';

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (err: any) {
      setError('Erreur lors du chargement des cours');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-5">Chargement des cours...</div>;
  if (error) return <div className="alert alert-danger mt-5">{error}</div>;

  return (
    <div className="container mt-4">
      <h1>Cours disponibles</h1>
      <div className="row">
        {courses.map((course) => (
          <div key={course.id} className="col-md-4 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{course.title}</h5>
                <p className="card-text">{course.description}</p>
                <p className="card-text">
                  <small className="text-muted">
                    Enseignant: {course.teacher?.username || 'Non assigné'}
                  </small>
                </p>
              </div>
              <div className="card-footer">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => window.location.href = `/courses/${course.id}`}
                >
                  Voir détails
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursesPage;