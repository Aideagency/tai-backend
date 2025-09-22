import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

export const typeOrmConfig = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  ssl:
    process.env.MODE === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,
  extra: {
    charset: 'utf8mb4_unicode_ci',
    ssl:
      process.env.MODE === 'production'
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
  },
  synchronize: false,
  logging: false,
});
