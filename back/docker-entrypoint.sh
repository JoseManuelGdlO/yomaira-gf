#!/bin/sh
set -e

DB_HOST="${DB_HOST:-mysql}"
DB_PORT="${DB_PORT:-3306}"

echo "[entrypoint] Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
node -e "
const net = require('net');
const host = process.env.DB_HOST || 'mysql';
const port = Number(process.env.DB_PORT || 3306);
function wait() {
  const socket = net.createConnection({ host, port }, () => {
    socket.end();
    process.exit(0);
  });
  socket.on('error', () => setTimeout(wait, 2000));
}
wait();
"
echo "[entrypoint] MySQL is reachable"

echo "[entrypoint] Running migrations..."
NODE_ENV=production npx sequelize-cli db:migrate

echo "[entrypoint] Starting server..."
exec "$@"
