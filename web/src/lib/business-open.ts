type OpeningSlot = { day: number; opens: string; closes: string };

/** Verifica se a loja está aberta agora baseado em opening_hours. Se faltar info, assume aberta. */
export function isBusinessOpenNow(openingHours: unknown): boolean {
  if (!Array.isArray(openingHours) || openingHours.length === 0) return true;
  const now = new Date();
  const dow = now.getDay();
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  const todaySlots = (openingHours as OpeningSlot[]).filter(
    (s) => typeof s.day === "number" && s.day === dow,
  );
  if (todaySlots.length === 0) return false;

  for (const slot of todaySlots) {
    const [oh, om] = (slot.opens || "00:00").split(":").map(Number);
    const [ch, cm] = (slot.closes || "00:00").split(":").map(Number);
    const opens = (oh ?? 0) * 60 + (om ?? 0);
    const closes = (ch ?? 0) * 60 + (cm ?? 0);
    // suporta loja que atravessa meia-noite (closes < opens)
    if (closes >= opens) {
      if (minutesNow >= opens && minutesNow < closes) return true;
    } else {
      if (minutesNow >= opens || minutesNow < closes) return true;
    }
  }
  return false;
}
