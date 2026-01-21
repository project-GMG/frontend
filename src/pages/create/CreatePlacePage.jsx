// gmg-front/src/pages/create/CreatePlacePage.jsx

import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CreatePlacePage.css';
import BackButton from '../components/common/BackButton';
import TopBar from '../components/common/TopBar';
import NextButton from '../components/common/NextButton';
import riceIcon from '../../assets/icons/rice.png';
import coffeeIcon from '../../assets/icons/coffee.png';
import beerIcon from '../../assets/icons/beer.png';
import bookIcon from '../../assets/icons/book.png';

const CATEGORIES = [
  {
    id: 'restaurant',
    label: '식당',
    description: '맛있는 밥 먹어야지!',
    image: riceIcon,
  },
  {
    id: 'cafe',
    label: '카페',
    description: '커피 한잔 해야지!',
    image: coffeeIcon,
  },
  {
    id: 'pub',
    label: '술집',
    description: '술 한잔 해야지!',
    image: beerIcon,
  },
  {
    id: 'library',
    label: '도서관 스터디카페',
    description: '공부 하러 가야지!',
    image: bookIcon,
  },
];

const PLACE_TYPE_CODE_MAP = {
  restaurant: 'RESTAURANT',
  cafe: 'CAFE',
  pub: 'BAR',
  library: 'STUDY',
};

const CODE_TO_ID_MAP = {
  RESTAURANT: 'restaurant',
  CAFE: 'cafe',
  BAR: 'bar',
  STUDY: 'study',
};

export default function CreatePlacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prev = location.state || {};

  // 뒤로 왔다가 다시 진입 시 복원 (placeTypeCodes -> selectedIds)
  const initialSelectedIds = useMemo(() => {
    const codes = Array.isArray(prev.placeTypeCodes) ? prev.placeTypeCodes : [];
    return codes.map((c) => CODE_TO_ID_MAP[c]).filter(Boolean);
  }, [prev.placeTypeCodes]);

  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);

  const toggleCategory = (id) => {
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  };

  const handleBack = () => window.history.back();

  const placeTypeCodes = useMemo(() => {
    return selectedIds.map((id) => PLACE_TYPE_CODE_MAP[id]).filter(Boolean);
  }, [selectedIds]);

  const hasSelection = placeTypeCodes.length > 0;

  const handleNext = () => {
    if (!placeTypeCodes.length) return;

    navigate('/create/date', {
      state: {
        ...prev, 
        placeTypeCodes,
      },
    });
  };

  return (
    <div className="create-place-page">
      <div className="create-place-container">
        <header className="create-place-nav">
          <div className="create-place-topbar">
            <TopBar currentStep={1} totalSteps={4} />
          </div>

          <div className="create-place-back">
            <BackButton onClick={handleBack} />
          </div>
        </header>

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
                    (isSelected ? ' create-place-category-card--selected' : '')
                  }
                  onClick={() => toggleCategory(category.id)}
                >
                  <img
                    src={category.image}
                    alt={category.label}
                    className="create-place-category-thumbnail"
                  />
                  <div className="create-place-category-texts">
                    <span className="create-place-category-label">{category.label}</span>
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
