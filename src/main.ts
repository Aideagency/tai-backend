import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TracerLogger } from './logger/logger.service';
import { Request, Response, NextFunction } from 'express';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
    cors: true,
    // bufferLogs: true,
  });
  app.enableCors();
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  const logger = new TracerLogger();
  // app.useLogger(logger);

  app.use(express().set('trust proxy', 1));

  app.use((err: Error, _req, res, _next) => {
    const currentTime = new Date().toISOString(); // Get the current time in ISO format
    console.log(`[${currentTime}] Error:`, err); // Log the current time with the error
    res.status(500).json({
      message: 'Error: ' + err.message,
    });
  });

  // Main API Swagger (automatically includes all modules except Partner routes)
  const config = new DocumentBuilder()
    .setTitle('Core Backend')
    .setDescription('API documentation for CardinalStone Core API')
    .setVersion('1.0')
    .addTag('')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });

  // Filter out partner routes from main documentation
  const filteredDocument = {
    ...document,
    paths: Object.keys(document.paths).reduce((obj, key) => {
      obj[key] = document.paths[key];
      return obj;
    }, {}),
  };

  SwaggerModule.setup('api/v1/backend', app, filteredDocument);

  await app.listen(process.env.PORT ?? 3000, () => {
    logger.info(`Server is running on port ${process.env.PORT ?? 3000}`);
  });
}
bootstrap();
