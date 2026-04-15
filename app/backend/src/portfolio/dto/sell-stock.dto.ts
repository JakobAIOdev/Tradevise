import { IsNumber, IsString, Min } from 'class-validator';

export class SellStockDto {
  @IsString()
  symbol!: string;

  @IsNumber()
  @Min(0.000001)
  quantity!: number;
}
