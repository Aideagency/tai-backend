import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

// const isDev = process.env.NODE_ENV === 'development';
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is missing');

// export const typeOrmConfig = new DataSource({
//   type: 'postgres',
//   host: isDev ? process.env.POSTGRES_HOST : process.env.POSTGRES_HOST_REMOTE,
//   port: parseInt(process.env.POSTGRES_PORT),
//   username: isDev
//     ? process.env.POSTGRES_USER
//     : process.env.POSTGRES_USER_REMOTE,
//   database: isDev
//     ? process.env.POSTGRES_DATABASE
//     : process.env.POSTGRES_DATABASE_REMOTE,
//   password: isDev
//     ? process.env.POSTGRES_PASSWORD
//     : process.env.POSTGRES_PASSWORD_REMOTE,
//   entities: [__dirname + '/../**/*.entity.{js,ts}'],
//   migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
//   ssl:
//     process.env.MODE === 'production'
//       ? {
//           rejectUnauthorized: false,
//         }
//       : false,
//   extra: {
//     charset: 'utf8mb4_unicode_ci',
//     ssl:
//       process.env.MODE === 'production'
//         ? {
//             require: true,
//             rejectUnauthorized: false,
//           }
//         : false,
//   },
//   synchronize: false,
//   logging: false,
// });

export default new DataSource({
  type: 'postgres',
  url,
  ssl: true,
  extra: { ssl: { rejectUnauthorized: false } },

  // Use TS paths for dev/CLI; JS paths still match if compiled
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: ['error'],
});
