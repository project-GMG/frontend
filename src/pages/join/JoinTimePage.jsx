// src/pages/join/JoinTimePage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NextButton from '../components/common/NextButton';
import './JoinTimePage.css';

const LONG_PRESS_MS = 250;
const MOVE_CANCEL_PX = 8;
const KEY_SEP = '::';

// YYYY-MM-DD (로컬)
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

function toYmdLocal(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// "01/09 금"
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

// "HH:mm" -> minutes
function hmToMin(hm) {
  const s = String(hm || '').slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(s)) return null;
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

// timeRange -> 슬롯(30분단위) + 라벨(정시만) + apiHm("HH:mm")
function buildTimeSlotsFromRange(startHm, endHm) {
  const startMin = hmToMin(startHm);
  const endMin = hmToMin(endHm);
  if (startMin == null || endMin == null) return { labels: [], slots: [], apiHm: [] };
  if (!(startMin < endMin)) return { labels: [], slots: [], apiHm: [] };

  const slots = [];
  const labels = [];
  const apiHm = [];

  let cur = startMin;
  while (cur <= endMin) {
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

export default function JoinTimePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hashUrl = (searchParams.get('code') || '').trim();

  const [selectedKeys, setSelectedKeys] = useState(() => new Set());

  const gridScrollRef = useRef(null);
  const timeScrollRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

  // 이벤트 로딩
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState('');
  const [eventData, setEventData] = useState(null);

  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // 1) 이벤트 정보 로딩
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!hashUrl) {
        setIsLoadingEvent(false);
        setEventError('링크가 올바르지 않습니다. /join/time?code=해시값 형태로 접속해야 합니다.');
        return;
      }

      setIsLoadingEvent(true);
      setEventError('');

      try {
        const res = await fetch(`/api/events/${encodeURIComponent(hashUrl)}`, {
          headers: { accept: 'application/json' },
        });
        const json = await res.json().catch(() => null);

        if (!alive) return;

        if (!res.ok) {
          setEventError(json?.message || '이벤트 정보를 불러오지 못했습니다.');
          setEventData(null);
          setIsLoadingEvent(false);
          return;
        }

        setEventData(json?.data || null);
        setIsLoadingEvent(false);
      } catch {
        if (!alive) return;
        setEventError('네트워크 오류로 이벤트 정보를 불러오지 못했습니다.');
        setEventData(null);
        setIsLoadingEvent(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [hashUrl]);

  // 2) 날짜/시간 슬롯 구성
  const { labels: allDateLabels, ymds: allDateYmds } = useMemo(() => {
    const s = eventData?.dateRange?.startDate;
    const e = eventData?.dateRange?.endDate;
    return buildDatesFromRange(s, e, 35);
  }, [eventData?.dateRange?.startDate, eventData?.dateRange?.endDate]);

  const { slots: TIME_SLOTS, labels: TIME_LABELS, apiHm: timeApiHm } = useMemo(() => {
    const s = eventData?.timeRange?.startTime;
    const e = eventData?.timeRange?.endTime;
    return buildTimeSlotsFromRange(s, e);
  }, [eventData?.timeRange?.startTime, eventData?.timeRange?.endTime]);

  // 페이지네이션(기존 유지)
  const PAGE_SIZE = 3;
  const totalPages = Math.max(1, Math.ceil(allDateLabels.length / PAGE_SIZE));
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  const pageDates = allDateLabels.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pageDateIndexOffset = page * PAGE_SIZE;

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

  const onTouchStart = (e) => {
    if (selectStateRef.current.mode !== 'idle') return;
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e) => {
    if (selectStateRef.current.mode !== 'idle') return;
    const start = touchStartRef.current;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;

    if (Math.abs(dy) > Math.abs(dx)) return;

    const TH = 40;
    if (dx <= -TH) goNext();
    else if (dx >= TH) goPrev();
  };

  const handleBack = () => navigate(-1);

  // 선택 키 -> API unavailableTimes
  const buildUnavailableTimes = () => {
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

      out.push({
        date: ymd,
        startTime,
        endTime: `${eh}:${em}`,
      });
    }

    return out;
  };

  // POST /api/event/{hashUrl}/participants/{participantId}/unavailble-times
  const handleNext = async () => {
    if (!hashUrl) return;
    if (selectedKeys.size === 0) return;

    setSubmitError('');
    setIsSubmitting(true);

    const participantIdRaw = localStorage.getItem(`gmg_participant_${hashUrl}`);
    const participantId = participantIdRaw ? Number(participantIdRaw) : null;

    if (!participantId || Number.isNaN(participantId)) {
      setIsSubmitting(false);
      setSubmitError('참여자 정보가 없습니다. 먼저 이름 등록을 다시 진행해주세요.');
      return;
    }

    const unavailableTimes = buildUnavailableTimes();
    if (!unavailableTimes.length) {
      setIsSubmitting(false);
      setSubmitError('선택한 시간이 유효하지 않습니다. 다시 선택해주세요.');
      return;
    }

    try {
      const res = await fetch(
        `/api/event/${encodeURIComponent(hashUrl)}/participants/${encodeURIComponent(
          participantId,
        )}/unavailble-times`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unavailableTimes }),
        },
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setSubmitError(json?.message || '시간 등록에 실패했습니다.');
        return;
      }

      navigate(`/join/Category?code=${encodeURIComponent(hashUrl)}`);
    } catch {
      setSubmitError('네트워크 오류로 시간 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isNextDisabled =
    selectedKeys.size === 0 || isLoadingEvent || !!eventError || isSubmitting;

  // =========================
  // 롱프레스 드래그 선택/해제
  // =========================
  const [selectModeUI, setSelectModeUI] = useState('idle');

  const selectStateRef = useRef({
    mode: 'idle',
    pointerDown: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startKey: null,
    lastKey: null,
    longPressTimer: null,
    movedBeforeLongPress: false,
  });

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

  const onSlotPointerDown = (e, key) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const st = selectStateRef.current;
    st.pointerDown = true;
    st.pointerId = e.pointerId;
    st.startX = e.clientX;
    st.startY = e.clientY;
    st.startKey = key;
    st.lastKey = key;
    st.movedBeforeLongPress = false;

    clearLongPressTimer();

    st.longPressTimer = setTimeout(() => {
      if (!st.pointerDown) return;
      if (st.movedBeforeLongPress) return;

      const isActive = selectedKeys.has(key);
      const mode = isActive ? 'deselect' : 'select';
      setMode(mode);

      applyKeyByMode(key, mode);

      timeScrollRef.current?.classList.add('is-selecting');
      gridScrollRef.current?.classList.add('is-selecting');

      e.currentTarget.setPointerCapture?.(e.pointerId);
    }, LONG_PRESS_MS);
  };

  const onSlotPointerMove = (e) => {
    const st = selectStateRef.current;
    if (!st.pointerDown) return;

    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;

    if (st.mode === 'idle') {
      if (Math.abs(dx) > MOVE_CANCEL_PX || Math.abs(dy) > MOVE_CANCEL_PX) {
        st.movedBeforeLongPress = true;
        clearLongPressTimer();
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
    st.pointerId = null;

    clearLongPressTimer();

    if (wasMode === 'idle') {
      if (!st.movedBeforeLongPress && startKey) {
        toggleSingle(startKey);
      }
      st.startKey = null;
      st.lastKey = null;
      return;
    }

    setMode('idle');

    timeScrollRef.current?.classList.remove('is-selecting');
    gridScrollRef.current?.classList.remove('is-selecting');

    st.startKey = null;
    st.lastKey = null;
    try {
      e.currentTarget?.releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onPointerCancel = (e) => finishPointer(e);

  return (
    <div className="join-time-page">
      <div className="join-time-container">
        <header className="join-time-header">
          <button type="button" className="join-time-back" onClick={handleBack} aria-label="뒤로가기">
            ‹
          </button>

          <div className="join-time-step-pill">
            {page + 1} / {totalPages}
          </div>

          <div className="join-time-header-spacer" />
        </header>

        <main className="join-time-content">
          <h1 className="join-time-title">어려운 시간을 선택해주세요</h1>

          {isLoadingEvent && (
            <p style={{ margin: '8px 0', color: '#666', fontSize: 14 }}>모임 정보를 불러오는 중...</p>
          )}
          {!!eventError && (
            <p style={{ margin: '8px 0', color: '#d00', fontSize: 14 }}>{eventError}</p>
          )}
          {!!submitError && (
            <p style={{ margin: '8px 0', color: '#d00', fontSize: 14 }}>{submitError}</p>
          )}

          <section
            className={`join-time-grid-card ${selectModeUI !== 'idle' ? 'is-selecting' : ''}`}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="jt-frame">
              <div className="jt-date-rail">
                <div className="jt-date-row">
                  {pageDates.map((d, i) => (
                    <div key={`${page}-${d}-${i}`} className="jt-date-header">
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              <div ref={timeScrollRef} className="jt-time-rail" onScroll={syncFromTime}>
                <div className="jt-time-col">
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
                    gridTemplateColumns: `repeat(${pageDates.length}, var(--cell-w))`,
                    gridTemplateRows: `repeat(${TIME_SLOTS.length}, var(--cell-h))`,
                  }}
                >
                  {TIME_SLOTS.map((slot, slotIndex) =>
                    pageDates.map((dateLabel, localDateIndex) => {
                      const dateIndex = pageDateIndexOffset + localDateIndex;
                      const key = makeKey(dateIndex, slotIndex);
                      const isActive = selectedKeys.has(key);

                      return (
                        <button
                          type="button"
                          key={`${page}-${key}`}
                          data-slot-key={key}
                          className={`jt-slot ${isActive ? 'jt-slot--active' : ''}`}
                          aria-label={`${dateLabel} ${slot}`}
                          onPointerDown={(e) => onSlotPointerDown(e, key)}
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
