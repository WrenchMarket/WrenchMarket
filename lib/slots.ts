export function buildSlotsForDay(params: {
  dateISO: string;
  start: string;
  end: string;
  slotMinutes: number;
}) {
  const { dateISO, start, end, slotMinutes } = params;
  const startDt = new Date(`${dateISO}T${start}`);
  const endDt = new Date(`${dateISO}T${end}`);
  const slots: string[] = [];

  let t = new Date(startDt);
  while (t.getTime() + slotMinutes * 60_000 <= endDt.getTime()) {
    slots.push(t.toISOString());
    t = new Date(t.getTime() + slotMinutes * 60_000);
  }
  return slots;
}

export function slotIntersectsBlackout(
  slotISO: string,
  blackouts: { starts_at: string; ends_at: string }[],
  slotMinutes: number
) {
  const s = new Date(slotISO).getTime();
  const e = s + slotMinutes * 60_000;
  return blackouts.some((b) => {
    const bs = new Date(b.starts_at).getTime();
    const be = new Date(b.ends_at).getTime();
    return s < be && e > bs;
  });
}
