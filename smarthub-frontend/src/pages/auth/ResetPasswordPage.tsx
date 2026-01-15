// src/pages/auth/ResetPasswordPage.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

const ResetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Récupérer le token depuis l'URL
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Token de réinitialisation manquant');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setSuccess('Mot de passe réinitialisé avec succès !');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="text-center mb-4">Réinitialiser le mot de passe</h2>
              
              {error && (
                <div className="alert alert-danger">{error}</div>
              )}
              
              {success && (
                <div className="alert alert-success">{success}</div>
              )}

              {!token ? (
                <div className="alert alert-warning">
                  <p>Lien de réinitialisation invalide ou expiré.</p>
                  <a href="/forgot-password" className="btn btn-primary">
                    Demander un nouveau lien
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Nouveau mot de passe</label>
                    <input
                      type="password"
                      className="form-control"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      className="form-control"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;