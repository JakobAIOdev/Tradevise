import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class JoinGroupDto {
  @ApiProperty({ example: 'ABCD1234', minLength: 4, maxLength: 12 })
  @IsString()
  @MinLength(4)
  @MaxLength(12)
  code!: string;
}
