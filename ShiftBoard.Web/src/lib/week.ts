export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDayHeading(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const startLabel = weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${startLabel} – ${endLabel}, ${weekEnd.getFullYear()}`;
}

/** Formats the "HH:mm:ss" portion of a naive (no-timezone) API timestamp as "9:00 AM". */
export function formatTime(iso: string): string {
  const [hourStr, minuteStr] = iso.slice(11, 16).split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

/** Converts an API timestamp to the value a `datetime-local` input expects. */
export function toInputValue(iso: string): string {
  return iso.slice(0, 16);
}

/** Converts a `datetime-local` input value back to the API's expected format. */
export function toApiValue(inputValue: string): string {
  return inputValue.length === 16 ? `${inputValue}:00` : inputValue;
}
