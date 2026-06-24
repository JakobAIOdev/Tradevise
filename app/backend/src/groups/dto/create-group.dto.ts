import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    example: 'University Trading League',
    minLength: 2,
    maxLength: 40,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  name!: string;
}
