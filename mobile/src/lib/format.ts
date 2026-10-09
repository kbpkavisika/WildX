const LOCALE = "en-US";
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const METRES_PER_KM = 1000;

export function formatMonth(date: Date): string {
  return date.toLocaleDateString(LOCALE, { month: "short" });
}

export function formatWeekday(date: Date): string {
  return date.toLocaleDateString(LOCALE, { weekday: "short" });
}

export function formatDayLabel(date: Date): string {
  return `${formatWeekday(date)}, ${date.getDate()} ${formatMonth(date)}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function formatAgo(date: Date, now: Date): string {
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / MS_PER_SECOND));
  if (seconds < SECONDS_PER_MINUTE) return `${seconds} s ago`;
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  if (minutes < SECONDS_PER_MINUTE) return `${minutes} min ago`;
  return `at ${formatTime(date)}`;
}

export function formatDayTime(date: Date, now: Date): string {
  const day = isSameDay(date, now) ? "Today" : formatDayLabel(date);
  return `${day} · ${formatTime(date)}`;
}

export function formatKm(metres: number): string {
  return `${(metres / METRES_PER_KM).toFixed(1)} km`;
}

export function formatLatLng([lat, lng]: [number, number], decimals: number): string {
  return `${lat.toFixed(decimals)}, ${lng.toFixed(decimals)}`;
}

export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function counted(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
