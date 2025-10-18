import { DataSource } from 'typeorm';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is missing');

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
