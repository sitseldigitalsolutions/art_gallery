import { del, get, getPaged, patch, post } from '@/lib/api';
import type { Address, Cart, OrderDetail, OrderSummary, PaymentMethodOption } from '@/lib/types';

export const cartApi = {
  get: () => get<Cart>('/cart'),
  add: (body: { artworkId?: string; customArtRequestId?: string; quantity?: number }) => post<Cart>('/cart/items', body),
  update: (id: string, quantity: number) => patch<Cart>(`/cart/items/${id}`, { quantity }),
  remove: (id: string) => del<Cart>(`/cart/items/${id}`),
};

export interface CheckoutInput {
  addressId?: string;
  shippingAddress?: Omit<Address, 'id' | 'isDefault' | 'label'>;
  paymentMethod: 'COD' | 'MANUAL';
  notes?: string;
}

export const ordersApi = {
  paymentMethods: () => get<PaymentMethodOption[]>('/payments/methods'),
  checkout: (input: CheckoutInput) => post<OrderDetail>('/orders/checkout', input),
  list: (page = 1) => getPaged<OrderSummary>('/orders', { page }),
  detail: (id: string) => get<OrderDetail>(`/orders/${id}`),
  cancel: (id: string) => post(`/orders/${id}/cancel`),
  downloadLink: (accessId: string) => post<{ url: string; expiresInSeconds: number }>(`/downloads/${accessId}/link`),
};
