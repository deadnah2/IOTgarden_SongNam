import { Period } from '../enums/period.enum';

export function getPeriodRange(period: Period) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === Period.DAY) {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === Period.WEEK) {
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    end.setTime(start.getTime());
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  end.setMonth(end.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
