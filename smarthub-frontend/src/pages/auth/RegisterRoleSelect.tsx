// src/pages/auth/RegisterRoleSelect.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const RegisterRoleSelect: React.FC = () => {
  const roles = [
    {
      id: 'STUDENT',
      title: 'Étudiant ENSAM',
      description: 'Accédez aux cours, projets et ressources pédagogiques',
      icon: 'bi-mortarboard-fill',
      color: 'primary',
      features: [
        'Accès aux cours et TD',
        'Soumission des projets',
        'Consultation des notes',
        'Ressources pédagogiques'
      ]
    },
    {
      id: 'TEACHER', 
      title: 'Enseignant',
      description: 'Gérez vos cours, projets et évaluez les étudiants',
      icon: 'bi-person-badge-fill',
      color: 'success',
      features: [
        'Gestion des cours',
        'Évaluation des étudiants',
        'Publication de ressources',
        'Suivi des projets'
      ]
    },
    {
      id: 'ADMIN',
      title: 'Administrateur',
      description: 'Gestion complète de la plateforme GIATD-SI',
      icon: 'bi-shield-check',
      color: 'warning',
      features: [
        'Gestion des utilisateurs',
        'Configuration système',
        'Supervision de la plateforme',
        'Rapports et statistiques'
      ]
    }
  ];

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8">
          
          {/* En-tête identique à LoginPage */}
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

          {/* Contenu de sélection */}
          <div className="card shadow border-0">
            <div className="card-body p-4">
              <h4 className="text-center mb-4">Sélectionnez votre profil</h4>
              <p className="text-muted text-center mb-4">
                Choisissez le type de compte que vous souhaitez créer
              </p>

              <div className="row g-3">
                {roles.map((role) => (
                  <div className="col-md-4" key={role.id}>
                    <Link 
                      to={`/register?role=${role.id}`}
                      className="card h-100 text-decoration-none border-0 shadow-sm hover-shadow"
                      style={{ transition: 'all 0.3s' }}
                    >
                      <div className={`card-body text-center p-4`}>
                        <div className={`mb-3 rounded-circle bg-${role.color}-subtle d-inline-flex align-items-center justify-content-center`}
                             style={{ width: '70px', height: '70px' }}>
                          <i className={`bi ${role.icon} fs-3 text-${role.color}`}></i>
                        </div>
                        <h5 className="card-title fw-bold">{role.title}</h5>
                        <p className="card-text text-muted small mb-3">{role.description}</p>
                        
                        <ul className="list-unstyled small text-start">
                          {role.features.map((feature, idx) => (
                            <li key={idx} className="mb-2">
                              <i className={`bi bi-check-circle-fill text-${role.color} me-2`}></i>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        <div className="mt-3">
                          <span className={`badge bg-${role.color} px-3 py-2`}>
                            S'inscrire en tant que {role.title.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              <div className="text-center mt-4 pt-3 border-top">
                <Link to="/login" className="text-decoration-none fw-medium">
                  <i className="bi bi-arrow-left me-1"></i>
                  Retour à la connexion
                </Link>
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

export default RegisterRoleSelect;