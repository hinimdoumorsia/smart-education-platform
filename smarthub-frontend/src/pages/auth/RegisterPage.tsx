// src/pages/auth/RegisterPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RegisterPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Récupérer le rôle depuis l'URL
  const queryParams = new URLSearchParams(location.search);
  const urlRole = queryParams.get('role');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: urlRole || 'STUDENT' // Par défaut STUDENT
  });
  
  // Champs spécifiques par rôle
  const [studentFields, setStudentFields] = useState({
    matricule: '',
    filiere: '',
    niveau: '',
    anneeEntree: new Date().getFullYear().toString()
  });
  
  const [teacherFields, setTeacherFields] = useState({
    departement: '',
    specialite: '',
    grade: '',
    matriculeProf: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register, user } = useAuth(); // Ajout de 'user' pour débogage

  // Mettre à jour le rôle si changé dans l'URL
  useEffect(() => {
    if (urlRole && ['STUDENT', 'TEACHER', 'ADMIN'].includes(urlRole)) {
      setFormData(prev => ({ ...prev, role: urlRole }));
    }
  }, [urlRole]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setStudentFields({
      ...studentFields,
      [e.target.name]: e.target.value
    });
  };

  const handleTeacherChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTeacherFields({
      ...teacherFields,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation de base
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      // Préparer les données selon le rôle
      const registerData: any = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        role: formData.role
      };

      // Ajouter les champs spécifiques
      if (formData.role === 'STUDENT') {
        registerData.matricule = studentFields.matricule.trim();
        registerData.filiere = studentFields.filiere;
        registerData.niveau = studentFields.niveau;
        registerData.anneeEntree = studentFields.anneeEntree;
      } else if (formData.role === 'TEACHER') {
        registerData.departement = teacherFields.departement;
        registerData.specialite = teacherFields.specialite;
        registerData.grade = teacherFields.grade;
        registerData.matriculeProf = teacherFields.matriculeProf.trim();
      }

      console.log('📤 Données d\'inscription envoyées:', registerData);

      // Appel à l'API d'inscription
      const result = await register(registerData);
      console.log('✅ Réponse de l\'inscription:', result);

      // Vérifier si l'utilisateur est maintenant connecté
      console.log('👤 Utilisateur après inscription:', user);
      console.log('🔑 Token dans localStorage:', localStorage.getItem('token'));

      // Petite pause pour laisser le temps à l'authentification de se mettre à jour
      setTimeout(() => {
        console.log('🔄 Redirection vers /dashboard');
        navigate('/dashboard');
      }, 500);

    } catch (err: any) {
      console.error('❌ Erreur lors de l\'inscription:', err);
      
      // Gestion d'erreur détaillée
      if (err.response) {
        console.error('📊 Données de l\'erreur:', err.response.data);
        console.error('📡 Statut HTTP:', err.response.status);
        setError(err.response?.data?.message || `Erreur ${err.response.status}: ${err.response.data}`);
      } else if (err.request) {
        console.error('🌐 Pas de réponse du serveur');
        setError('Le serveur ne répond pas. Vérifiez votre connexion internet.');
      } else {
        console.error('⚡ Erreur inattendue:', err.message);
        setError(err.message || 'Erreur lors de l\'inscription');
      }
    } finally {
      setLoading(false);
    }
  };

  // Titres selon le rôle
  const roleTitles = {
    STUDENT: 'Étudiant',
    TEACHER: 'Enseignant',
    ADMIN: 'Administrateur'
  };

  // Options pour les menus déroulants
  const filieres = [
    { value: 'GI', label: 'Génie Informatique' },
    { value: 'GM', label: 'Génie Mécanique' },
    { value: 'GP', label: 'Génie des Procédés' },
    { value: 'GC', label: 'Génie Civil' },
    { value: 'IATD', label: 'IATD' }
  ];

  const niveaux = [
    { value: '1', label: '1ère année' },
    { value: '2', label: '2ème année' },
    { value: '3', label: '3ème année' },
    { value: '4', label: '4ème année' },
    { value: '5', label: '5ème année' }
  ];

  const departements = [
    { value: 'Informatique', label: 'Informatique' },
    { value: 'Mécanique', label: 'Mécanique' },
    { value: 'Procédés', label: 'Procédés' },
    { value: 'Mathématiques', label: 'Mathématiques' },
    { value: 'Physique', label: 'Physique' }
  ];

  const grades = [
    { value: 'PROFESSEUR', label: 'Professeur' },
    { value: 'PROFESSEUR_ASSISTANT', label: 'Professeur Assistant' },
    { value: 'MAITRE_CONFERENCES', label: 'Maître de Conférences' },
    { value: 'MAITRE_ASSISTANT', label: 'Maître Assistant' },
    { value: 'CHERCHEUR', label: 'Chercheur' }
  ];

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8">
          {/* En-tête identique */}
          <div className="d-flex align-items-center justify-content-center mb-3">
            <div 
              className="rounded-circle bg-white d-flex align-items-center justify-content-center me-3 overflow-hidden"
              style={{ 
                width: '70px', 
                height: '70px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '2px solid #fd9c0d',
                flexShrink: 0
              }}
            >
              <img 
                src="/logo-giatd.jpg" 
                alt="Logo GIATD-ENSAM" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  borderRadius: '50%',
                }} 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="text-primary text-center">
                      <div style="font-size: 1.5rem; font-weight: bold">IATD</div>
                      <div style="font-size: 0.7rem">ENSAM</div>
                    </div>
                  `;
                }}
              />
            </div>
            
            <div className="text-start">
              <h2 className="fw-bold text-primary mb-0" style={{ fontSize: '1.8rem' }}>
                GIATD-SI
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: '1rem' }}>
                École Nationale Supérieure des Arts et Métiers - Meknès
              </p>
            </div>
          </div>

          <hr className="mb-4" />

          <div className="card shadow border-0">
            <div className="card-body p-4">
              {/* En-tête avec badge du rôle */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="text-center mb-0 flex-grow-1">
                  Inscription {roleTitles[formData.role as keyof typeof roleTitles]}
                </h4>
                <span className={`badge bg-${formData.role === 'STUDENT' ? 'primary' : formData.role === 'TEACHER' ? 'success' : 'warning'} fs-6`}>
                  {formData.role}
                </span>
              </div>
              
              {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Erreur :</strong> {error}
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}

              {/* Message d'information pour le débogage */}
              {process.env.NODE_ENV === 'development' && (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Mode développement : vérifiez la console pour les logs
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                {/* Section informations personnelles */}
                <div className="card border-0 bg-light mb-4">
                  <div className="card-body">
                    <h5 className="card-title mb-3">
                      <i className="bi bi-person-circle me-2"></i>
                      Informations personnelles
                    </h5>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-medium">
                          Prénom <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          placeholder="Votre prénom"
                          disabled={loading}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-medium">
                          Nom <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          placeholder="Votre nom"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-medium">
                          Nom d'utilisateur <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          required
                          placeholder="Matricule ou pseudo"
                          disabled={loading}
                        />
                        <small className="text-muted">
                          Utilisé pour vous connecter (doit être unique)
                        </small>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-medium">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          placeholder="+212 6 XX XX XX XX"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label fw-medium">
                        Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder={formData.role === 'STUDENT' ? "prenom.nom@etu.ensam.ma" : "prenom.nom@ensam.ma"}
                        disabled={loading}
                      />
                      <small className="text-muted">
                        {formData.role === 'STUDENT' 
                          ? "Utilisez votre email étudiant @etu.ensam.ma" 
                          : "Utilisez votre email professionnel @ensam.ma"}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Section spécifique au rôle */}
                {formData.role === 'STUDENT' && (
                  <div className="card border-primary border-1 mb-4">
                    <div className="card-header bg-primary bg-opacity-10 border-primary">
                      <h5 className="mb-0 text-primary">
                        <i className="bi bi-mortarboard-fill me-2"></i>
                        Informations étudiant
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-medium">
                            Matricule <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="matricule"
                            value={studentFields.matricule}
                            onChange={handleStudentChange}
                            required
                            placeholder="Ex: E20230001"
                            disabled={loading}
                          />
                          <small className="text-muted">
                            Votre numéro de matricule étudiant
                          </small>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-medium">
                            Filière <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select"
                            name="filiere"
                            value={studentFields.filiere}
                            onChange={handleStudentChange}
                            required
                            disabled={loading}
                          >
                            <option value="">Sélectionnez une filière</option>
                            {filieres.map(filiere => (
                              <option key={filiere.value} value={filiere.value}>
                                {filiere.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-medium">
                            Niveau <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select"
                            name="niveau"
                            value={studentFields.niveau}
                            onChange={handleStudentChange}
                            required
                            disabled={loading}
                          >
                            <option value="">Sélectionnez un niveau</option>
                            {niveaux.map(niveau => (
                              <option key={niveau.value} value={niveau.value}>
                                {niveau.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-medium">
                            Année d'entrée <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            name="anneeEntree"
                            value={studentFields.anneeEntree}
                            onChange={handleStudentChange}
                            required
                            min="2000"
                            max={new Date().getFullYear()}
                            disabled={loading}
                          />
                          <small className="text-muted">
                            Année d'entrée à l'ENSAM
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formData.role === 'TEACHER' && (
                  <div className="card border-success border-1 mb-4">
                    <div className="card-header bg-success bg-opacity-10 border-success">
                      <h5 className="mb-0 text-success">
                        <i className="bi bi-person-badge-fill me-2"></i>
                        Informations enseignant
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-medium">
                            Matricule enseignant <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="matriculeProf"
                            value={teacherFields.matriculeProf}
                            onChange={handleTeacherChange}
                            required
                            placeholder="Ex: P20230001"
                            disabled={loading}
                          />
                          <small className="text-muted">
                            Votre numéro de matricule enseignant
                          </small>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-medium">
                            Département <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select"
                            name="departement"
                            value={teacherFields.departement}
                            onChange={handleTeacherChange}
                            required
                            disabled={loading}
                          >
                            <option value="">Sélectionnez un département</option>
                            {departements.map(dept => (
                              <option key={dept.value} value={dept.value}>
                                {dept.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-medium">
                            Spécialité <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="specialite"
                            value={teacherFields.specialite}
                            onChange={handleTeacherChange}
                            required
                            placeholder="Ex: Intelligence Artificielle"
                            disabled={loading}
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-medium">
                            Grade <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select"
                            name="grade"
                            value={teacherFields.grade}
                            onChange={handleTeacherChange}
                            required
                            disabled={loading}
                          >
                            <option value="">Sélectionnez un grade</option>
                            {grades.map(grade => (
                              <option key={grade.value} value={grade.value}>
                                {grade.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formData.role === 'ADMIN' && (
                  <div className="card border-warning border-1 mb-4">
                    <div className="card-header bg-warning bg-opacity-10 border-warning">
                      <h5 className="mb-0 text-warning">
                        <i className="bi bi-shield-check me-2"></i>
                        Informations administrateur
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="alert alert-warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        <strong>Note importante :</strong> Les comptes administrateur nécessitent 
                        une validation manuelle par un super-administrateur.
                      </div>
                    </div>
                  </div>
                )}

                {/* Section mot de passe */}
                <div className="card border-0 bg-light mb-4">
                  <div className="card-body">
                    <h5 className="card-title mb-3">
                      <i className="bi bi-shield-lock me-2"></i>
                      Sécurité du compte
                    </h5>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-medium">
                          Mot de passe <span className="text-danger">*</span>
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          placeholder="6 caractères minimum"
                          disabled={loading}
                        />
                        <small className="text-muted">
                          Au moins 6 caractères
                        </small>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-medium">
                          Confirmer le mot de passe <span className="text-danger">*</span>
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          placeholder="Répétez le mot de passe"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOUTONS D'ACTION CORRIGÉS */}
                <div className="d-flex justify-content-between">
                  {/* BOUTON "Changer de rôle" CORRIGÉ - remplacé Link par button */}
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => !loading && navigate('/register/select-role')}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-left me-1"></i>
                    Changer de rôle
                  </button>
                  
                  {/* BOUTON d'inscription */}
                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Inscription en cours...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus me-2"></i>
                        S'inscrire en tant que {roleTitles[formData.role as keyof typeof roleTitles]}
                      </>
                    )}
                  </button>
                </div>
              </form>
              
              <div className="text-center mt-4 pt-3 border-top">
                <p className="mb-2">
                  Déjà un compte ?{' '}
                  <Link to="/login" className="text-decoration-none fw-medium text-primary">
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Se connecter
                  </Link>
                </p>
                <p className="text-muted small mb-0">
                  <i className="bi bi-shield-check me-1"></i>
                  Plateforme sécurisée - IATD SmartHub v1.0
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-3">
            <p className="text-muted small">
              © {new Date().getFullYear()} ENSAM Meknès - Tous droits réservés
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;