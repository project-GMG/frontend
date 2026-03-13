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
import logoIcon from '../../assets/icons/logo.png';

const CATEGORIES = [
  {
    id: 'restaurant',
    label: '식당',
    description: '맛있게 밥 먹으러 가요!',
    image: riceIcon,
  },
  {
    id: 'cafe',
    label: '카페',
    description: '커피 한잔 하러 가요!',
    image: coffeeIcon,
  },
  {
    id: 'pub',
    label: '술집',
    description: '가볍게 한잔 하러 가요!',
    image: beerIcon,
  },
  {
    id: 'library',
    label: '도서관',
    description: '공부하러 가요!',
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
  BAR: 'pub',
  STUDY: 'library',
};

export default function CreatePlacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prev = location.state || {};

  const initialSelectedIds = useMemo(() => {
    const codes = Array.isArray(prev.placeTypeCodes) ? prev.placeTypeCodes : [];
    return codes.map((code) => CODE_TO_ID_MAP[code]).filter(Boolean);
  }, [prev.placeTypeCodes]);

  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);

  const toggleCategory = (id) => {
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  };

  const handleBack = () => window.history.back();

  const placeTypeCodes = useMemo(
    () => selectedIds.map((id) => PLACE_TYPE_CODE_MAP[id]).filter(Boolean),
    [selectedIds],
  );

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
      <div className="create-place-desktop-shell">
        <aside className="create-place-brand-panel" aria-hidden="true">
          <img src={logoIcon} alt="" className="create-place-brand-logo" />
          <div className="create-place-brand-copy">
            <p className="create-place-brand-text">
              싫어하는 것을
              <br />
              존중해주니까
            </p>
            <div className="create-place-brand-divider" />
            <p className="create-place-brand-text">
              이제는 <span className="create-place-brand-text-strong">가면가</span>
            </p>
          </div>
        </aside>

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
            <h1 className="create-place-title">어디로 갈까요?</h1>
            <p className="create-place-subtitle">
              방문할 장소를 <span className="create-place-subtitle-em">모두</span> 선택해 주세요
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
                    onClick={(event) => {
                      toggleCategory(category.id);
                      event.currentTarget.blur();
                    }}
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
    </div>
  );
}
