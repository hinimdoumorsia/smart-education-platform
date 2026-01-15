// src/types/project.ts - SIMPLIFIÉ
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