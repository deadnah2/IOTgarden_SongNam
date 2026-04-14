import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IncomingSensorPayloadDto } from '../dto/incoming-sensor-payload.dto';
import type { SensorPayloadParseResult } from '../interfaces/sensor-payload-parse-result.interface';

@Injectable()
export class SensorPayloadParserHelper {
  parse(payload: unknown): SensorPayloadParseResult {
    const convertedPayload = this.convertPayload(payload);

    if (convertedPayload === null) {
      return {
        ok: false,
        error: 'Payload is not valid JSON',
      };
    }

    const sensorPayload = plainToInstance(
      IncomingSensorPayloadDto,
      convertedPayload,
    );

    const errors = validateSync(sensorPayload, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      return {
        ok: false,
        error: JSON.stringify(errors),
      };
    }

    return {
      ok: true,
      data: sensorPayload,
    };
  }

  private convertPayload(payload: unknown): Record<string, unknown> | null {
    if (payload === null || payload === undefined) {
      return null;
    }

    if (typeof payload === 'string') {
      return this.parseJsonObject(payload);
    }

    if (Buffer.isBuffer(payload)) {
      return this.parseJsonObject(payload.toString('utf8'));
    }

    if (
      typeof payload === 'object' &&
      payload !== null &&
      !Array.isArray(payload)
    ) {
      return payload as Record<string, unknown>;
    }

    return null;
  }

  private parseJsonObject(value: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(value) as unknown;

      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }

      return null;
    } catch {
      return null;
    }
  }
}
