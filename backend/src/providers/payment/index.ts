import type { PaymentMethod, PaymentStatus } from '@prisma/client';
import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors.js';

export interface PaymentOrderInput {
  orderId: string;
  orderNumber: string;
  amount: string; // decimal string
  currency: string;
}

export interface CreatedPayment {
  provider: string;
  method: PaymentMethod;
  status: PaymentStatus;
  providerRef?: string | null;
  meta?: Record<string, unknown>;
  /** Instructions for the customer (e.g. bank transfer details). */
  instructions?: string;
}

/**
 * Payment provider abstraction. COD and MANUAL are implemented; online gateways
 * (Razorpay / Stripe / PayU) are reserved — they refuse to run until configured,
 * so the platform never pretends an online payment succeeded.
 */
export interface PaymentProvider {
  readonly name: string;
  supports(method: PaymentMethod): boolean;
  createPayment(order: PaymentOrderInput, method: PaymentMethod): Promise<CreatedPayment>;
  confirmPayment(payment: { id: string; providerRef: string | null }, reference?: string): Promise<{ status: PaymentStatus; providerRef?: string | null }>;
  refund?(payment: { id: string; providerRef: string | null }, amount: string): Promise<{ status: PaymentStatus }>;
}

export class CodPaymentProvider implements PaymentProvider {
  readonly name = 'cod';
  supports(method: PaymentMethod) {
    return method === 'COD';
  }
  async createPayment(): Promise<CreatedPayment> {
    return {
      provider: this.name,
      method: 'COD',
      status: 'PENDING',
      instructions: 'Pay in cash when your artwork is delivered.',
    };
  }
  /** Called by an admin once the courier/artist has collected the cash. */
  async confirmPayment(_payment: { id: string; providerRef: string | null }, reference?: string) {
    return { status: 'PAID' as const, providerRef: reference ?? null };
  }
}

export class ManualPaymentProvider implements PaymentProvider {
  readonly name = 'manual';
  supports(method: PaymentMethod) {
    return method === 'MANUAL';
  }
  async createPayment(order: PaymentOrderInput): Promise<CreatedPayment> {
    return {
      provider: this.name,
      method: 'MANUAL',
      status: 'AWAITING_CONFIRMATION',
      instructions: `Transfer ${order.currency} ${order.amount} via bank transfer / UPI quoting ${order.orderNumber}. Our team confirms the payment manually.`,
    };
  }
  async confirmPayment(_payment: { id: string; providerRef: string | null }, reference?: string) {
    return { status: 'PAID' as const, providerRef: reference ?? null };
  }
}

class UnconfiguredGatewayProvider implements PaymentProvider {
  constructor(
    readonly name: string,
    private readonly method: PaymentMethod,
  ) {}
  supports(method: PaymentMethod) {
    return method === this.method;
  }
  private fail(): never {
    throw new AppError(501, 'PAYMENT_PROVIDER_NOT_CONFIGURED', `${this.name} payments are not configured on this platform yet`);
  }
  async createPayment(): Promise<CreatedPayment> {
    this.fail();
  }
  async confirmPayment(): Promise<{ status: PaymentStatus }> {
    this.fail();
  }
}

const providers: PaymentProvider[] = [
  new CodPaymentProvider(),
  new ManualPaymentProvider(),
  new UnconfiguredGatewayProvider('razorpay', 'RAZORPAY'),
  new UnconfiguredGatewayProvider('stripe', 'STRIPE'),
  new UnconfiguredGatewayProvider('payu', 'PAYU'),
];

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  const p = providers.find((x) => x.supports(method));
  if (!p) throw new AppError(400, 'BAD_REQUEST', `Unsupported payment method ${method}`);
  return p;
}

export function getProviderByName(name: string): PaymentProvider | undefined {
  return providers.find((p) => p.name === name);
}

/** Methods offered at checkout. Only offline methods are live until a gateway is integrated. */
export const ENABLED_METHODS: PaymentMethod[] = ['COD', 'MANUAL'];
export const configuredDefaultProvider = config.PAYMENT_PROVIDER;
