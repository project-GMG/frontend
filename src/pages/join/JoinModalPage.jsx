import React, { useEffect, useMemo, useRef, useState } from 'react';
import './JoinModalPage.css';
import NextButton from '../components/common/NextButton';
import Logo from '../../assets/icons/logo.png';
import ShareIcon from '../../assets/icons/share.png';

const DUMMY_LINK = 'https://meet.jbnu.ac.kr/fhcfspup';

const DATES = ['11/23 일', '11/24 월', '11/25 화', '11/26 수', '11/27 목'];
const TIME_SLOTS = [
  '1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM',
  '6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM','10:00 PM','10:30 PM',
];
const TIME_LABELS = [
  '1 PM','',
  '2 PM','',
  '3 PM','',
  '4 PM','',
  '5 PM','',
  '6 PM','',
  '7 PM','',
  '8 PM','',
  '9 PM','',
  '10 PM','',
];

const RESTAURANT_SETS = [
  [
    { id: '1-1', name: '좋은치킨', imageAlt: '추천 음식 1' },
    { id: '1-2', name: '맛있는파스타', imageAlt: '추천 음식 2' },
    { id: '1-3', name: '전북대밥집', imageAlt: '추천 음식 3' },
  ],
  [
    { id: '2-1', name: '송천동맛집', imageAlt: '추천 음식 4' },
    { id: '2-2', name: '호성동맛집', imageAlt: '추천 음식 5' },
    { id: '2-3', name: '분식천국', imageAlt: '추천 음식 6' },
  ],
  [
    { id: '3-1', name: '일식가게', imageAlt: '추천 음식 7' },
    { id: '3-2', name: '피자맛집', imageAlt: '추천 음식 8' },
    { id: '3-3', name: '고기집', imageAlt: '추천 음식 9' },
  ],
  [
    { id: '4-1', name: '카페라떼', imageAlt: '추천 음식 10' },
    { id: '4-2', name: '베이커리', imageAlt: '추천 음식 11' },
    { id: '4-3', name: '샐러드', imageAlt: '추천 음식 12' },
  ],
];

function loadMembers() {
  try {
    const raw = localStorage.getItem('gmg_members');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveMembers(next) {
  localStorage.setItem('gmg_members', JSON.stringify(next));
}

export default function JoinModalPage() {
  // 스케줄 선택(멀티)
  const [selectedSlots, setSelectedSlots] = useState(() => new Set());

  // 하단 모달
  const [isJoinOpen, setIsJoinOpen] = useState(true);
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  const gridScrollRef = useRef(null);
  const dateScrollRef = useRef(null);
  const timeScrollRef = useRef(null);

  useEffect(() => {
    // 첫 진입 시 자동 오픈 + 포커스
    setIsJoinOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const trimmedName = name.trim();

  const isExistingMember = useMemo(() => {
    if (!trimmedName) return false;
    const members = loadMembers();
    return members.includes(trimmedName);
  }, [trimmedName]);

  const helperText = useMemo(() => {
    if (!trimmedName) return '';
    return isExistingMember
      ? '등록된 이름이네요. 수정으로 진행해요.'
      : '새로운 모임원이네요.';
  }, [trimmedName, isExistingMember]);

  const buttonLabel = useMemo(() => {
    if (!trimmedName) return '참여 · 수정하기';
    return isExistingMember ? '수정하기' : '참여하기';
  }, [trimmedName, isExistingMember]);

  const buttonDisabled = !trimmedName;

  const toggleSlot = (key) => {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const syncFromGrid = () => {
    const grid = gridScrollRef.current;
    const date = dateScrollRef.current;
    const time = timeScrollRef.current;
    if (!grid || !date || !time) return;

    date.scrollLeft = grid.scrollLeft;
    time.scrollTop = grid.scrollTop;
  };

  const syncFromDate = () => {
    const grid = gridScrollRef.current;
    const date = dateScrollRef.current;
    if (!grid || !date) return;
    grid.scrollLeft = date.scrollLeft;
  };

  const syncFromTime = () => {
    const grid = gridScrollRef.current;
    const time = timeScrollRef.current;
    if (!grid || !time) return;
    grid.scrollTop = time.scrollTop;
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'GMG 모임 링크',
          text: '모임 일정 페이지를 공유해 보세요.',
          url: DUMMY_LINK,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(DUMMY_LINK);
        alert('공유 기능을 지원하지 않는 환경입니다. 링크를 클립보드에 복사했습니다.');
      }
    } catch (e) {
      console.error('공유 실패 또는 취소:', e);
    }
  };

  const handleJoinSubmit = () => {
    if (!trimmedName) return;

    if (!isExistingMember) {
      const members = loadMembers();
      const next = [...members, trimmedName];
      saveMembers(next);
      console.log('새 멤버 참여:', trimmedName);
    } else {
      console.log('기존 멤버 수정:', trimmedName);
    }

    // 여기서 다음 단계(참여/수정 플로우)로 이동 처리하면 됨
    // 예: navigate('/edit') 또는 모달 닫기
    setIsJoinOpen(false);
  };

  return (
    <div className="main-page">
      <div className="main-page-container">
        <header className="main-header">
          <img src={Logo} alt="GMG 로고" className="main-logo" />
          <div className="main-share-area">
            <button type="button" className="main-share-bubble" onClick={handleShare}>
              <span className="main-share-bubble-text">공유하고 모임을 잡아보세요!</span>
            </button>

            <button type="button" className="main-share-icon-button" onClick={handleShare}>
              <img src={ShareIcon} alt="공유" className="main-share-icon-image" />
            </button>
          </div>
        </header>

        <main className="main-content">
          <h1 className="main-title">전북대에서 밥먹자</h1>

          {/* 일정 컨테이너 */}
          <section className="main-section">
            <div className="schedule-container schedule-container--new">
              <h2 className="schedule-title">이때 만날까요?</h2>

              <div className="schedule-frame">
                {/* 날짜(상단) */}
                <div ref={dateScrollRef} className="schedule-date-rail" onScroll={syncFromDate}>
                  <div className="schedule-date-row">
                    {DATES.map((date) => (
                      <div key={date} className="schedule-date-header">
                        {date}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 시간(좌측) */}
                <div ref={timeScrollRef} className="schedule-time-rail" onScroll={syncFromTime}>
                  <div className="schedule-time-col">
                    {TIME_SLOTS.map((slot, rowIndex) => (
                      <div key={slot} className="schedule-time-label">
                        {TIME_LABELS[rowIndex] ?? ''}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 슬롯 그리드 */}
                <div
                  ref={gridScrollRef}
                  className="schedule-grid-scroll gmg-scrollbar-both"
                  onScroll={syncFromGrid}
                >
                  <div
                    className="schedule-grid-slots"
                    style={{
                      gridTemplateColumns: `repeat(${DATES.length}, 87.666664px)`,
                      gridTemplateRows: `repeat(${TIME_SLOTS.length}, 20px)`,
                    }}
                  >
                    {TIME_SLOTS.map((slot) =>
                      DATES.map((date) => {
                        const key = `${date}-${slot}`;
                        const isActive = selectedSlots.has(key);
                        return (
                          <button
                            type="button"
                            key={key}
                            className={`schedule-slot ${isActive ? 'schedule-slot--active' : ''}`}
                            onClick={() => toggleSlot(key)}
                          />
                        );
                      }),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 음식점 추천 */}
          <section className="main-section">
            <div className="restaurant-rail restaurant-rail--hidden-scrollbar">
              {RESTAURANT_SETS.map((set, idx) => (
                <div key={`box-${idx}`} className="restaurant-container">
                  <h2 className="restaurant-container-title">이 음식점 어때요?</h2>

                  <div className="restaurant-set">
                    {set.map((item) => (
                      <article key={item.id} className="restaurant-card">
                        <div className="restaurant-image" aria-label={item.imageAlt} />
                        <p className="restaurant-name">{item.name}</p>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* 하단 입력 모달 */}
        {isJoinOpen && (
          <div className="join-sheet-overlay">
            <div className="join-sheet">
              <div className="join-sheet-grabber" />

              <label className="join-sheet-label" htmlFor="join-name">
                이름을 입력해 주세요
              </label>

              <input
                id="join-name"
                ref={inputRef}
                className="join-sheet-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                autoComplete="off"
              />

              <p className={`join-sheet-helper ${trimmedName ? 'is-visible' : ''}`}>{helperText}</p>

              <div className="join-sheet-button">
                <NextButton disabled={buttonDisabled} onClick={handleJoinSubmit}>
                  {buttonLabel}
                </NextButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
