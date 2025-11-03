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
// import { SupabaseStrategy } from './supabase.strategy';
// import { SupabaseService } from './supabase.service';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [
    RepositoryModule,
    InfrastructureModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
  ],
  providers: [
    AuthService,
    TracerLogger,
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy,
    // SupabaseStrategy,
    // SupabaseService,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
