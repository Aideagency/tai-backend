import {
  Controller,
  Get,
  HttpCode,
  Post,
  Request,
  Body,
  BadRequestException,
  Put,
  UseInterceptors,
  UploadedFile,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TracerLogger } from 'src/logger/logger.service';
import { LoginResponseDto } from './dtos/login-response.dto';
import { RegisterDto } from './dtos/register.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { Helper } from 'src/utils/helper';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { JwtGuards } from './jwt.guards';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { CommunityTag, UserGender } from 'src/database/entities/user.entity';
import { VerifyAccountDto } from './dtos/verify-account.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
// import { SupabaseAuthGuard } from './supabase.guards';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: TracerLogger,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @UseGuards(AuthGuard('user-local'))
  @Post('login')
  @HttpCode(200)
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({})
  async login(@Request() req): Promise<any> {
    const isLoginSuccessful = typeof req.user !== 'string';

    if (!isLoginSuccessful) {
      throw new BadRequestException(req.user);
    }

    const tokens = await this.authService.getJwtTokens(req.user);

    return tokens;
  }

  @Throttle({ default: { limit: 2, ttl: 300000 } })
  @Post('signup')
  @HttpCode(201)
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiBody({
    description: 'User registration',
    type: RegisterDto,
  })
  async createUser(@Body(new ValidationPipe()) dto: RegisterDto): Promise<any> {
    const data = await this.authService.createUser(dto);

    return {
      statusCode: 201,
      message: 'User has been created successfully',
      data,
    };
  }

  @Post('verify-email')
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @ApiBody({ type: VerifyEmailDto, description: 'Email verification' })
  @HttpCode(200)
  async verifyEmail(
    @Body(new ValidationPipe()) dto: VerifyEmailDto,
    @Request() req,
  ): Promise<any> {
    await this.authService.verifyEmail(dto, req.user.email_address);

    return {
      statusCode: 200,
      message: 'Check completed successfully',
    };
  }

  @Throttle({ default: { limit: 1, ttl: 300000 } })
  @Post('forgot-password')
  @ApiBadRequestResponse()
  @HttpCode(200)
  async forgetPassword(@Body() dto: ForgotPasswordDto): Promise<any> {
    try {
      await this.authService.forgetPassword(dto.email_address);

      return {
        statusCode: 200,
        message: 'OTP sent to your registered email address.',
      };
    } catch (error) {
      throw error;
    }
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @ApiBadRequestResponse()
  async resetPassword(
    @Body(new ValidationPipe()) dto: ResetPasswordDto,
    @Request() req,
  ): Promise<any> {
    await this.authService.resetPassword(dto, Helper.getIpAddress(req));

    return {
      message: 'Password has been reset successfully',
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @Post('initiate-change-password')
  @ApiBadRequestResponse()
  async initiateChangePassword(@Request() req): Promise<any> {
    await this.authService.intiateChangePassword(req.user.email_address);

    return {
      statusCode: 200,
      message: 'OTP sent to your registered email address.',
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @Post('change-password')
  @ApiBadRequestResponse()
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Request() req,
  ): Promise<any> {
    await this.authService.changePassword(
      req.user.email_address,
      dto,
      Helper.getIpAddress(req),
    );

    return {
      statusCode: 200,
      message: 'OTP sent to your registered email address.',
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @Post('generate-verification-OTP')
  @ApiBadRequestResponse()
  async accountVerification(@Request() req): Promise<any> {
    await this.authService.generateAcccountVerificationOTP(
      req.user.email_address,
    );

    return {
      statusCode: 200,
      message: 'OTP sent to your registered email address.',
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @HttpCode(200)
  @Get('profile')
  @ApiOkResponse({
    schema: {
      example: {
        statusCode: 200,
        user: {
          id: 4,
          last_name: 'John',
          first_name: 'Smith',
          gender: 'MALE',
          birth_date: '1990-01-11',
          email_address: 'johnsmith@gmail.com',
          phone_no: '+2348080180000',
          community: ['PARENT', 'SINGLE'],
        },
      },
    },
  })
  @ApiBadRequestResponse()
  async getProfileInformation(@Request() req): Promise<any> {
    const user = await this.authService.getProfileInformation(
      req.user.email_address,
    );

    return {
      statusCode: 200,
      user,
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @HttpCode(200)
  @Put('profile')
  @ApiBadRequestResponse()
  @ApiConsumes('multipart/form-data')
  @UsePipes(
    new ValidationPipe({ whitelist: true, skipMissingProperties: true }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        birth_date: { type: 'string', example: '2000-10-12', nullable: true },
        phone_no: { type: 'string', example: '+23480809090', nullable: true },
        email_address: {
          type: 'string',
          example: 'sample@email.com',
          nullable: true,
        },
        first_name: {
          type: 'string',
          example: 'Chukwudi',
          nullable: true,
        },
        last_name: {
          type: 'string',
          example: 'Biola',
          nullable: true,
        },
        gender: {
          type: 'string',
          enum: Object.values(UserGender),
          nullable: true,
        },
        community: {
          type: 'array',
          items: { type: 'string', enum: Object.values(CommunityTag) },
          description: 'Optional array of community tags',
          nullable: true, // Ensure Swagger treats this as nullable
        },
        profilePicture: { type: 'string', format: 'binary', nullable: true },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      storage: diskStorage({
        destination: './uploads/profile-pictures',
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        // Allow jpg/jpeg/png/gif
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Unsupported file type'), false);
        }
      },
      limits: {
        fileSize: 300 * 1024,
      },
    }),
  )
  async updateUserProfile(
    @Body() dto: UpdateProfileDto,
    @Request() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<any> {
    const user = await this.authService.updateProfileInformation(
      req.user.email_address,
      dto,
      file, // <-- pass the file
    );

    return {
      statusCode: 200,
      user,
    };
  }

  @Get('google')
  @ApiOperation({ summary: 'Start Google OAuth2 login flow' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google consent screen',
  })
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Nothing needed here; handled by Passport
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Request() req) {
    // req.user comes from GoogleStrategy.validate()
    return this.authService.googleLogin(req.user);
  }

  @Post('email-test')
  // @UseGuards(AuthGuard('google'))
  async testEmail() {
    // req.user comes from GoogleStrategy.validate()
    await this.authService.generateSampleEmail();
    return 'Email sent';
  }
}
