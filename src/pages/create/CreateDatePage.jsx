// gmg-front/src/pages/create/CreateDatePage.jsx

import React, { useMemo, useState } from 'react';
import './CreateDatePage.css';
import BackButton from '../components/common/BackButton';
import TopBar from '../components/common/TopBar';
import NextButton from '../components/common/NextButton';
import { useLocation, useNavigate } from 'react-router-dom';

const WEEKDAY_LABELS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function useCalendarCells() {
  return useMemo(() => {
    const cells = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 1); // 한 달 후

    // 월요일 기준 요일 인덱스 (Mon=0 ... Sun=6)
    const jsDay = today.getDay(); // Sun=0 ... Sat=6
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

// 00:00 ~ 24:00 (30분 단위, 49개)
const TIME_OPTIONS = Array.from({ length: 49 }, (_, i) => {
  const totalMin = i * 30;
  const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const mm = String(totalMin % 60).padStart(2, '0');
  return `${hh}:${mm}`;
});

// Date -> "YYYY-MM-DD" (로컬 기준)
function toYmdLocal(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function CreateDatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prev = location.state || {}; // CreatePlacePage에서 넘어온 placeTypeCodes 등

  const calendarCells = useCalendarCells();

  // 뒤로 갔다가 다시 진입 시 복원: prev.dateRange, prev.timeRange
  const initialSelectedDateKeys = useMemo(() => {
    const set = new Set();

    const dr = prev?.dateRange;
    if (!dr?.startDate || !dr?.endDate) return set;

    const start = new Date(`${dr.startDate}T00:00:00`);
    const end = new Date(`${dr.endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return set;

    // 캘린더 셀 key는 ISO 문자열이므로, 해당 날짜들의 ISO key를 찾아서 set에 넣음
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
    return idx >= 0 ? idx : 2; // 기본 01:00 근처
  }, [prev?.timeRange?.startTime]);

  const initialEndTimeIndex = useMemo(() => {
    const t = prev?.timeRange?.endTime;
    const idx = TIME_OPTIONS.indexOf(t);
    return idx >= 0 ? idx : 4; // 기본 02:00 근처
  }, [prev?.timeRange?.endTime]);

  const [selectedDateKeys, setSelectedDateKeys] = useState(initialSelectedDateKeys);
  const [startTimeIndex, setStartTimeIndex] = useState(initialStartTimeIndex);
  const [endTimeIndex, setEndTimeIndex] = useState(initialEndTimeIndex);

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

    // 선택된 날짜 객체 배열
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
        timeRange: { startTime, endTime },
      },
    });
  };

  const hasSelection = selectedDateKeys.size > 0;

  const isWeekend = (date) => {
    const day = date.getDay(); // Sun=0, Sat=6
    return day === 0 || day === 6;
  };

  const handleStartWheel = (event) => {
    event.preventDefault();
    setStartTimeIndex((prevIndex) => {
      if (event.deltaY > 0) return Math.min(prevIndex + 1, TIME_OPTIONS.length - 1);
      return Math.max(prevIndex - 1, 0);
    });
  };

  const handleEndWheel = (event) => {
    event.preventDefault();
    setEndTimeIndex((prevIndex) => {
      if (event.deltaY > 0) return Math.min(prevIndex + 1, TIME_OPTIONS.length - 1);
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
          onClick={() =>
            type === 'start' ? setStartTimeIndex(index) : setEndTimeIndex(index)
          }
        >
          {label}
        </button>
      );
    });

  return (
    <div className="create-date-page">
      <div className="create-date-container">
        <TopBar currentStep={2} totalSteps={4} />

        <header className="create-date-header">
          <BackButton onClick={handleBack} />
        </header>

        <main className="create-date-content">
          <h1 className="create-date-title">언제쯤 만날까요?</h1>

          {/* 날짜 선택 */}
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

          {/* 시간대 선택 (휠 형태) */}
          <section className="create-date-section create-date-time-section">
            <p className="create-date-section-title">
              <span className="create-date-section-title-strong">시간대</span> 선택하기
            </p>

            <div className="create-date-time-picker">
              <div className="create-date-time-wheel" onWheel={handleStartWheel}>
                {renderWheelItems(startTimeIndex, 'start')}
              </div>

              <span className="create-date-time-separator">~</span>

              <div className="create-date-time-wheel" onWheel={handleEndWheel}>
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
  );
}
