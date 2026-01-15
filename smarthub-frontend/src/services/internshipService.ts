import api from './api';
import { Internship, InternshipCreateRequest, InternshipUpdateRequest, InternshipFilters } from '../types/internship';

export const internshipService = {
  // Get all internships with optional filters
  getAll: async (filters?: InternshipFilters): Promise<Internship[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.company) params.append('company', filters.company);
    if (filters?.startDateFrom) params.append('startDateFrom', filters.startDateFrom);
    if (filters?.startDateTo) params.append('startDateTo', filters.startDateTo);
    
    const queryString = params.toString();
    const url = `/api/internships${queryString ? `?${queryString}` : ''}`;
    const response = await api.get<Internship[]>(url);
    return response.data;
  },

  // Get internship by ID
  getById: async (id: number): Promise<Internship> => {
    const response = await api.get<Internship>(`/api/internships/${id}`);
    return response.data;
  },

  // Get my internships (for student)
  getMyInternships: async (): Promise<Internship[]> => {
    const response = await api.get<Internship[]>('/api/internships/my-internships');
    return response.data;
  },

  // Get supervised internships (for teacher/supervisor)
  getSupervisedInternships: async (): Promise<Internship[]> => {
    const response = await api.get<Internship[]>('/api/internships/supervised');
    return response.data;
  },

  // Create internship
  create: async (internship: InternshipCreateRequest): Promise<Internship> => {
    const response = await api.post<Internship>('/api/internships', internship);
    return response.data;
  },

  // Update internship
  update: async (id: number, internship: InternshipUpdateRequest): Promise<Internship> => {
    const response = await api.put<Internship>(`/api/internships/${id}`, internship);
    return response.data;
  },

  // Delete internship
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/internships/${id}`);
  },

  // Search internships
  search: async (query: string): Promise<Internship[]> => {
    const response = await api.get<Internship[]>(`/api/internships/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get internships by status
  getByStatus: async (status: string): Promise<Internship[]> => {
    const response = await api.get<Internship[]>(`/api/internships/status/${status}`);
    return response.data;
  },

  // Get active internships
  getActiveInternships: async (): Promise<Internship[]> => {
    const response = await api.get<Internship[]>('/api/internships/active');
    return response.data;
  },

  // Get internships by company
  getByCompany: async (company: string): Promise<Internship[]> => {
    const response = await api.get<Internship[]>(`/api/internships/company/${encodeURIComponent(company)}`);
    return response.data;
  }
};