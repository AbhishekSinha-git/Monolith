import { http } from '@/api/client';
import { config } from '@/config';

export type Session = {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
  isAuthenticated: boolean;
  connectedProviders?: Array<{ name: string; status: 'connected' | 'error' | 'syncing'; lastSync?: string }>;
  scopes?: string[];
};

export const authApi = {
  getSession: () => http.get<Session>('/api/auth/session'),
  beginGoogleOAuth: (params: { redirectUri: string }) =>
    http.post<{ authorizationUrl: string }>('/api/auth/google/begin', params),
  logout: () => http.post<void>('/api/auth/logout'),
  googleAuth: () => window.location.href = `${config.apiBaseUrl}/api/auth/google`,
};


