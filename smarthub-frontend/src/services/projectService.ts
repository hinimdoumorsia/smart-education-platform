// src/services/projectService.ts - VERSION CORRIGÉE
import api from './api';

// Définir et EXPORTER les types
export enum ProjectStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}


export interface ProjectUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

// Dans src/services/projectService.ts, ajoutez AVANT la classe :

export interface UserBasic {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

// Les autres exports (ProjectStatus, Project, etc.)...


export interface Project {
  id: number;
  title: string;
  description: string;
  students: ProjectUser[];
  supervisor: ProjectUser;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectRequest {
  title: string;
  description: string;
  studentIds: number[];
  startDate: string;
  endDate: string;
  status?: ProjectStatus;
}

class ProjectService {
  // Récupérer tous les projets
  async getAll(): Promise<Project[]> {
    const response = await api.get('/api/projects');
    return response.data;
  }

  // Récupérer un projet par ID
  async getById(id: number): Promise<Project> {
    const response = await api.get(`/api/projects/${id}`);
    return response.data;
  }

  // Créer un projet
  async create(project: ProjectRequest): Promise<Project> {
    const response = await api.post('/api/projects', project);
    return response.data;
  }

  // Mettre à jour un projet
  async update(id: number, project: Partial<ProjectRequest>): Promise<Project> {
    const response = await api.put(`/api/projects/${id}`, project);
    return response.data;
  }

  // Supprimer un projet
  async delete(id: number): Promise<void> {
    await api.delete(`/api/projects/${id}`);
  }

  // Récupérer mes projets (enseignants/admin)
  async getMyProjects(): Promise<Project[]> {
    const response = await api.get('/api/projects/my-projects');
    return response.data;
  }

  // Récupérer mes projets étudiants
  async getMyStudentProjects(): Promise<Project[]> {
    const response = await api.get('/api/projects/student/my-projects');
    return response.data;
  }

  // Rechercher des projets
  async search(query: string): Promise<Project[]> {
    const response = await api.get('/api/projects/search', {
      params: { query }
    });
    return response.data;
  }

  // Filtrer par statut
  async getByStatus(status: ProjectStatus): Promise<Project[]> {
    const response = await api.get(`/api/projects/status/${status}`);
    return response.data;
  }

  // Récupérer les projets actifs
  async getActiveProjects(): Promise<Project[]> {
    const response = await api.get('/api/projects/active');
    return response.data;
  }

  // Gestion des étudiants
  async addStudent(projectId: number, studentId: number): Promise<void> {
    await api.post(`/api/projects/${projectId}/students/${studentId}`);
  }

  async addStudents(projectId: number, studentIds: number[]): Promise<void> {
    await api.post(`/api/projects/${projectId}/students`, studentIds);
  }

  async removeStudent(projectId: number, studentId: number): Promise<void> {
    await api.delete(`/api/projects/${projectId}/students/${studentId}`);
  }

  // Utilitaires
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getStatusColor(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.PLANNED: return 'secondary';
      case ProjectStatus.IN_PROGRESS: return 'primary';
      case ProjectStatus.COMPLETED: return 'success';
      case ProjectStatus.CANCELLED: return 'danger';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.PLANNED: return 'Planifié';
      case ProjectStatus.IN_PROGRESS: return 'En cours';
      case ProjectStatus.COMPLETED: return 'Terminé';
      case ProjectStatus.CANCELLED: return 'Annulé';
      default: return status;
    }
  }

  calculateProgress(startDate: string, endDate: string): number {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.round((elapsed / total) * 100));
  }
}

const projectService = new ProjectService();
export default projectService;