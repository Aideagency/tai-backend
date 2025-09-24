import {
  Controller,
  Get,
  HttpCode,
  Post,
  Request,
  Body,
  BadRequestException,
  // ValidationPipe,
  Put,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
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
import { SupabaseAuthGuard } from './supabase.guards';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: TracerLogger,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @UseGuards(AuthGuard('local'))
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

    const tokens = await this.authService.getJwtTokens({
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      email_address: req.user.email_address,
      phone_no: req.user.phone_no,
      id: req.user.id,
      // is_parent: req.user.is_parent,
      // marital_status: req.user.marital_status,
    });

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
  async createUser(@Body() dto: RegisterDto): Promise<any> {
    await this.authService.createUser(dto);

    return {
      statusCode: 201,
      message: 'User has been created successfully',
      //   user,
    };
  }

  @Post('verify-email')
  @ApiBody({ type: VerifyEmailDto, description: 'Email verification' })
  @HttpCode(200)
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<any> {
    await this.authService.verifyEmail(dto.email_address);

    return {
      statusCode: 200,
      message: 'Check completed successfully',
    };
  }

  @Throttle({ default: { limit: 1, ttl: 300000 } })
  @Post('forgot-password')
  @ApiBadRequestResponse()
  @HttpCode(200)
  async forgetPassword(@Body() dto: VerifyEmailDto): Promise<any> {
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
    @Body() dto: ResetPasswordDto,
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
  @HttpCode(200)
  @Get('profile')
  @ApiBadRequestResponse()
  async getProfileInformation(@Request() req): Promise<any> {
    const user = await this.authService.getProfileInformation(
      req.user.email_address,
    );

    return {
      statusCode: 200,
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email_address,
        phone_no: user.phone_no,
        marital_status: user.marital_status,
      },
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtGuards)
  @ApiBearerAuth()
  @HttpCode(200)
  @Put('profile')
  @ApiBadRequestResponse()
  async updateUserProfile(
    @Body() dto: UpdateProfileDto,
    @Request() req,
  ): Promise<any> {
    const user = await this.authService.getProfileInformation(
      req.user.email_address,
    );

    return {
      statusCode: 200,
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email_address,
        phone_no: user.phone_no,
        category: user.marital_status,
      },
    };
  }
}
