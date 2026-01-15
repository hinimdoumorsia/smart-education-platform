import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  active: boolean;
  createdAt?: string;
}

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await userService.getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
    if (!window.confirm('Êtes-vous sûr de vouloir modifier le rôle de cet utilisateur ?')) {
      return;
    }

    try {
      // Ici, vous appellerez votre API pour mettre à jour le rôle
      // Exemple : await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      alert(`Rôle de l'utilisateur ${userId} changé en ${newRole}`);
      loadUsers(); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la modification du rôle:', error);
      alert('Erreur lors de la modification du rôle');
    }
  };

  const handleActivationToggle = async (userId: string, currentActive: boolean) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir ${currentActive ? 'désactiver' : 'activer'} cet utilisateur ?`)) {
      return;
    }

    try {
      // Ici, vous appellerez votre API pour activer/désactiver
      // Exemple : await api.put(`/api/admin/users/${userId}/active`, { active: !currentActive });
      alert(`Utilisateur ${currentActive ? 'désactivé' : 'activé'}`);
      loadUsers(); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = selectedRole === '' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Accès réservé aux administrateurs</h4>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Gestion des Utilisateurs</h1>
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher par nom, email, prénom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3 mb-3">
              <select
                className="form-control"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">Tous les rôles</option>
                <option value="STUDENT">Étudiant</option>
                <option value="TEACHER">Enseignant</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>
            <div className="col-md-3 mb-3">
              <button className="btn btn-primary w-100" onClick={loadUsers} disabled={loading}>
                {loading ? 'Chargement...' : 'Rafraîchir'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom d'utilisateur</th>
                    <th>Nom complet</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td><small className="text-muted">{user.id.slice(0, 8)}...</small></td>
                      <td>{user.username}</td>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>{user.email}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                          disabled={user.id === currentUser?.id}
                        >
                          <option value="STUDENT">Étudiant</option>
                          <option value="TEACHER">Enseignant</option>
                          <option value="ADMIN">Administrateur</option>
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${user.active ? 'bg-success' : 'bg-danger'}`}>
                          {user.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className={`btn ${user.active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            onClick={() => handleActivationToggle(user.id, user.active)}
                            title={user.active ? 'Désactiver' : 'Activer'}
                            disabled={user.id === currentUser?.id}
                          >
                            {user.active ? 'Désactiver' : 'Activer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-4">
                <p className="text-muted">Aucun utilisateur trouvé</p>
              </div>
            )}
            
            <div className="mt-3">
              <p className="text-muted">
                Total: {filteredUsers.length} utilisateur(s)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;