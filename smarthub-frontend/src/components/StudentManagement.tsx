import React, { useState, useEffect } from 'react';
import { Student } from '../services/courseService'; // CHANGÉ: ../../ → ../
import userService, { User } from '../services/userService'; // CHANGÉ: ../../ → ../
import courseService from '../services/courseService'; // CHANGÉ: ../../ → ../
import { 
  FaUserPlus, 
  FaUserMinus, 
  FaSearch, 
  FaTimes, 
  FaUserGraduate, 
  FaUserCheck, 
  FaUserSlash 
} from 'react-icons/fa'; // AJOUTEZ CET IMPORT


interface StudentManagementProps {
  courseId: string;
  enrolledStudents: Student[];
  onStudentsUpdated: () => void;
  isTeacherOrAdmin: boolean;
}

const StudentManagement: React.FC<StudentManagementProps> = ({
  courseId,
  enrolledStudents,
  onStudentsUpdated,
  isTeacherOrAdmin
}) => {
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isTeacherOrAdmin) {
      fetchAvailableStudents();
    }
  }, [courseId, isTeacherOrAdmin]);

  const fetchAvailableStudents = async () => {
    try {
      setLoading(true);
      const students = await userService.getAvailableStudents(courseId);
      setAvailableStudents(students);
    } catch (err: any) {
      console.error('Error fetching available students:', err);
      setError('Erreur lors du chargement des étudiants disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedStudentId) {
      setError('Veuillez sélectionner un étudiant');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await courseService.addStudentToCourse(courseId, selectedStudentId);
      
      setSuccess('Étudiant ajouté avec succès');
      setSelectedStudentId('');
      
      // Recharger les données
      fetchAvailableStudents();
      onStudentsUpdated();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'étudiant');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir retirer ${studentName} de ce cours ?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await courseService.removeStudentFromCourse(courseId, studentId);
      
      setSuccess('Étudiant retiré avec succès');
      
      // Recharger les données
      fetchAvailableStudents();
      onStudentsUpdated();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du retrait de l\'étudiant');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchAvailableStudents();
      return;
    }

    try {
      setLoading(true);
      const students = await userService.searchStudents(searchQuery);
      setAvailableStudents(students);
    } catch (err) {
      console.error('Error searching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStudentFullName = (student: Student | User) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.username;
  };

  const getStudentEmail = (student: Student | User) => {
    return (student as any).email || 'Non disponible';
  };

  return (
    <div className="student-management">
      {/* Messages d'alerte */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <FaTimes className="me-2" />
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <FaUserCheck className="me-2" />
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {/* Section : Ajouter un étudiant (pour enseignants/admins) */}
      {true && (
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <FaUserPlus className="me-2" />
              Ajouter un étudiant au cours
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <form onSubmit={handleSearch} className="mb-3">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rechercher un étudiant par nom..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="btn btn-outline-secondary" type="submit">
                      <FaSearch />
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={fetchAvailableStudents}
                      title="Réinitialiser"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </form>
                
                <div className="mb-3">
                  <label htmlFor="studentSelect" className="form-label">
                    Sélectionner un étudiant à ajouter
                  </label>
                  <select
                    id="studentSelect"
                    className="form-control"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    disabled={loading || availableStudents.length === 0}
                  >
                    <option value="">Choisir un étudiant...</option>
                    {availableStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {getStudentFullName(student)} ({student.username}) - {getStudentEmail(student)}
                      </option>
                    ))}
                  </select>
                  {availableStudents.length === 0 && !loading && (
                    <div className="form-text text-muted">
                      Aucun étudiant disponible à ajouter
                    </div>
                  )}
                </div>
              </div>
              
              <div className="col-md-4 d-flex align-items-end">
                <button
                  className="btn btn-primary w-100"
                  onClick={handleAddStudent}
                  disabled={loading || !selectedStudentId || availableStudents.length === 0}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Ajout en cours...
                    </>
                  ) : (
                    <>
                      <FaUserPlus className="me-2" />
                      Ajouter l'étudiant
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Liste des étudiants disponibles */}
            {availableStudents.length > 0 && (
              <div className="mt-3">
                <h6>Étudiants disponibles ({availableStudents.length})</h6>
                <div className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {availableStudents.map((student) => (
                    <div key={student.id} className="list-group-item list-group-item-action">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <FaUserGraduate className="me-2 text-primary" />
                          <strong>{getStudentFullName(student)}</strong>
                          <div className="text-muted small">
                            {student.username} • {getStudentEmail(student)}
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setSelectedStudentId(student.id)}
                          disabled={loading}
                        >
                          <FaUserPlus />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section : Étudiants inscrits */}
      <div className="card">
        <div className="card-header bg-success text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaUserGraduate className="me-2" />
              Étudiants inscrits ({enrolledStudents.length})
            </h5>
            {isTeacherOrAdmin && (
              <span className="badge bg-light text-dark">
                {enrolledStudents.length} étudiant(s)
              </span>
            )}
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="mt-2">Chargement des étudiants...</p>
            </div>
          ) : enrolledStudents.length === 0 ? (
            <div className="text-center py-5">
              <FaUserSlash className="display-1 text-muted mb-3" />
              <h5>Aucun étudiant inscrit</h5>
              <p className="text-muted">Les étudiants inscrits apparaîtront ici</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Nom d'utilisateur</th>
                    <th>Nom complet</th>
                    <th>Email</th>
                    {isTeacherOrAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <FaUserGraduate className="me-2 text-primary" />
                        {student.username}
                      </td>
                      <td>
                        {student.firstName && student.lastName 
                          ? `${student.firstName} ${student.lastName}`
                          : 'Non spécifié'}
                      </td>
                      <td>
                        {(student as any).email || 'Non disponible'}
                      </td>
                      {isTeacherOrAdmin && (
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveStudent(student.id, getStudentFullName(student))}
                            disabled={loading}
                            title="Retirer du cours"
                          >
                            <FaUserMinus />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Statistiques */}
        {enrolledStudents.length > 0 && (
          <div className="card-footer">
            <div className="row text-center">
              <div className="col-md-4">
                <div className="card border-info">
                  <div className="card-body">
                    <h5 className="text-info">{enrolledStudents.length}</h5>
                    <p className="text-muted mb-0">Étudiants inscrits</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-success">
                  <div className="card-body">
                    <h5 className="text-success">
                      {enrolledStudents.filter(s => (s as any).email).length}
                    </h5>
                    <p className="text-muted mb-0">Avec email</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-warning">
                  <div className="card-body">
                    <h5 className="text-warning">
                      {enrolledStudents.filter(s => s.firstName && s.lastName).length}
                    </h5>
                    <p className="text-muted mb-0">Noms complets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;