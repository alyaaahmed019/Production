const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const numberFormatter = new Intl.NumberFormat('en-US');

/** Parses `YYYY-MM-DD` as a local date (avoids the UTC off-by-one problem). */
function parseDate(value: string): Date | null {
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string): string {
  const date = parseDate(value);
  return date ? dateFormatter.format(date) : '—';
}

export function formatDateTime(value: string): string {
  const date = parseDate(value);
  return date ? dateTimeFormatter.format(date) : '—';
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatFabric(quantity: number, unit: string): string {
  return `${formatNumber(quantity)} ${unit}`;
}

export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
