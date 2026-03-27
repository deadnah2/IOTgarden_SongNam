import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { Period } from '../../../common/enums/period.enum';

export class PriceReportQueryDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  gardenId: number;

  @ApiProperty({ enum: Period, enumName: 'Period', example: Period.DAY })
  @IsEnum(Period)
  period: Period;

  @ApiPropertyOptional({
    example: '2026-01-10',
    description: 'Local date in YYYY-MM-DD format. If omitted, current local date is used.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date?: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  vegetableId?: number;
}
