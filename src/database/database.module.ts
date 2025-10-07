import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

require('dotenv').config();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const url = process.env.DATABASE_URL;
        if (!url) {
          throw new Error('DATABASE_URL is missing');
        }

        const isProd = process.env.NODE_ENV === 'production';

        // Optional visibility (no secrets):
        // eslint-disable-next-line no-console
        console.log(
          'DB host:',
          url.split('@')[2]?.split('/')[0] ?? '(unparsable)',
        );

        return {
          type: 'postgres',
          url,
          // Supabase requires SSL; with some environments you may need this:
          ssl: true,
          extra: { ssl: { rejectUnauthorized: false } },

          autoLoadEntities: true,
          synchronize: false, // set true only if you know what you’re doing in dev
          logging: !isProd && ['error', 'warn'], // or true for verbose dev logs

          // When running the app (dist), entities/migrations are JS:
          entities: ['dist/**/*.entity.js'],
          migrations: ['dist/database/migrations/*.js'],
          migrationsRun: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
