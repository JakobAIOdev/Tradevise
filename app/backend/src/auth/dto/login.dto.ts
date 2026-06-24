import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'jane.trader' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'correct-horse-battery-staple' })
  @IsString()
  password: string;
}
