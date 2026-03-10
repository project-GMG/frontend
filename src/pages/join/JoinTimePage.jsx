import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NextButton from '../components/common/NextButton';
import BackButton from '../components/common/BackButton';
import './JoinTimePage.css';
import { buildApiUrl } from '../../lib/api';

const LONG_PRESS_MS = 250;
const KEY_SEP = '::';

const SWIPE_TH_PX = 40;
const SWIPE_MAX_VERTICAL_PX = 80;
const SWIPE_DECIDE_PX = 12;

async function apiFetch(path, options = {}) {
  const res = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text().catch(() => '');
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg =
      json?.message ||
      json?.error ||
      (typeof json === 'string' ? json : null) ||
      (text && text.slice(0, 120)) ||
      `요청 실패 (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = json;
    throw err;
  }

  return json;
}

function extractParticipantId(json) {
  const data = json?.data;
  if (!data) return null;
  const pid = data.participantId ?? data.id ?? data.participantID;
  const n = Number(pid);
  return Number.isFinite(n) ? n : null;
}

async function ensureParticipantId(hashUrl) {
  const keyId = `gmg_participant_${hashUrl}`;
  const keyName = `gmg_participant_name_${hashUrl}`;

  const cached = sessionStorage.getItem(keyId);
  const cachedNum = cached ? Number(cached) : NaN;
  if (Number.isFinite(cachedNum)) return cachedNum;

  const name = (sessionStorage.getItem(keyName) || '').trim();
  if (!name) return null;

  const json = await apiFetch(`/api/event/${encodeURIComponent(hashUrl)}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  const pid = extractParticipantId(json);
  if (pid == null) return null;

  sessionStorage.setItem(keyId, String(pid));
  sessionStorage.setItem(keyName, name);

  return pid;
}

function parseYmd(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  dt.setHours(0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function normalizeYmdInput(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function normalizeHmInput(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const m = raw.match(/(\d{2}):(\d{2})/);
  if (!m) return '';
  return `${m[1]}:${m[2]}`;
}

function pickFirstNonEmpty(...values) {
  for (const v of values) {
    if (v == null) continue;
    if (String(v).trim()) return v;
  }
  return '';
}

function getNormalizedEventRange(eventData) {
  const startDateRaw = pickFirstNonEmpty(
    eventData?.dateRange?.startDate,
    eventData?.startDate,
    eventData?.startDateTime,
    eventData?.dateStart,
  );
  const endDateRaw = pickFirstNonEmpty(
    eventData?.dateRange?.endDate,
    eventData?.endDate,
    eventData?.endDateTime,
    eventData?.dateEnd,
  );
  const startTimeRaw = pickFirstNonEmpty(
    eventData?.timeRange?.startTime,
    eventData?.startTime,
    eventData?.startDateTime,
    eventData?.timeStart,
  );
  const endTimeRaw = pickFirstNonEmpty(
    eventData?.timeRange?.endTime,
    eventData?.endTime,
    eventData?.endDateTime,
    eventData?.timeEnd,
  );

  return {
    startDate: normalizeYmdInput(startDateRaw),
    endDate: normalizeYmdInput(endDateRaw),
    startTime: normalizeHmInput(startTimeRaw),
    endTime: normalizeHmInput(endTimeRaw),
  };
}

function withFallbackEventRange(eventData, fallbackEventData) {
  const primary = getNormalizedEventRange(eventData);
  if (primary.startDate && primary.endDate && primary.startTime && primary.endTime) return primary;

  const fallback = getNormalizedEventRange(fallbackEventData);
  return {
    startDate: primary.startDate || fallback.startDate,
    endDate: primary.endDate || fallback.endDate,
    startTime: primary.startTime || fallback.startTime,
    endTime: primary.endTime || fallback.endTime,
  };
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

function buildDatesFromRange(startYmd, endYmd, limit = 35) {
  const start = parseYmd(startYmd);
  const end = parseYmd(endYmd);
  if (!start || !end) return { labels: [], ymds: [] };

  const labels = [];
  const ymds = [];

  const cur = new Date(start);
  let count = 0;
  while (cur.getTime() <= end.getTime() && count < limit) {
    labels.push(formatDateKorean(cur));
    ymds.push(toYmdLocal(cur));
    cur.setDate(cur.getDate() + 1);
    count += 1;
  }

  return { labels, ymds };
}

function hmToMin(hm) {
  const s = String(hm || '').slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(s)) return null;
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

function buildTimeSlotsFromRange(startHm, endHm) {
  const startMin = hmToMin(startHm);
  const endMin = hmToMin(endHm);
  if (startMin == null || endMin == null) return { labels: [], slots: [], apiHm: [] };
  if (!(startMin < endMin)) return { labels: [], slots: [], apiHm: [] };

  const slots = [];
  const labels = [];
  const apiHm = [];

  let cur = startMin;
  while (cur < endMin) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;

    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    apiHm.push(`${hh}:${mm}`);

    const isPm = h >= 12;
    const hour12 = ((h + 11) % 12) + 1;
    const ampm = isPm ? 'PM' : 'AM';
    slots.push(`${hour12}:${mm} ${ampm}`);

    labels.push(m === 0 ? `${hour12} ${ampm}` : '');
    cur += 30;
  }

  return { labels, slots, apiHm };
}

function makeKey(dateIndex, slotIndex) {
  return `${dateIndex}${KEY_SEP}${slotIndex}`;
}

function parseKey(key) {
  const [a, b] = String(key).split(KEY_SEP);
  const di = Number(a);
  const si = Number(b);
  if (!Number.isFinite(di) || !Number.isFinite(si)) return null;
  return { dateIndex: di, slotIndex: si };
}

function isWeekendLabel(label) {
  const wd = String(label || '')
    .trim()
    .slice(-1);
  return wd === '토' || wd === '일';
}

function addDaysYmd(baseYmd, days) {
  const dt = parseYmd(baseYmd);
  if (!dt) return baseYmd;
  dt.setDate(dt.getDate() + days);
  return toYmdLocal(dt);
}

function buildDummyEvent5Days() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = toYmdLocal(today);
  const end = addDaysYmd(start, 4);
  return {
    title: '다같이 만나요(더미)',
    dateRange: { startDate: start, endDate: end },
    timeRange: { startTime: '10:00', endTime: '20:00' },
  };
}

export default function JoinTimePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hashUrl = (searchParams.get('code') || '').trim();
  const isEditMode = searchParams.get('mode') === 'edit';

  const [selectedKeys, setSelectedKeys] = useState(() => new Set());

  const gridScrollRef = useRef(null);
  const timeScrollRef = useRef(null);

  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState('');
  const [eventData, setEventData] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const dummyEventData = useMemo(
    () => ({
      ...buildDummyEvent5Days(),
      hashUrl: 'local-preview',
      title: 'Local Preview Event',
      heatmapData: [],
    }),
    [],
  );

  const USE_DUMMY_WHEN_NO_CODE = true;

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!hashUrl) {
        if (!alive) return;

        if (USE_DUMMY_WHEN_NO_CODE) {
          setEventError('');
          setEventData(dummyEventData);
          setIsLoadingEvent(false);
          return;
        }

        setIsLoadingEvent(false);
        setEventError('링크가 올바르지 않습니다. /join/time?code=해시값 형태로 접속해야 합니다.');
        setEventData(null);
        return;
      }

      setIsLoadingEvent(true);
      setEventError('');

      try {
        const json = await apiFetch(`/api/events/${encodeURIComponent(hashUrl)}`);
        if (!alive) return;

        setEventData(json?.data || null);
        setIsLoadingEvent(false);
      } catch (e) {
        if (!alive) return;

        if (USE_DUMMY_WHEN_NO_CODE) {
          setEventData(dummyEventData);
          setEventError('개발 모드: 이벤트 API 접근 실패로 더미 데이터를 표시합니다.');
          setIsLoadingEvent(false);
          return;
        }

        setEventError(e?.message || '네트워크 오류로 이벤트 정보를 불러오지 못했습니다.');
        setEventData(null);
        setIsLoadingEvent(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [dummyEventData, hashUrl]);

  const normalizedEventRange = useMemo(
    () => withFallbackEventRange(eventData, dummyEventData),
    [dummyEventData, eventData],
  );

  const { labels: allDateLabels, ymds: allDateYmds } = useMemo(() => {
    const s = normalizedEventRange.startDate;
    const e = normalizedEventRange.endDate;
    return buildDatesFromRange(s, e, 35);
  }, [normalizedEventRange.startDate, normalizedEventRange.endDate]);

  const {
    slots: TIME_SLOTS,
    labels: TIME_LABELS,
    apiHm: timeApiHm,
  } = useMemo(() => {
    const s = normalizedEventRange.startTime;
    const e = normalizedEventRange.endTime;
    return buildTimeSlotsFromRange(s, e);
  }, [normalizedEventRange.startTime, normalizedEventRange.endTime]);

  useEffect(() => {
    if (!isEditMode || !hashUrl || !allDateYmds.length || !timeApiHm.length) return;

    const participantId = sessionStorage.getItem(`gmg_participant_${hashUrl}`);
    if (!participantId) return;

    let alive = true;
    (async () => {
      try {
        const json = await apiFetch(
          `/api/event/${encodeURIComponent(hashUrl)}/participants/${encodeURIComponent(
            participantId,
          )}/unavailable-times`,
        );
        if (!alive) return;
        const times = json?.data?.unavailableTimes ?? [];

        const keys = new Set();
        for (const { date, startTime } of times) {
          const dateIndex = allDateYmds.indexOf(date);
          const slotIndex = timeApiHm.indexOf(startTime);
          if (dateIndex !== -1 && slotIndex !== -1) keys.add(makeKey(dateIndex, slotIndex));
        }
        setSelectedKeys(keys);
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
    };
  }, [isEditMode, hashUrl, allDateYmds, timeApiHm]);

  const PAGE_SIZE = 3;
  const totalPages = Math.max(1, Math.ceil(allDateLabels.length / PAGE_SIZE));
  const [page, setPage] = useState(0);

  const [hasReachedLast, setHasReachedLast] = useState(false);

  useEffect(() => {
    setHasReachedLast(false);
  }, [hashUrl, totalPages]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  useEffect(() => {
    if (totalPages <= 1) return;
    if (page === totalPages - 1) setHasReachedLast(true);
  }, [page, totalPages]);

  const pageDatesRaw = allDateLabels.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pageDateIndexOffset = page * PAGE_SIZE;

  const pageDatesFixed = useMemo(() => {
    const arr = [...pageDatesRaw];
    while (arr.length < PAGE_SIZE) arr.push(null);
    return arr;
  }, [pageDatesRaw]);

  const syncFromGrid = () => {
    const grid = gridScrollRef.current;
    const time = timeScrollRef.current;
    if (!grid || !time) return;
    time.scrollTop = grid.scrollTop;
  };

  const syncFromTime = () => {
    const grid = gridScrollRef.current;
    const time = timeScrollRef.current;
    if (!grid || !time) return;
    grid.scrollTop = time.scrollTop;
  };

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  const handleBack = () => navigate(-1);

  const buildUnavailableTimesRaw = () => {
    const out = [];
    for (const key of selectedKeys) {
      const parsed = parseKey(key);
      if (!parsed) continue;

      const { dateIndex, slotIndex } = parsed;

      const ymd = allDateYmds[dateIndex];
      const startTime = timeApiHm[slotIndex];
      if (!ymd || !startTime) continue;

      const startMin = hmToMin(startTime);
      if (startMin == null) continue;

      const endMin = startMin + 30;
      const eh = String(Math.floor(endMin / 60)).padStart(2, '0');
      const em = String(endMin % 60).padStart(2, '0');

      out.push({ date: ymd, startTime, endTime: `${eh}:${em}` });
    }
    return out;
  };

  const filterUnavailableTimesByEvent = (list) => {
    const ds = normalizedEventRange.startDate;
    const de = normalizedEventRange.endDate;
    const ts = normalizedEventRange.startTime;
    const te = normalizedEventRange.endTime;

    const startDate = parseYmd(ds);
    const endDate = parseYmd(de);
    const startMin = hmToMin(ts);
    const endMin = hmToMin(te);

    if (!startDate || !endDate || startMin == null || endMin == null) return list;

    return list.filter((it) => {
      const d = parseYmd(it.date);
      if (!d) return false;
      if (d.getTime() < startDate.getTime() || d.getTime() > endDate.getTime()) return false;

      const sMin = hmToMin(it.startTime);
      const eMin = hmToMin(it.endTime);
      if (sMin == null || eMin == null) return false;

      if (sMin < startMin) return false;
      if (eMin > endMin) return false;
      if (eMin - sMin !== 30) return false;
      if (sMin % 30 !== 0) return false;

      return true;
    });
  };

  const handleNext = async () => {
    if (!hashUrl) return;

    setSubmitError('');
    setIsSubmitting(true);

    let participantId = null;
    try {
      participantId = await ensureParticipantId(hashUrl);
    } catch (e) {
      setIsSubmitting(false);
      setSubmitError(e?.message || '참여자 정보를 확인하지 못했습니다. 다시 시도해주세요.');
      return;
    }

    if (!participantId) {
      setIsSubmitting(false);
      setSubmitError('참여자 정보가 없습니다. 먼저 이름 등록을 다시 진행해주세요.');
      return;
    }

    const raw = buildUnavailableTimesRaw();
    const unavailableTimes = filterUnavailableTimesByEvent(raw);

    try {
      await apiFetch(
        `/api/event/${encodeURIComponent(hashUrl)}/participants/${encodeURIComponent(
          participantId,
        )}/unavailable-times`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unavailableTimes }),
        },
      );

      navigate(`/join/Category?code=${encodeURIComponent(hashUrl)}`);
    } catch (e) {
      setSubmitError(e?.message || '네트워크 오류로 시간 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shouldRequireLastPage = totalPages > 1;
  const isNextDisabled =
    (shouldRequireLastPage && !hasReachedLast) || isLoadingEvent || !!eventError || isSubmitting;

  const [selectModeUI, setSelectModeUI] = useState('idle');

  const selectStateRef = useRef({
    mode: 'idle',
    pointerDown: false,
    pointerId: null,
    pointerType: null,
    startX: 0,
    startY: 0,
    startKey: null,
    lastKey: null,
    longPressTimer: null,
    movedBeforeLongPress: false,
    cancelPx: 8,
    pressingLocked: false,
    captureEl: null,
  });

  const swipeStateRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    decided: false,
    isSwipe: false,
    dx: 0,
    dy: 0,
  });

  const isSwipingRef = useRef(false);

  const clearLongPressTimer = () => {
    const st = selectStateRef.current;
    if (st.longPressTimer) {
      clearTimeout(st.longPressTimer);
      st.longPressTimer = null;
    }
  };

  const setMode = (mode) => {
    selectStateRef.current.mode = mode;
    setSelectModeUI(mode);
  };

  const applyKeyByMode = (key, mode) => {
    if (!key) return;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (mode === 'select') next.add(key);
      else if (mode === 'deselect') next.delete(key);
      return next;
    });
  };

  const toggleSingle = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const findSlotKeyFromPoint = (clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const slotEl = el.closest?.('[data-slot-key]');
    return slotEl?.getAttribute?.('data-slot-key') ?? null;
  };

  const lockScrollForPressing = () => {
    const grid = gridScrollRef.current;
    const time = timeScrollRef.current;
    if (grid) grid.classList.add('is-pressing');
    if (time) time.classList.add('is-pressing');
  };

  const unlockScrollForPressing = () => {
    const grid = gridScrollRef.current;
    const time = timeScrollRef.current;
    if (grid) grid.classList.remove('is-pressing');
    if (time) time.classList.remove('is-pressing');
  };

  const lockScrollForSelecting = () => {
    const grid = gridScrollRef.current;
    const time = timeScrollRef.current;
    if (grid) grid.classList.add('is-selecting');
    if (time) time.classList.add('is-selecting');
  };

  const unlockScrollForSelecting = () => {
    const grid = gridScrollRef.current;
    const time = timeScrollRef.current;
    if (grid) grid.classList.remove('is-selecting');
    if (time) time.classList.remove('is-selecting');
  };

  const cancelSelectingForSwipe = () => {
    const st = selectStateRef.current;
    st.movedBeforeLongPress = true;
    clearLongPressTimer();
    if (st.pressingLocked) {
      st.pressingLocked = false;
      unlockScrollForPressing();
    }
    if (st.mode !== 'idle') {
      setMode('idle');
      unlockScrollForSelecting();
    }
  };

  const onGridPointerDownCapture = (e) => {
    if (selectStateRef.current.mode !== 'idle') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const s = swipeStateRef.current;
    s.active = true;
    s.pointerId = e.pointerId;
    s.startX = e.clientX;
    s.startY = e.clientY;
    s.decided = false;
    s.isSwipe = false;
    s.dx = 0;
    s.dy = 0;

    isSwipingRef.current = false;
  };

  const onGridPointerMoveCapture = (e) => {
    const s = swipeStateRef.current;
    if (!s.active) return;
    if (s.pointerId !== e.pointerId) return;
    if (selectStateRef.current.mode !== 'idle') return;

    s.dx = e.clientX - s.startX;
    s.dy = e.clientY - s.startY;

    const ax = Math.abs(s.dx);
    const ay = Math.abs(s.dy);

    if (!s.decided) {
      if (ax < SWIPE_DECIDE_PX && ay < SWIPE_DECIDE_PX) return;

      s.decided = true;

      if (ax >= ay) {
        s.isSwipe = true;
        isSwipingRef.current = true;
        cancelSelectingForSwipe();
      } else {
        s.isSwipe = false;
        isSwipingRef.current = false;
        s.active = false;
        s.pointerId = null;
        return;
      }
    }

    if (!s.isSwipe) return;

    e.preventDefault();
    e.stopPropagation();
  };

  const onGridPointerUpCapture = (e) => {
    const s = swipeStateRef.current;
    if (!s.active) return;
    if (s.pointerId !== e.pointerId) return;

    const dx = s.dx;
    const dy = s.dy;

    const ax = Math.abs(dx);
    const ay = Math.abs(dy);

    const wasSwipe = s.isSwipe;

    s.active = false;
    s.pointerId = null;
    s.decided = false;
    s.isSwipe = false;

    isSwipingRef.current = false;

    if (!wasSwipe) return;
    if (ay > SWIPE_MAX_VERTICAL_PX) return;
    if (ax < SWIPE_TH_PX) return;

    if (dx <= -SWIPE_TH_PX) goNext();
    else if (dx >= SWIPE_TH_PX) goPrev();
  };

  const onGridPointerCancelCapture = () => {
    const s = swipeStateRef.current;
    s.active = false;
    s.pointerId = null;
    s.decided = false;
    s.isSwipe = false;
    isSwipingRef.current = false;
  };

  const onSlotPointerDown = (e, key) => {
    if (isSwipingRef.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const st = selectStateRef.current;

    st.pointerDown = true;
    st.pointerId = e.pointerId;
    st.pointerType = e.pointerType;
    st.startX = e.clientX;
    st.startY = e.clientY;
    st.startKey = key;
    st.lastKey = key;
    st.movedBeforeLongPress = false;
    st.cancelPx = e.pointerType === 'touch' ? 16 : 8;
    st.pressingLocked = false;
    st.captureEl = e.currentTarget;

    clearLongPressTimer();

    if (e.pointerType === 'touch') {
      e.preventDefault();
      st.pressingLocked = true;
      lockScrollForPressing();
      if (st.captureEl && typeof st.captureEl.setPointerCapture === 'function') {
        try {
          st.captureEl.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    }

    st.longPressTimer = setTimeout(() => {
      if (!st.pointerDown) return;
      if (st.movedBeforeLongPress) return;
      if (isSwipingRef.current) return;

      const isActive = selectedKeys.has(key);
      const mode = isActive ? 'deselect' : 'select';
      setMode(mode);
      applyKeyByMode(key, mode);

      if (st.pressingLocked) {
        st.pressingLocked = false;
        unlockScrollForPressing();
      }
      lockScrollForSelecting();
    }, LONG_PRESS_MS);
  };

  const onSlotPointerMove = (e) => {
    if (isSwipingRef.current) return;

    const st = selectStateRef.current;
    if (!st.pointerDown) return;

    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;

    if (st.mode === 'idle') {
      if (Math.abs(dx) > st.cancelPx || Math.abs(dy) > st.cancelPx) {
        st.movedBeforeLongPress = true;
        clearLongPressTimer();
        if (st.pressingLocked) {
          st.pressingLocked = false;
          unlockScrollForPressing();
        }
      }
      return;
    }

    e.preventDefault();

    const key = findSlotKeyFromPoint(e.clientX, e.clientY);
    if (!key) return;
    if (key === st.lastKey) return;

    st.lastKey = key;
    applyKeyByMode(key, st.mode);
  };

  const finishPointer = (e) => {
    const st = selectStateRef.current;
    if (!st.pointerDown) return;

    const wasMode = st.mode;
    const startKey = st.startKey;

    st.pointerDown = false;

    clearLongPressTimer();

    if (st.pressingLocked) {
      st.pressingLocked = false;
      unlockScrollForPressing();
    }

    if (wasMode === 'idle') {
      if (!st.movedBeforeLongPress && startKey && !isSwipingRef.current) toggleSingle(startKey);
      st.startKey = null;
      st.lastKey = null;
      st.pointerId = null;
      st.pointerType = null;
      st.captureEl = null;
      return;
    }

    setMode('idle');
    unlockScrollForSelecting();

    st.startKey = null;
    st.lastKey = null;
    st.pointerId = null;
    st.pointerType = null;

    if (st.captureEl) {
      try {
        st.captureEl.releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
    }
    st.captureEl = null;
  };

  const onPointerCancel = (e) => finishPointer(e);

  return (
    <div className="join-time-page">
      <div className="join-time-container">
        <header className="join-time-nav">
          <div className="join-time-step-pill">
            {page + 1} / {totalPages}
          </div>
          <div className="join-time-back">
            <BackButton onClick={handleBack} />
          </div>
        </header>

        <main className="join-time-content">
          <h1 className="join-time-title">어려운 시간을 선택해주세요</h1>

          {isLoadingEvent && (
            <div className="join-time-loading">
              <p className="join-time-loading-text">모임 정보를 불러오는 중...</p>
            </div>
          )}

          {!!eventError && (
            <p style={{ margin: '8px 0', color: '#d00', fontSize: 14 }}>{eventError}</p>
          )}
          {!!submitError && (
            <p style={{ margin: '8px 0', color: '#d00', fontSize: 14 }}>{submitError}</p>
          )}

          <section className="join-time-grid-wrap">
            <section
              className={`join-time-grid-card ${selectModeUI !== 'idle' ? 'is-selecting' : ''}`}
              onPointerDownCapture={onGridPointerDownCapture}
              onPointerMoveCapture={onGridPointerMoveCapture}
              onPointerUpCapture={onGridPointerUpCapture}
              onPointerCancelCapture={onGridPointerCancelCapture}
            >
              <div className="jt-frame">
                <div className="jt-date-rail">
                  <div className="jt-date-row jt-date-row--sticky">
                    {pageDatesFixed.map((d, i) => (
                      <div
                        key={`${page}-${d ?? 'empty'}-${i}`}
                        className={[
                          'jt-date-header',
                          d && isWeekendLabel(d) ? 'is-weekend' : '',
                          !d ? 'jt-date-header--empty' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {d ?? ''}
                      </div>
                    ))}
                  </div>
                </div>

                <div ref={timeScrollRef} className="jt-time-rail" onScroll={syncFromTime}>
                  <div className="jt-time-col">
                    <div className="jt-time-label jt-time-label--spacer" aria-hidden="true" />
                    {TIME_SLOTS.map((slot, idx) => (
                      <div key={`${slot}-${idx}`} className="jt-time-label">
                        {TIME_LABELS[idx] ?? ''}
                      </div>
                    ))}
                  </div>
                </div>

                <div ref={gridScrollRef} className="jt-grid-scroll" onScroll={syncFromGrid}>
                  <div
                    className="jt-grid"
                    style={{
                      gridTemplateColumns: `repeat(${PAGE_SIZE}, 1fr)`,
                      gridTemplateRows: `repeat(${TIME_SLOTS.length}, var(--cell-h))`,
                    }}
                  >
                    {TIME_SLOTS.map((slot, slotIndex) =>
                      pageDatesFixed.map((dateLabel, localDateIndex) => {
                        const hasDate = !!dateLabel;
                        const dateIndex = pageDateIndexOffset + localDateIndex;
                        const key = makeKey(dateIndex, slotIndex);

                        const isActive = hasDate && selectedKeys.has(key);
                        const pairClass = slotIndex % 2 === 0 ? 'jt-slot--top' : 'jt-slot--bottom';

                        if (!hasDate) {
                          return (
                            <div
                              key={`${page}-empty-${key}`}
                              className={`jt-slot jt-slot--empty ${pairClass}`}
                              aria-hidden="true"
                            />
                          );
                        }

                        return (
                          <button
                            type="button"
                            key={`${page}-${key}`}
                            data-slot-key={key}
                            className={`jt-slot ${pairClass} ${isActive ? 'jt-slot--active' : ''}`}
                            aria-label={`${dateLabel} ${slot}`}
                            onPointerDown={(ev) => onSlotPointerDown(ev, key)}
                            onPointerMove={onSlotPointerMove}
                            onPointerUp={finishPointer}
                            onPointerCancel={onPointerCancel}
                          />
                        );
                      }),
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="join-time-pagination join-time-pagination--dots-only">
              <div className="join-time-dots" aria-label="페이지 표시">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <span key={i} className={`join-time-dot ${i === page ? 'is-active' : ''}`} />
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="join-time-footer">
          <NextButton disabled={isNextDisabled} onClick={handleNext}>
            {isSubmitting ? '등록 중...' : '다음'}
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
