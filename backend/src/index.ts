import { app } from './app';
import { env } from './config/env';

const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      action: 'server_start',
      port: PORT,
      environment: env.NODE_ENV,
      message: `Server running on http://localhost:${PORT}`,
    }),
  );
});
