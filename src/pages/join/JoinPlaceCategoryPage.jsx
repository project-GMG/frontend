// src/pages/join/JoinPlaceCategoryPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './JoinPlaceCategoryPage.css';
import NextButton from '../components/common/NextButton';
import BackButton from '../components/common/BackButton';
import logoIcon from '../../assets/icons/logo.png';
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

async function apiFetch(path, options = {}) {
  const res = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text().catch(() => '');
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg =
      json?.message ||
      json?.error ||
      (typeof json === 'string' ? json : null) ||
      `요청 실패 (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = json;
    throw err;
  }

  return json;
}

function getParticipantId(hashUrl) {
  const raw = sessionStorage.getItem(`gmg_participant_${hashUrl}`);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

async function postComplete(hashUrl, participantId) {
  return apiFetch(
    `/api/event/${encodeURIComponent(hashUrl)}/participants/${encodeURIComponent(participantId)}/complete`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

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

/* =========================
   ✅ 개발환경 디자인 확인용 더미 데이터 (모든 카드 노출)
   - 실제 API 응답 형태: data.placeTypes[] 유사하게 구성
   ========================= */
function buildDummyPlaceTypesAll() {
  return [
    {
      code: 'RESTAURANT',
      label: '음식점',
      categories: [
        { id: 101, name: '한식', code: 'KOREAN_FOOD' },
        { id: 102, name: '중식', code: 'CHINESE_FOOD' },
        { id: 103, name: '일식', code: 'JAPANESE_FOOD' },
        { id: 104, name: '양식', code: 'WESTERN_FOOD' },
        { id: 105, name: '아시안', code: 'ASIAN_FOOD' },
        { id: 106, name: '분식', code: 'SNACK_BAR' },
        { id: 107, name: '패스트푸드', code: 'FAST_FOOD' },
        { id: 108, name: '치킨', code: 'CHICKEN' },
        { id: 109, name: '고기', code: 'MEAT' },
      ],
    },
    {
      code: 'CAFE',
      label: '카페',
      categories: [
        { id: 201, name: '개인카페', code: 'LOCAL_CAFE' },
        { id: 202, name: '디저트카페', code: 'DESSERT_CAFE' },
        { id: 203, name: '프랜차이즈', code: 'FRANCHISE_CAFE' },
        { id: 204, name: '보드게임카페', code: 'BOARDGAME_CAFE' },
      ],
    },
    {
      code: 'BAR',
      label: '술집',
      categories: [
        { id: 301, name: '칵테일바', code: 'COCKTAIL_BAR' },
        { id: 302, name: '이자카야', code: 'IZAKAYA' },
        { id: 303, name: '실내포차', code: 'INDOOR_POCHA' },
        { id: 304, name: '푸드바', code: 'FOOD_BAR' },
      ],
    },
    {
      code: 'STUDY',
      label: '공부',
      categories: [
        { id: 401, name: '도서관', code: 'LIBRARY' },
        { id: 402, name: '스터디카페', code: 'STUDY_CAFE' },
      ],
    },
  ];
}

export default function JoinPlaceCategoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hashUrl = (searchParams.get('code') || '').trim();

  // ✅ code 없어도 디자인 확인 가능하도록 더미 code 부여
  const isDummyMode = !hashUrl;
  const effectiveCode = hashUrl || 'dev-dummy';

  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [placeTypes, setPlaceTypes] = useState([]);

  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);
  const [completeError, setCompleteError] = useState('');

  const handleBack = () => navigate(-1);

  useEffect(() => {
    let alive = true;

    (async () => {
      // ✅ code 없으면 더미로 바로 노출 (에러 문구도 표시하지 않음)
      if (!hashUrl) {
        if (!alive) return;
        setIsLoading(false);
        setErrorText('');
        setPlaceTypes(buildDummyPlaceTypesAll());
        return;
      }

      setIsLoading(true);
      setErrorText('');

      try {
        const res = await fetch(
          buildApiUrl(`/api/events/${encodeURIComponent(hashUrl)}/categories`),
          { headers: { accept: 'application/json' } },
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

        // ✅ 개발 편의: API 실패해도 더미로 전환
        setErrorText('');
        setPlaceTypes(buildDummyPlaceTypesAll());
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
      `/join/category/sub?code=${encodeURIComponent(effectiveCode)}&categoryId=${encodeURIComponent(
        item.id,
      )}`,
      {
        state: {
          groupId: group.id,
          title: item.label,
          categoryId: item.id,
          categoryCode: item.code,
          placeTypeCode: item.placeTypeCode,
          placeTypeLabel: item.placeTypeLabel,
          // ✅ 더미 모드에서도 다음 화면이 렌더링 가능하도록 힌트
          __dummy: isDummyMode,
        },
      },
    );
  };

  const handleDone = async () => {
    if (isDummyMode) {
      navigate(`/join/final?code=${encodeURIComponent(effectiveCode)}`, {
        state: { __dummy: true },
      });
      return;
    }

    if (!hashUrl) return;

    setCompleteError('');
    setIsSubmittingComplete(true);

    const participantId = getParticipantId(hashUrl);
    if (!participantId) {
      setCompleteError('참여자 정보가 없습니다. 이름 등록부터 다시 진행해 주세요.');
      setIsSubmittingComplete(false);
      return;
    }

    try {
      await postComplete(hashUrl, participantId);
      navigate(`/join/final?code=${encodeURIComponent(hashUrl)}`);
    } catch (e) {
      setCompleteError(e?.message || '완료 처리에 실패했습니다.');
    } finally {
      setIsSubmittingComplete(false);
    }
  };

  return (
    <div className="jpc-page">
      <div className="jpc-desktop-shell">
        <aside className="jpc-brand-panel" aria-hidden="true">
          <img src={logoIcon} alt="" className="jpc-brand-logo" />
          <div className="jpc-brand-copy">
            <p className="jpc-brand-text">
              싫어하는 것을
              <br />
              존중해주니까
            </p>
            <div className="jpc-brand-divider" />
            <p className="jpc-brand-text">
              이제는 <span className="jpc-brand-text-strong">가면가</span>
            </p>
          </div>
        </aside>
        <div className="jpc-container">
          <header className="jpc-nav">
            <div className="jpc-step-pill">2 / 2</div>
            <div className="jpc-back">
              <BackButton onClick={handleBack} />
            </div>
          </header>

          <main className="jpc-content">
            <h1 className="jpc-title">여긴 피했으면 좋겠어요</h1>

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
                            // ✅ 더미 모드에선 막지 않음
                            disabled={!isDummyMode && (!!errorText || !hashUrl)}
                          >
                            <div className="jpc-item-icon">
                              {iconSrc ? (
                                <img
                                  src={iconSrc}
                                  alt=""
                                  style={{ width: '47px', height: '47px', objectFit: 'contain' }}
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
    </div>
  );
}
