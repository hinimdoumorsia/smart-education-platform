// src/types/announcement.ts
export enum AnnouncementType {
  SEMINAR = 'SEMINAR',
  WORKSHOP = 'WORKSHOP',
  DEFENSE = 'DEFENSE',
  JOB_OFFER = 'JOB_OFFER',
  INTERNSHIP_OFFER = 'INTERNSHIP_OFFER'
}

export interface UserBasic {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: AnnouncementType;
  date: string; // ISO string
  author: UserBasic;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnnouncementRequest {
  title: string;
  content: string;
  type: AnnouncementType;
  date: string; // ISO string
  published?: boolean;
}

export interface AnnouncementFilters {
  type?: AnnouncementType;
  published?: boolean;
  authorId?: number;
  recent?: boolean;
}