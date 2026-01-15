export interface UserBasicDTO {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export interface Resource {
  id: number;
  title: string;
  authors: UserBasicDTO[];
  abstractText: string;
  publicationDate: string;
  originalFileName?: string;
  fileDownloadUrl?: string;
  fileSize?: number;
  fileType?: string;
  type: 'ARTICLE' | 'THESIS' | 'PUBLICATION' | 'REPORT' | 'OTHER';
  createdAt: string;
  updatedAt: string;
}

export interface ResourceCreateRequest {
  title: string;
  authorIds?: number[];
  abstractText: string;
  publicationDate: string;
  file?: File;
  type: 'ARTICLE' | 'THESIS' | 'PUBLICATION' | 'REPORT' | 'OTHER';
}

export interface ResourceUpdateRequest extends ResourceCreateRequest {}

export interface ResourceFilters {
  type?: string;
  year?: string;
  author?: string;
  search?: string;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  downloadUrl?: string;
}