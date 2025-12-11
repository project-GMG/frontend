import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import './CreatePlacePage.css';
import BackButton from '../components/common/BackButton';
import TopBar from '../components/common/TopBar';
import NextButton from '../components/common/NextButton';

const CATEGORIES = [
  { id: 'restaurant', label: '식당', description: '맛있는 밥 먹어야지!' },
  { id: 'cafe', label: '카페', description: '커피 한잔 해야지!' },
  { id: 'pub', label: '술집', description: '술 한잔 해야지!' },
  {
    id: 'library',
    label: '도서관 스터디카페',
    description: '공부 하러 가야지!',
  },
];

export default function CreatePlacePage() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleCategory = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id],
    );
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleNext = () => {
    if (!selectedIds.length) return;
    navigate('/create/date');
    console.log('선택된 카테고리:', selectedIds);
  };

  const hasSelection = selectedIds.length > 0;

  return (
    <div className="create-place-page">
      <div className="create-place-container">
        {/* 상단 프로그래스 바 */}
        <div className="create-place-topbar">
          <TopBar currentStep={1} totalSteps={4} />
        </div>

        {/* 백버튼 */}
        <div className="create-place-back">
          <BackButton onClick={handleBack} />
        </div>

        <main className="create-place-content">
          <h1 className="create-place-title">어디를 갈까요?</h1>
          <p className="create-place-subtitle">
            방문할 장소들을 <span className="create-place-subtitle-em">모두</span> 선택해 주세요
          </p>

          <div className="create-place-category-list">
            {CATEGORIES.map((category) => {
              const isSelected = selectedIds.includes(category.id);

              return (
                <button
                  key={category.id}
                  type="button"
                  className={
                    'create-place-category-card' +
                    (isSelected
                      ? ' create-place-category-card--selected'
                      : '')
                  }
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="create-place-category-thumbnail" />
                  <div className="create-place-category-texts">
                    <span className="create-place-category-label">
                      {category.label}
                    </span>
                    <span className="create-place-category-description">
                      {category.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </main>

        <footer className="create-place-footer">
          <NextButton disabled={!hasSelection} onClick={handleNext}>
            다음
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
