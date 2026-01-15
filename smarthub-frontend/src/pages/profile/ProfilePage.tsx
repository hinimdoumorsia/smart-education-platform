import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UserType {
  id: string;
  username: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  profileImage?: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Photo de profil
  const [profileImage, setProfileImage] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      }));
      
      // Charger l'image de profil si elle existe dans l'utilisateur
      if (user.profileImage) {
        const timestamp = new Date().getTime();
        setProfileImage(`http://localhost:8081${user.profileImage}?t=${timestamp}`);
      } else {
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
        if (initials) {
          setProfileImage(`https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=0D8ABC&color=fff&size=128`);
        } else {
          setProfileImage(`https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=0D8ABC&color=fff&size=128`);
        }
      }
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { currentPassword, newPassword, confirmPassword, ...profileData } = formData;
      await updateUser(profileData);
      await refreshUser();
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour du profil' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });
      setLoading(false);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Mot de passe changé avec succès !' });
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors du changement de mot de passe' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Veuillez sélectionner une image valide' });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'L\'image ne doit pas dépasser 5MB' });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async () => {
    if (!imageFile || !user) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.post(`/api/v1/users/${user.id}/profile-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Le backend retourne l'utilisateur complet
      const updatedUser = response.data;
      
      // Mettre à jour l'utilisateur dans le contexte d'authentification
      const updatedUserData: UserType = {
        id: updatedUser.id.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
        active: updatedUser.active,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        profileImage: updatedUser.profileImage
      };
      
      // Rafraîchir l'utilisateur via le contexte
      await refreshUser();
      
      // Mettre à jour l'image affichée
      if (updatedUser.profileImage) {
        const timestamp = new Date().getTime();
        setProfileImage(`http://localhost:8081${updatedUser.profileImage}?t=${timestamp}`);
      }
      
      setMessage({ type: 'success', text: 'Photo de profil mise à jour avec succès !' });
      
      // Réinitialiser le fichier sélectionné
      setImageFile(null);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.response?.data || 'Erreur lors de l\'upload de la photo' 
      });
    } finally {
      setUploadingImage(false);
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mt-4">
      <div className="row g-4">
        {/* Colonne gauche - Photo et informations basiques */}
        <div className="col-lg-4 col-md-5">
          <div className="card shadow h-100">
            <div className="card-body text-center">
              <div className="mb-3 position-relative">
                <div className="rounded-circle mx-auto mb-3 border border-4 border-primary position-relative" 
                     style={{ 
                       width: '150px', 
                       height: '150px', 
                       overflow: 'hidden',
                       background: profileImage ? `url(${profileImage}) center/cover` : '#0D8ABC'
                     }}>
                  {!profileImage && (
                    <div className="text-white d-flex align-items-center justify-content-center h-100" 
                         style={{ fontSize: '48px' }}>
                      {user.firstName?.[0] || user.username[0]}
                    </div>
                  )}
                </div>
                
                <div className="position-absolute bottom-0 end-50 translate-middle-x">
                  <label className="btn btn-primary btn-sm rounded-pill" style={{ cursor: 'pointer' }}>
                    <i className="bi bi-camera me-1"></i>
                    Changer
                    <input
                      type="file"
                      accept="image/*"
                      className="d-none"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>

              <h4 className="mb-1">{user.firstName} {user.lastName}</h4>
              <p className="text-muted mb-2">@{user.username}</p>
              <div className={`badge ${user.role === 'ADMIN' ? 'bg-danger' : user.role === 'TEACHER' ? 'bg-warning' : 'bg-info'} mb-3`}>
                {user.role}
              </div>

              {imageFile && (
                <div className="mb-3">
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={uploadProfileImage}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Envoi...
                      </>
                    ) : (
                      'Sauvegarder la photo'
                    )}
                  </button>
                  <button 
                    className="btn btn-outline-secondary btn-sm ms-2"
                    onClick={() => {
                      setImageFile(null);
                      // Réinitialiser à l'image actuelle
                      if (user?.profileImage) {
                        const timestamp = new Date().getTime();
                        setProfileImage(`http://localhost:8081${user.profileImage}?t=${timestamp}`);
                      } else {
                        const firstName = user?.firstName || '';
                        const lastName = user?.lastName || '';
                        const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
                        if (initials) {
                          setProfileImage(`https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=0D8ABC&color=fff&size=128`);
                        }
                      }
                    }}
                  >
                    Annuler
                  </button>
                </div>
              )}

              <div className="mt-3">
                <p className="mb-2">
                  <i className="bi bi-envelope me-2 text-primary"></i>
                  {user.email}
                </p>
                {user.phoneNumber && (
                  <p className="mb-2">
                    <i className="bi bi-telephone me-2 text-primary"></i>
                    {user.phoneNumber}
                  </p>
                )}
                <p className="text-muted small">
                  <i className="bi bi-calendar me-2"></i>
                  Membre depuis: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Statistiques selon le rôle */}
          <div className="card shadow mt-3">
            <div className="card-body">
              <h5 className="card-title mb-3">Statistiques</h5>
              
              {user.role === 'STUDENT' && (
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Cours suivis</span>
                    <span className="badge bg-primary rounded-pill">0</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Projets</span>
                    <span className="badge bg-success rounded-pill">0</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Quiz complétés</span>
                    <span className="badge bg-warning rounded-pill">0</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Stages</span>
                    <span className="badge bg-info rounded-pill">0</span>
                  </li>
                </ul>
              )}

              {user.role === 'TEACHER' && (
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Cours créés</span>
                    <span className="badge bg-primary rounded-pill">0</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Projets supervisés</span>
                    <span className="badge bg-success rounded-pill">0</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Annonces publiées</span>
                    <span className="badge bg-info rounded-pill">0</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Quiz créés</span>
                    <span className="badge bg-warning rounded-pill">0</span>
                  </li>
                </ul>
              )}

              {user.role === 'ADMIN' && (
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Utilisateurs</span>
                    <span className="badge bg-danger rounded-pill">0</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Total Cours</span>
                    <span className="badge bg-primary rounded-pill">0</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Total Projets</span>
                    <span className="badge bg-success rounded-pill">0</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Total Quiz</span>
                    <span className="badge bg-warning rounded-pill">0</span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite - Formulaire et onglets */}
        <div className="col-lg-8 col-md-7">
          <div className="card shadow h-100">
            <div className="card-header bg-white">
              <ul className="nav nav-tabs card-header-tabs border-0">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                  >
                    <i className="bi bi-person me-2"></i>
                    Informations
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                    onClick={() => setActiveTab('password')}
                  >
                    <i className="bi bi-shield-lock me-2"></i>
                    Sécurité
                  </button>
                </li>
                {user.role === 'STUDENT' && (
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'academic' ? 'active' : ''}`}
                      onClick={() => setActiveTab('academic')}
                    >
                      <i className="bi bi-mortarboard me-2"></i>
                      Académique
                    </button>
                  </li>
                )}
              </ul>
            </div>
            
            <div className="card-body">
              {message.text && (
                <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show mb-4`}>
                  {message.text}
                  <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
                </div>
              )}

              {activeTab === 'info' && (
                <form onSubmit={handleProfileUpdate}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Prénom *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Nom *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Téléphone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="+212 6 00 00 00 00"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Nom d'utilisateur</label>
                    <input
                      type="text"
                      className="form-control"
                      value={user.username}
                      disabled
                    />
                    <small className="text-muted">Le nom d'utilisateur ne peut pas être modifié</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Rôle</label>
                    <input
                      type="text"
                      className="form-control"
                      value={user.role}
                      disabled
                    />
                  </div>

                  <div className="text-end">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'password' && (
                <form onSubmit={handlePasswordChange}>
                  <div className="mb-4">
                    <h5 className="mb-3">Changer votre mot de passe</h5>
                    <p className="text-muted">Pour des raisons de sécurité, veuillez utiliser un mot de passe fort et unique.</p>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Mot de passe actuel *</label>
                    <input
                      type="password"
                      className="form-control"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Nouveau mot de passe *</label>
                    <input
                      type="password"
                      className="form-control"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                    <small className="text-muted">Minimum 6 caractères</small>
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Confirmer le nouveau mot de passe *</label>
                    <input
                      type="password"
                      className="form-control"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="text-end">
                    <button
                      type="submit"
                      className="btn btn-warning"
                      disabled={loading}
                    >
                      {loading ? 'Changement en cours...' : 'Changer le mot de passe'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'academic' && user.role === 'STUDENT' && (
                <div>
                  <h5 className="mb-3">Informations académiques</h5>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Niveau d'études</label>
                      <input
                        type="text"
                        className="form-control"
                        defaultValue="Licence"
                        disabled
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Spécialité</label>
                      <input
                        type="text"
                        className="form-control"
                        defaultValue="Informatique"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Année universitaire</label>
                    <input
                      type="text"
                      className="form-control"
                      defaultValue="2023-2024"
                      disabled
                    />
                  </div>
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Ces informations sont gérées par l'administration. Contactez le service académique pour toute modification.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Préférences selon le rôle */}
          <div className="card shadow mt-4">
            <div className="card-header">
              <h5 className="mb-0">Préférences</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" id="notifications" defaultChecked />
                    <label className="form-check-label" htmlFor="notifications">
                      Notifications par email
                    </label>
                  </div>
                  <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" id="newsletter" defaultChecked />
                    <label className="form-check-label" htmlFor="newsletter">
                      Newsletter académique
                    </label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" id="projectAlerts" defaultChecked />
                    <label className="form-check-label" htmlFor="projectAlerts">
                      Alertes de projets
                    </label>
                  </div>
                  <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" id="deadlineReminders" defaultChecked />
                    <label className="form-check-label" htmlFor="deadlineReminders">
                      Rappels d'échéances
                    </label>
                  </div>
                </div>
              </div>
              <div className="text-end mt-3">
                <button className="btn btn-outline-primary">
                  <i className="bi bi-save me-2"></i>
                  Sauvegarder les préférences
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;