import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      autoLoadEntities: true,
      synchronize: false,
      entities: ['dist/**/*.entity{.ts,.js}'],
      migrations: ['dist/database/migrations/*.js'],
      migrationsRun: false,
      logging: false,
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
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
