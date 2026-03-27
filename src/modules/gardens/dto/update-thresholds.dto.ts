import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateThresholdsDto {
  @ApiPropertyOptional({
    example: 35,
    description: 'Temperature threshold. A notification is created when the value is exceeded.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  temperatureThreshold?: number;

  @ApiPropertyOptional({
    example: 80,
    description: 'Humidity threshold. A notification is created when the value is exceeded.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  humidityThreshold?: number;
}
