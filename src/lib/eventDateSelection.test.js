import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDateColumns, normalizeSelectedDates } from './eventDateSelection.js';

test('normalizeSelectedDates sorts, formats, and deduplicates dates', () => {
  const normalized = normalizeSelectedDates([
    '2026-03-21',
    '2026-03-13T15:00:00.000Z',
    new Date('2026-03-14T00:00:00+09:00'),
    '2026-03-13',
  ]);

  assert.deepEqual(normalized, ['2026-03-13', '2026-03-14', '2026-03-21']);
});

test('buildDateColumns keeps only explicitly selected dates', () => {
  const columns = buildDateColumns(['2026-03-13', '2026-03-14', '2026-03-20', '2026-03-21']);

  assert.deepEqual(columns.ymds, ['2026-03-13', '2026-03-14', '2026-03-20', '2026-03-21']);
  assert.equal(columns.labels.length, 4);
  assert.ok(columns.labels.every((label) => /^03\/\d{2}\s[일월화수목금토]$/.test(label)));
});
