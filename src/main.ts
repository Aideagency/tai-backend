import * as crypto from 'crypto';

// @ts-ignore
if (!global.crypto) {
  // attach Node’s crypto to global
  // @ts-ignore
  global.crypto = crypto;
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TracerLogger } from './logger/logger.service';

import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as session from 'express-session';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // enable Nest logger (remove the next line entirely or set levels as needed)
    logger: ['error'],
    // logger: false,
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
  });

  // ⭐ ADDED — EJS view engine
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  // ⭐ ADDED — SESSION for login-protected views
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'super-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // set true if using HTTPS
      },
    }),
  );

  // ⭐ ADDED — Passport for login
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(cookieParser());

  // Optional: global validation
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Correct way to set trust proxy on the underlying Express app
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // If you really want a raw error handler, keep it AFTER trust proxy:
  expressApp.use((err: Error, _req, res, _next) => {
    const currentTime = new Date().toISOString();
    // Use console.log or Nest Logger here
    // eslint-disable-next-line no-console
    console.error(`[${currentTime}] Error:`, err);
    res.status(500).json({ message: 'Error: ' + err.message });
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('TAI App')
    .setDescription('API documentation The Agudah Institute')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });
  SwaggerModule.setup('api/v1/backend', app, document);

  const port = Number(process.env.PORT);

  await app.listen(port);
  // ✅ Log AFTER listen resolves
  const logger = new TracerLogger();
  logger.log(`Server is running on port ${port}`);
  logger.log(`Swagger: http://localhost:${port}/api/v1/backend`);
}

bootstrap();
