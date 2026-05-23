import { createApp } from './app';
import { assertDb } from './config/database';
import { env } from './config/env';

async function main(): Promise<void> {
  try {
    await assertDb();
    console.log('[db] connection established');
  } catch (err) {
    console.error('[db] failed to connect:', err);
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`[api] medflow-api listening on http://localhost:${env.PORT}`);
    console.log(`[api] base path: /api/v1`);
  });
}

void main();
