export type ApiErrorKind = 'NETWORK' | 'TIMEOUT' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'SERVER_ERROR' | 'CLIENT_ERROR';

export class ApiError extends Error {
  status?: number;
  kind: ApiErrorKind;
  data?: any;

  constructor(message: string, kind: ApiErrorKind, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.data = data;
  }
}

export function classifyHttpStatus(status: number): ApiErrorKind {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 404) return 'NOT_FOUND';
  if (status >= 500) return 'SERVER_ERROR';
  return 'CLIENT_ERROR';
}
