import React, { useMemo, useRef, useState } from 'react';
import './CreateInfoPage.css';
import BackButton from '../components/common/BackButton';
import TopBar from '../components/common/TopBar';
import NextButton from '../components/common/NextButton';
import { useNavigate } from 'react-router-dom';
import editPen from '../../assets/icons/edit_pen.png';

const DEFAULT_NAME = '전북대에서 밥먹자';

export default function CreateInfoPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [groupName, setGroupName] = useState(DEFAULT_NAME);
  const [nameTouched, setNameTouched] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

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
  const isFormValid = isNameValid;

  const handleCreate = () => {
    if (!isFormValid) return;
    console.log('모임 이름:', trimmed);
    navigate('/create/final');
  };

  // 상태 클래스(요구사항 4단계)
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

  return (
    <div className="create-info-page">
      <div className="create-info-container">
        <TopBar currentStep={4} totalSteps={4} />

        <header className="create-info-header">
          <BackButton onClick={handleBack} />
        </header>

        <main className="create-info-content">
          <h1 className="create-info-title">모임을 생성하세요</h1>

          {/* 모임 이름 */}
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

            {isNameTooLong && (
              <p className="info-error-text">12글자 이내로 입력해주세요</p>
            )}
          </section>
        </main>

        <footer className="create-info-footer">
          <NextButton disabled={!isFormValid} onClick={handleCreate}>
            생성하기
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
