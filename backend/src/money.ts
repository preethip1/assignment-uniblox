// Percentage discount on a cents amount; floor keeps it whole and never over-discounts.
export function applyPercent(amountCents: number, percent: number): number {
  return Math.floor((amountCents * percent) / 100);
}

// Money is kept as integer cents everywhere; this only formats it for display.
export function formatCents(amountCents: number): string {
  const sign = amountCents < 0 ? "-" : "";
  const abs = Math.abs(amountCents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
