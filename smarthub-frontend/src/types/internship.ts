export interface UserBasicDTO {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export interface Internship {
  id: number;
  title: string;
  description: string;
  student: UserBasicDTO;
  supervisor: UserBasicDTO;
  company: string;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface InternshipCreateRequest {
  title: string;
  description: string;
  studentId: number;
  supervisorId?: number; // Optionnel, car peut être assigné automatiquement
  company: string;
  startDate: string;
  endDate: string;
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface InternshipUpdateRequest extends InternshipCreateRequest {}

export interface InternshipFilters {
  status?: string;
  company?: string;
  startDateFrom?: string;
  startDateTo?: string;
}