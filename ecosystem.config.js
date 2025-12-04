module.exports = {
  apps: [
    {
      name: 'doctorq-web',
      cwd: '/home/ec2-user/DoctorQ/estetiQ-web',
      script: 'yarn',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_DISABLE_ESLINT: '1',
        TSC_COMPILE_ON_ERROR: '1',
        NODE_OPTIONS: '--max-old-space-size=4096'
      },
      error_file: '/home/ec2-user/logs/doctorq-web-error.log',
      out_file: '/home/ec2-user/logs/doctorq-web-out.log',
      log_file: '/home/ec2-user/logs/doctorq-web-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'doctorq-api',
      cwd: '/home/ec2-user/DoctorQ/estetiQ-api',
      script: 'uv',
      args: 'run uvicorn src.main:app --host 0.0.0.0 --port 8080',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        ENVIRONMENT: 'production',
        PORT: 8080,
        LOG_LEVEL: 'INFO'
      },
      error_file: '/home/ec2-user/logs/doctorq-api-error.log',
      out_file: '/home/ec2-user/logs/doctorq-api-out.log',
      log_file: '/home/ec2-user/logs/doctorq-api-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ],

  deploy: {
    production: {
      user: 'ec2-user',
      host: 'seu-servidor.amazonaws.com',
      ref: 'origin/main',
      repo: 'git@github.com:rbmarquez/DoctorQ.git',
      path: '/home/ec2-user/DoctorQ',
      'post-deploy': 'cd estetiQ-web && yarn install && yarn build && pm2 reload ecosystem.config.js --env production'
    }
  }
};