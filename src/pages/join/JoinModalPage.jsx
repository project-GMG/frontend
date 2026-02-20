// src/pages/join/JoinModalPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './JoinModalPage.css';
import NextButton from '../components/common/NextButton';
import { buildApiUrl } from '../../lib/api';

function extractParticipantId(json) {
  const data = json?.data;
  if (!data) return null;
  const pid = data.participantId ?? data.id ?? data.participantID;
  const n = Number(pid);
  return Number.isFinite(n) ? n : null;
}

export default function JoinModalPage({ open, hashUrl, onClose, onSuccessGoTime }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [joinError, setJoinError] = useState('');

  // 서버 기반 참여 여부 확인 상태
  const [isExistingMember, setIsExistingMember] = useState(false);
  const [existingParticipantId, setExistingParticipantId] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setJoinError('');
    setIsSubmittingJoin(false);
    setIsExistingMember(false);
    setExistingParticipantId(null);
    setIsChecking(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const trimmedName = name.trim();

  // 이름 입력 시 debounce로 GET /check 호출
  useEffect(() => {
    if (!trimmedName || !hashUrl) {
      setIsExistingMember(false);
      setExistingParticipantId(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const res = await fetch(
          buildApiUrl(
            `/api/event/${encodeURIComponent(hashUrl)}/participants/check?name=${encodeURIComponent(trimmedName)}`,
          ),
          { headers: { accept: 'application/json' } },
        );
        const json = await res.json().catch(() => null);
        const exists = json?.data?.exists ?? false;
        const pid = json?.data?.participantId ?? null;
        setIsExistingMember(exists);
        setExistingParticipantId(exists && pid != null ? Number(pid) : null);
      } catch {
        // 조회 실패 시 신규로 간주
        setIsExistingMember(false);
        setExistingParticipantId(null);
      } finally {
        setIsChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [trimmedName, hashUrl]);

  const helperText = useMemo(() => {
    if (!trimmedName) return '';
    if (isChecking) return '확인 중...';
    return isExistingMember ? '등록된 이름이네요. 수정으로 진행해요.' : '새로운 모임원이네요.';
  }, [trimmedName, isChecking, isExistingMember]);

  const buttonLabel = useMemo(() => {
    if (!trimmedName || isChecking) return '참여 · 수정하기';
    return isExistingMember ? '수정하기' : '참여하기';
  }, [trimmedName, isChecking, isExistingMember]);

  const buttonDisabled = !trimmedName || isSubmittingJoin || isChecking || !hashUrl;

  const handleOverlayClick = () => {
    onClose?.();
  };

  const handleJoinSubmit = async () => {
    if (!trimmedName || !hashUrl) return;

    setJoinError('');
    setIsSubmittingJoin(true);

    try {
      let participantId = isExistingMember ? existingParticipantId : null;

      if (!isExistingMember || participantId == null) {
        // 신규 참여자 → POST로 등록
        const res = await fetch(
          buildApiUrl(`/api/event/${encodeURIComponent(hashUrl)}/participants`),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ name: trimmedName }),
          },
        );

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          setJoinError(json?.message || `참여에 실패했습니다. (${res.status})`);
          return;
        }

        participantId = extractParticipantId(json);
      }

      if (participantId == null) {
        setJoinError('참여자 ID를 받지 못했습니다. 서버 응답을 확인해주세요.');
        return;
      }

      sessionStorage.setItem(`gmg_participant_${hashUrl}`, String(participantId));
      sessionStorage.setItem(`gmg_participant_name_${hashUrl}`, trimmedName);

      onSuccessGoTime?.({ isNew: !isExistingMember });
    } catch {
      setJoinError('네트워크 오류로 참여에 실패했습니다.');
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  if (!open) return null;

  return (
    <div className="join-sheet-overlay" onClick={handleOverlayClick}>
      <div className="join-sheet" onClick={(e) => e.stopPropagation()}>
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
  );
}
