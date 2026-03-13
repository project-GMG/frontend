// gmg-front/src/pages/create/CreateDatePage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './CreateDatePage.css';
import BackButton from '../components/common/BackButton';
import TopBar from '../components/common/TopBar';
import NextButton from '../components/common/NextButton';
import { useLocation, useNavigate } from 'react-router-dom';
import logoIcon from '../../assets/icons/logo.png';

const WEEKDAY_LABELS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function useCalendarCells() {
  return useMemo(() => {
    const cells = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 1);

    const jsDay = today.getDay();
    const mondayBasedIndex = (jsDay + 6) % 7;

    let currentDate = new Date(today);

    for (let i = 0; i < 35; i += 1) {
      if (i < mondayBasedIndex) {
        cells.push({ type: 'empty', key: `empty-before-${i}` });
      } else if (currentDate < endDate) {
        cells.push({
          type: 'date',
          key: currentDate.toISOString(),
          date: new Date(currentDate),
        });
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        cells.push({ type: 'empty', key: `empty-after-${i}` });
      }
    }

    return cells;
  }, []);
}

const TIME_OPTIONS = Array.from({ length: 49 }, (_, i) => {
  const totalMin = i * 30;
  const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const mm = String(totalMin % 60).padStart(2, '0');
  return `${hh}:${mm}`;
});

function toYmdLocal(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toBackendTimeLabel(timeLabel) {
  return timeLabel === '24:00' ? '23:59' : timeLabel;
}

export default function CreateDatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prev = location.state || {};

  const calendarCells = useCalendarCells();

  const initialSelectedDateKeys = useMemo(() => {
    const set = new Set();

    const dr = prev?.dateRange;
    if (!dr?.startDate || !dr?.endDate) return set;

    const start = new Date(`${dr.startDate}T00:00:00`);
    const end = new Date(`${dr.endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return set;

    const ymdToKey = new Map();
    calendarCells.forEach((cell) => {
      if (cell.type === 'date') ymdToKey.set(toYmdLocal(cell.date), cell.key);
    });

    const cur = new Date(start);
    while (cur <= end) {
      const key = ymdToKey.get(toYmdLocal(cur));
      if (key) set.add(key);
      cur.setDate(cur.getDate() + 1);
    }

    return set;
  }, [prev?.dateRange, calendarCells]);

  const initialStartTimeIndex = useMemo(() => {
    const t = prev?.timeRange?.startTime;
    const idx = TIME_OPTIONS.indexOf(t);
    if (idx >= 0) return idx;
    return TIME_OPTIONS.indexOf('13:00');
  }, [prev?.timeRange?.startTime]);

  const initialEndTimeIndex = useMemo(() => {
    const t = prev?.timeRange?.endTime;
    const idx = TIME_OPTIONS.indexOf(t);
    if (idx >= 0) return idx;
    return TIME_OPTIONS.indexOf('18:00');
  }, [prev?.timeRange?.endTime]);

  const [selectedDateKeys, setSelectedDateKeys] = useState(initialSelectedDateKeys);
  const [startTimeIndex, setStartTimeIndex] = useState(initialStartTimeIndex);
  const [endTimeIndex, setEndTimeIndex] = useState(initialEndTimeIndex);

  const wheelAccStartRef = useRef(0);
  const wheelAccEndRef = useRef(0);
  const WHEEL_THRESHOLD = 100;

  const startWheelRef = useRef(null);
  const endWheelRef = useRef(null);

  const startTouchYRef = useRef(null);
  const endTouchYRef = useRef(null);

  const TOUCH_STEP_PX = 18;
  const TOUCH_COOLDOWN_MS = 90;
  const startTouchLockRef = useRef(false);
  const endTouchLockRef = useRef(false);

  const stepIndex = (setter, dir) => {
    setter((prevIndex) => {
      if (dir > 0) return Math.min(prevIndex + 1, TIME_OPTIONS.length - 1);
      return Math.max(prevIndex - 1, 0);
    });
  };

  const lockStep = (lockRef) => {
    lockRef.current = true;
    window.setTimeout(() => {
      lockRef.current = false;
    }, TOUCH_COOLDOWN_MS);
  };

  useEffect(() => {
    const startEl = startWheelRef.current;
    const endEl = endWheelRef.current;

    if (!startEl || !endEl) return;

    const onStartTouchStart = (e) => {
      startTouchYRef.current = e.touches?.[0]?.clientY ?? null;
    };

    const onStartTouchMove = (e) => {
      const y = e.touches?.[0]?.clientY;
      if (y == null || startTouchYRef.current == null) return;

      const dy = y - startTouchYRef.current;

      if (!startTouchLockRef.current && Math.abs(dy) >= TOUCH_STEP_PX) {
        stepIndex(setStartTimeIndex, dy < 0 ? 1 : -1);
        lockStep(startTouchLockRef);
        startTouchYRef.current = y;
      }

      e.preventDefault();
    };

    const onStartTouchEnd = () => {
      startTouchYRef.current = null;
    };

    const onEndTouchStart = (e) => {
      endTouchYRef.current = e.touches?.[0]?.clientY ?? null;
    };

    const onEndTouchMove = (e) => {
      const y = e.touches?.[0]?.clientY;
      if (y == null || endTouchYRef.current == null) return;

      const dy = y - endTouchYRef.current;

      if (!endTouchLockRef.current && Math.abs(dy) >= TOUCH_STEP_PX) {
        stepIndex(setEndTimeIndex, dy < 0 ? 1 : -1);
        lockStep(endTouchLockRef);
        endTouchYRef.current = y;
      }

      e.preventDefault();
    };

    const onEndTouchEnd = () => {
      endTouchYRef.current = null;
    };

    startEl.addEventListener('touchstart', onStartTouchStart, { passive: true });
    startEl.addEventListener('touchmove', onStartTouchMove, { passive: false });
    startEl.addEventListener('touchend', onStartTouchEnd, { passive: true });
    startEl.addEventListener('touchcancel', onStartTouchEnd, { passive: true });

    endEl.addEventListener('touchstart', onEndTouchStart, { passive: true });
    endEl.addEventListener('touchmove', onEndTouchMove, { passive: false });
    endEl.addEventListener('touchend', onEndTouchEnd, { passive: true });
    endEl.addEventListener('touchcancel', onEndTouchEnd, { passive: true });

    return () => {
      startEl.removeEventListener('touchstart', onStartTouchStart);
      startEl.removeEventListener('touchmove', onStartTouchMove);
      startEl.removeEventListener('touchend', onStartTouchEnd);
      startEl.removeEventListener('touchcancel', onStartTouchEnd);

      endEl.removeEventListener('touchstart', onEndTouchStart);
      endEl.removeEventListener('touchmove', onEndTouchMove);
      endEl.removeEventListener('touchend', onEndTouchEnd);
      endEl.removeEventListener('touchcancel', onEndTouchEnd);
    };
  }, []);

  const toggleDate = (cell) => {
    if (cell.type !== 'date') return;

    setSelectedDateKeys((p) => {
      const next = new Set(p);
      if (next.has(cell.key)) next.delete(cell.key);
      else next.add(cell.key);
      return next;
    });
  };

  const handleBack = () => window.history.back();

  const handleNext = () => {
    if (!selectedDateKeys.size) return;

    if (startTimeIndex >= endTimeIndex) {
      alert('시작 시간은 종료 시간보다 이전이어야 합니다.');
      return;
    }

    const selectedDates = calendarCells
      .filter((cell) => cell.type === 'date' && selectedDateKeys.has(cell.key))
      .map((cell) => cell.date);

    selectedDates.sort((a, b) => a - b);

    const startDate = toYmdLocal(selectedDates[0]);
    const endDate = toYmdLocal(selectedDates[selectedDates.length - 1]);

    const startTime = TIME_OPTIONS[startTimeIndex];
    const endTime = TIME_OPTIONS[endTimeIndex];

    navigate('/create/locate', {
      state: {
        ...prev,
        dateRange: { startDate, endDate },
        timeRange: {
          startTime: toBackendTimeLabel(startTime),
          endTime: toBackendTimeLabel(endTime),
        },
      },
    });
  };

  const hasSelection = selectedDateKeys.size > 0;

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const handleStartWheel = (event) => {
    wheelAccStartRef.current += event.deltaY;

    if (Math.abs(wheelAccStartRef.current) < WHEEL_THRESHOLD) return;

    const dir = wheelAccStartRef.current > 0 ? 1 : -1;
    wheelAccStartRef.current = 0;

    setStartTimeIndex((prevIndex) => {
      if (dir > 0) return Math.min(prevIndex + 1, TIME_OPTIONS.length - 1);
      return Math.max(prevIndex - 1, 0);
    });
  };

  const handleEndWheel = (event) => {
    wheelAccEndRef.current += event.deltaY;

    if (Math.abs(wheelAccEndRef.current) < WHEEL_THRESHOLD) return;

    const dir = wheelAccEndRef.current > 0 ? 1 : -1;
    wheelAccEndRef.current = 0;

    setEndTimeIndex((prevIndex) => {
      if (dir > 0) return Math.min(prevIndex + 1, TIME_OPTIONS.length - 1);
      return Math.max(prevIndex - 1, 0);
    });
  };

  const renderWheelItems = (selectedIndex, type) =>
    [-1, 0, 1].map((offset) => {
      const index = selectedIndex + offset;
      const label = TIME_OPTIONS[index];

      if (!label) {
        return (
          <div
            key={`${type}-empty-${offset}`}
            className="create-date-time-wheel-item create-date-time-wheel-item--empty"
          />
        );
      }

      const isActive = offset === 0;

      return (
        <button
          type="button"
          key={`${type}-${label}`}
          className={
            'create-date-time-wheel-item' +
            (isActive
              ? ' create-date-time-wheel-item--active'
              : ' create-date-time-wheel-item--inactive')
          }
          onClick={() => (type === 'start' ? setStartTimeIndex(index) : setEndTimeIndex(index))}
        >
          {label}
        </button>
      );
    });

  return (
    <div className="create-date-page">
      <div className="create-date-desktop-shell">
        <aside className="create-date-brand-panel" aria-hidden="true">
          <img src={logoIcon} alt="" className="create-date-brand-logo" />
          <div className="create-date-brand-copy">
            <p className="create-date-brand-text">
              싫어하는 것을
              <br />
              존중해주니까
            </p>
            <div className="create-date-brand-divider" />
            <p className="create-date-brand-text">
              이제는 <span className="create-date-brand-text-strong">가면가</span>
            </p>
          </div>
        </aside>
        <div className="create-date-container">
          <header className="create-date-nav">
            <div className="create-date-topbar">
              <TopBar currentStep={2} totalSteps={4} />
            </div>
            <div className="create-date-back">
              <BackButton onClick={handleBack} />
            </div>
          </header>

          <main className="create-date-content">
            <h1 className="create-date-title">언제쯤 만날까요?</h1>
            <p className="create-date-subtitle">
              가능한 <span className="create-date-subtitle-em">날짜</span>와{' '}
              <span className="create-date-subtitle-em">시간대</span>를 선택해 주세요
            </p>

            <section className="create-date-section">
              <p className="create-date-section-title">
                <span className="create-date-section-title-strong">날짜</span> 선택하기
              </p>

              <div className="create-date-calendar">
                {calendarCells.map((cell) => {
                  if (cell.type === 'empty') {
                    return (
                      <div
                        key={cell.key}
                        className="create-date-calendar-cell create-date-calendar-cell--empty"
                      />
                    );
                  }

                  const selected = selectedDateKeys.has(cell.key);
                  const date = cell.date;
                  const isWeekendDay = isWeekend(date);
                  const dayLabel = WEEKDAY_LABELS[(date.getDay() + 6) % 7] ?? '';

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      className={
                        'create-date-calendar-cell create-date-calendar-cell--date' +
                        (selected ? ' create-date-calendar-cell--selected' : '')
                      }
                      onClick={() => toggleDate(cell)}
                    >
                      <span
                        className={
                          'create-date-calendar-day' +
                          (isWeekendDay ? ' create-date-calendar-day--weekend' : '')
                        }
                      >
                        {date.getDate()}
                      </span>
                      <span
                        className={
                          'create-date-calendar-weekday' +
                          (isWeekendDay ? ' create-date-calendar-weekday--weekend' : '')
                        }
                      >
                        {dayLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="create-date-section create-date-time-section">
              <p className="create-date-section-title">
                <span className="create-date-section-title-strong">시간대</span> 선택하기
              </p>

              <div className="create-date-time-picker">
                <div
                  ref={startWheelRef}
                  className="create-date-time-wheel"
                  onWheel={handleStartWheel}
                >
                  {renderWheelItems(startTimeIndex, 'start')}
                </div>

                <span className="create-date-time-separator">~</span>

                <div ref={endWheelRef} className="create-date-time-wheel" onWheel={handleEndWheel}>
                  {renderWheelItems(endTimeIndex, 'end')}
                </div>
              </div>
            </section>
          </main>

          <footer className="create-date-footer">
            <NextButton disabled={!hasSelection} onClick={handleNext}>
              다음
            </NextButton>
          </footer>
        </div>
      </div>
    </div>
  );
}
