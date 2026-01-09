/* src/pages/join/JoinModalPage.jsx */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './JoinModalPage.css';
import NextButton from '../components/common/NextButton';
import Logo from '../../assets/icons/logo.png';
import ShareIcon from '../../assets/icons/share.png';
import ChickenImg from '../../assets/icons/chicken.png';

/** ===== utils (hashUrl 필요 없음) ===== */
function getBaseUrl() {
  const envBase = (import.meta.env.VITE_SHARE_BASE_URL || '').trim();
  return envBase ? envBase.replace(/\/+$/, '') : window.location.origin;
}

function buildJoinLink(hashUrl) {
  if (!hashUrl) return '';
  const base = getBaseUrl();
  return `${base}/join?code=${encodeURIComponent(hashUrl)}`;
}

const DEFAULT_DATES = ['11/23 일', '11/24 월', '11/25 화', '11/26 수', '11/27 목'];

const DEFAULT_TIME_SLOTS = [
  '1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM',
  '6:00 PM','6:30 PM','7:00 PM','7:30 PM','8:00 PM','8:30 PM','9:00 PM','9:30 PM','10:00 PM','10:30 PM',
];

const DEFAULT_TIME_LABELS = [
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

function loadMembers(hashUrl) {
  try {
    const raw = localStorage.getItem(`gmg_members_${hashUrl || 'unknown'}`);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveMembers(hashUrl, next) {
  localStorage.setItem(`gmg_members_${hashUrl || 'unknown'}`, JSON.stringify(next));
}

// YYYY-MM-DD (로컬)
function parseYmd(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  dt.setHours(0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatDateKorean(date) {
  if (!(date instanceof Date)) return '';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const wd = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${mm}/${dd} ${wd}`;
}

function buildDatesFromRange(startYmd, endYmd, limit = 35) {
  const start = parseYmd(startYmd);
  const end = parseYmd(endYmd);
  if (!start || !end) return DEFAULT_DATES;

  const out = [];
  const cur = new Date(start);
  let count = 0;

  while (cur.getTime() <= end.getTime() && count < limit) {
    out.push(formatDateKorean(cur));
    cur.setDate(cur.getDate() + 1);
    count += 1;
  }

  return out.length ? out : DEFAULT_DATES;
}

function buildTimeSlotsFromRange(startHm, endHm) {
  const start = String(startHm || '').slice(0, 5);
  const end = String(endHm || '').slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    return { slots: DEFAULT_TIME_SLOTS, labels: DEFAULT_TIME_LABELS };
  }

  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  let startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  if (!(startMin < endMin)) {
    return { slots: DEFAULT_TIME_SLOTS, labels: DEFAULT_TIME_LABELS };
  }

  const slots = [];
  const labels = [];

  while (startMin <= endMin) {
    const h = Math.floor(startMin / 60);
    const m = startMin % 60;

    const isPm = h >= 12;
    const hour12 = ((h + 11) % 12) + 1;
    const minuteStr = String(m).padStart(2, '0');
    const ampm = isPm ? 'PM' : 'AM';

    slots.push(`${hour12}:${minuteStr} ${ampm}`);

    if (m === 0) labels.push(`${hour12} ${ampm}`);
    else labels.push('');

    startMin += 30;
  }

  return { slots, labels };
}

/** ===== component ===== */
export default function JoinModalPage() {
  console.log('JoinModalPage VERSION 2026-01-09 A');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ✅ 여기서 먼저 hashUrl을 만든다 (이 아래에서만 사용)
  const hashUrl = (searchParams.get('code') || '').trim();
  console.log('hashUrl:', hashUrl);

  const [selectedSlots, setSelectedSlots] = useState(() => new Set());

  const [isJoinOpen, setIsJoinOpen] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);

  const [name, setName] = useState('');
  const inputRef = useRef(null);

  const gridScrollRef = useRef(null);
  const dateScrollRef = useRef(null);
  const timeScrollRef = useRef(null);

  // 이벤트 로딩 상태
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState('');
  const [eventData, setEventData] = useState(null);

  // 참여자 등록 상태
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    setIsJoinOpen(true);
    setHasJoined(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  // ✅ shareUrl도 hashUrl 선언 이후에만 계산
  const shareUrl = useMemo(() => buildJoinLink(hashUrl), [hashUrl]);

  // 1) 이벤트 정보 조회 GET /api/events/{hashUrl}
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!hashUrl) {
        setIsLoadingEvent(false);
        setEventError('링크가 올바르지 않습니다. /join?code=해시값 형태로 접속해야 합니다.');
        setEventData(null);
        return;
      }

      setIsLoadingEvent(true);
      setEventError('');

      const url = `/api/events/${encodeURIComponent(hashUrl)}`;
      console.log('event effect run, url=', url);

      try {
        const res = await fetch(url, { headers: { accept: 'application/json' } });
        const json = await res.json().catch(() => null);

        if (!alive) return;

        if (!res.ok) {
          setEventError(json?.message || '이벤트 정보를 불러오지 못했습니다.');
          setEventData(null);
          setIsLoadingEvent(false);
          return;
        }

        setEventData(json?.data || null);
        setIsLoadingEvent(false);
      } catch (e) {
        if (!alive) return;
        setEventError('네트워크 오류로 이벤트 정보를 불러오지 못했습니다.');
        setEventData(null);
        setIsLoadingEvent(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [hashUrl]);

  const trimmedName = name.trim();

  const isExistingMember = useMemo(() => {
    if (!trimmedName) return false;
    const members = loadMembers(hashUrl);
    return members.includes(trimmedName);
  }, [trimmedName, hashUrl]);

  const helperText = useMemo(() => {
    if (!trimmedName) return '';
    return isExistingMember ? '등록된 이름이네요. 수정으로 진행해요.' : '새로운 모임원이네요.';
  }, [trimmedName, isExistingMember]);

  const buttonLabel = useMemo(() => {
    if (!trimmedName) return '참여 · 수정하기';
    return isExistingMember ? '수정하기' : '참여하기';
  }, [trimmedName, isExistingMember]);

  const buttonDisabled = !trimmedName || isSubmittingJoin || isLoadingEvent || !!eventError;

  const title = eventData?.title || '모임';

  const dates = useMemo(() => {
    const startDate = eventData?.dateRange?.startDate;
    const endDate = eventData?.dateRange?.endDate;
    return buildDatesFromRange(startDate, endDate, 35);
  }, [eventData?.dateRange?.startDate, eventData?.dateRange?.endDate]);

  const { slots: timeSlots, labels: timeLabels } = useMemo(() => {
    const startTime = eventData?.timeRange?.startTime;
    const endTime = eventData?.timeRange?.endTime;
    return buildTimeSlotsFromRange(startTime, endTime);
  }, [eventData?.timeRange?.startTime, eventData?.timeRange?.endTime]);

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
    if (!hashUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'GMG 모임 링크',
          text: '모임 일정 페이지를 공유해 보세요.',
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        alert('링크를 클립보드에 복사했습니다.');
      }
    } catch (e) {
      console.error('공유 실패 또는 취소:', e);
    }
  };

  // 2) 참여자 등록 POST /api/event/{hashUrl}/participants
  const handleJoinSubmit = async () => {
    if (!trimmedName) return;
    if (!hashUrl) return;

    setJoinError('');
    setIsSubmittingJoin(true);

    try {
      const res = await fetch(`/api/event/${encodeURIComponent(hashUrl)}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setJoinError(json?.message || '참여에 실패했습니다.');
        return;
      }

      const participant = json?.data || {};
      const participantId = participant.participantId;

      if (!isExistingMember) {
        const members = loadMembers(hashUrl);
        saveMembers(hashUrl, [...members, trimmedName]);
      }

      if (participantId != null) {
        localStorage.setItem(`gmg_participant_${hashUrl}`, String(participantId));
        localStorage.setItem(`gmg_participant_name_${hashUrl}`, trimmedName);
      }

      setIsJoinOpen(false);
      setHasJoined(true);
    } catch (e) {
      setJoinError('네트워크 오류로 참여에 실패했습니다.');
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  const goJoinTime = () => {
    if (!hasJoined) return;
    navigate(`/join/time?code=${encodeURIComponent(hashUrl)}`);
  };

  const onScheduleKeyDown = (e) => {
    if (!hasJoined) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goJoinTime();
    }
  };

  const goJoinCategory = () => {
    if (!hasJoined) return;
    navigate(`/join/Category?code=${encodeURIComponent(hashUrl)}`);
  };

  const onRestaurantKeyDown = (e) => {
    if (!hasJoined) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goJoinCategory();
    }
  };

  return (
    <div className="main-page">
      <div className="main-page-container">
        <header className="main-header">
          <img src={Logo} alt="GMG 로고" className="main-logo" />
          <div className="main-share-area">
            <button
              type="button"
              className="main-share-bubble"
              onClick={handleShare}
              disabled={!hashUrl}
              aria-disabled={!hashUrl}
            >
              <span className="main-share-bubble-text">공유하고 모임을 잡아보세요!</span>
            </button>

            <button
              type="button"
              className="main-share-icon-button"
              onClick={handleShare}
              disabled={!hashUrl}
              aria-disabled={!hashUrl}
            >
              <img src={ShareIcon} alt="공유" className="main-share-icon-image" />
            </button>
          </div>
        </header>

        <main className="main-content">
          <h1 className="main-title">{title}</h1>

          {isLoadingEvent && (
            <p style={{ margin: '8px 0', color: '#666', fontSize: 14 }}>
              모임 정보를 불러오는 중...
            </p>
          )}
          {!!eventError && (
            <p style={{ margin: '8px 0', color: '#d00', fontSize: 14 }}>
              {eventError}
            </p>
          )}

          <section className="main-section">
            <div
              className={`schedule-container schedule-container--new ${
                hasJoined ? 'schedule-container--clickable' : ''
              }`}
              role="button"
              tabIndex={hasJoined ? 0 : -1}
              aria-disabled={!hasJoined}
              onClick={goJoinTime}
              onKeyDown={onScheduleKeyDown}
            >
              <h2 className="schedule-title">이때 만날까요?</h2>

              <div
                className="schedule-frame"
                style={{
                  pointerEvents: isJoinOpen ? 'none' : 'auto',
                }}
              >
                <div ref={dateScrollRef} className="schedule-date-rail" onScroll={syncFromDate}>
                  <div className="schedule-date-row">
                    {dates.map((date) => (
                      <div key={date} className="schedule-date-header">
                        {date}
                      </div>
                    ))}
                  </div>
                </div>

                <div ref={timeScrollRef} className="schedule-time-rail" onScroll={syncFromTime}>
                  <div className="schedule-time-col">
                    {timeSlots.map((slot, rowIndex) => (
                      <div key={slot} className="schedule-time-label">
                        {timeLabels[rowIndex] ?? ''}
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  ref={gridScrollRef}
                  className="schedule-grid-scroll gmg-scrollbar-both"
                  onScroll={syncFromGrid}
                >
                  <div
                    className="schedule-grid-slots"
                    style={{
                      gridTemplateColumns: `repeat(${dates.length}, 87.666664px)`,
                      gridTemplateRows: `repeat(${timeSlots.length}, 20px)`,
                    }}
                  >
                    {timeSlots.map((slot) =>
                      dates.map((date) => {
                        const key = `${date}-${slot}`;
                        const isActive = selectedSlots.has(key);
                        return (
                          <button
                            type="button"
                            key={key}
                            className={`schedule-slot ${isActive ? 'schedule-slot--active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSlot(key);
                            }}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="main-section">
            <div className="restaurant-rail restaurant-rail--hidden-scrollbar">
              {RESTAURANT_SETS.map((set, idx) => (
                <div
                  key={`box-${idx}`}
                  className={`restaurant-container ${hasJoined ? 'restaurant-container--clickable' : ''}`}
                  role="button"
                  tabIndex={hasJoined ? 0 : -1}
                  aria-disabled={!hasJoined}
                  onClick={goJoinCategory}
                  onKeyDown={onRestaurantKeyDown}
                >
                  <h2 className="restaurant-container-title">이 음식점 어때요?</h2>

                  <div
                    className="restaurant-set"
                    style={{
                      pointerEvents: isJoinOpen ? 'none' : 'auto',
                    }}
                  >
                    {set.map((item) => (
                      <article
                        key={item.id}
                        className="restaurant-card"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img src={ChickenImg} alt={item.imageAlt} className="restaurant-thumb" />
                        <div className="restaurant-label">
                          <p className="restaurant-label-text">{item.name}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

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

              {!!joinError && (
                <p className="join-sheet-helper is-visible" style={{ color: '#d00' }}>
                  {joinError}
                </p>
              )}

              <div className="join-sheet-button">
                <NextButton disabled={buttonDisabled} onClick={handleJoinSubmit}>
                  {isSubmittingJoin ? '처리 중...' : buttonLabel}
                </NextButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
