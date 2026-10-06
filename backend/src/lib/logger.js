import pino from 'pino';
import { config } from '../config/config.js';

export const logger = pino({
  level: config.LOG_LEVEL || 'info',

  transport:
    config.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        }
      : undefined,

  base: {
    service: 'perplexity-backend',
  },

  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'accessToken',
      'refreshToken',
    ],
    remove: true,
  },
});



// logger.info()  logger.info("Server started");
// logger.error()  logger.error({ error }, "Database connection failed");
// logger.warn() logger.warn("Something unusual happened");
// logger.debug() logger.debug({ userId }, "User fetched");