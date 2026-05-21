// entries sorted by date ascending assumed

export function toSigned(entry) {
  return entry.type === 'profit' ? entry.amount : -entry.amount;
}

export function sortedEntries(entries) {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

export function withCumulative(sorted) {
  let cum = 0;
  return sorted.map(e => {
    cum += toSigned(e);
    return { ...e, signedAmount: toSigned(e), cumulative: cum };
  });
}

export function getWeekStart(date) {
  // week starts Sunday
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export function getMonthKey(dateStr) {
  return dateStr.slice(0, 7);
}

export function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export function currentWeekStart() {
  return getWeekStart(new Date());
}

export function computeStats(entries) {
  if (!entries.length) return null;

  const sorted = sortedEntries(entries);
  const enriched = withCumulative(sorted);

  const total = enriched[enriched.length - 1].cumulative;

  const monthKey = currentMonthKey();
  const weekStart = currentWeekStart();

  const monthTotal = enriched
    .filter(e => e.date.startsWith(monthKey))
    .reduce((s, e) => s + e.signedAmount, 0);

  const weekTotal = enriched
    .filter(e => e.date >= weekStart)
    .reduce((s, e) => s + e.signedAmount, 0);

  const profitDays = enriched.filter(e => e.signedAmount > 0).length;
  const lossDays = enriched.filter(e => e.signedAmount < 0).length;

  const avg = enriched.reduce((s, e) => s + e.signedAmount, 0) / enriched.length;

  const best = enriched.reduce((a, b) => (a.signedAmount >= b.signedAmount ? a : b));
  const worst = enriched.reduce((a, b) => (a.signedAmount <= b.signedAmount ? a : b));

  // streaks
  let currentProfitStreak = 0;
  let currentLossStreak = 0;
  let maxProfitStreak = 0;
  let tempStreak = 0;

  for (let i = enriched.length - 1; i >= 0; i--) {
    if (enriched[i].signedAmount > 0) {
      currentProfitStreak++;
    } else {
      break;
    }
  }
  for (let i = enriched.length - 1; i >= 0; i--) {
    if (enriched[i].signedAmount < 0) {
      currentLossStreak++;
    } else {
      break;
    }
  }
  tempStreak = 0;
  for (let i = 0; i < enriched.length; i++) {
    if (enriched[i].signedAmount > 0) {
      tempStreak++;
      if (tempStreak > maxProfitStreak) maxProfitStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  return {
    total,
    monthTotal,
    weekTotal,
    profitDays,
    lossDays,
    avg,
    best,
    worst,
    currentProfitStreak,
    currentLossStreak,
    maxProfitStreak,
    enriched,
  };
}
