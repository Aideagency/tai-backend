import { IsInt, IsString, IsOptional } from 'class-validator';

export class RequestRefundDto {
  @IsInt()
  registrationId: number;

  @IsString()
  amount: string;

  @IsOptional()
  @IsString()
  reason: string | null;
}
