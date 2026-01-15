import api from './api';
import { 
  Resource, 
  ResourceCreateRequest, 
  ResourceUpdateRequest, 
  ResourceFilters 
} from '../types/resource';

class ResourceService {
  // Get all resources with optional filters
  async getAll(filters?: ResourceFilters): Promise<Resource[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.year) params.append('year', filters.year);
    if (filters?.search) params.append('query', filters.search);
    
    const queryString = params.toString();
    const url = `/api/resources${queryString ? `?${queryString}` : ''}`;
    
    try {
      const response = await api.get<Resource[]>(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  }

  // Get resource by ID
  async getById(id: number): Promise<Resource> {
    try {
      const response = await api.get<Resource>(`/api/resources/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching resource ${id}:`, error);
      throw error;
    }
  }

  // Get my resources (for teachers/admins)
  async getMyResources(): Promise<Resource[]> {
    try {
      const response = await api.get<Resource[]>('/api/resources/my-resources');
      return response.data;
    } catch (error) {
      console.error('Error fetching my resources:', error);
      throw error;
    }
  }

  // Get resources by author
  async getByAuthor(authorId: number): Promise<Resource[]> {
    try {
      const response = await api.get<Resource[]>(`/api/resources/author/${authorId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching resources for author ${authorId}:`, error);
      throw error;
    }
  }

  // Get resources by type
  async getByType(type: string): Promise<Resource[]> {
    try {
      const response = await api.get<Resource[]>(`/api/resources/type/${type}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching resources by type ${type}:`, error);
      throw error;
    }
  }

  // Search resources
  async search(query: string): Promise<Resource[]> {
    try {
      const response = await api.get<Resource[]>(`/api/resources/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error(`Error searching resources with query ${query}:`, error);
      throw error;
    }
  }

  // Create resource
  // Dans src/services/resourceService.ts, modifiez la méthode create :
// Modifiez les méthodes create et update comme suit :

async create(resourceData: ResourceCreateRequest): Promise<Resource> {
  try {
    const formData = new FormData();
    formData.append('title', resourceData.title);
    formData.append('abstractText', resourceData.abstractText || '');
    formData.append('publicationDate', resourceData.publicationDate);
    formData.append('type', resourceData.type);
    
    // ✅ CORRECTION DÉFINITIVE: Garantir que authorIds existe
    const authorIds = resourceData.authorIds ?? []; // Utilisation de l'opérateur de coalescence nulle
    authorIds.forEach(id => {
      formData.append('authorIds', id.toString());
    });
    
    // Ajouter le fichier s'il est fourni
    if (resourceData.file) {
      formData.append('file', resourceData.file);
    }

    const response = await api.post<Resource>('/api/resources', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating resource:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

async update(id: number, resourceData: ResourceUpdateRequest): Promise<Resource> {
  try {
    const formData = new FormData();
    formData.append('title', resourceData.title);
    formData.append('abstractText', resourceData.abstractText || '');
    formData.append('publicationDate', resourceData.publicationDate);
    formData.append('type', resourceData.type);
    
    // ✅ CORRECTION DÉFINITIVE: Garantir que authorIds existe
    const authorIds = resourceData.authorIds ?? []; // Utilisation de l'opérateur de coalescence nulle
    authorIds.forEach(idValue => {
      formData.append('authorIds', idValue.toString());
    });
    
    // Ajouter le fichier s'il est fourni
    if (resourceData.file) {
      formData.append('file', resourceData.file);
    }

    const response = await api.put<Resource>(`/api/resources/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(`Error updating resource ${id}:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}
  // Delete resource
  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/api/resources/${id}`);
    } catch (error) {
      console.error(`Error deleting resource ${id}:`, error);
      throw error;
    }
  }

  // Download file
  async downloadFile(fileName: string, originalFileName: string): Promise<void> {
    try {
      const response = await api.get(`/api/resources/files/${fileName}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // Format file size
  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 Bytes';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file icon
  getFileIcon(fileType?: string): string {
    if (!fileType) return 'bi-file-earmark';
    if (fileType.includes('pdf')) return 'bi-file-pdf text-danger';
    if (fileType.includes('word') || fileType.includes('doc')) return 'bi-file-word text-primary';
    if (fileType.includes('excel') || fileType.includes('xls')) return 'bi-file-excel text-success';
    if (fileType.includes('powerpoint') || fileType.includes('ppt')) return 'bi-file-ppt text-warning';
    if (fileType.includes('image')) return 'bi-file-image text-info';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'bi-file-zip text-secondary';
    return 'bi-file-earmark';
  }

  // Get resource type label
  getTypeLabel(type: string): string {
    switch (type) {
      case 'ARTICLE': return 'Article';
      case 'THESIS': return 'Thèse';
      case 'PUBLICATION': return 'Publication';
      case 'REPORT': return 'Rapport';
      case 'OTHER': return 'Autre';
      default: return type;
    }
  }

  // Get resource type badge class
  getTypeBadge(type: string): string {
    switch (type) {
      case 'ARTICLE': return 'badge bg-primary';
      case 'THESIS': return 'badge bg-success';
      case 'PUBLICATION': return 'badge bg-info';
      case 'REPORT': return 'badge bg-warning';
      case 'OTHER': return 'badge bg-secondary';
      default: return 'badge bg-secondary';
    }
  }
}

const resourceService = new ResourceService();
export default resourceService;