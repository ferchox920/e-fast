const relativeTimeFormat = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 1000 * 60 * 60 * 24 * 365],
  ['month', 1000 * 60 * 60 * 24 * 30],
  ['week', 1000 * 60 * 60 * 24 * 7],
  ['day', 1000 * 60 * 60 * 24],
  ['hour', 1000 * 60 * 60],
  ['minute', 1000 * 60],
  ['second', 1000],
];

export const formatRelativeTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = date.getTime() - Date.now();

  for (const [unit, ms] of divisions) {
    const value = diffMs / ms;
    if (Math.abs(value) >= 1 || unit === 'second') {
      return relativeTimeFormat.format(Math.round(value), unit);
    }
  }

  return '';
};
