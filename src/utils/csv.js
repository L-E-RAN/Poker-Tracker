import { withCumulative, sortedEntries, toSigned } from './calculations';

export function exportCSV(entries) {
  const sorted = sortedEntries(entries);
  const enriched = withCumulative(sorted);

  const header = ['date', 'type', 'amount', 'signedAmount', 'cumulativeTotal'];
  const rows = enriched.map(e => [
    e.date,
    e.type,
    e.amount,
    e.signedAmount,
    e.cumulative,
  ]);

  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'poker_results.csv';
  a.click();
  URL.revokeObjectURL(url);
}
