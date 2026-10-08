const LOCALE = "en-US";

export function formatDate(date: Date): string {
  return `${date.getDate()} ${formatMonth(date)}, ${date.getFullYear()}`;
}

export function formatDayLabel(date: Date): string {
  return `${formatWeekday(date)}, ${date.getDate()} ${formatMonth(date)}`;
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
}

export function formatMonth(date: Date): string {
  return date.toLocaleDateString(LOCALE, { month: "short" });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

export function formatWeekday(date: Date): string {
  return date.toLocaleDateString(LOCALE, { weekday: "short" });
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}
