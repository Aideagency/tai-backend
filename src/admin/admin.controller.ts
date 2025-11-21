// src/admin/admin.controller.ts
import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  Query,
  Post,
  UseGuards,
  HttpCode,
  BadRequestException,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExcludeController,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserByAdminDto } from './dtos/update-user-by-admin.dto';
import { SuspendUserDto } from './dtos/suspend-user.dto';
import { ResetUserPasswordDto } from './dtos/reset-user-password.dto';
// import { AdminJwtGuard } from './auth/admin/auth/admin-jwt.guard'; // adjust path
// import { RolesGuard, Roles } from './auth/admin/auth/roles.guard'; // adjust path
import { AdminRole } from 'src/database/entities/admin.entity';
import { AdminJwtGuard } from './auth/admin-jwt.guard';
import { Roles, RolesGuard } from './auth/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from 'src/auth/dtos/login.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Admin - manage users')
@ApiBearerAuth()
@UseGuards(AdminJwtGuard, RolesGuard)
@Controller('admin/users')
@ApiExcludeController()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'search: name/email/phone',
  })
  @ApiQuery({ name: 'suspended', required: false, description: 'true|false' })
  @ApiQuery({ name: 'orderBy', required: false, enum: ['createdAt', 'id'] })
  @ApiQuery({ name: 'orderDir', required: false, enum: ['ASC', 'DESC'] })
  async list(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('q') q?: string,
    @Query('suspended') suspended?: string,
    @Query('orderBy') orderBy?: 'createdAt' | 'id',
    @Query('orderDir') orderDir?: 'ASC' | 'DESC',
  ) {
    return this.adminService.listUsers({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      q,
      orderBy,
      orderDir,
      suspended:
        typeof suspended === 'string' ? suspended === 'true' : undefined,
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateUserByAdminDto) {
    return this.adminService.updateUserByAdmin(id, dto);
  }

  @Patch(':id/suspend')
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  @HttpCode(200)
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Patch(':id/suspend')
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  @HttpCode(200)
  async suspend(@Param('id') id: string, @Body() dto: SuspendUserDto) {
    return this.adminService.suspendUser(id, dto.reason);
  }

  @Patch(':id/unsuspend')
  @Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  @HttpCode(200)
  async unsuspend(@Param('id') id: string) {
    return this.adminService.unsuspendUser(id);
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN)
  @HttpCode(200)
  async remove(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Patch(':id/restore')
  @Roles(AdminRole.SUPER_ADMIN)
  @HttpCode(200)
  async restore(@Param('id') id: string) {
    return this.adminService.restoreUser(id);
  }

  @Post(':id/reset-password')
  @Roles(AdminRole.SUPER_ADMIN)
  @HttpCode(200)
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetUserPasswordDto,
  ) {
    return this.adminService.resetUserPassword(id, dto.new_password);
  }
}
