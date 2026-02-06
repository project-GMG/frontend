// src/pages/join/JoinPlaceCategoryPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './JoinPlaceCategoryPage.css';
import NextButton from '../components/common/NextButton';
import BackButton from '../components/common/BackButton';
import { buildApiUrl } from '../../lib/api';

import AsianFoodIcon from '../../assets/icons/category_icon/asian food ico.png';
import BoardGameCafeIcon from '../../assets/icons/category_icon/board gamecafe ico.png';
import ChickenIcon from '../../assets/icons/category_icon/chicken ico.png';
import ChineseFoodIcon from '../../assets/icons/category_icon/chinese food ico.png';
import CocktailIcon from '../../assets/icons/category_icon/cocktail ico.png';
import DessertCafeIcon from '../../assets/icons/category_icon/dessert cafe ico.png';
import FastfoodIcon from '../../assets/icons/category_icon/fastfood ico.png';
import FoodAlcholIcon from '../../assets/icons/category_icon/food alchol ico.png';
import FranchiseCafeIcon from '../../assets/icons/category_icon/Franchise cafe ico.png';
import JapaneseAlcholIcon from '../../assets/icons/category_icon/japanes alchol ico.png';
import JapaneseFoodIcon from '../../assets/icons/category_icon/japanese food ico.png';
import KoreaFoodIcon from '../../assets/icons/category_icon/korea food ico.png';
import LibraryIcon from '../../assets/icons/category_icon/library ico.png';
import MeatIcon from '../../assets/icons/category_icon/meat ico 1.png';
import PochaIcon from '../../assets/icons/category_icon/pocha ico.png';
import SnackIcon from '../../assets/icons/category_icon/snack ico.png';
import SoloCafeIcon from '../../assets/icons/category_icon/solo cafe ico.png';
import StudyCafeIcon from '../../assets/icons/category_icon/study cafe ico.png';
import WestonFoodIcon from '../../assets/icons/category_icon/weston food ico.png';

const CATEGORY_ICON_BY_CODE = {
  LOCAL_CAFE: SoloCafeIcon,
  DESSERT_CAFE: DessertCafeIcon,
  FRANCHISE_CAFE: FranchiseCafeIcon,
  BOARDGAME_CAFE: BoardGameCafeIcon,

  COCKTAIL_BAR: CocktailIcon,
  IZAKAYA: JapaneseAlcholIcon,
  INDOOR_POCHA: PochaIcon,
  FOOD_BAR: FoodAlcholIcon,

  KOREAN_FOOD: KoreaFoodIcon,
  CHINESE_FOOD: ChineseFoodIcon,
  JAPANESE_FOOD: JapaneseFoodIcon,
  WESTERN_FOOD: WestonFoodIcon,
  ASIAN_FOOD: AsianFoodIcon,

  SNACK_BAR: SnackIcon,
  FAST_FOOD: FastfoodIcon,

  CHICKEN: ChickenIcon,
  MEAT: MeatIcon,

  LIBRARY: LibraryIcon,
  STUDY_CAFE: StudyCafeIcon,
};

function buildTitleParts(placeTypeCode, placeTypeLabel) {
  const label = placeTypeLabel || '장소';

  switch (placeTypeCode) {
    case 'RESTAURANT':
      return [
        { text: '이 ', highlight: false },
        { text: '음식점', highlight: true },
        { text: '은 애매해요', highlight: false },
      ];
    case 'CAFE':
      return [
        { text: '이 ', highlight: false },
        { text: label, highlight: true },
        { text: '는 별로예요', highlight: false },
      ];
    case 'BAR':
      return [
        { text: '이 ', highlight: false },
        { text: label, highlight: true },
        { text: '은 취향이 아니에요', highlight: false },
      ];
    case 'STUDY':
      return [
        { text: '여기선 ', highlight: false },
        { text: label, highlight: true },
        { text: '가 잘 안될 것 같아요', highlight: false },
      ];
    default:
      return [
        { text: '이 ', highlight: false },
        { text: label, highlight: true },
        { text: '는 피하고 싶어요', highlight: false },
      ];
  }
}

export default function JoinPlaceCategoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hashUrl = (searchParams.get('code') || '').trim();

  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [placeTypes, setPlaceTypes] = useState([]);

  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);
  const [completeError, setCompleteError] = useState('');

  const handleBack = () => navigate(-1);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!hashUrl) {
        if (!alive) return;
        setIsLoading(false);
        setErrorText('링크가 올바르지 않습니다.');
        setPlaceTypes([]);
        return;
      }

      setIsLoading(true);
      setErrorText('');

      try {
        const res = await fetch(
          buildApiUrl(`/api/events/${encodeURIComponent(hashUrl)}/categories`),
          {
            headers: { accept: 'application/json' },
          },
        );
        const json = await res.json().catch(() => null);

        if (!alive) return;

        if (!res.ok) {
          setErrorText(json?.message || '카테고리 정보를 불러오지 못했습니다.');
          setPlaceTypes([]);
          setIsLoading(false);
          return;
        }

        const pts = json?.data?.placeTypes || [];
        setPlaceTypes(Array.isArray(pts) ? pts : []);
        setIsLoading(false);
      } catch {
        if (!alive) return;
        setErrorText('네트워크 오류로 카테고리 정보를 불러오지 못했습니다.');
        setPlaceTypes([]);
        setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [hashUrl]);

  const GROUPS = useMemo(() => {
    return (placeTypes || []).map((pt) => ({
      id: String(pt.code || pt.id || ''),
      titleParts: buildTitleParts(pt.code, pt.label),
      items: (pt.categories || []).map((c) => ({
        id: c.id,
        label: c.name,
        code: c.code,
        placeTypeCode: pt.code,
        placeTypeLabel: pt.label,
      })),
    }));
  }, [placeTypes]);

  const goSub = (group, item) => {
    navigate(
      `/join/category/sub?code=${encodeURIComponent(hashUrl)}&categoryId=${encodeURIComponent(item.id)}`,
      {
        state: {
          groupId: group.id,
          title: item.label,
          categoryId: item.id,
          categoryCode: item.code,
          placeTypeCode: item.placeTypeCode,
          placeTypeLabel: item.placeTypeLabel,
        },
      },
    );
  };

  const handleDone = async () => {
    if (!hashUrl) return;

    setCompleteError('');
    setIsSubmittingComplete(true);

    try {
      const participantId = sessionStorage.getItem(`gmg_participant_${hashUrl}`);

      if (!participantId) {
        setCompleteError('참여자 정보가 없습니다. 먼저 이름 등록을 진행해주세요.');
        setIsSubmittingComplete(false);
        return;
      }

      const res = await fetch(
        buildApiUrl(
          `/api/event/${encodeURIComponent(hashUrl)}/participants/${encodeURIComponent(participantId)}/complete`,
        ),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        },
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setCompleteError(json?.message || `등록 완료에 실패했습니다. (${res.status})`);
        setIsSubmittingComplete(false);
        return;
      }

      navigate(`/join/final?code=${encodeURIComponent(hashUrl)}`);
    } catch {
      setCompleteError('네트워크 오류로 등록 완료에 실패했습니다.');
      setIsSubmittingComplete(false);
    }
  };

  return (
    <div className="jpc-page">
      <div className="jpc-container">
        {/* ✅ JoinTimePage와 동일한 위치 체계(absolute) */}
        <header className="jpc-nav">
          <div className="jpc-step-pill">2 / 2</div>
          <div className="jpc-back">
            <BackButton onClick={handleBack} />
          </div>
        </header>

        <main className="jpc-content">
          <h1 className="jpc-title">여긴 피했으면 좋겠어요</h1>

          {/* ✅ 로딩 문구 화면 중앙 */}
          {isLoading && (
            <div className="jpc-loading">
              <p className="jpc-loading-text">불러오는 중...</p>
            </div>
          )}

          {!!errorText && (
            <p style={{ margin: '8px 0', color: '#d00', fontSize: 14 }}>{errorText}</p>
          )}

          {!!completeError && (
            <p style={{ margin: '8px 0', color: '#d00', fontSize: 14 }}>{completeError}</p>
          )}

          {!isLoading && (
            <div className="jpc-groups">
              {GROUPS.map((group) => (
                <section
                  key={group.id}
                  className={
                    'jpc-group-card' +
                    (group.id === 'RESTAURANT' ? ' jpc-group-card--restaurant' : '')
                  }
                >
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
                    {group.items.map((item) => {
                      const iconSrc = CATEGORY_ICON_BY_CODE[item.code];

                      return (
                        <button
                          key={`${group.id}-${item.id}`}
                          type="button"
                          className="jpc-item"
                          onClick={() => goSub(group, item)}
                          aria-label={`${item.label} 선택`}
                          disabled={!hashUrl || !!errorText}
                        >
                          <div className="jpc-item-icon">
                            {iconSrc ? (
                              <img
                                src={iconSrc}
                                alt=""
                                style={{
                                  width: '47px',
                                  height: '47px',
                                  objectFit: 'contain',
                                }}
                                draggable={false}
                              />
                            ) : null}
                          </div>

                          <div className="jpc-item-label">{item.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}

              {!errorText && GROUPS.length === 0 && (
                <p style={{ margin: '8px 0', color: '#666', fontSize: 14 }}>
                  선택 가능한 카테고리가 없습니다.
                </p>
              )}
            </div>
          )}
        </main>

        <footer className="jpc-footer">
          <NextButton
            disabled={!!errorText || isLoading || isSubmittingComplete}
            onClick={handleDone}
          >
            {isSubmittingComplete ? '처리 중...' : '완료'}
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
