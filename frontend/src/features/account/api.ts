import { del, get, getPaged, http, patch, post } from '@/lib/api';
import type { Address, ArtworkCard, Notification } from '@/lib/types';

export interface Me {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  createdAt?: string;
}

export const accountApi = {
  me: () => get<Me>('/users/me'),
  update: (body: { fullName?: string; phone?: string }) => patch<Me>('/users/me', body),
  uploadAvatar: async (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return (await http.post('/users/me/avatar', fd)).data.data as Me;
  },
  addresses: () => get<Address[]>('/users/me/addresses'),
  addAddress: (a: Address) => post<Address>('/users/me/addresses', a),
  updateAddress: (id: string, a: Partial<Address>) => patch<Address>(`/users/me/addresses/${id}`, a),
  removeAddress: (id: string) => del(`/users/me/addresses/${id}`),
  recentlyViewed: () => get<ArtworkCard[]>('/users/me/recently-viewed'),
};

export const notificationsApi = {
  list: (page = 1) => getPaged<Notification>('/notifications', { page }),
  unread: () => get<{ count: number }>('/notifications/unread-count'),
  read: (id: string) => patch(`/notifications/${id}/read`),
  readAll: () => patch('/notifications/read-all'),
};
