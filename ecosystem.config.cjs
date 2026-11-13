/**
 * PM2 Ecosystem Configuration for Specs Stock Management
 * Target Subdomain: specs-stock.gemshine.tech
 * Backend Port: 5028
 * Database: Local VPS MongoDB (mongodb://127.0.0.1:27017/specs_stock_db)
 */

module.exports = {
  apps: [
    {
      name: 'specs-stock-server',
      script: './dist-server/index.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 5028,
        CLIENT_URL: 'https://specs-stock.gemshine.tech',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/specs_stock_db',
        MONGODB_DB_NAME: 'specs_stock_db',
        DATA_FILE_PATH: './server/data/db.json',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5028,
        CLIENT_URL: 'https://specs-stock.gemshine.tech',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/specs_stock_db',
        MONGODB_DB_NAME: 'specs_stock_db',
        DATA_FILE_PATH: './server/data/db.json',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
