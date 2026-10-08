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

const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;

export function formatAgo(date: Date, now: Date): string {
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / MS_PER_SECOND));
  if (seconds < SECONDS_PER_MINUTE) return `${seconds} s ago`;
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  if (minutes < SECONDS_PER_MINUTE) return `${minutes} min ago`;
  return `at ${formatTime(date)}`;
}

const METRES_PER_KM = 1000;

export function formatKm(metres: number): string {
  return `${(metres / METRES_PER_KM).toFixed(1)} km`;
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}
