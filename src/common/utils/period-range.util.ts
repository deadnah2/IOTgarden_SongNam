import { Period } from '../enums/period.enum';

function parseLocalBaseDate(date?: string) {
  if (!date) {
    return new Date();
  }

  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getPeriodRange(period: Period, date?: string) {
  const baseDate = parseLocalBaseDate(date);
  const start = new Date(baseDate);
  const end = new Date(baseDate);

  if (period === Period.DAY) {
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  if (period === Period.WEEK) {
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    end.setTime(start.getTime());
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  end.setDate(1);
  end.setHours(0, 0, 0, 0);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}
