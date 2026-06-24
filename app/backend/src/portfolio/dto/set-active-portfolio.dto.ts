import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SetActivePortfolioDto {
  @ApiProperty({ example: 'clx4x09mf0000u3v8m2ue7q6n' })
  @IsString()
  portfolioId!: string;
}
