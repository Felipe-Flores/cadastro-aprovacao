import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Ativa a validação automática baseada nos DTOs
  app.useGlobalPipes(new ValidationPipe()); 
  
  // Permite que o Frontend (Vite) acesse esta API
  app.enableCors(); 

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`O servidor está rodando em: http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();