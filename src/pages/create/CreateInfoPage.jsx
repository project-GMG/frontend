// gmg-front/src/pages/create/CreateInfoPage.jsx

import React, { useMemo, useRef, useState } from 'react';
import './CreateInfoPage.css';
import BackButton from '../components/common/BackButton';
import TopBar from '../components/common/TopBar';
import NextButton from '../components/common/NextButton';
import { useLocation, useNavigate } from 'react-router-dom';
import editPen from '../../assets/icons/edit_pen.png';

const DEFAULT_NAME = '전북대에서 밥먹자';

function toYmd(dateLike) {
  if (!dateLike) return '';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toHm(timeLike) {
  if (!timeLike) return '';
  const s = String(timeLike).trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s.slice(0, 5);
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{1}:\d{2}$/.test(s)) return `0${s}`;
  if (/^\d{1,2}$/.test(s)) return String(s).padStart(2, '0') + ':00';
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5);
  return '';
}

function normalizeDateRange(input) {
  const arr = Array.isArray(input) ? input : input ? Array.from(input) : [];
  const dates = arr
    .map((v) => new Date(v))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (!dates.length) return { startDate: '', endDate: '' };
  return {
    startDate: toYmd(dates[0]),
    endDate: toYmd(dates[dates.length - 1]),
  };
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function CreateInfoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);

  const prev = location.state || {};

  const [groupName, setGroupName] = useState(DEFAULT_NAME);
  const [nameTouched, setNameTouched] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleBack = () => window.history.back();

  const handleNameFocus = () => {
    setNameTouched(true);
    setNameFocused(true);
  };

  const handleNameBlur = () => setNameFocused(false);
  const handleNameChange = (e) => setGroupName(e.target.value);

  const trimmed = groupName.trim();
  const isNameTooLong = trimmed.length > 12;
  const isNameEmpty = trimmed.length === 0;
  const isNameValid = !isNameEmpty && !isNameTooLong;

  const placeTypeCodes = Array.isArray(prev.placeTypeCodes) ? prev.placeTypeCodes : [];

  const locationObj = prev.location || null;
  const centerLatitude =
    locationObj?.centerLatitude !== undefined ? Number(locationObj.centerLatitude) : NaN;
  const centerLongitude =
    locationObj?.centerLongitude !== undefined ? Number(locationObj.centerLongitude) : NaN;

  const dateRange =
    prev.dateRange && prev.dateRange.startDate && prev.dateRange.endDate
      ? {
          startDate: toYmd(prev.dateRange.startDate),
          endDate: toYmd(prev.dateRange.endDate),
        }
      : normalizeDateRange(prev.selectedDates);

  const timeRange =
    prev.timeRange && prev.timeRange.startTime && prev.timeRange.endTime
      ? {
          startTime: toHm(prev.timeRange.startTime),
          endTime: toHm(prev.timeRange.endTime),
        }
      : {
          startTime: toHm(prev.startTime),
          endTime: toHm(prev.endTime),
        };

  const hasPlaceTypes = placeTypeCodes.length > 0;
  const hasLocation = Number.isFinite(centerLatitude) && Number.isFinite(centerLongitude);
  const hasDateRange = !!dateRange.startDate && !!dateRange.endDate;
  const hasTimeRange = !!timeRange.startTime && !!timeRange.endTime;

  const isPayloadReady = hasPlaceTypes && hasLocation && hasDateRange && hasTimeRange;
  const isFormValid = isNameValid && isPayloadReady && !isSubmitting;

  const labelClass = useMemo(() => {
    const base = 'info-field-label';
    if (isNameTooLong) return `${base} info-field-label--error`;
    if (nameFocused) return `${base} info-field-label--active`;
    return base;
  }, [isNameTooLong, nameFocused]);

  const wrapperClass = useMemo(() => {
    const base = 'info-input-wrapper';
    if (isNameTooLong) return `${base} info-input-wrapper--error`;
    if (nameFocused) return `${base} info-input-wrapper--active`;
    return base;
  }, [isNameTooLong, nameFocused]);

  const inputClass = useMemo(() => {
    const base = 'info-input';
    const isDefaultPlaceholder = !nameTouched && groupName === DEFAULT_NAME;
    return isDefaultPlaceholder ? `${base} info-input--placeholder` : base;
  }, [nameTouched, groupName]);

  const handlePencilClick = () => {
    setNameTouched(true);
    inputRef.current?.focus();
  };

  const handleCreate = async () => {
    if (!isFormValid) {
      if (!isPayloadReady) {
        setSubmitError('이전 단계(장소/날짜/시간/위치) 선택값이 누락되었습니다.');
      }
      return;
    }

    if (timeRange.startTime >= timeRange.endTime) {
      setSubmitError('시작 시간은 종료 시간보다 이전이어야 합니다.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    const payload = {
      title: trimmed,
      placeTypeCodes,
      location: {
        centerLatitude,
        centerLongitude,
        locationName: locationObj?.locationName || '',
      },
      dateRange: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
      timeRange: {
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
      },
    };

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = text ? safeJsonParse(text) : null;

      if (!res.ok) {
        const msg =
          data?.message ||
          (res.status === 400
            ? '잘못된 요청입니다.'
            : res.status === 401
              ? '인증이 필요합니다.'
              : '요청이 실패했습니다.');
        setSubmitError(msg);
        return;
      }

      const eventData = data?.data || {};

      navigate('/create/final', {
        state: {
          ...prev,
          createdEvent: {
            code: data?.code,
            message: data?.message,
            eventId: eventData.eventId,
            hashUrl: eventData.hashUrl,
            createdAt: eventData.createdAt,
          },
          requestPayload: payload,
        },
      });
    } catch (e) {
      setSubmitError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-info-page">
      <div className="create-info-container">
        <TopBar currentStep={4} totalSteps={4} />

        <header className="create-info-header">
          <BackButton onClick={handleBack} />
        </header>

        <main className="create-info-content">
          <h1 className="create-info-title">모임을 생성하세요</h1>

          <section className="info-field">
            <label className={labelClass} htmlFor="group-name">
              모임 이름
            </label>

            <div className={wrapperClass}>
              <input
                id="group-name"
                ref={inputRef}
                type="text"
                className={inputClass}
                value={groupName}
                onFocus={handleNameFocus}
                onBlur={handleNameBlur}
                onChange={handleNameChange}
              />

              <button
                type="button"
                className="info-pencil-button"
                onClick={handlePencilClick}
                aria-label="모임 이름 수정"
              >
                <img src={editPen} alt="" className="info-pencil" />
              </button>
            </div>

            {isNameTooLong && <p className="info-error-text">12글자 이내로 입력해주세요</p>}

            {!isPayloadReady && (
              <p className="info-error-text">
                이전 단계 선택값이 누락되었습니다. (카테고리/날짜/시간/위치)
              </p>
            )}

            {!!submitError && <p className="info-error-text">{submitError}</p>}
          </section>
        </main>

        <footer className="create-info-footer">
          <NextButton disabled={!isFormValid} onClick={handleCreate}>
            {isSubmitting ? '생성 중...' : '생성하기'}
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
