// src/pages/join/JoinTimePage.jsx
import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NextButton from '../components/common/NextButton';
import './JoinTimePage.css';

const TIME_SLOTS = [
  '1:00 PM','1:30 PM',
  '2:00 PM','2:30 PM',
  '3:00 PM','3:30 PM',
  '4:00 PM','4:30 PM',
  '5:00 PM','5:30 PM',
  '6:00 PM','6:30 PM',
];

const TIME_LABELS = [
  '1 PM','',
  '2 PM','',
  '3 PM','',
  '4 PM','',
  '5 PM','',
  '6 PM','',
];

export default function JoinTimePage() {
  const navigate = useNavigate();

  // 더미 날짜 12개(3일 x 4페이지)
  const allDates = useMemo(
    () => [
      '11/23 일', '11/24 월', '11/25 화',
      '11/26 수', '11/27 목', '11/28 금',
      '11/29 토', '11/30 일', '12/01 월',
      '12/02 화', '12/03 수', '12/04 목',
    ],
    [],
  );

  const PAGE_SIZE = 3;
  const totalPages = Math.ceil(allDates.length / PAGE_SIZE);

  const [page, setPage] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState(() => new Set());

  const gridScrollRef = useRef(null);
  const timeScrollRef = useRef(null);

  // 스와이프 감지용
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

  const toggleSlot = (key) => {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e) => {
    const start = touchStartRef.current;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;

    // 세로 스크롤 제스처면 무시
    if (Math.abs(dy) > Math.abs(dx)) return;

    const TH = 40; // 임계값
    if (dx <= -TH) goNext();      // 왼쪽으로 밀면 다음 페이지
    else if (dx >= TH) goPrev();  // 오른쪽으로 밀면 이전 페이지
  };

  const handleBack = () => navigate(-1);

  const handleNext = () => {
    console.log('선택된 슬롯:', Array.from(selectedSlots));
  };

  const isNextDisabled = selectedSlots.size === 0;

  return (
    <div className="join-time-page">
      <div className="join-time-container">
        {/* 헤더: 백버튼 + 페이지 표시 */}
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

          {/* 그리드 카드 (스와이프 영역) */}
          <section
            className="join-time-grid-card"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="jt-frame">
              {/* 상단 날짜(3일 고정, 스크롤 없음) */}
              <div className="jt-date-rail">
                <div className="jt-date-row">
                  {pageDates.map((d) => (
                    <div key={d} className="jt-date-header">
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              {/* 좌측 시간(세로 스크롤, grid와 동기화) */}
              <div
                ref={timeScrollRef}
                className="jt-time-rail"
                onScroll={syncFromTime}
              >
                <div className="jt-time-col">
                  {TIME_SLOTS.map((slot, idx) => (
                    <div key={slot} className="jt-time-label">
                      {TIME_LABELS[idx] ?? ''}
                    </div>
                  ))}
                </div>
              </div>

              {/* 슬롯 영역(세로 스크롤) */}
              <div
                ref={gridScrollRef}
                className="jt-grid-scroll"
                onScroll={syncFromGrid}
              >
                <div
                  className="jt-grid"
                  style={{
                    gridTemplateColumns: `repeat(${pageDates.length}, var(--cell-w))`,
                    gridTemplateRows: `repeat(${TIME_SLOTS.length}, var(--cell-h))`,
                  }}
                >
                  {TIME_SLOTS.map((slot) =>
                    pageDates.map((date) => {
                      const key = `${date}-${slot}`; // 페이지와 무관하게 날짜+시간으로 관리(원하면 page 포함해도 됨)
                      const isActive = selectedSlots.has(key);

                      return (
                        <button
                          type="button"
                          key={`${page}-${key}`}
                          className={`jt-slot ${isActive ? 'jt-slot--active' : ''}`}
                          onClick={() => toggleSlot(key)}
                          aria-label={`${date} ${slot}`}
                        />
                      );
                    }),
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 페이지 도트(버튼 없음) */}
          <div className="join-time-pagination join-time-pagination--dots-only">
            <div className="join-time-dots" aria-label="페이지 표시">
              {Array.from({ length: totalPages }).map((_, i) => (
                <span
                  key={i}
                  className={`join-time-dot ${i === page ? 'is-active' : ''}`}
                />
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
