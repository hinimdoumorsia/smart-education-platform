import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username.trim(), password.trim());
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      if (errorMsg.includes('Bad credentials') || errorMsg.includes('Identifications sont erronées')) {
        setError('Nom d\'utilisateur ou mot de passe incorrect');
      } else {
        setError(errorMsg || 'Échec de la connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordMessage('');
    
    if (!forgotPasswordEmail) {
      setForgotPasswordMessage('Veuillez entrer votre email');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setForgotPasswordMessage(`Un email de réinitialisation a été envoyé à ${forgotPasswordEmail}`);
      setForgotPasswordEmail('');
    } catch (err) {
      setForgotPasswordMessage('Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          {/* En-tête compact - Logo uniquement */}
          <div className="d-flex align-items-center justify-content-center mb-3">
            {/* Logo de l'école - SANS icône */}
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
              {/* SEULEMENT le logo image */}
              <img 
                src="/logo-giatd.jpg" 
                alt="Logo GIATD-ENSAM" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  borderRadius: '50%',
                  //padding: '5px'
                }} 
                onError={(e) => {
                  // Fallback si le logo n'existe pas
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
            
            {/* Texte à droite du logo */}
            <div className="text-start">
              <h2 className="fw-bold text-primary mb-0" style={{ fontSize: '1.8rem' }}>
                GIATD-SI
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: '1rem' }}>
                École Nationale Supérieure des Arts et Métiers - Meknès
              </p>
            </div>
          </div>

          {/* Ligne séparatrice */}
          <hr className="mb-4" />

          {/* Formulaire de connexion */}
          <div className="card shadow border-0">
            <div className="card-body p-4">
              <h4 className="text-center mb-4">Connexion à SmartHub</h4>
              
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}

              {!showForgotPassword ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label fw-medium">
                      <i className="bi bi-person me-1"></i>
                      Nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="Entrez votre nom d'utilisateur"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-medium">
                      <i className="bi bi-key me-1"></i>
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="Entrez votre mot de passe"
                    />
                  </div>

                  <div className="mb-3 text-end">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none p-0 text-primary"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      <i className="bi bi-question-circle me-1"></i>
                      Mot de passe oublié ?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Se connecter
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <div className="mb-3">
                    <p className="text-muted mb-3">
                      <i className="bi bi-info-circle me-1"></i>
                      Entrez votre email pour réinitialiser votre mot de passe.
                    </p>
                    <label htmlFor="forgotPasswordEmail" className="form-label fw-medium">
                      Adresse email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="forgotPasswordEmail"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="votre.email@ensam.ma"
                      required
                      disabled={loading}
                    />
                  </div>

                  {forgotPasswordMessage && (
                    <div className={`alert ${forgotPasswordMessage.includes('envoyé') ? 'alert-success' : 'alert-info'} mb-3`}>
                      <i className="bi bi-check-circle me-2"></i>
                      {forgotPasswordMessage}
                    </div>
                  )}

                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordMessage('');
                      }}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-left me-1"></i>
                      Retour
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-1"></i>
                          Envoyer
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center mt-4 pt-3 border-top">
                <p className="mb-2">
                  Pas encore de compte ?{' '}
                <Link to="/register/select-role" className="text-decoration-none fw-medium text-primary">
                  <i className="bi bi-person-plus me-1"></i>
                  Créer un compte
                </Link>
                </p>
                <p className="text-muted small mb-0">
                  <i className="bi bi-shield-check me-1"></i>
                  Plateforme sécurisée - IATD SmartHub v1.0
                </p>
              </div>
            </div>
          </div>

          {/* Footer minimaliste */}
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

export default LoginPage;