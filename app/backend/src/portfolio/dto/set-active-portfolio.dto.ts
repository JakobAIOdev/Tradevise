import { IsString } from 'class-validator';

export class SetActivePortfolioDto {
  @IsString()
  portfolioId!: string;
}
