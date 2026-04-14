import type { LedState } from '@prisma/client';

export interface PublishLedCommandInput {
  gardenId: number;
  userId: number;
  led1State: LedState;
  led2State: LedState;
  led3State: LedState;
}
