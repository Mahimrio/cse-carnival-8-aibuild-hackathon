function validDemoDate() {
  const value = process.env.DEMO_DATE;
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function getToday() {
  return validDemoDate() ?? new Date().toISOString().slice(0, 10);
}

export function getNow() {
  const demoDate = validDemoDate();
  if (!demoDate) return new Date();

  const now = new Date();
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");

  return new Date(`${demoDate}T${time}`);
}