import * as Sentry from '@sentry/react';

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('⚠️  VITE_SENTRY_DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',

    // 性能监控 - 在生产环境中采样
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    // Session Replay - 用户会话重放（可选）
    replaysSessionSampleRate: 0.1, // 10% 的正常会话
    replaysOnErrorSampleRate: 1.0, // 100% 的错误会话

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // 错误过滤
    ignoreErrors: [
      // 忽略浏览器扩展错误
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      // 忽略网络错误
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
    ],

    // 敏感数据脱敏
    beforeSend(event, hint) {
      // 移除可能包含敏感信息的 breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.filter(breadcrumb => {
          // 过滤掉可能包含敏感数据的控制台日志
          if (breadcrumb.category === 'console') {
            return false;
          }
          return true;
        });
      }

      // 移除 URL 中的敏感参数
      if (event.request?.url) {
        const url = new URL(event.request.url);
        ['token', 'key', 'password'].forEach(param => {
          if (url.searchParams.has(param)) {
            url.searchParams.set(param, '[REDACTED]');
          }
        });
        event.request.url = url.toString();
      }

      return event;
    },
  });

  console.log('✅ Sentry initialized successfully');
}
