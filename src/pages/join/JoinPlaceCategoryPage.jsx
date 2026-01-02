import React from 'react';
import { useNavigate } from 'react-router-dom';
import './JoinPlaceCategoryPage.css';
import NextButton from '../components/common/NextButton';

const GROUPS = [
  {
    id: 'restaurant',
    titleParts: [
      { text: '이 ', highlight: false },
      { text: '음식점', highlight: true },
      { text: '은 애매해요', highlight: false },
    ],
    items: [
      { id: 'korean', label: '한식' },
      { id: 'chinese', label: '중식' },
      { id: 'japanese', label: '일식' },
      { id: 'western', label: '양식' },
      { id: 'late-night', label: '분식·야식' },
    ],
  },
  {
    id: 'pub',
    titleParts: [
      { text: '이 ', highlight: false },
      { text: '술집', highlight: true },
      { text: '은 취향이 아니에요', highlight: false },
    ],
    items: [
      { id: 'beer', label: '소주·맥주' },
      { id: 'izakaya', label: '이자카야' },
      { id: 'makgeolli', label: '막걸리' },
      { id: 'cocktail', label: '펍·칵테일' },
      { id: 'wine', label: '와인' },
    ],
  },
  {
    id: 'study',
    titleParts: [
      { text: '여기선 ', highlight: false },
      { text: '스터디', highlight: true },
      { text: '가 잘 안될 것 같아요', highlight: false },
    ],
    items: [
      { id: 'library', label: '도서관' },
      { id: 'study-cafe', label: '스터디카페' },
      { id: 'study-room', label: '스터디룸' },
      { id: 'reading-room', label: '독서실' },
      { id: 'etc', label: '기타' },
    ],
  },
];

export default function JoinPlaceCategoryPage() {
  const navigate = useNavigate();

  const handleBack = () => navigate(-1);

  const goSub = (groupId, item) => {
    navigate('/join/Category/sub', {
      state: {
        groupId,
        itemId: item.id,
        title: item.label,
      },
    });
  };

  return (
    <div className="jpc-page">
      <div className="jpc-container">
        <header className="jpc-header">
          <button type="button" className="jpc-back" onClick={handleBack} aria-label="뒤로가기">
            ‹
          </button>

          <div className="jpc-step-pill">2 / 2</div>

          <div className="jpc-header-spacer" />
        </header>

        <main className="jpc-content">
          <h1 className="jpc-title">여긴 피했으면 좋겠어요</h1>

          <div className="jpc-groups">
            {GROUPS.map((group) => (
              <section key={group.id} className="jpc-group-card">
                <h2 className="jpc-group-title">
                  {group.titleParts.map((p, idx) => (
                    <span
                      key={`${group.id}-t-${idx}`}
                      className={p.highlight ? 'jpc-highlight' : undefined}
                    >
                      {p.text}
                    </span>
                  ))}
                </h2>

                <div className="jpc-items">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="jpc-item"
                      onClick={() => goSub(group.id, item)}
                      aria-label={`${item.label} 선택`}
                    >
                      <div className="jpc-item-icon" />
                      <div className="jpc-item-label">{item.label}</div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>

        <footer className="jpc-footer">
          <NextButton
            disabled={false}
            onClick={() => {
              console.log('완료 클릭');
            }}
          >
            완료
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
