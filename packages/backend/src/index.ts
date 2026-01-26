import 'dotenv/config';
import { initDI } from './di-container';
import { createApp } from './infrastructure/http/app';
import { connectDatabase } from './infrastructure/database';

async function bootstrap() {
  try {
    initDI();

    await connectDatabase();

    const app = createApp();
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
