import React, { useMemo, useState } from 'react';
import './CreateDatePage.css';
import BackButton from '../components/common/BackButton';
import TopBar from '../components/common/TopBar';
import NextButton from '../components/common/NextButton';
import { useNavigate } from 'react-router-dom';

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

// 00:00 ~ 24:00 (25개)
const TIME_OPTIONS = Array.from({ length: 25 }, (_, i) =>
  String(i).padStart(2, '0') + ':00',
);

export default function CreateDatePage() {
  const navigate = useNavigate();                 // ← 여기서 선언
  const calendarCells = useCalendarCells();
  const [selectedDateKeys, setSelectedDateKeys] = useState(new Set());

  const [startTimeIndex, setStartTimeIndex] = useState(1);
  const [endTimeIndex, setEndTimeIndex] = useState(2);

  const toggleDate = (cell) => {
    if (cell.type !== 'date') return;

    setSelectedDateKeys((prev) => {
      const next = new Set(prev);
      if (next.has(cell.key)) {
        next.delete(cell.key);
      } else {
        next.add(cell.key);
      }
      return next;
    });
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleNext = () => {
    if (!selectedDateKeys.size) return;

    const selectedDates = calendarCells
      .filter((cell) => cell.type === 'date' && selectedDateKeys.has(cell.key))
      .map((cell) => cell.date.toISOString());

    const startTime = TIME_OPTIONS[startTimeIndex];
    const endTime = TIME_OPTIONS[endTimeIndex];

    console.log('선택된 날짜들:', selectedDates);
    console.log('선택된 시간대:', startTime, '~', endTime);

    navigate('/create/locate');                   // ← 이제 정상 동작
  };

  const hasSelection = selectedDateKeys.size > 0;

  const isWeekend = (date) => {
    const day = date.getDay(); // Sun=0, Sat=6
    return day === 0 || day === 6;
  };

  const handleStartWheel = (event) => {
    event.preventDefault();
    setStartTimeIndex((prev) => {
      if (event.deltaY > 0) {
        return Math.min(prev + 1, TIME_OPTIONS.length - 1);
      }
      return Math.max(prev - 1, 0);
    });
  };

  const handleEndWheel = (event) => {
    event.preventDefault();
    setEndTimeIndex((prev) => {
      if (event.deltaY > 0) {
        return Math.min(prev + 1, TIME_OPTIONS.length - 1);
      }
      return Math.max(prev - 1, 0);
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
            type === 'start'
              ? setStartTimeIndex(index)
              : setEndTimeIndex(index)
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
              <span className="create-date-section-title-strong">날짜</span>{' '}
              선택하기
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
                const dayLabel =
                  WEEKDAY_LABELS[(date.getDay() + 6) % 7] ?? '';

                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={
                      'create-date-calendar-cell create-date-calendar-cell--date' +
                      (selected
                        ? ' create-date-calendar-cell--selected'
                        : '')
                    }
                    onClick={() => toggleDate(cell)}
                  >
                    <span
                      className={
                        'create-date-calendar-day' +
                        (isWeekendDay
                          ? ' create-date-calendar-day--weekend'
                          : '')
                      }
                    >
                      {date.getDate()}
                    </span>
                    <span
                      className={
                        'create-date-calendar-weekday' +
                        (isWeekendDay
                          ? ' create-date-calendar-weekday--weekend'
                          : '')
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
              <span className="create-date-section-title-strong">시간대</span>{' '}
              선택하기
            </p>

            <div className="create-date-time-picker">
              <div
                className="create-date-time-wheel"
                onWheel={handleStartWheel}
              >
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
