import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePortfolioDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  name!: string;
}
