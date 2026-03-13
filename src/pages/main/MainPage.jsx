// src/pages/main/MainPage.jsx
import './MainPage.css';
import NextButton from '../components/common/NextButton';
import Logo from '../../assets/icons/logo.png';
import ShareIcon from '../../assets/icons/share.png';
import NoImage from '../../assets/icons/no-image.png';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import JoinModalPage from '../join/JoinModalPage';
import { buildApiUrl } from '../../lib/api';
import { buildConsecutiveSelectedDates, buildDateColumns } from '../../lib/eventDateSelection';

const USE_DUMMY_WHEN_NO_CODE = true;

function getBaseUrl() {
  const envBase = (import.meta.env.VITE_SHARE_BASE_URL || '').trim();
  return envBase ? envBase.replace(/\/+$/, '') : window.location.origin;
}

function buildMainLink(hashUrl) {
  const base = getBaseUrl();
  return `${base}/main?code=${encodeURIComponent(hashUrl)}`;
}

function parseYmd(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  dt.setHours(0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function truncateKorean(name, max = 7) {
  const s = String(name || '').trim();
  const chars = Array.from(s);
  if (chars.length <= max) return s;
  return `${chars.slice(0, max).join('')}...`;
}

function buildTimeSlotsFromRange(startHm, endHm) {
  const start = String(startHm || '').slice(0, 5);
  const end = String(endHm || '').slice(0, 5);

  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    return { slots: [], labels: [] };
  }

  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  let startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  if (!(startMin < endMin)) return { slots: [], labels: [] };

  const slots = [];
  const labels = [];

  while (startMin < endMin) {
    const h = Math.floor(startMin / 60);
    const m = startMin % 60;

    const isPm = h >= 12;
    const hour12 = ((h + 11) % 12) + 1;
    const minuteStr = String(m).padStart(2, '0');
    const ampm = isPm ? 'PM' : 'AM';

    slots.push(`${hour12}:${minuteStr} ${ampm}`);
    labels.push(m === 0 ? `${hour12} ${ampm}` : '');

    startMin += 30;
  }

  // 종료 시각 레이블 추가 (슬롯은 추가하지 않음)
  const eh2 = Math.floor(endMin / 60);
  const em2 = endMin % 60;
  const isPmEnd = eh2 >= 12;
  const hour12End = ((eh2 + 11) % 12) + 1;
  const ampmEnd = isPmEnd ? 'PM' : 'AM';
  labels.push(em2 === 0 ? `${hour12End} ${ampmEnd}` : '');

  return { slots, labels };
}

function slotToHm(slot) {
  const m = String(slot).match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/);
  if (!m) return '';
  let h = Number(m[1]);
  const mm = m[2];
  const ap = m[3];
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${mm}`;
}

function normalizeRecommendations(data) {
  const recs = data?.recommendations;
  if (!Array.isArray(recs)) return [];

  const flat = recs
    .flatMap((r) => {
      const typeName = String(r?.placeTypeName || r?.placeTypeLabel || r?.label || '').trim();
      const places = Array.isArray(r?.places) ? r.places : [];
      return places.map((p) => ({
        id: p?.placeId ?? p?.id,
        name: String(p?.placeName ?? p?.name ?? '').trim(),
        imageUrl: String(p?.imageUrl || '').trim(),
        score: typeof p?.score === 'number' ? p.score : -Infinity,
        placeTypeName: typeName,
      }));
    })
    .filter((p) => p.id != null && p.name);

  const uniq = new Map();
  for (const p of flat) {
    const key = String(p.id);
    if (!uniq.has(key)) uniq.set(key, p);
    else {
      const prev = uniq.get(key);
      if ((p.score ?? -Infinity) > (prev.score ?? -Infinity)) uniq.set(key, p);
    }
  }

  return Array.from(uniq.values()).sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));
}

function getSlotBgByLevel(level) {
  // Level 0 (응답 없음/0명): 기본 배경색
  if (level === 0) return '#EDEEF1';
  // Level 1 (아주 낮음): 0% 초과 ~ 25% 이하
  if (level === 1) return '#FFEEE8';
  // Level 2 (낮음): 25% 초과 ~ 50% 이하
  if (level === 2) return '#FFD4C4';
  // Level 3 (보통): 50% 초과 ~ 75% 이하
  if (level === 3) return '#FFBAA1';
  // Level 4 (높음): 75% 초과 ~ 90% 이하
  if (level === 4) return '#FF9873';
  // Level 5 (매우 높음): 90% 초과 ~ 100%
  if (level === 5) return '#FF7544';
  return '#EDEEF1';
}

function calculateLevelFromIntensity(intensity) {
  // intensity는 백엔드에서 계산한 0.0 ~ 1.0 값
  if (intensity == null || intensity <= 0) return 0;

  // intensity를 비율로 변환하여 레벨 계산
  if (intensity > 0.9) return 5; // 90% 초과 ~ 100%
  if (intensity > 0.75) return 4; // 75% 초과 ~ 90% 이하
  if (intensity > 0.5) return 3; // 50% 초과 ~ 75% 이하
  if (intensity > 0.25) return 2; // 25% 초과 ~ 50% 이하
  if (intensity > 0) return 1; // 0% 초과 ~ 25% 이하
  return 0;
}

function buildRecoSections(recoPlaces) {
  const list = Array.isArray(recoPlaces) ? recoPlaces : [];
  const byType = new Map();

  for (const p of list) {
    const type = String(p?.placeTypeName || '').trim() || '음식점';
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type).push({
      id: p?.id,
      name: p?.name,
      imageUrl: String(p?.imageUrl || '').trim(),
    });
  }

  const sections = [];
  for (const [typeLabel, places] of byType.entries()) {
    for (let i = 0; i < places.length; i += 3) {
      sections.push({
        title: `이 ${typeLabel} 어때요?`,
        places: places.slice(i, i + 3),
        key: `${typeLabel}-${i}`,
      });
    }
  }

  return sections;
}

const DUMMY_EVENT = {
  title: '다같이 만나요',
  selectedDates: buildConsecutiveSelectedDates('2026-02-10', 6),
  timeRange: { startTime: '10:00', endTime: '20:00' },
  heatmapData: [
    { date: '2026-02-10', timeSlot: '10:00', availableCount: 2 },
    { date: '2026-02-10', timeSlot: '10:30', availableCount: 3 },
    { date: '2026-02-10', timeSlot: '11:00', availableCount: 5 },
    { date: '2026-02-11', timeSlot: '12:00', availableCount: 4 },
    { date: '2026-02-12', timeSlot: '18:00', availableCount: 6 },
    { date: '2026-02-13', timeSlot: '18:30', availableCount: 6 },
    { date: '2026-02-14', timeSlot: '19:00', availableCount: 7 },
    { date: '2026-02-15', timeSlot: '16:00', availableCount: 1 },
  ],
  placeTypes: [
    { id: 1, code: 'RESTAURANT', label: '식당' },
    { id: 2, code: 'CAFE', label: '카페' },
  ],
};

const DUMMY_RECO = [
  { id: 'd1', name: '을밀대 평양냉면', imageUrl: '', placeTypeName: '식당' },
  { id: 'd2', name: '성심당 본점', imageUrl: '', placeTypeName: '식당' },
  { id: 'd3', name: '스시 오마카세', imageUrl: '', placeTypeName: '식당' },
  { id: 'd4', name: '라떼 맛집', imageUrl: '', placeTypeName: '카페' },
  { id: 'd5', name: '핸드드립 카페', imageUrl: '', placeTypeName: '카페' },
  { id: 'd6', name: '디저트 카페', imageUrl: '', placeTypeName: '카페' },
];

export default function MainPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hashUrl = (searchParams.get('code') || '').trim();

  const gridScrollRef = useRef(null);
  const dateScrollRef = useRef(null);
  const timeScrollRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [eventData, setEventData] = useState(null);

  const [recoLoading, setRecoLoading] = useState(false);
  const [recoPlaces, setRecoPlaces] = useState([]);

  const [isJoinOpen, setIsJoinOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!hashUrl) {
        if (!alive) return;

        if (USE_DUMMY_WHEN_NO_CODE) {
          setErrorText('');
          setEventData(DUMMY_EVENT);
          setRecoPlaces(DUMMY_RECO);
          setIsLoading(false);
          return;
        }

        setIsLoading(false);
        setErrorText('링크가 올바르지 않습니다. (code 없음)');
        setEventData(null);
        return;
      }

      setIsLoading(true);
      setErrorText('');

      try {
        const res = await fetch(buildApiUrl(`/api/events/${encodeURIComponent(hashUrl)}`), {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        });

        const json = await res.json().catch(() => null);
        if (!alive) return;

        if (!res.ok) {
          setEventData(DUMMY_EVENT);
          setRecoPlaces(DUMMY_RECO);
          setErrorText('개발 모드: API 접근 실패로 더미 데이터를 표시합니다.');
          setIsLoading(false);
          return;
        }

        const data = json?.data || null;
        if (!data) {
          setEventData(DUMMY_EVENT);
          setRecoPlaces(DUMMY_RECO);
          setErrorText('개발 모드: 이벤트 데이터가 비어 있어 더미 데이터를 표시합니다.');
          setIsLoading(false);
          return;
        }

        setEventData(data);
        setIsLoading(false);
      } catch {
        if (!alive) return;
        setEventData(DUMMY_EVENT);
        setRecoPlaces(DUMMY_RECO);
        setErrorText('개발 모드: 네트워크 오류로 더미 데이터를 표시합니다.');
        setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [hashUrl]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!hashUrl) return;

      setRecoLoading(true);

      try {
        const res = await fetch(
          buildApiUrl(`/api/events/${encodeURIComponent(hashUrl)}/places/recommendations`),
          {
            headers: { accept: 'application/json' },
            cache: 'no-store',
          },
        );

        const json = await res.json().catch(() => null);
        if (!alive) return;

        if (!res.ok) {
          setRecoLoading(false);
          return;
        }

        const list = normalizeRecommendations(json?.data);
        setRecoPlaces(list);
        setRecoLoading(false);
      } catch {
        if (!alive) return;
        setRecoLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [hashUrl]);

  useEffect(() => {
    if (!hashUrl) return;

    const streamUrl = buildApiUrl(`/api/events/${encodeURIComponent(hashUrl)}/stream`);
    const es = new EventSource(streamUrl);

    const safeJsonParse = (s) => {
      try {
        return s ? JSON.parse(s) : null;
      } catch {
        return null;
      }
    };

    const applyHeatmapPatch = (payload) => {
      const data = payload?.data ?? payload ?? null;
      const nextHeatmap = data?.heatmapData ?? data?.heatmap ?? data?.items ?? data?.values ?? null;
      if (!Array.isArray(nextHeatmap)) return;

      setEventData((prev) => {
        if (!prev) return prev;
        return { ...prev, heatmapData: nextHeatmap };
      });
    };

    const applyRecommendationsPatch = (payload) => {
      // SSE 응답 구조: { eventId, recommendations: [...] }
      const data = payload?.data ?? payload ?? null;
      if (!data) return;

      // recommendations 배열이 있는지 확인
      const recommendations = data?.recommendations;
      if (!Array.isArray(recommendations)) return;

      // normalizeRecommendations에 전달
      const list = normalizeRecommendations({ recommendations });
      if (list.length > 0) {
        setRecoPlaces(list);
      }
    };

    // 이벤트 타입별 핸들러 등록
    es.addEventListener('heatmap-update', (e) => {
      const payload = safeJsonParse(e?.data);
      if (payload) applyHeatmapPatch(payload);
    });

    es.addEventListener('place-recommendations', (e) => {
      const payload = safeJsonParse(e?.data);
      if (payload) applyRecommendationsPatch(payload);
    });

    // 연결 확인 이벤트
    es.addEventListener('connected', (e) => {
      console.log('SSE 연결 성공:', e.data);
    });

    es.onerror = () => {
      console.warn('SSE stream error:', streamUrl);
    };

    return () => {
      es.close();
    };
  }, [hashUrl]);

  const heatmapLevelMap = useMemo(() => {
    const list = Array.isArray(eventData?.heatmapData) ? eventData.heatmapData : [];

    const out = new Map();

    for (const h of list) {
      const dt = parseYmd(h?.date);
      const dateLabel = dt ? buildDateColumns([h?.date]).labels[0] : '';
      const timeHm = String(h?.timeSlot || '').slice(0, 5);
      if (!dateLabel || !/^\d{2}:\d{2}$/.test(timeHm)) continue;

      const key = `${dateLabel}|${timeHm}`;
      const level = calculateLevelFromIntensity(h?.intensity);
      out.set(key, level);
    }

    return out;
  }, [eventData]);

  const title = eventData?.title || '';

  const dates = useMemo(() => {
    return buildDateColumns(eventData?.selectedDates, 60).labels;
  }, [eventData?.selectedDates]);

  const { slots: timeSlots, labels: timeLabels } = useMemo(() => {
    const startTime = eventData?.timeRange?.startTime;
    const endTime = eventData?.timeRange?.endTime;
    return buildTimeSlotsFromRange(startTime, endTime);
  }, [eventData?.timeRange?.startTime, eventData?.timeRange?.endTime]);

  const canRenderGrid = dates.length > 0 && timeSlots.length > 0;

  const recoSections = useMemo(() => buildRecoSections(recoPlaces), [recoPlaces]);

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
    if (!hashUrl) return;
    const url = buildMainLink(hashUrl);

    try {
      if (navigator.share) {
        await navigator.share({ title: 'GMG 모임 링크', text: '모임 일정 페이지', url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert('링크를 클립보드에 복사했습니다.');
      }
    } catch (e) {
      console.error('공유 실패 또는 취소:', e);
    }
  };

  const handleParticipate = () => {
    if (!hashUrl) return;
    setIsJoinOpen(true);
  };

  const handleCloseJoin = () => setIsJoinOpen(false);

  const handleJoinedGoTime = ({ isNew } = {}) => {
    setIsJoinOpen(false);
    const base = `/join/time?code=${encodeURIComponent(hashUrl)}`;
    navigate(isNew ? base : `${base}&mode=edit`);
  };

  const isReady = !isLoading && !!eventData;

  return (
    <div className="main-page">
      <div className="main-desktop-shell">
        <aside className="main-brand-panel" aria-hidden="true">
          <img src={Logo} alt="" className="main-brand-logo" />
          <div className="main-brand-copy">
            <p className="main-brand-text">
              싫어하는 것을
              <br />
              존중해주니까
            </p>
            <div className="main-brand-divider" />
            <p className="main-brand-text">
              이제는 <span className="main-brand-text-strong">가면가</span>
            </p>
          </div>
        </aside>
        <div className="main-page-container">
          <header className="main-header">
            <img src={Logo} alt="GMG 로고" className="main-logo" />

            <div className="main-share-area">
              <button
                type="button"
                className="main-share-bubble"
                onClick={handleShare}
                disabled={!hashUrl}
              >
                <span className="main-share-bubble-text">공유하고 모임을 잡아보세요!</span>
              </button>

              <button
                type="button"
                className="main-share-icon-button"
                onClick={handleShare}
                disabled={!hashUrl}
              >
                <img src={ShareIcon} alt="공유" className="main-share-icon-image" />
              </button>
            </div>
          </header>

          <main className="main-content">
            {isLoading && (
              <p style={{ margin: '8px 0', color: '#666', fontSize: 14 }}>
                모임 정보를 불러오는 중...
              </p>
            )}

            {!!errorText && (
              <p style={{ margin: '8px 0', color: '#666', fontSize: 12 }}>{errorText}</p>
            )}

            {isReady && (
              <>
                <h1 className="main-title">{title || '제목이 없습니다.'}</h1>

                <section className="main-section">
                  <div className="schedule-container">
                    <h2 className="schedule-title">이때 만날까요?</h2>

                    {!canRenderGrid ? (
                      <p style={{ margin: '8px 0', color: '#666', fontSize: 14 }}>
                        날짜/시간 범위가 설정되지 않아 시간표를 표시할 수 없습니다.
                      </p>
                    ) : (
                      <div className="schedule-frame">
                        <div
                          ref={dateScrollRef}
                          className="schedule-date-rail"
                          onScroll={syncFromDate}
                        >
                          <div className="schedule-date-row">
                            {dates.map((date) => (
                              <div key={date} className="schedule-date-header">
                                {date}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div
                          ref={timeScrollRef}
                          className="schedule-time-rail"
                          onScroll={syncFromTime}
                        >
                          <div className="schedule-time-col">
                            {timeSlots.map((slot, rowIndex) => (
                              <div key={slot} className="schedule-time-label">
                                {timeLabels[rowIndex] ?? ''}
                              </div>
                            ))}
                            {/* 종료 시각 레이블 */}
                            <div className="schedule-time-label schedule-time-label--end">
                              {timeLabels[timeSlots.length] ?? ''}
                            </div>
                          </div>
                        </div>

                        <div
                          ref={gridScrollRef}
                          className="schedule-grid-scroll gmg-scrollbar-both"
                          onScroll={syncFromGrid}
                        >
                          <div className="schedule-grid-scroll-inner">
                            <div
                              className="schedule-grid-slots"
                              style={{
                                gridTemplateColumns: `repeat(${dates.length}, 87.666664px)`,
                                gridTemplateRows: `repeat(${timeSlots.length}, 20px)`,
                              }}
                            >
                              {timeSlots.map((slot, rowIndex) =>
                                dates.map((date) => {
                                  const key = `${date}-${slot}`;
                                  const hmKey = slotToHm(slot);

                                  const isTop = rowIndex % 2 === 0;
                                  const cellClass = isTop
                                    ? 'schedule-slot schedule-slot--top'
                                    : 'schedule-slot schedule-slot--bottom';

                                  const levelKey = hmKey ? `${date}|${hmKey}` : '';
                                  const level = levelKey ? heatmapLevelMap.get(levelKey) : null;
                                  const bg = level != null ? getSlotBgByLevel(level) : '#EDEEF1';

                                  return (
                                    <div
                                      key={key}
                                      className={cellClass}
                                      style={{ backgroundColor: bg }}
                                    />
                                  );
                                }),
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="main-section">
                  <div className="restaurant-rail restaurant-rail--hidden-scrollbar">
                    {recoLoading ? (
                      <div className="restaurant-container">
                        <h2 className="restaurant-container-title">추천 장소</h2>
                        <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                          추천 장소를 불러오는 중...
                        </p>
                      </div>
                    ) : recoSections.length === 0 ? (
                      <div className="restaurant-container">
                        <h2 className="restaurant-container-title">추천 장소</h2>
                        <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                          추천 장소가 없습니다.
                        </p>
                      </div>
                    ) : (
                      <>
                        {recoSections.map((section) => (
                          <div key={section.key} className="restaurant-container">
                            <h2 className="restaurant-container-title">{section.title}</h2>

                            <div className="restaurant-set">
                              {section.places.map((place) => (
                                <article key={place.id ?? place.name} className="restaurant-card">
                                  <img
                                    src={place.imageUrl || NoImage}
                                    alt={place.name}
                                    className="restaurant-thumb"
                                    loading="lazy"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = NoImage;
                                    }}
                                  />
                                  <div className="restaurant-label">
                                    <p className="restaurant-label-text">
                                      {truncateKorean(place.name, 7)}
                                    </p>
                                  </div>
                                </article>
                              ))}

                              {Array.from({ length: Math.max(0, 3 - section.places.length) }).map(
                                (_, emptyIdx) => (
                                  <div
                                    key={`${section.key}-empty-${emptyIdx}`}
                                    className="restaurant-card restaurant-card--empty"
                                  />
                                ),
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </section>
              </>
            )}
          </main>

          <footer className="main-footer">
            <NextButton disabled={false} onClick={handleParticipate}>
              참여 · 수정하기
            </NextButton>
          </footer>

          <JoinModalPage
            open={isJoinOpen}
            hashUrl={hashUrl}
            onClose={handleCloseJoin}
            onSuccessGoTime={handleJoinedGoTime}
          />
        </div>
      </div>
    </div>
  );
}
