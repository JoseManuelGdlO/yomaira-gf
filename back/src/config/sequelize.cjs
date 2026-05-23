require('dotenv').config();

const common = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'medflow',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  define: {
    underscored: true,
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
};

module.exports = {
  development: { ...common, logging: false },
  test: { ...common, database: (process.env.DB_NAME || 'medflow') + '_test', logging: false },
  production: { ...common, logging: false },
};
