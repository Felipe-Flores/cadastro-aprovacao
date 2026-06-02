import { NestFactory } from '@nestjs/core';
import { AppModule } from '../backend/src/app.module';
import { INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: INestApplication;

export default async function (req: VercelRequest, res: VercelResponse) {
  if (!cachedApp) {
    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
    app.enableCors(); // Habilita CORS para o frontend
    await app.init();
    cachedApp = app;
  }
  (cachedApp.getHttpAdapter().getInstance())(req, res);
}