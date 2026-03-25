import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ReportPeriod } from './report-period.enum';

export class PriceReportQueryDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  gardenId: number;

  @ApiProperty({ enum: ReportPeriod, enumName: 'ReportPeriod', example: ReportPeriod.DAY })
  @IsEnum(ReportPeriod)
  period: ReportPeriod;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  vegetableId?: number;
}
