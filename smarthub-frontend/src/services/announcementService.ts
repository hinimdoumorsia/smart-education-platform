// src/services/announcementService.ts
import api from './api';
import { Announcement, AnnouncementRequest, AnnouncementType } from '../types/announcement';

class AnnouncementService {
  // Créer une annonce
  async create(announcement: AnnouncementRequest): Promise<Announcement> {
    const response = await api.post('/api/v1/announcements', announcement);
    return response.data;
  }

  // Récupérer toutes les annonces
  async getAll(): Promise<Announcement[]> {
    const response = await api.get('/api/v1/announcements');
    return response.data;
  }

  // Récupérer les annonces publiées
  async getPublished(): Promise<Announcement[]> {
    const response = await api.get('/api/v1/announcements/published');
    return response.data;
  }

  // Récupérer les annonces récentes (30 derniers jours)
  async getRecent(): Promise<Announcement[]> {
    const response = await api.get('/api/v1/announcements/recent');
    return response.data;
  }

  // Récupérer une annonce par ID
  async getById(id: number): Promise<Announcement> {
    const response = await api.get(`/api/v1/announcements/${id}`);
    return response.data;
  }

  // Récupérer mes annonces (pour enseignants/admin)
  async getMyAnnouncements(): Promise<Announcement[]> {
    const response = await api.get('/api/v1/announcements/my-announcements');
    return response.data;
  }

  // Récupérer les annonces par auteur
  async getByAuthor(authorId: number): Promise<Announcement[]> {
    const response = await api.get(`/api/v1/announcements/author/${authorId}`);
    return response.data;
  }

  // Récupérer les annonces par type
  async getByType(type: AnnouncementType): Promise<Announcement[]> {
    const response = await api.get(`/api/v1/announcements/type/${type}`);
    return response.data;
  }

  // Récupérer les annonces par type et publiées
  async getByTypePublished(type: AnnouncementType): Promise<Announcement[]> {
    const response = await api.get(`/api/v1/announcements/type/${type}/published`);
    return response.data;
  }

  // Rechercher des annonces
  async search(query: string): Promise<Announcement[]> {
    const response = await api.get('/api/v1/announcements/search', {
      params: { query }
    });
    return response.data;
  }

  // Mettre à jour une annonce
  async update(id: number, announcement: Partial<AnnouncementRequest>): Promise<Announcement> {
    const response = await api.put(`/api/v1/announcements/${id}`, announcement);
    return response.data;
  }

  // Supprimer une annonce
  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/announcements/${id}`);
  }

  // Basculer le statut de publication
  async togglePublishStatus(id: number): Promise<Announcement> {
    const response = await api.patch(`/api/v1/announcements/${id}/toggle-publish`);
    return response.data;
  }

  // Méthodes utilitaires
  getTypeLabel(type: AnnouncementType): string {
    switch (type) {
      case AnnouncementType.SEMINAR: return 'Séminaire';
      case AnnouncementType.WORKSHOP: return 'Atelier';
      case AnnouncementType.DEFENSE: return 'Soutenance';
      case AnnouncementType.JOB_OFFER: return 'Offre d\'emploi';
      case AnnouncementType.INTERNSHIP_OFFER: return 'Offre de stage';
      default: return type;
    }
  }

  getTypeColor(type: AnnouncementType): string {
    switch (type) {
      case AnnouncementType.SEMINAR: return 'primary';
      case AnnouncementType.WORKSHOP: return 'success';
      case AnnouncementType.DEFENSE: return 'info';
      case AnnouncementType.JOB_OFFER: return 'warning';
      case AnnouncementType.INTERNSHIP_OFFER: return 'danger';
      default: return 'secondary';
    }
  }

  getTypeIcon(type: AnnouncementType): string {
    switch (type) {
      case AnnouncementType.SEMINAR: return 'bi-megaphone';
      case AnnouncementType.WORKSHOP: return 'bi-tools';
      case AnnouncementType.DEFENSE: return 'bi-mortarboard';
      case AnnouncementType.JOB_OFFER: return 'bi-briefcase';
      case AnnouncementType.INTERNSHIP_OFFER: return 'bi-briefcase-fill';
      default: return 'bi-bell';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Vérifier si une date est passée
  isPast(dateString: string): boolean {
    return new Date(dateString) < new Date();
  }

  // Vérifier si une date est proche (dans les 7 jours)
  isUpcoming(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    return date > now && date <= nextWeek;
  }
}

const announcementService = new AnnouncementService();
export default announcementService;