import 'dotenv/config';
import { z } from 'zod';

const bool = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),

  BACKEND_FRAMEWORK: z.enum(['express', 'hapi']).default('express'),
  DATABASE_TYPE: z.enum(['mysql', 'mongodb']).default('mysql'),
  ORM_PROVIDER: z.enum(['prisma', 'drizzle', 'mongoose']).default('prisma'),
  DATABASE_URL: z.string().min(1),
  MONGODB_URL: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  /** 'none' is required when the frontend is on a different site than the API (HTTPS only). */
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  FILE_SIGNING_SECRET: z.string().min(32, 'FILE_SIGNING_SECRET must be at least 32 chars'),

  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  LOCAL_UPLOAD_DIR: z.string().default('uploads'),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(15),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_ENDPOINT: z.string().optional(),

  REDIS_ENABLED: bool,
  REDIS_URL: z.string().optional(),

  PAYMENT_PROVIDER: z.enum(['cod', 'manual', 'razorpay', 'stripe', 'payu']).default('cod'),
  DEFAULT_CURRENCY: z.string().default('INR'),
  DEFAULT_COUNTRY: z.string().default('IN'),
  DEFAULT_TIMEZONE: z.string().default('Asia/Kolkata'),
  COMMISSION_DEFAULT_PERCENTAGE: z.coerce.number().min(0).max(100).default(10),
  DIGITAL_DOWNLOAD_LIMIT: z.coerce.number().int().positive().default(5),
  DIGITAL_DOWNLOAD_EXPIRY_DAYS: z.coerce.number().int().positive().default(30),

  AI_PROVIDER: z.string().default('none'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

const env = parsed.data;

if (env.NODE_ENV === 'production' && /replace_me/.test(env.JWT_ACCESS_SECRET + env.JWT_REFRESH_SECRET + env.FILE_SIGNING_SECRET)) {
  console.error('❌ Refusing to start in production with placeholder secrets.');
  process.exit(1);
}

export const config = {
  ...env,
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  maxUploadBytes: Math.round(env.MAX_UPLOAD_MB * 1024 * 1024),
};

export type AppConfig = typeof config;
