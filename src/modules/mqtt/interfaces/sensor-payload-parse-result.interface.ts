import type { IncomingSensorPayloadDto } from '../dto/incoming-sensor-payload.dto';

export type SensorPayloadParseResult =
  | { ok: true; data: IncomingSensorPayloadDto }
  | { ok: false; error: string };
