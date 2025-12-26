// src/admin/auth/admin-auth.controller.ts
import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtGuard } from './admin-jwt.guard';
import { Roles, RolesGuard } from './roles.guard';
import { AdminRole } from 'src/database/entities/admin.entity';
import { Req } from '@nestjs/common';
import { AdminSuperSignupDto } from './dtos/admin-signup.dto';
import { AdminCreateDto } from './dtos/admin-create.dto';
import { AdminLoginDto } from './dtos/admin-login.dto';

@ApiTags('Admin auth')
@Controller('admin/auth')
// @ApiExcludeController()
export class AdminAuthController {
  constructor(private readonly svc: AdminAuthService) {}

  // One-time bootstrap: allowed only if there is NO super admin yet
  @Post('signup-super')
  @HttpCode(201)
  async signupSuper(@Body() dto: AdminSuperSignupDto) {
    return this.svc.signupSuperAdmin(dto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: AdminLoginDto) {
    return this.svc.login(dto);
  }

  // Super admins can create other admins
  @Post('admins')
  @ApiBearerAuth()
  @UseGuards(AdminJwtGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN)
  @HttpCode(201)
  async createAdmin(@Body() dto: AdminCreateDto, @Req() req: any) {
    return this.svc.createAdmin(req.user.adminId, dto);
  }
}
