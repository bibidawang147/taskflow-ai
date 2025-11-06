module.exports = {
  apps: [{
    name: 'workflow-backend',
    script: './dist/server.js',

    // 集群模式，使用所有 CPU 核心
    instances: 'max',
    exec_mode: 'cluster',

    // 环境变量
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },

    // 日志配置
    error_file: './logs/pm2-err.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // 内存限制
    max_memory_restart: '500M',

    // 自动重启
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,

    // 优雅关闭
    kill_timeout: 5000,
    listen_timeout: 3000,

    // 监控
    instance_var: 'INSTANCE_ID',

    // cron 重启（每天凌晨2点）
    cron_restart: '0 2 * * *',

    // 其他配置
    node_args: '--max-old-space-size=2048',
  }],

  // 部署配置（可选）
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:username/workflow-platform.git',
      path: '/var/www/workflow-platform',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
