import { DataSource } from 'typeorm';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is missing');

function shouldUseDatabaseSsl(url: string): boolean {
  const value = process.env.DATABASE_SSL?.toLowerCase();

  if (value === 'true') return true;
  if (value === 'false') return false;

  return (
    process.env.NODE_ENV === 'production' ||
    url.includes('supabase.co') ||
    url.includes('pooler.supabase.com') ||
    url.includes('sslmode=require')
  );
}

const useSsl = shouldUseDatabaseSsl(url);

export default new DataSource({
  type: 'postgres',
  url,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  extra: useSsl ? { ssl: { rejectUnauthorized: false } } : undefined,

  // Use TS paths for dev/CLI; JS paths still match if compiled
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: ['error'],
});
