import { ApiPropertyOptional } from '@nestjs/swagger';
import { LedState } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateLedDto {
  @ApiPropertyOptional({ enum: LedState, example: LedState.On })
  @IsOptional()
  @IsEnum(LedState)
  led1State?: LedState;

  @ApiPropertyOptional({ enum: LedState, example: LedState.Off })
  @IsOptional()
  @IsEnum(LedState)
  led2State?: LedState;

  @ApiPropertyOptional({ enum: LedState, example: LedState.On })
  @IsOptional()
  @IsEnum(LedState)
  led3State?: LedState;
}
