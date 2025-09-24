import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TracerLogger } from 'src/logger/logger.service';
import { RepositoryModule } from 'src/repository/repository.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';
import { SupabaseStrategy } from './supabase.strategy';
import { SupabaseService } from './supabase.service';

@Module({
  imports: [
    RepositoryModule,
    InfrastructureModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [
    AuthService,
    TracerLogger,
    LocalStrategy,
    JwtStrategy,
    // SupabaseStrategy,
    // SupabaseService,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
