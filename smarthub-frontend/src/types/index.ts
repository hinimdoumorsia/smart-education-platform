// Types utilitaires généraux
// N'affecte pas le code existant

export interface ApiError {
  error: string;
  message: string;
  timestamp?: string;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}