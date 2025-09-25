import {
  BadRequestException,
  Controller,
  Put,
  UseGuards,
  UseInterceptors,
  Req,
  Body,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { JwtGuards } from 'src/auth/jwt.guards';
import { Helper } from 'src/utils/helper';
import { diskStorage } from 'multer';
import * as path from 'path';
import { UserService } from './user.service';
import { TracerLogger } from 'src/logger/logger.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: TracerLogger,
  ) {}
//   @Put('profile')
//   @ApiBearerAuth()
//   @UseGuards(JwtGuards)
//   @ApiConsumes('multipart/form-data')
//   @ApiBody({
//     description: 'Update user profile with profile picture',
//     schema: {
//       type: 'object',
//       properties: {
//         profilePicture: {
//           type: 'string',
//           format: 'binary',
//         },
//       },
//     },
//   })
//   @UseInterceptors(
//     FileInterceptor('profilePicture', {
//       storage: diskStorage({
//         destination: './uploads/profile-pictures',
//         filename: (req, file, cb) => {
//           const uniqueSuffix =
//             Date.now() + '-' + Math.round(Math.random() * 1e9);
//           cb(
//             null,
//             `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
//           );
//         },
//       }),
//       fileFilter: (req, file, cb) => {
//         if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
//           cb(null, true);
//         } else {
//           cb(new BadRequestException('Unsupported file type'), false);
//         }
//       },
//       limits: {
//         fileSize: 2 * 1024 * 1024, // 2MB
//       },
//     }),
//   )
//   async updateUserDetails(
//     @Req() req,
//     @Body() updateUserDetailsDto: any,
//     @UploadedFile() profilePicture?: Express.Multer.File,
//   ): Promise<any> {
//     const files: Record<string, Express.Multer.File[]> = {};
//     updateUserDetailsDto.profilePicture = null;

//     if (profilePicture) {
//       files['profilePicture'] = [profilePicture];
//     }
//     // await Helper.validateDocuments(files);

//     // if (profilePicture) {
//     //   const avatar = Helper.getAvatarUrl(profilePicture.path);
//     //   updateUserDetailsDto.profilePicture = avatar;
//     // }
//     // const result = await this.userService.updateUserDetails(
//     //   req.user,
//     //   updateUserDetailsDto,
//     // );

//     if (!result) {
//       throw new BadRequestException('Error updating user details');
//     }

//     return {
//       statusCode: 200,
//       message: 'Profile Picture updated successfully',
//       data: result,
//     };
//   }
}
