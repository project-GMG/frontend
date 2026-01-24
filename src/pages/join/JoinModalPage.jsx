// src/pages/join/JoinModalPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './JoinModalPage.css';
import NextButton from '../components/common/NextButton';

function loadMembers(hashUrl) {
  try {
    const raw = sessionStorage.getItem(`gmg_members_${hashUrl || 'unknown'}`);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveMembers(hashUrl, next) {
  sessionStorage.setItem(`gmg_members_${hashUrl || 'unknown'}`, JSON.stringify(next));
}

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

  useEffect(() => {
    if (!open) return;
    setName('');
    setJoinError('');
    setIsSubmittingJoin(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

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

  const buttonDisabled = !trimmedName || isSubmittingJoin || !hashUrl;

  const handleOverlayClick = () => {
    onClose?.();
  };

  const handleJoinSubmit = async () => {
    if (!trimmedName) return;
    if (!hashUrl) return;

    setJoinError('');
    setIsSubmittingJoin(true);

    try {
      const res = await fetch(`/api/event/${encodeURIComponent(hashUrl)}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setJoinError(json?.message || `참여에 실패했습니다. (${res.status})`);
        return;
      }

      const participantId = extractParticipantId(json);

      if (!isExistingMember) {
        const members = loadMembers(hashUrl);
        saveMembers(hashUrl, [...members, trimmedName]);
      }

      if (participantId != null) {
        sessionStorage.setItem(`gmg_participant_${hashUrl}`, String(participantId));
        sessionStorage.setItem(`gmg_participant_name_${hashUrl}`, trimmedName);
      } else {
        setJoinError('참여자 ID를 받지 못했습니다. 서버 응답을 확인해주세요.');
        return;
      }

      onSuccessGoTime?.();
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
