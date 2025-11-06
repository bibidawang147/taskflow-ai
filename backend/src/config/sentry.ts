import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️  SENTRY_DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // 性能监控 - 在生产环境中采样，开发环境全量
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profiling - 性能分析
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      nodeProfilingIntegration(),
    ],

    // 错误过滤 - 忽略某些常见的非关键错误
    ignoreErrors: [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
    ],

    // 敏感数据脱敏
    beforeSend(event, hint) {
      // 移除敏感的请求头
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // 移除敏感的请求体数据
      if (event.request?.data) {
        const data = event.request.data as Record<string, any>;
        if (typeof data === 'object' && data !== null) {
          ['password', 'token', 'secret', 'apiKey'].forEach(key => {
            if (data[key]) {
              data[key] = '[REDACTED]';
            }
          });
        }
      }

      return event;
    },
  });

  console.log('✅ Sentry initialized successfully');
}

export default Sentry;
