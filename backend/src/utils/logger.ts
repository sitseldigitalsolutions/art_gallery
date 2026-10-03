import pino from 'pino';
import { config } from '../config/env.js';

export const logger = pino({
  level: config.isTest ? 'silent' : config.isProd ? 'info' : 'debug',
  redact: ['req.headers.authorization', 'req.headers.cookie', 'password', 'passwordHash', '*.password'],
  transport: config.isProd || config.isTest ? undefined : { target: 'pino-pretty', options: { colorize: true } },
});
