import { createApp } from './app.js';
import { env } from './config/env.js';

const start = async () => {
  const app = await createApp();

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server running at http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
