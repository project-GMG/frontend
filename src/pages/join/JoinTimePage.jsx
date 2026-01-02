import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NextButton from '../components/common/NextButton';
import './JoinTimePage.css';

const TIME_SLOTS = [
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
  '3:30 PM',
  '4:00 PM',
  '4:30 PM',
  '5:00 PM',
  '5:30 PM',
  '6:00 PM',
  '6:30 PM',
];

const TIME_LABELS = ['1 PM', '', '2 PM', '', '3 PM', '', '4 PM', '', '5 PM', '', '6 PM', ''];

const LONG_PRESS_MS = 250;
const MOVE_CANCEL_PX = 8;

export default function JoinTimePage() {
  const navigate = useNavigate();

  const allDates = useMemo(
    () => [
      '11/23 일',
      '11/24 월',
      '11/25 화',
      '11/26 수',
      '11/27 목',
      '11/28 금',
      '11/29 토',
      '11/30 일',
      '12/01 월',
      '12/02 화',
      '12/03 수',
      '12/04 목',
    ],
    [],
  );

  const PAGE_SIZE = 3;
  const totalPages = Math.ceil(allDates.length / PAGE_SIZE);

  const [page, setPage] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState(() => new Set());

  const gridScrollRef = useRef(null);
  const timeScrollRef = useRef(null);

  const touchStartRef = useRef({ x: 0, y: 0 });

  const pageDates = allDates.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

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

  const handleNext = () => {
    console.log('선택된 슬롯:', Array.from(selectedSlots));
    navigate('/join/Category');
  };

  const isNextDisabled = selectedSlots.size === 0;

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
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (mode === 'select') next.add(key);
      else if (mode === 'deselect') next.delete(key);
      return next;
    });
  };

  const toggleSingle = (key) => {
    setSelectedSlots((prev) => {
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

      const isActive = selectedSlots.has(key);
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
          <button
            type="button"
            className="join-time-back"
            onClick={handleBack}
            aria-label="뒤로가기"
          >
            ‹
          </button>

          <div className="join-time-step-pill">
            {page + 1} / {totalPages}
          </div>

          <div className="join-time-header-spacer" />
        </header>

        <main className="join-time-content">
          <h1 className="join-time-title">어려운 시간을 선택해주세요</h1>

          <section
            className={`join-time-grid-card ${selectModeUI !== 'idle' ? 'is-selecting' : ''}`}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="jt-frame">
              <div className="jt-date-rail">
                <div className="jt-date-row">
                  {pageDates.map((d) => (
                    <div key={d} className="jt-date-header">
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              <div ref={timeScrollRef} className="jt-time-rail" onScroll={syncFromTime}>
                <div className="jt-time-col">
                  {TIME_SLOTS.map((slot, idx) => (
                    <div key={slot} className="jt-time-label">
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
                  {TIME_SLOTS.map((slot) =>
                    pageDates.map((date) => {
                      const key = `${date}-${slot}`;
                      const isActive = selectedSlots.has(key);

                      return (
                        <button
                          type="button"
                          key={`${page}-${key}`}
                          data-slot-key={key}
                          className={`jt-slot ${isActive ? 'jt-slot--active' : ''}`}
                          aria-label={`${date} ${slot}`}
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
            다음
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
