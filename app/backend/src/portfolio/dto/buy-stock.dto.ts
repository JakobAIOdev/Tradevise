import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class BuyStockDto {
  @ApiProperty({ example: 'AAPL' })
  @IsString()
  symbol!: string;

  @ApiProperty({ example: 2.5, minimum: 0.000001 })
  @IsNumber()
  @Min(0.000001)
  quantity!: number;
}
