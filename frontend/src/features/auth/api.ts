import { post } from '@/lib/api';
import type { AuthUser } from '@/lib/types';

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface ArtistRegisterInput extends RegisterInput {
  displayName: string;
  artistType: 'INDIVIDUAL' | 'STUDIO' | 'GALLERY' | 'CREATIVE_BUSINESS';
  bio?: string;
  description?: string;
  artistStatement?: string;
  yearsOfExperience?: number;
  country: string;
  state?: string;
  city?: string;
  address?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  primaryCategoryId?: string;
  styleIds: string[];
  mediumIds: string[];
  specializations: string[];
  awards: string[];
  acceptsCustomArt: boolean;
}

export const authApi = {
  login: (email: string, password: string) => post<AuthResponse>('/auth/login', { email, password }),
  register: (input: RegisterInput) => post<AuthResponse>('/auth/register', input),
  registerArtist: (input: ArtistRegisterInput) => post<AuthResponse>('/auth/register/artist', input),
  logout: () => post<{ loggedOut: boolean }>('/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    post('/auth/change-password', { currentPassword, newPassword }),
};
