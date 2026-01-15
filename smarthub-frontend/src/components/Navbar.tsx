import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLLIElement>(null);
  const createDropdownRef = useRef<HTMLLIElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fermer les dropdowns quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target as Node)) {
        setCreateDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fermer les dropdowns quand on change de page
  useEffect(() => {
    setUserDropdownOpen(false);
    setCreateDropdownOpen(false);
  }, [location.pathname]);

  const toggleUserDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    setUserDropdownOpen(!userDropdownOpen);
    setCreateDropdownOpen(false);
  };

  const toggleCreateDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    setCreateDropdownOpen(!createDropdownOpen);
    setUserDropdownOpen(false);
  };

  // Fonction pour générer les liens selon le rôle
  const renderUserSpecificLinks = () => {
    if (!user) return null;

    switch (user.role) {
      case 'ADMIN':
        return (
          <>
            <li className="nav-item">
              <Link className="nav-link" to="/announcements">
                <i className="bi bi-megaphone me-1"></i>
                Annonces
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/internships">
                <i className="bi bi-briefcase me-1"></i>
                Stages
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-warning" to="/admin">
                <i className="bi bi-gear me-1"></i>
                Administration
              </Link>
            </li>
          </>
        );

      case 'TEACHER':
        return (
          <>
            <li className="nav-item">
              <Link className="nav-link" to="/my-courses">
                <i className="bi bi-journal-check me-1"></i>
                Mes cours
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/announcements">
                <i className="bi bi-megaphone me-1"></i>
                Annonces
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/internships">
                <i className="bi bi-briefcase me-1"></i>
                Stages
              </Link>
            </li>
          </>
        );

      case 'STUDENT':
        return (
          <>
            <li className="nav-item">
              <Link className="nav-link" to="/announcements">
                <i className="bi bi-megaphone me-1"></i>
                Annonces
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/my-projects">
                <i className="bi bi-folder-check me-1"></i>
                Mes projets
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/my-internships">
                <i className="bi bi-briefcase-fill me-1"></i>
                Mes stages
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/my-quiz-attempts">
                <i className="bi bi-clipboard-check me-1"></i>
                Mes tentatives
              </Link>
            </li>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-cpu me-2"></i>
          IATD Smarthub
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarMain"
          aria-controls="navbarMain"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarMain">
          {isAuthenticated && (
            <ul className="navbar-nav me-auto">
              {/* Liens communs à tous les utilisateurs */}
              <li className="nav-item">
                <Link className="nav-link" to="/courses">
                  <i className="bi bi-book me-1"></i>
                  Cours
                </Link>
              </li>
              
              <li className="nav-item">
                <Link className="nav-link" to="/projects">
                  <i className="bi bi-folder me-1"></i>
                  Projets
                </Link>
              </li>
              
              <li className="nav-item">
                <Link className="nav-link" to="/resources">
                  <i className="bi bi-journal-text me-1"></i>
                  Ressources
                </Link>
              </li>
              
              <li className="nav-item">
                <Link className="nav-link" to="/quizzes">
                  <i className="bi bi-question-circle me-1"></i>
                  Quiz
                </Link>
              </li>

              {/* Liens spécifiques selon le rôle */}
              {renderUserSpecificLinks()}

              {/* Dropdown création pour enseignants et admin */}
              {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                <li className="nav-item dropdown" ref={createDropdownRef}>
                  <a 
                    className="nav-link dropdown-toggle" 
                    href="#" 
                    onClick={toggleCreateDropdown}
                    role="button"
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Créer
                  </a>
                  {createDropdownOpen && (
                    <ul className="dropdown-menu show">
                      <li>
                        <Link className="dropdown-item" to="/courses/create" onClick={() => setCreateDropdownOpen(false)}>
                          <i className="bi bi-book me-2"></i>
                          Nouveau cours
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/projects/create" onClick={() => setCreateDropdownOpen(false)}>
                          <i className="bi bi-folder-plus me-2"></i>
                          Nouveau projet
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/announcements/create" onClick={() => setCreateDropdownOpen(false)}>
                          <i className="bi bi-megaphone me-2"></i>
                          Nouvelle annonce
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/quizzes/create" onClick={() => setCreateDropdownOpen(false)}>
                          <i className="bi bi-question-circle me-2"></i>
                          Nouveau quiz
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/resources/create" onClick={() => setCreateDropdownOpen(false)}>
                          <i className="bi bi-journal-plus me-2"></i>
                          Nouvelle ressource
                        </Link>
                      </li>
                      {user?.role === 'ADMIN' && (
                        <>
                          <li className="dropdown-divider"></li>
                          <li>
                            <Link className="dropdown-item text-warning" to="/internships/create" onClick={() => setCreateDropdownOpen(false)}>
                              <i className="bi bi-briefcase me-2"></i>
                              Nouveau stage
                            </Link>
                          </li>
                        </>
                      )}
                    </ul>
                  )}
                </li>
              )}
            </ul>
          )}
          
          {/* Section droite : utilisateur */}
          <div className="navbar-nav ms-auto">
            {isAuthenticated && user ? (
              <li className="nav-item dropdown" ref={userDropdownRef}>
                <a 
                  className="nav-link dropdown-toggle d-flex align-items-center" 
                  href="#" 
                  onClick={toggleUserDropdown}
                  role="button"
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-person-circle me-2"></i>
                  <div className="d-flex flex-column align-items-start me-2">
                    <span>{user.firstName || user.username}</span>
                    <small className="d-flex align-items-center">
                      <span className={`badge ${user.role === 'ADMIN' ? 'bg-danger' : user.role === 'TEACHER' ? 'bg-warning' : 'bg-info'}`}>
                        {user.role}
                      </span>
                    </small>
                  </div>
                </a>
                {userDropdownOpen && (
                  <ul className="dropdown-menu dropdown-menu-end show">
                    <li className="dropdown-header">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" 
                             style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                          {user.firstName?.[0] || user.username[0]}
                        </div>
                        <div>
                          <div className="fw-bold">{user.firstName} {user.lastName}</div>
                          <div className="text-muted small">@{user.username}</div>
                        </div>
                      </div>
                    </li>
                    <li className="dropdown-divider"></li>
                    <li>
                      <Link className="dropdown-item" to="/profile" onClick={() => setUserDropdownOpen(false)}>
                        <i className="bi bi-person me-2"></i>
                        Mon profil
                      </Link>
                    </li>
                    
                    {/* Liens spécifiques dans le dropdown selon le rôle */}
                    {user.role === 'STUDENT' && (
                      <>
                        <li>
                          <Link className="dropdown-item" to="/my-projects" onClick={() => setUserDropdownOpen(false)}>
                            <i className="bi bi-folder-check me-2"></i>
                            Mes projets
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/my-internships" onClick={() => setUserDropdownOpen(false)}>
                            <i className="bi bi-briefcase-fill me-2"></i>
                            Mes stages
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/my-quiz-attempts" onClick={() => setUserDropdownOpen(false)}>
                            <i className="bi bi-clipboard-check me-2"></i>
                            Mes tentatives
                          </Link>
                        </li>
                      </>
                    )}
                    
                    {user.role === 'TEACHER' && (
                      <>
                        <li>
                          <Link className="dropdown-item" to="/my-courses" onClick={() => setUserDropdownOpen(false)}>
                            <i className="bi bi-journal-check me-2"></i>
                            Mes cours
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/my-projects" onClick={() => setUserDropdownOpen(false)}>
                            <i className="bi bi-folder-check me-2"></i>
                            Mes projets
                          </Link>
                        </li>
                      </>
                    )}
                    
                    {user.role === 'ADMIN' && (
                      <li>
                        <Link className="dropdown-item text-warning" to="/admin" onClick={() => setUserDropdownOpen(false)}>
                          <i className="bi bi-gear me-2"></i>
                          Administration
                        </Link>
                      </li>
                    )}
                    
                    <li className="dropdown-divider"></li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Déconnexion
                      </button>
                    </li>
                  </ul>
                )}
              </li>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/login">
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  Connexion
                </Link>
              </li>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;