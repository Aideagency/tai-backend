// import { NestFactory } from '@nestjs/core';
// import { ValidationPipe } from '@nestjs/common';
// import { AppModule } from './app.module';
// import { TracerLogger } from './logger/logger.service';
// import { Request, Response, NextFunction } from 'express';
// import * as express from 'express';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule, {
//     logger: false,
//     cors: true,
//     // bufferLogs: true,
//   });
//   // app.useGlobalPipes(new ValidationPipe());
//   app.enableCors();
//   app.use((req: Request, res: Response, next: NextFunction) => {
//     if (req.method === 'OPTIONS') {
//       res.sendStatus(200);
//     } else {
//       next();
//     }
//   });
//   const logger = new TracerLogger();
//   // app.useLogger(logger);

//   app.use(express().set('trust proxy', 1));

//   app.use((err: Error, _req, res, _next) => {
//     const currentTime = new Date().toISOString(); // Get the current time in ISO format
//     console.log(`[${currentTime}] Error:`, err); // Log the current time with the error
//     res.status(500).json({
//       message: 'Error: ' + err.message,
//     });
//   });

//   // Main API Swagger (automatically includes all modules except Partner routes)
//   const config = new DocumentBuilder()
//     .setTitle('TAI App')
//     .setDescription('API documentation The Agudah Insttitute')
//     .setVersion('1.0')
//     .addTag('')
//     .addBearerAuth()
//     .build();

//   const document = SwaggerModule.createDocument(app, config, {
//     deepScanRoutes: true,
//   });

//   // Filter out partner routes from main documentation
//   const filteredDocument = {
//     ...document,
//     paths: Object.keys(document.paths).reduce((obj, key) => {
//       obj[key] = document.paths[key];
//       return obj;
//     }, {}),
//   };

//   SwaggerModule.setup('api/v1/backend', app, filteredDocument);

//   await app.listen(process.env.PORT ?? 3000, () => {
//     logger.info(`Server is running on port ${process.env.PORT ?? 3000}`);
//   });
// }
// bootstrap();
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

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
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
