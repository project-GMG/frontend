function parseYmd(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toYmdLocal(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateKorean(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const wd = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${mm}/${dd} ${wd}`;
}

function normalizeToYmd(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : toYmdLocal(value);
  }

  const raw = String(value || '').trim();
  if (!raw) return '';

  const matchedYmd = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (matchedYmd) return `${matchedYmd[1]}-${matchedYmd[2]}-${matchedYmd[3]}`;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? '' : toYmdLocal(parsed);
}

export function normalizeSelectedDates(input) {
  const arr = Array.isArray(input) ? input : input ? Array.from(input) : [];
  return [...new Set(arr.map(normalizeToYmd).filter(Boolean))].sort();
}

export function buildDateColumns(selectedDates, limit = Infinity) {
  const ymds = normalizeSelectedDates(selectedDates).slice(0, limit);

  return {
    ymds,
    labels: ymds.map(parseYmd).filter(Boolean).map(formatDateKorean),
  };
}

export function buildConsecutiveSelectedDates(startYmd, days) {
  const start = parseYmd(startYmd);
  if (!start || !Number.isFinite(days) || days <= 0) return [];

  const selectedDates = [];
  const current = new Date(start);

  for (let i = 0; i < days; i += 1) {
    selectedDates.push(toYmdLocal(current));
    current.setDate(current.getDate() + 1);
  }

  return selectedDates;
}
