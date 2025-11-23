import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════╗
  ║         Payment API - Running             ║
  ╠═══════════════════════════════════════════╣
  ║  🚀 Server:  http://localhost:${port}        ║
  ╚═══════════════════════════════════════════╝
  `);
}
bootstrap();
