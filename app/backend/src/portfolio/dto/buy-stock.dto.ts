import { IsNumber, IsString, Min } from 'class-validator';

export class BuyStockDto {
  @IsString()
  symbol!: string;

  @IsNumber()
  @Min(0.000001)
  quantity!: number;
}
