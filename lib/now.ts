function validDemoDate() {
  const value = process.env.DEMO_DATE;
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function getToday(): string {
  return validDemoDate() ?? new Date().toISOString().slice(0, 10);
}

export function getNow(): Date {
  const demoDate = validDemoDate();
  if (!demoDate) return new Date();

  const now = new Date();
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");

  return new Date(`${demoDate}T${time}`);
}

export function getTomorrow(): string {
  const now = getNow();
  now.setDate(now.getDate() + 1);
  return now.toISOString().slice(0, 10);
}

export function getWeekRange(): { start: string; end: string } {
  const start = getNow();
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function getDateForDay(targetDay: string): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const targetIdx = days.findIndex((d) => d.startsWith(targetDay.toLowerCase().slice(0, 3)));
  if (targetIdx === -1) return getToday();

  const now = getNow();
  const currentIdx = now.getDay();
  let diff = targetIdx - currentIdx;
  if (diff < 0) diff += 7; // next occurrence of that day

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + diff);
  return targetDate.toISOString().slice(0, 10);
}