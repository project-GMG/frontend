import React from 'react';
import './MainPage.css';
import NextButton from '../components/common/NextButton';

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

// 컨테이너(세트 박스) 4개, 각 컨테이너 안에 음식점 3개
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

export default function MainPage() {
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

  const handleParticipate = () => {
    console.log('참여 · 수정하기 버튼 클릭');
  };

  return (
    <div className="main-page">
      <div className="main-page-container">
        <header className="main-header">
          <div className="main-logo" aria-label="GMG 로고" />
            <button
            type="button"
            className="main-share-bubble"
            onClick={handleShare}
            >
            <span className="main-share-bubble-text">
                공유하고 모임을 잡아보세요!
            </span>
            <span className="main-share-bubble-icon" />
            </button>
        </header>

        <main className="main-content">
          <h1 className="main-title">전북대에서 밥먹자</h1>

          {/* 일정 컨테이너 */}
          <section className="main-section">
            <div className="schedule-container">
              <h2 className="schedule-title">이때 만날까요?</h2>

              <div className="schedule-scroll">
                <div
                  className="schedule-grid"
                  style={{
                    gridTemplateColumns: `60px repeat(${DATES.length}, 87.666664px)`,
                    gridTemplateRows: `20px repeat(${TIME_SLOTS.length}, 20px)`,
                  }}
                >
                  <div className="schedule-empty-cell" />

                  {DATES.map((date) => (
                    <div key={date} className="schedule-date-header">
                      {date}
                    </div>
                  ))}

                  {TIME_SLOTS.map((slot, rowIndex) => (
                    <React.Fragment key={slot}>
                      <div className="schedule-time-label">
                        {TIME_LABELS[rowIndex] ?? ''}
                      </div>

                      {DATES.map((date) => (
                        <button
                          type="button"
                          key={`${date}-${slot}`}
                          className="schedule-slot"
                          onClick={() => console.log('slot click:', date, slot)}
                        />
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 음식점 추천: "컨테이너(세트 박스)" 자체가 좌우로 여러 개 */}
          <section className="main-section">
            <h2 className="main-section-title">이 음식점 어때요?</h2>

            <div className="restaurant-rail">
              {RESTAURANT_SETS.map((set, idx) => (
                <div key={`box-${idx}`} className="restaurant-container">
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

        <footer className="main-footer">
          <NextButton disabled={false} onClick={handleParticipate}>
            참여 · 수정하기
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
