import { Module } from '@nestjs/common';
import { CommunicationModule } from './communication/communication.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [CommunicationModule, CloudinaryModule],
  exports: [CommunicationModule, CloudinaryModule],
})
export class InfrastructureModule {}
