import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class IncomingSensorPayloadDto {
  @ApiProperty({ example: 29.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(-50)
  @Max(100)
  temperature: number;

  @ApiProperty({ example: 70.2 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  humidity: number;

  @ApiPropertyOptional({ example: '2026-03-26T10:15:00.000Z' })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}
