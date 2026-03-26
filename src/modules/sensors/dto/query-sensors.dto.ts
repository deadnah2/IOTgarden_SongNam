import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, Min } from 'class-validator';
import { Period } from '../../../common/enums/period.enum';

export class QuerySensorsDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  gardenId: number;

  @ApiProperty({
    enum: Period,
    enumName: 'Period',
    example: Period.DAY,
  })
  @IsEnum(Period)
  period: Period;
}
