import {
  Controller,
  Get,
  HttpCode,
  Post,
  Request,
  UnauthorizedException,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TracerLogger } from 'src/logger/logger.service';
import { LoginResponseDto } from './dtos/login-response.dto';
import { UserType, UserEntity } from 'src/database/entities/user.entity';
import { RegisterDto } from './dtos/register.dto';

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
  @ApiBadRequestResponse({

  })
  async login(@Request() req): Promise<any> {
    const isLoginSuccessful = typeof req.user !== 'string';

    if (!isLoginSuccessful) {
      throw new BadRequestException(req.user);
    }

    const tokens = await this.authService.getJwtTokens({
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      middle_name: req.user.middle_name,
      userType: UserType[req.user.user_type],
      email_address: req.user.email_address,
      phone: req.user.phone_no,
      phone_no: req.user.id,
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

  //   @Post('verify-email')
  //   @ApiBody({ type: VerifyEmailDto })
  //   @HttpCode(200)
  //   async verifyEmail(
  //     @Body(new ValidationPipe()) dto: VerifyEmailDto,
  //   ): Promise<any> {
  //     const result = await this.authService.verifyEmail(dto.email);

  //     if (!result) {
  //       return {
  //         statusCode: 200,
  //         message: 'Check completed successfully',
  //         data: result,
  //         status: false,
  //       };
  //     }

  //     return {
  //       statusCode: 200,
  //       message: 'Check completed successfully',
  //       data: result,
  //       status: true,
  //     };
  //   }

  //   @Throttle({ default: { limit: 1, ttl: 300000 } })
  //   @Post('forgetPassword')
  //   @ApiOkResponse({ status: 200 })
  //   @ApiBadRequestResponse()
  //   @HttpCode(200)
  //   async forgetPassword(
  //     @Body(new ValidationPipe()) dto: ForgetPassDto,
  //   ): Promise<any> {
  //     try {
  //       await this.authService.forgetPassword(dto.CustID);

  //       return {
  //         message:
  //           'An OTP has been sent to your email address if you have an account with us.',
  //       };
  //     } catch (error) {
  //       throw error;
  //     }
  //   }

  //   @Throttle({ default: { limit: 5, ttl: 60000 } })
  //   @Post('resetPassword')
  //   @ApiBadRequestResponse()
  //   async resetPassword(
  //     @Body(new ValidationPipe()) dto: ResetPasswordDto,
  //     @Request() req,
  //   ): Promise<any> {
  //     const userVal: any = await this.authService.resetPassword(
  //       dto,
  //       Helper.getIpAddress(req),
  //     );

  //     if (!userVal) throw new BadRequestException('Error resetting password');

  //     return {
  //       message: 'Password has been reset successfully',
  //     };
  //   }
}
